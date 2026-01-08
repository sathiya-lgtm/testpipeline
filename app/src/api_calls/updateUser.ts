import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { ServiceProviderRole, CustomerRole } from '../types/enums';

/** Specifies which type of account to perform action on (Service Provider or Customer). */
type Additional = 'sp' | 'cl';

interface IEditUser {
    action: 'edit-user';
    /** Setting any of these fields to values that already exist for user will cause
     * the request to fail. Must check to see if values are different before making request.
     */
    target: {
        id: number;
        email?: string;
        username?: string;
        is_admin?: boolean;
        password?: string;
    };
    prev: '';
    additional: Additional;
}

interface IChangeRoles {
    action: 'change-roles';
    target: { id: number; roles: ServiceProviderRole[] | CustomerRole[] | [] };
    prev: '';
    additional: Additional;
}

interface IResetPassword {
    action: 'reset-password';
    target: { id: number; password: string };
    prev: '';
    additional: Additional;
}

interface IDeleteUser {
    action: 'delete-user';
    target: number;
    prev: '';
    additional: Additional;
}

// Using union type instead of interface here because it tells compiler to force only one of the following interfaces.
// Will have to check identity of object in certain places where this is used so compiler understands which one should be enforced.
export type UpdateUserData =
    | IEditUser
    | IChangeRoles
    | IResetPassword
    | IDeleteUser;

interface IParams {
    user: IUser;
    updateUserData: UpdateUserData;
}

/** Makes a POST request to save mask. */
export default async ({ user, updateUserData }: IParams): Promise<void> => {
    await customFetch(
        `/api/user/modify`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(updateUserData),
        },
        'User update'
    );
};
