import { NavigateFunction, Location } from 'react-router-dom';

// Custom
import { Dispatch, SetStateAction } from 'react';
import { IUser } from '../../types/interfaces';

/** Defines the text to be compared and whether said text should be compared exactly. */
interface ITextPattern {
    text: string;
    exact?: boolean;
}

export enum LinkTo {
    Dashboard = '/home',
    ForensicSearch = '/home/forensic-search',
    UtilityPage = '/utilities',
    RegistrationCode = '/registration-code',
    CameraPage = '/home/camera',
    ChangePassword = '/change-password',
    Alerts = '/home/alerts',
}

/**
 * onClick handler for Evolon logo on NavBar.
 * Will either refresh the homepage or navigate to
 * homepage depending on user's current browser location.
 * @param location {Location} - Location in browser history stack via useLocation hook.
 * @param navigate {NavigateFunction} - The interface for the navigate() function returned from useNavigate().
 * @returns {void}
 */
export const handleLogoClick = (
    location: Location,
    navigate: NavigateFunction
): void => {
    if (location.pathname === '/home') navigate(0);
    else navigate('/home');
};

/**
 * onClick handler for logout button on the NavBar.
 * Will blacklist current refresh token stored in sessionStorage
 * and remove data from current state.
 * @param setActiveUser {Dispatch<SetStateAction<IUser | null>>} - Function for setting current user data.
 * @param navigate {NavigateFunction} - The interface for the navigate() function returned from useNavigate().
 * @returns {void}
 */
export const handleLogout = async (
    setActiveUser: Dispatch<SetStateAction<IUser | null>>,
    setUserLoggedIn: Dispatch<SetStateAction<boolean | null>>,
    navigate: NavigateFunction
): Promise<void> => {
    sessionStorage.clear();
    setActiveUser(null);
    setUserLoggedIn(false);
    navigate('/');
};

/** Iterates through each text pattern to see if it matches the hash. */
const isTextInHash = (hash: string, textPatterns: ITextPattern[]): boolean => {
    let hasFoundMatch: boolean = false;

    textPatterns.forEach((textPattern) => {
        const { exact, text } = textPattern;

        if (exact) {
            /** Hash without the preceding "#" (e.g. /home instead of #/home). */
            const hashContent: string = hash.replace('#', '');

            // Checks for hash with and without trailing forward slash ("/").
            // Sometimes the URL ends with "/", sometimes it doesn't.
            if (hashContent === text || hashContent === `${text}/`) {
                hasFoundMatch = true;
            }
        } else if (hash.includes(text)) {
            hasFoundMatch = true;
        }
    });

    return hasFoundMatch;
};

/** Will concatenate className "highlight" to the end of baseCSSClass argument if
 * any of the provided text patterns match hash.
 */
export const generateCSSClassBasedOnHash = ({
    baseCSSClass,
    hash,
    textPatterns,
}: {
    baseCSSClass?: string;
    hash: string;
    textPatterns: ITextPattern[];
}): string => {
    return `${baseCSSClass} ${
        isTextInHash(hash, textPatterns) ? 'highlight' : ''
    }`;
};
