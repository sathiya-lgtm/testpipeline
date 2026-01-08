import axios, { AxiosError } from 'axios';

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

const host = import.meta.env.VITE_API_DOMAIN || '';

const StaticRoute = () => {
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

    return {
        get: async <T, U>(endpoint: string, parameters: U): Promise<T | IResponse> => {
            try {
                const response = await axios.get<T>(`${host}/${endpoint}`, {
                    params: parameters,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return (response as any).data;
            } catch(error: any) {
                return handleError(error);
            }
        },
        post: async <T, U>(endpoint: string, parameters: U): Promise<T | IResponse> => {
            try {
                const response = await axios.post<T>(
                `${host}/${endpoint}`,
                parameters,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
                );
                return (response as any).data;
            } catch(error: any) {
                return handleError(error);
            }
            
        },
        put: async <T, U>(endpoint: string, parameters: U): Promise<T | IResponse> => {
            try {
                const response = await axios.put<T>(
                    `${host}/${endpoint}`,
                    parameters,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                return (response as any).data

            } catch(error: any) {
                return handleError(error);
            }
        },
        delete: async <T, U>(endpoint: string, parameters: U): Promise<T | IResponse> => {
            try {
                const response = await axios.delete<T>(`${host}/${endpoint}`, {
                    params: parameters,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });
                return (response as any).data;
            } catch( error: any ) {
                return handleError(error); 
            }
        },
    };
};

export default StaticRoute;
