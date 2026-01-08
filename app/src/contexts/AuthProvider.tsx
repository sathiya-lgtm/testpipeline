// React
import React, {
    ReactElement,
    createContext,
    useState,
    useMemo,
    FC,
    Dispatch,
    SetStateAction,
    useEffect,
    useRef,
    useCallback,
} from 'react';

// Third party
import { toast } from 'react-toastify';

// Custom
import refreshToken from '../api_calls/refreshToken';
import handleGenericError from '../utils/handleGenericError';
import getSessionTimeRemainingInMilliseconds from '../utils/getSessionTimeRemainingInMilliseconds';
import { defaultRequestTimeout } from '../utils/customFetch';

// Custom types
import { IUser } from '../types/interfaces';

interface IProps {
    children: ReactElement;
}

interface IAuthContext {
    activeUser: IUser | null;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    userLoggedIn: boolean | null;
    setUserLoggedIn: Dispatch<SetStateAction<boolean | null>>;
    shouldShowSessionWarning: boolean;
    setShouldShowSessionWarning: Dispatch<SetStateAction<boolean>>;
}

export const AuthContext = createContext<IAuthContext>({
    activeUser: null,
    setActiveUser: () => {},
    userLoggedIn: null,
    setUserLoggedIn: () => {},
    shouldShowSessionWarning: false,
    setShouldShowSessionWarning: () => {},
});

/** Milliseconds: Value that dictates how often user session is checked. */
const checkSessionStatusIntervalTime = 1_000;

/** Milliseconds: Determines how often activity is reset. */
const activityWindow = 60_000;

/** Milliseconds added to session time limit that accounts for
 * the time it takes for an HTTP request to resolve (worst case) and the
 * amount of time it takes between cycles for the UI to check for activity.
 */
export const warningCountdownBuffer =
    checkSessionStatusIntervalTime + defaultRequestTimeout;
/** Milliseconds: Time remaining on a user session before triggering session warning.
 * Adds a buffer that accounts for maximum length refresh token HTTP request can take.
 */
export const warningThreshold = 60_000 + warningCountdownBuffer;

/** Milliseconds: Time remaining in session before app should attempt to refresh user token / session.
 * Currently set to 15 minutes, which means the application should automatically refresh the user
 * session if the user is active within 15 minutes of the session expiring.
 *
 * ! Warning: The corresponding logic will not work as intended if sessions don't last for 20 minutes.
 * TODO: A pattern that attempts to refresh without hardcoded values like this would be less error prone The effect of such a pattern changes if the session time (on the back-end) changes.
 */
const refreshThreshold = 900_000;

/** Determines whether or not the user's current session token should be refreshed.
 * @param {boolean} hasUserBeenActive - Value representing whether or not the user is considered 'active'.
 * @param {number} timeRemaining - Time remaining before user session expires (milliseconds).
 * @returns {boolean} Boolean representing whether user session token should be refreshed.
 */
const shouldRefreshToken = (
    hasUserBeenActive: boolean,
    timeRemaining: number
): boolean => {
    // Should refresh if user has been active & time remaining is less than or equal to refresh threshold.
    if (hasUserBeenActive && timeRemaining <= refreshThreshold) return true;

    return false;
};

/**
 * Wrapper for components that need to either update/set the application's active user
 * or reference the application's active user (e.g. determining and/or displaying user privileges).
 * @param {IProps} props - Props that feature child element(s) that need access to AuthContext.
 * @returns {ReactElement} Wrapper for elements that needs access to AuthContext.
 */
const AuthProvider: FC<IProps> = ({ children }: IProps): ReactElement => {
    const [activeUser, setActiveUser] = useState<IUser | null>(null);
    const [userLoggedIn, setUserLoggedIn] = useState<boolean | null>(null);
    const [shouldShowSessionWarning, setShouldShowSessionWarning] =
        useState<boolean>(false);
    const resetHasUserBeenActiveIntervalIdRef = useRef<number | undefined>(
        undefined
    );
    const checkSessionStatusIntervalIdRef = useRef<number | undefined>(
        undefined
    );
    const activeUserRef = useRef<IUser | null>(activeUser);
    const hasUserBeenActiveRef = useRef<boolean>(false);

    /** Simply sets 'hasUserBeenActiveRef' to "true". Had
     * to be wrapped in a useCallback hook as to retain function identity
     * for removeEventListener as to be properly removed.
     */
    const setHasUserBeenActive = useCallback(() => {
        hasUserBeenActiveRef.current = true;
    }, []);

    /** Simply sets 'hasUserBeenActiveRef' to "false". Had
     * to be wrapped in a useCallback hook as to retain function identity
     * for removeEventListener as to be properly removed.
     */
    const resetHasUserBeenActive = useCallback(() => {
        hasUserBeenActiveRef.current = false;
    }, []);

    /** Checks the status of the user's current session (i.e. how close the session is to expiring). Will either
     * refresh the user's session token (assuming the user has been active) or will set "session warning" state to
     * true.
     * @returns {Promise<void>}
     */
    const checkSessionStatusIntervalCallback = async (): Promise<void> => {
        const user: IUser | null = activeUserRef.current;
        const hasUserBeenActive: boolean = hasUserBeenActiveRef.current;

        if (user) {
            try {
                /** Milliseconds. */
                const sessionTimeRemaining =
                    getSessionTimeRemainingInMilliseconds(user);

                if (sessionTimeRemaining <= warningThreshold) {
                    const checkSessionStatusIntervalId =
                        checkSessionStatusIntervalIdRef.current;
                    const resetHasUserBeenActiveIntervalId =
                        resetHasUserBeenActiveIntervalIdRef.current;

                    checkSessionStatusIntervalIdRef.current = undefined;
                    resetHasUserBeenActiveIntervalIdRef.current = undefined;

                    // If app should warn user about expiring session, stop checking for session status and user activity.
                    clearInterval(checkSessionStatusIntervalId);
                    clearInterval(resetHasUserBeenActiveIntervalId);

                    // Tell app to show session timeout warning.
                    setShouldShowSessionWarning(true);
                } else if (
                    shouldRefreshToken(hasUserBeenActive, sessionTimeRemaining)
                ) {
                    const refreshedUser = await refreshToken(user.refreshToken);

                    sessionStorage.setItem(
                        'user',
                        JSON.stringify(refreshedUser)
                    );

                    setActiveUser(refreshedUser);
                }
            } catch (err) {
                handleGenericError(err);
            }
        }
    };

    /**
     * Starts an interval that checks to see if the user has been active within said interval.
     * If so, will refresh the user's JWT. If the user has not been active within said interval
     * and the session is close to expiring, will update "sessionIsCloseToExpiring" variable to true, remove
     * the onClick event listener, set activity to false, and clear this interval. If neither conditions are met,
     * will simply reset activity variable to false.
     * NOTE: Intervals become idle when the user clicks into another browser tab within the same window, which results
     * in the interval countdown being paused.
     * @returns {number} Interval ID.
     */
    const startCheckSessionStatusInterval = (): number =>
        window.setInterval(
            checkSessionStatusIntervalCallback,
            checkSessionStatusIntervalTime
        );

    /** Starts an interval that resets the value of 'hasUserBeenActive' to false. */
    const startHasUserBeenActiveResetInterval = (): number =>
        window.setInterval(resetHasUserBeenActive, activityWindow);

    /** When component mounts, will check to see if there is user data in session storage.
     * If so, will either log the user back in based on said user data or clear session storage and
     * notify user that their session has expired.
     */
    useEffect(() => {
        const userData: string | null = sessionStorage.getItem('user');

        if (userData) {
            try {
                const user: IUser = JSON.parse(userData);
                const sessionTimeRemaining =
                    getSessionTimeRemainingInMilliseconds(user);

                // If session has expired or expires soon, clear their session storage and notify user of expired session.
                if (sessionTimeRemaining <= warningThreshold) {
                    sessionStorage.clear();

                    toast.info('Session expired. Log back in to continue.');
                    setActiveUser(null);
                    setUserLoggedIn(false);
                } else {
                    setActiveUser(user);
                    setUserLoggedIn(true);
                }
            } catch (err) {
                handleGenericError(err);
            }
        } else {
            setActiveUser(null);
            setUserLoggedIn(false);
        }

        return () => {
            clearInterval(checkSessionStatusIntervalIdRef.current);
            clearInterval(resetHasUserBeenActiveIntervalIdRef.current);

            window.removeEventListener('click', setHasUserBeenActive, {
                capture: true,
            });
        };
    }, []);

    /**
     * Adds "click" event listener to entire window whenever the user changes or
     * whenever session is close to expiring state changes and session is not close to expiring.
     * Removes aforementioned event listener otherwise.
     */
    useEffect(() => {
        if (activeUser) {
            if (!shouldShowSessionWarning) {
                // If there is a user with a fresh session, add event listener.
                window.addEventListener('click', setHasUserBeenActive, {
                    capture: true,
                });
            } else {
                // If there is a user, but session is about to expire, remove listener.
                window.removeEventListener('click', setHasUserBeenActive, {
                    capture: true,
                });
            }
        }
    }, [activeUser, shouldShowSessionWarning]);

    /** Executes whenever user's access token changes (which happens if the user logs in, logs out, or refreshes their session).
     * Will start an interval that checks user activity if user is logged in. Removes interval if user is not present.
     */
    useEffect(() => {
        // Keep ref in sync with state.
        activeUserRef.current = activeUser;

        // The user session has changed, thus reset variables.
        resetHasUserBeenActive();
        setShouldShowSessionWarning(false);

        // If the user is logged in (via either log in or refresh)...
        if (activeUser?.accessToken) {
            if (checkSessionStatusIntervalIdRef.current === undefined) {
                checkSessionStatusIntervalIdRef.current =
                    startCheckSessionStatusInterval();
            }
            if (resetHasUserBeenActiveIntervalIdRef.current === undefined) {
                resetHasUserBeenActiveIntervalIdRef.current =
                    startHasUserBeenActiveResetInterval();
            }
        } else {
            // If there is no user, clear intervals and remove event listener.
            const checkSessionStatusIntervalId =
                checkSessionStatusIntervalIdRef.current;
            const resetHasUserBeenActiveIntervalId =
                resetHasUserBeenActiveIntervalIdRef.current;

            checkSessionStatusIntervalIdRef.current = undefined;
            resetHasUserBeenActiveIntervalIdRef.current = undefined;

            clearInterval(checkSessionStatusIntervalId);
            clearInterval(resetHasUserBeenActiveIntervalId);

            window.removeEventListener('click', setHasUserBeenActive, {
                capture: true,
            });
        }
    }, [activeUser?.accessToken]);

    const value = useMemo(
        () => ({
            activeUser,
            setActiveUser,
            userLoggedIn,
            setUserLoggedIn,
            shouldShowSessionWarning,
            setShouldShowSessionWarning,
        }),
        [
            activeUser,
            setActiveUser,
            userLoggedIn,
            setUserLoggedIn,
            shouldShowSessionWarning,
            setShouldShowSessionWarning,
        ]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export default AuthProvider;
