// React
import { Dispatch, SetStateAction } from 'react';

// API Calls
import login from '../../api_calls/login';
import getEULA from '../../api_calls/getEULA';

// Custom
import { HTTPError } from '../../classes/HTTPError';
import { IUser } from '../../types/interfaces';

/**
 * Log in handler. Will execute "login" api request then returns message relaying log in result.
 * @param {string} email - Email of user attempting to log in.
 * @param {string} password - Password of user attempting to log in.
 * @param {Dispatch<SetStateAction<IUser | null>>} setActiveUser - Setter app's/AuthContext's activeUser.
 * @param {Dispatch<SetStateAction<string | null>>} setError - Setter for parent's loginError state.
 * @param {Dispatch<SetStateAction<boolean>>} setIsLoading - Setter for parent's isLoading state.
 * @returns {Promise<string>} Message relaying result of login attempt.
 */
export const handleLogin = async (
    email: string,
    password: string,
    setActiveUser: Dispatch<SetStateAction<IUser | null>>,
    setUserLoggedIn: Dispatch<SetStateAction<boolean | null>>,
    setError: Dispatch<SetStateAction<string | null>>,
    setIsLoading: Dispatch<SetStateAction<boolean>>,
    navigate: any
): Promise<void> => {
    try {
        setIsLoading(true);
        sessionStorage.clear();

        const user: IUser = await login(email, password);

        const getEULAResponse = await getEULA({
            user,
        });

        if (!getEULAResponse.accepted_eula) {
            navigate('/traditionaleula', { state: { user: user } });
        } else {
            sessionStorage.setItem('user', JSON.stringify(user));
            setActiveUser(user);
            setUserLoggedIn(true);
        }

        setIsLoading(false);
    } catch (err) {
        let errorMessage = err instanceof Error ? err.message : String(err);

        if (err instanceof HTTPError) {
            if (err.statusCode === 401) {
                errorMessage = 'Invalid email or password.';
            }
        }

        if (err instanceof Error && err.message === 'AbortError') {
            errorMessage =
                'Log in cancelled. Server is taking too long to respond.';
        }

        setError(errorMessage);

        setIsLoading(false);
    }
};
