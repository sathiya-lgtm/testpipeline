// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = `api/camera/actions/available`;

export interface ICameraActionAvailable {
    service_provider_account_id: number;
    service_provider_account_name: string;
    account_id: number;
    account_name: string;
    site_id: number;
    site_name: string;
    camera_id: number;
    camera_name: string;
}

export interface IGetProps {
    service_provider_account_id?: number;
    account_id?: number;
    site_id?: number;
}

const CameraActionsAvailableRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetProps) =>
            api.get<ICameraActionAvailable[], IGetProps>(endpoint, parameters),
    };
};

export default CameraActionsAvailableRoute;
