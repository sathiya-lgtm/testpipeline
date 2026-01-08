import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { IUser } from '../types/interfaces';


const DEFAULT_TIMEOUT: number = 5 * 60 * 1000; /* 5 minutes in millieseconds */
const host = import.meta.env.VITE_API_DOMAIN || '';

type RequestOptions = Pick<AxiosRequestConfig, 'timeout' | 'headers'>;

const DefaultOptions: RequestOptions = {
    timeout: DEFAULT_TIMEOUT
}

export interface IErrorDetails {
    title: string,
    description: string
};

export interface IResponse {
    success: boolean,
    transaction_id?: string | undefined | null,
    error?: string | undefined | null,
    details?: IErrorDetails | undefined | null
};

export interface IPrivateRoute {
    user: IUser;
    options?: RequestOptions | null | undefined;
}



const PrivateRoute = ({ user, options }: IPrivateRoute) => {
    const handleError = (error: AxiosError): any => {
        const errorData: IResponse = (error.response?.data as IResponse)
        return {
            success: false,
            transaction_id: errorData?.transaction_id,
            error: errorData?.error,
            details: {
                title: errorData?.details?.title ?? 'Unhandled Error',
                description: errorData?.details?.description ?? 'Unknown error ocurred.'
            }
        }
    };

    const buildConfig = (extra: AxiosRequestConfig = {}): AxiosRequestConfig => {
        const mergedBase = {
            timeout: options?.timeout ?? DefaultOptions.timeout,
        }

        const mergedHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.accessToken}`,
            ...(options?.headers ?? {}),
            ...(extra.headers ?? {}),
        }
        
        return {
            ...mergedBase,
            ...extra,
            headers: mergedHeaders
        };
    }

    const url = (endpoint: string) => `${host.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

    return {
        get: async <T, U>(endpoint: string, parameters: U): Promise<T | IResponse> => {
            try {
                const { data } = await axios.get<T>(url(endpoint), buildConfig({ params: parameters }));
                return data;
            } catch(error: any) {
                return handleError(error);
            }
        },
        post: async <T, U>(endpoint: string, parameters: U): Promise<T | IResponse> => {
            try {
                const { data } = await axios.post<T>(url(endpoint), parameters, buildConfig());
                return data;
            } catch(error: any) {
                return handleError(error);
            }
            
        },
        put: async <T, U>(endpoint: string, parameters: U): Promise<T | IResponse> => {
            try {
                const { data } = await axios.post<T>(url(endpoint), parameters, buildConfig());
                return data;
            } catch(error: any) {
                return handleError(error);
            }
        },
        delete: async <T, U>(endpoint: string, parameters: U): Promise<T | IResponse> => {
            try {
                const { data } = await axios.delete<T>(url(endpoint), buildConfig({ params: parameters }));
                return data;
            } catch( error: any ) {
                return handleError(error); 
            }
        },
    };
};

export default PrivateRoute;
