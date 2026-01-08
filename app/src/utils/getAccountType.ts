import { AccountType } from '../types/enums';
import { IUser } from '../types/interfaces';

/** Extracts account type from user data then returns it.
 * @param {IUser} activeUser - Object featuring the active user's account information.
 * @returns {AccountType} Account type corresponding to active user.
 */
export default (activeUser: IUser | null): AccountType => {
    if (!activeUser) {
        throw Error('User not found.');
    }

    if (activeUser.id === 1) {
        return AccountType.Evolon;
    }

    return activeUser.account_type;
};
