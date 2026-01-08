// Imports
import StaticRoute, {IResponse} from './StaticRoute';

const endpoint = 'api/scapi/login';

export interface ISCAPILoginRequest {
    username: string,
    password: string
};

export interface ISCAPILoginResponse extends IResponse {
    access_token: string,
    refresh_token: string
};

const SCAPIRoute = () => {
    const api = StaticRoute();
    return {
        login: async (parameters: ISCAPILoginRequest) =>
            api.post<ISCAPILoginResponse, ISCAPILoginRequest>(endpoint, parameters)
    };
};

export default SCAPIRoute;