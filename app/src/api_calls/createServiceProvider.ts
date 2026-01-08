import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

interface ICreateServiceProvider {
    name: string;
    form: 'Create-Service-Provider-Account';
    password?: string;
}

interface IParams {
    user: IUser;
    createServiceProviderData: ICreateServiceProvider;
}

export default async ({
    user,
    createServiceProviderData,
}: IParams): Promise<Response> => {
    return customFetch(
        `/api/jwt/sign-up`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(createServiceProviderData),
        },
        'Service Provider creation'
    );
};
