// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = 'api/network/device/actions/available';

// Interface for Network Device Action Available
export interface INetworkDeviceActionAvailableField {
    name: string;
    label: string;
    control: string;
    datatype: string;
    defaultValue: string;
    tooltip: string;
}

export interface INetworkDeviceActionAvailableProperties {
    fields: INetworkDeviceActionAvailableField[];
}

export interface INetworkDeviceActionAvailable {
    network_device_action_available_id: number;
    network_device_action_available_name: string;
    properties: INetworkDeviceActionAvailableProperties;
    created_at?: string;
    updated_at?: string;
}

export interface IGetProps {}

// Interfaces to register Network Device Action Available
export interface ICreateProps {
    network_device_action_available_name: string;
    properties: INetworkDeviceActionAvailableProperties;
}

// Interfaces to update Network Device Action Available
export interface IUpdateProps {
    network_device_action_available_id: number;
    network_device_action_available_name: string;
    properties: INetworkDeviceActionAvailableProperties;
}

// Interfaces to delete Network Device Action Available
export interface IDeleteProps {
    network_device_action_available_id: number;
    network_device_action_available_name: string;
}

const NetworkDeviceActionsAvailableRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetProps) =>
            api.get<INetworkDeviceActionAvailable[], IGetProps>(
                endpoint,
                parameters
            ),
        insert: (parameters: ICreateProps) =>
            api.insert<INetworkDeviceActionAvailable, ICreateProps>(
                endpoint,
                parameters
            ),
        update: (parameters: IUpdateProps) =>
            api.update<INetworkDeviceActionAvailable, IUpdateProps>(
                endpoint,
                parameters
            ),
        delete: (parameters: IDeleteProps) =>
            api.delete<boolean, IDeleteProps>(endpoint, parameters),
    };
};

export default NetworkDeviceActionsAvailableRoute;
