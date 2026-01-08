import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

export interface IServiceProviderUser {
    username: string;
    password: string;
    email: string;
    /**
     * 1,GlobalAdmin
     * 2,AccountAdmin
     * 3,CreateUser
     * 4,EditUser
     * 5,ViewUser
     * 6,CreateDevice
     * 7,EditDevice
     * 8,DeleteDevice
     * 9,CanLockAccount
     * 10,CanAssignMultipleAccounts
     * 11,HolderAccounts
     * 12,CanRegisterDevice
     */
    roles: [2] | [5];
    form: 'Create-Service-Provider-User';
    /** Only needed if active user is a Service Provider (i.e. not Evolon user). */
    service_provider_account_reference_id?: number;
}

export interface ICustomerUser {
    username: string;
    password: string;
    email: string;
    is_admin: boolean;
    properties: { trace?: boolean };
    form: 'Create-Account-User';
    /** References "Customer" account ID. Not needed if active user is Customer. */
    account_reference_id?: number;
}

interface IParams {
    user: IUser;
    userData: IServiceProviderUser | ICustomerUser;
}

export default async ({ user, userData }: IParams): Promise<Response> => {
    return customFetch(
        `/api/jwt/sign-up`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(userData),
        },
        'User creation'
    );
};
