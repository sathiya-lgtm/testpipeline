// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = `api/sp`;

export interface IServiceProviderAccount {
    service_provider_account_id: number;
    service_provider_account_name: string;
}

export interface IGetProps {}

const ServiceProviderAccountsRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetProps) =>
            api.get<IServiceProviderAccount[], IGetProps>(endpoint, parameters),
    };
};

export default ServiceProviderAccountsRoute;
