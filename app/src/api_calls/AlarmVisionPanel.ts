// Imports
import { IUser } from '../types/interfaces';
import PrivateRoute, { IResponse } from './PrivateRoute';

const endpoint = 'api/av/panel/retrieve';

export interface IAVPanelSyncRequest {
    system_id: number;
    mac_address: string;
    serial_number: string;
    access_token: string;
    refresh_token: string;
}

export interface IAVPanelSyncResponse extends IResponse {
    changed: boolean;
    mac_address: string;
    serial_number: string;
}

const AlarmVisionPanelRoute = (user: IUser) => {
    const api = PrivateRoute({ user });
    return {
        sync: async (parameters: IAVPanelSyncRequest) =>
            api.post<IAVPanelSyncResponse, IAVPanelSyncRequest>(
                endpoint,
                parameters
            ),
    };
};

export default AlarmVisionPanelRoute;