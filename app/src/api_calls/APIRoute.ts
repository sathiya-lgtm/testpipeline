import axios from 'axios';
import { IUser } from '../types/interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

export interface IAPIRoute {
    user: IUser;
}

const APIRoute = ({ user }: IAPIRoute) => {
    return {
        get: async <T, U>(endpoint: string, parameters: U): Promise<T> => {
            const response = await axios.get<T>(`${host}/${endpoint}`, {
                params: parameters,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.accessToken}`,
                },
            });
            return (response.data as any).response.data;
        },
        insert: async <T, U>(endpoint: string, parameters: U): Promise<T> => {
            const response = await axios.post<T>(
                `${host}/${endpoint}`,
                parameters,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.accessToken}`,
                    },
                }
            );
            return (response.data as any).response;
        },
        update: async <T, U>(endpoint: string, parameters: U): Promise<T> => {
            const response = await axios.put<T>(
                `${host}/${endpoint}`,
                parameters,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.accessToken}`,
                    },
                }
            );
            return (response.data as any).response;
        },
        delete: async <T, U>(endpoint: string, parameters: U): Promise<T> => {
            const response = await axios.delete<T>(`${host}/${endpoint}`, {
                params: parameters,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.accessToken}`,
                },
            });
            return (response.data as any).response.success;
        },
    };
};

export default APIRoute;
