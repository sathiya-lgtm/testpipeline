// React
import React, {
    Dispatch,
    FC,
    ReactElement,
    SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';

// Custom
import { handleLogout } from '../Navbar/Navbar.controller';
import {
    warningThreshold,
    warningCountdownBuffer,
} from '../../contexts/AuthProvider';
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import handleGenericError from '../../utils/handleGenericError';

// API calls
import refreshToken from '../../api_calls/refreshToken';

// Components
import LoadingModal from './LoadingModal';

// Custom types
import { IUser } from '../../types/interfaces';

// Styles
import '../../styles/components/Modals/SessionEnding.scss';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    setShowModal: Dispatch<SetStateAction<boolean>>;
    setUserLoggedIn: Dispatch<SetStateAction<boolean | null>>;
}

/**
 * Modal that pops up when the user's session is about to expire.
 * Prompts the user to either refresh session or log out.
 * @param {IProps} props
 * @returns {ReactElement}
 */
const SessionEndingModal: FC<IProps> = ({
    activeUser,
    setActiveUser,
    setShowModal,
    setUserLoggedIn,
}): ReactElement => {
    const navigate = useNavigate();
    const intervalIdRef = useRef<undefined | number>(undefined);
    const secondsRemainingCounterRef = useRef<number | undefined>(undefined);
    const [secondsRemainingDisplay, setSecondsRemainingDisplay] = useState<
        number | undefined
    >(undefined);

    const refreshSessionMutation = useMutation({
        mutationFn: refreshToken,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    /**
     * Pauses countdown then triggers a request to refresh user's JWT via React Query "mutate" call.
     * @returns {void}
     */
    const refreshSession = (): void => {
        // Pauses the countdown.
        clearInterval(intervalIdRef.current);

        // Make POST request to refresh token.
        refreshSessionMutation.mutate(activeUser.refreshToken);
    };

    /**
     * Pauses countdown then attempts to log user out. Will close modal regardless of outcome.
     * @returns {Promise<void>}
     */
    const endSession = async (): Promise<void> => {
        // Pauses the countdown.
        clearInterval(intervalIdRef.current);

        try {
            await handleLogout(setActiveUser, setUserLoggedIn, navigate);
        } catch (err) {
            handleHttpRequestError(err, setActiveUser, navigate);
        } finally {
            // Finally block executes whether the error was caught or the component unmounts.
            // Ensure modal closes even if logout failed.
            setShowModal(false);
        }
    };

    /** Initiates session countdown via browser's setInterval method. Said
     * setInterval executes every second. Leverages both state and ref hooks
     * to track countdown.
     * @returns {number} Interval ID.
     */
    const startCountdown = (): number =>
        window.setInterval(() => {
            const secondsRemaining = secondsRemainingCounterRef.current;

            if (secondsRemaining && secondsRemaining > 1) {
                secondsRemainingCounterRef.current = secondsRemaining - 1;

                setSecondsRemainingDisplay(secondsRemainingCounterRef.current);
            } else if (secondsRemaining !== undefined) {
                endSession();
            } else {
                clearInterval(intervalIdRef.current);
            }
        }, 1_000);

    /**
     * If JWT is successfully refreshed, will replace activeUser object in Auth Context.
     * If there was an error, end user session.
     */
    useEffect(() => {
        if (refreshSessionMutation.data) {
            try {
                const user = refreshSessionMutation.data;

                sessionStorage.setItem('user', JSON.stringify(user));

                setActiveUser(user);
            } catch (err) {
                handleGenericError(err);
            }
        } else if (refreshSessionMutation.isError) {
            endSession();
        }
    }, [refreshSessionMutation.data, refreshSessionMutation.isError]);

    useEffect(() => {
        const sessionTimeRemainingInSeconds = Math.floor(
            warningThreshold / 1_000
        );

        // Presumes defaultRequestTimeout was used as a buffer and thus must be subtracted from countdown.
        secondsRemainingCounterRef.current =
            sessionTimeRemainingInSeconds -
            Math.floor(warningCountdownBuffer / 1000);

        intervalIdRef.current = startCountdown();

        return () => clearInterval(intervalIdRef.current);
    }, []);

    return (
        <div className="confirmModalBackground show">
            {refreshSessionMutation.isLoading && (
                <LoadingModal modalText="Updating user session..." />
            )}
            <div className="confirmModal modal md">
                <div className="modalHeader">
                    <h2 className="title">Session Ending</h2>
                </div>
                <div className="modalBody">
                    <p>You&apos;ve been inactive for a while.</p>
                    {secondsRemainingDisplay && (
                        <p className="time-remaining">
                            For your security, we&apos;ll automatically log you
                            out in approximately{' '}
                            <strong>{secondsRemainingDisplay}</strong> seconds.
                            Do you want to stay logged in?
                        </p>
                    )}
                </div>
                <div className="saveBtnContainer">
                    <div>
                        <button
                            id="refresh"
                            className="btn primary"
                            onClick={refreshSession}
                            type="button"
                        >
                            Stay logged in
                        </button>
                    </div>
                    <div>
                        <button
                            id="end-session"
                            className="btn danger"
                            onClick={endSession}
                            type="button"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionEndingModal;
