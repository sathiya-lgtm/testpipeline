import { IUser } from '../types/interfaces';

/** Returns the amount of time remaining on active user's session in milliseconds.
 *  @returns {number} Milliseconds remaining on user session.
 */
export default (activeUser: IUser): number => {
    // Multiplies exp value by 1000 to convert to milliseconds (which is expected unit in Data constructor to yield accurate timestamp).
    const sessionExpirationTimeInMilliseconds: number = new Date(
        activeUser.exp * 1000
    ).getTime();

    const currentTimeInMilliseconds: number = new Date().getTime();

    const timeRemainingInMilliseconds: number =
        sessionExpirationTimeInMilliseconds - currentTimeInMilliseconds;

    return timeRemainingInMilliseconds;
};
