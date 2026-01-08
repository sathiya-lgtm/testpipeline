// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = `api/accounts`;

export interface ICustomer {
    service_provider_account_id: number;
    service_provider_account_name: string;
    account_id: number;
    account_name: string;
    properties: any;
    retention_days: number;
    is_active: boolean;
}

export interface IGetProps {
    service_provider_account_id?: number | null;
    account_id?: number | null;
}

const CustomersRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetProps) =>
            api.get<ICustomer[], IGetProps>(endpoint, parameters),
    };
};

export default CustomersRoute;
