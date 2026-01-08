// Imports
import { IUser } from '../types/interfaces';
import PrivateRoute, {IResponse} from './PrivateRoute';

const endpoint = 'api/edge/version';

export interface IEdgeVersionRequest {
    camera_id: string;
}

export interface IEdgeVersionResponse extends IResponse {
    version: string;
    supports_enhanced_features: boolean;
}

const getEdgeVersionInfo = (user: IUser) => {
    const api = PrivateRoute({ user });
    return {
        get: async (parameters: IEdgeVersionRequest) =>
            api.get<IEdgeVersionResponse, IEdgeVersionRequest>(
                endpoint,
                parameters
            ),
    };
};

export default getEdgeVersionInfo;
