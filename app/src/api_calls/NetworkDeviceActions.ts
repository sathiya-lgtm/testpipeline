// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = 'api/network/device/action';

export interface INetworkDeviceAction {
    service_provider_account_id: number;
    service_provider_account_name: string;
    account_id: number;
    account_name: string;
    site_id: number;
    site_name: string;
    camera_id: number;
    camera_name: string;
    network_device_action_id: number;
    network_device_id: number;
    network_device_properties: {
        ip_address: string;
        mac_address: string;
        user_name: string;
        user_password: string;
    };
    camera_action_properties: {
        clip: number;
        max_volume: number;
        min_volume: number;
        test_volume: number;
        alert_volume: number;
    };
    network_device_name: string;
    camera_action_id: number;
    camera_action_name: string;
    created_at?: string;
    updated_at?: string;
}

export interface IGetProps {
    service_provider_account_id?: number;
    account_id?: number;
    site_id?: number;
    camera_id?: number;
}

export interface ICreateProps {
    network_device_id: number;
    camera_action_id: number;
}

export interface ICopyProps {
    camera_from_id: number;
    camera_to_ids: number[];
}

export interface IDeleteProps {
    network_device_action_id: number;
}

const NetworkDeviceActionsRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetProps) =>
            api.get<INetworkDeviceAction[], IGetProps>(endpoint, parameters),
        insert: (parameters: ICreateProps) =>
            api.insert<INetworkDeviceAction, ICreateProps>(
                endpoint,
                parameters
            ),
        copy: async (parameters: ICopyProps) => {
            const result = await api.insert<Boolean, ICopyProps>(
                `${endpoint}/copy`,
                parameters
            );
            return (result as any).success;
        },
        delete: async (parameters: IDeleteProps) => {
            const success = await api.delete<Boolean, IDeleteProps>(
                endpoint,
                parameters
            );
            return {
                success,
                network_device_action_id: parameters.network_device_action_id,
            };
        },
    };
};

export default NetworkDeviceActionsRoute;
