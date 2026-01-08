// Imports
import { IUser } from '../types/interfaces';
import PrivateRoute, {IResponse} from './PrivateRoute';

const access_endpoint = 'api/integrations/system/session';

export interface ISystemSessionRequest {
    account_id?: number | undefined | null,
    site_id: number,
    dmp_username?: string | null,
    dmp_password?: string | null
};

export interface ISystemSessionResponse extends IResponse {
    is_alarm_vision: boolean;
    is_expired: boolean;
    system_id: number;
    access_token?: string | undefined | null;
    refresh_token?: string | undefined | null;
};

const IntegrationsSystemSessionRoute = (user: IUser) => {
    const api = PrivateRoute({ user });
    return {
        get: async (parameters: ISystemSessionRequest) =>
            api.get<ISystemSessionResponse, ISystemSessionRequest>(access_endpoint, parameters),
        update: async (parameters: ISystemSessionRequest) => 
            api.post<ISystemSessionResponse, ISystemSessionRequest>(access_endpoint, parameters)
    };
};

export default IntegrationsSystemSessionRoute;
