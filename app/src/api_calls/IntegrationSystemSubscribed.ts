// Imports
import { IUser } from '../types/interfaces';
import PrivateRoute, {IResponse} from './PrivateRoute';

const endpoint = 'api/integrations/system/subscribed';

export interface ISystemSubscribedRequest {
    site_id: number
};

export interface ISystemSubscribedResponse extends IResponse {
    subscribed: boolean,
    authorized: boolean
};

const IntegrationsSystemSubscribedRoute = (user: IUser) => {
    const api = PrivateRoute({ user });
    return {
        get: async (parameters: ISystemSubscribedRequest) =>
            api.get<ISystemSubscribedResponse, ISystemSubscribedRequest>(endpoint, parameters)
    };
};

export default IntegrationsSystemSubscribedRoute;
