// React
import { SetStateAction, Dispatch } from 'react';
import { NavigateFunction } from 'react-router-dom';

// Third party
import { toast } from 'react-toastify';

// Custom
import { HTTPError } from '../classes/HTTPError';

// Custom types
import { IUser } from '../types/interfaces';

/** A function that handles errors thrown during a try block that features a Fetch API call. Will log the user out
 * upon a session error and will log and notify of any other error thrown during said try block. Can be extended to handle
 * more specific errors.
 * @param {HTTPError | Error | any} err - Any value, however some form of Error is expected. "any" has to be handled here just in case.
 * @param {Dispatch<SetStateAction<IUser | null>>} setActiveUser - activeUser setter for possibly clearing activeUser from state.
 * @param {NavigateFunction} navigate - React Router Dom hook for redirecting user to a different "page".
 * @returns {void}
 */
export default (
    err: HTTPError | Error | any,
    setActiveUser: Dispatch<SetStateAction<IUser | null>>,
    navigate: NavigateFunction
): void => {
    const genericErrorMessage =
        err instanceof Error ? err.message : String(err);

    if (err instanceof HTTPError) {
        const { statusCode, description, action } = err;
        /** Reads: '{action} failed: {description} if both {action} and {description} are defined,
         * reads: '{description} if only {description} is defined,
         * {description} is replaced with {genericErrorMessage} if {description} is undefined.
         */
        const customErrorMessage: string = `${
            action ? `${action} failed: ` : ''
        }${description || genericErrorMessage}`;

        switch (statusCode) {
            case 400:
                console.error(customErrorMessage);
                toast.error(customErrorMessage);

                break;
            case 401:
                console.info(customErrorMessage);
                toast.info(customErrorMessage);

                setActiveUser(null);
                navigate('/');

                break;
            case 500:
                console.error(genericErrorMessage);

                toast.error(
                    action
                        ? customErrorMessage
                        : 'Failed to communicate with server. You can try reloading this page or wait and try again later.'
                );

                break;
            default:
                console.error(customErrorMessage || genericErrorMessage);
                toast.error(customErrorMessage || genericErrorMessage);
        }

        return;
    }

    // Timeout error handling.
    if (err instanceof Error && err.name === 'AbortError') {
        const customErrorMessage = 'Server connection attempt timed out.';

        console.error(customErrorMessage);
        toast.error(customErrorMessage);

        return;
    }

    // Fallback if error isn't specifically handled above.
    console.error(genericErrorMessage);
    toast.error(genericErrorMessage);
};
