// Imports
import { IUser } from '../types/interfaces';
import PrivateRoute, {IResponse} from './PrivateRoute';

const access_endpoint = 'api/integrations/system/access';

export interface ISystemAccessRequest {
    system_id: number
};

export interface ISystemAccessResponse extends IResponse {
    is_jwt_expired: boolean;
    access_token: string;
    refresh_token: string;
};

const IntegrationsSystemRoute = (user: IUser) => {
    const api = PrivateRoute({ user });
    return {
        access: async (parameters: ISystemAccessRequest) =>
            api.post<ISystemAccessResponse, ISystemAccessRequest>(access_endpoint, parameters)
    };
};

export default IntegrationsSystemRoute;
