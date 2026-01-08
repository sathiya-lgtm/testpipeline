// Imports
import { IUser } from '../types/interfaces';
import PrivateRoute, { IResponse } from './PrivateRoute';

const endpoint = 'api/camera/action/alert';

export interface ICameraActionAlertRequest {
    camera_id: number;
    camera_action_id: number;
}

export interface ICameraActionAlertRespone extends IResponse {}

const CameraActionAlertRoute = (user: IUser) => {
    const api = PrivateRoute({ user });
    return {
        insert: async (parameters: ICameraActionAlertRequest) =>
            api.post<ICameraActionAlertRespone, ICameraActionAlertRequest>(
                endpoint,
                parameters
            ),
    };
};

export default CameraActionAlertRoute;
