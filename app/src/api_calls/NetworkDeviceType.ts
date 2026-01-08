// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = 'api/network/device/type';

export interface INetworkDeviceTypeField {
    name: string;
    label: string;
    control: string;
    datatype: string;
    defaultValue: string | number;
    tooltip: string;
}

export interface INetworkDeviceTypeProperties {
    fields: INetworkDeviceTypeField[];
}

export interface INetworkDeviceType {
    network_device_type_id: number;
    network_device_type_name: string;
    model: string;
    description: string;
    is_active: boolean;
    properties: INetworkDeviceTypeProperties;
    created_at?: string;
    updated_at?: string;
}

export interface IGetProps {
    is_active?: boolean;
}

export interface ICreateProps {
    network_device_type_name: string;
    model: string;
    description: string;
    properties: any | null;
}

export interface IUpdateProps {
    network_device_type_id: number;
    network_device_type_name: string;
    model: string;
    description: string;
    is_active: boolean;
    properties: any | null;
}

export interface IDeleteProps {
    network_device_type_id: number;
}

const NetworkDeviceTypeRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetProps) =>
            api.get<INetworkDeviceType[], IGetProps>(endpoint, parameters),
        insert: (parameters: ICreateProps) =>
            api.insert<INetworkDeviceType, ICreateProps>(endpoint, parameters),
        update: (parameters: IUpdateProps) =>
            api.update<INetworkDeviceType, IUpdateProps>(endpoint, parameters),
        delete: (parameters: IDeleteProps) =>
            api.delete<boolean, IDeleteProps>(endpoint, parameters),
    };
};

export default NetworkDeviceTypeRoute;
