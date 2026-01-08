// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = 'api/network/device';

// Interface for Network Device properties
export interface INetworkDeviceProperites {
    [name: string]: string | number | boolean | null | undefined;
}

// Interface for Network Device
export interface INetworkDevice {
    network_device_id: number;
    network_device_name: string;
    network_device_type_id: number;
    network_device_type_name: string;
    account_id: number;
    account_name?: string;
    site_id: number;
    site_name?: string;
    is_active?: boolean;
    properties?: INetworkDeviceProperites | any | null;
    device_status?: number;
    heartbeat_at?: string;
    created_at?: string;
    updated_at?: string;
}

// Interfaces to register Network Device
export interface IGetProps {
    network_device_id?: number;
    service_provider_account_id?: number | null;
    account_id?: number;
    site_id?: number;
}

// Interfaces to register Network Device
export interface ICreateProps {
    network_device_name: string;
    network_device_type_id: number;
    account_id: number;
    site_id: number;
    properties?: INetworkDeviceProperites | any | null;
}

// Interfaces to update Network Device
export interface IUpdateProps {
    network_device_id: number;
    network_device_name: string;
    network_device_type_id: number;
    account_id: number;
    site_id: number;
    is_active?: boolean;
    properties?: INetworkDeviceProperites | any | null;
}

// Interfaces to delete Network Device
export interface IDeleteProps {
    network_device_id: number;
}

const NetworkDeviceRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetProps) =>
            api.get<INetworkDevice[], IGetProps>(endpoint, parameters),
        insert: (parameters: ICreateProps) =>
            api.insert<INetworkDevice, ICreateProps>(endpoint, parameters),
        update: (parameters: IUpdateProps) =>
            api.update<INetworkDevice, IUpdateProps>(endpoint, parameters),
        delete: (parameters: IDeleteProps) =>
            api.delete<boolean, IDeleteProps>(endpoint, parameters),
    };
};

export default NetworkDeviceRoute;
