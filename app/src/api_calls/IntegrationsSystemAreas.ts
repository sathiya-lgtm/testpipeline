// Imports
import { IUser } from '../types/interfaces';
import PrivateRoute, {IResponse} from './PrivateRoute';

const access_endpoint = 'api/integrations/system/areas';

export interface ISystemAreasRequest {
    account_id?: number | undefined | null,
    site_id: number,
    access_token?: string | null,
    refresh_token?: string | null
};

export interface IAreaInfo {
    number: string,
    name: string
}

export interface ISystemAreasResponse extends IResponse {
    areas: Array<IAreaInfo> | null | undefined
};

const IntegrationsSystemAreasRoute = (user: IUser) => {
    const api = PrivateRoute({ user });
    return {
        get: async (parameters: ISystemAreasRequest) =>
            api.get<ISystemAreasResponse, ISystemAreasRequest>(access_endpoint, parameters)
    };
};

export default IntegrationsSystemAreasRoute;
