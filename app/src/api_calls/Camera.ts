// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = `api/camera/eligible`;

export interface ICamera {
    service_provider_account_id: number;
    service_provider_account_name: string;
    account_id: number;
    account_name: string;
    site_id: number;
    site_name: string;
    camera_id: number;
    camera_name: string;
    network_device_actions_count: number;
}

export interface IGetProps {
    service_provider_account_id?: number;
    account_id?: number;
    site_id: number;
    camera_id?: number | undefined | null;
}

const CameraRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetProps) =>
            api.get<ICamera[], IGetProps>(endpoint, parameters),
    };
};

export default CameraRoute;
