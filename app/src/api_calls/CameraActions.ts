// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = 'api/camera/action';

export interface ICameraAction {
    camera_action_id: number;
    camera_action_name: string;
    camera_id: number;
    camera_name: string;
    network_device_action_available_id: number;
    network_device_action_available_name: string;
    network_device_action_available_properties: any;
    properties: any;
    created_at?: string;
    updated_at?: string;
}

export interface IGetProps {
    service_provider_account_id: number;
    account_id: number;
    site_id: number;
    camera_id?: number | undefined | null;
    network_device_action_available_id?: number | undefined | null;
}

export interface ICreateProps {
    camera_action_name: string;
    camera_id: number;
    network_device_action_available_id: number;
    properties: any | null;
}

export interface IUpdateProps {
    camera_action_id: number;
    camera_action_name: string;
    camera_id: number;
    network_device_action_available_id: number;
    properties: any;
}

export interface IDeleteProps {
    camera_action_id: number;
}

const CameraActionsRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetProps) =>
            api.get<ICameraAction[], IGetProps>(endpoint, parameters),
        insert: (parameters: ICreateProps) =>
            api.insert<ICameraAction, ICreateProps>(endpoint, parameters),
        update: (parameters: IUpdateProps) =>
            api.update<ICameraAction, IUpdateProps>(endpoint, parameters),
        delete: (parameters: IDeleteProps) =>
            api.delete<boolean, IDeleteProps>(endpoint, parameters),
    };
};

export default CameraActionsRoute;
