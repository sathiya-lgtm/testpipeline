import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface ICreateCustomer {
    properties: {};
    name: string;
    form: 'Create-Account';
    /** Not needed if active user is a Service Provider (i.e. only needed if Evolon user). */
    service_provider_account_reference_id?: number;
}

interface IParams {
    user: IUser;
    createCustomerData: ICreateCustomer;
}

export default async ({
    user,
    createCustomerData,
}: IParams): Promise<StandardApiResponseObj<{ account_id: number }>> => {
    const { data } = await axios.post<
        StandardApiResponseObj<{ account_id: number }>
    >(`${host}/api/jwt/sign-up`, createCustomerData, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    return data;
};
