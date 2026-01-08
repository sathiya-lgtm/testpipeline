// Imports
import axios from 'axios';
import { IUser } from '../types/interfaces';
import { IResponse } from './StaticRoute';

const host = import.meta.env.VITE_API_DOMAIN || '';

export interface IAVPanelInfoRequest {
    camera_id: string;
}

export interface IAVPanelInfo {
    system_id: number;
    system_name: string;
    model: string;
    mac_address: string;
    ip_address: string;
    serial_number: string;
    subscribed: boolean;
}

export interface IAVPanelInfoResponse extends IResponse {
    panel: IAVPanelInfo;
}

interface IParams {
    user: IUser;
    camera_id: string;
}

export default async ({
    user,
    camera_id,
}: IParams): Promise<IAVPanelInfoResponse> => {
    const { data } = await axios.get<IAVPanelInfoResponse>(
        `${host}/api/av/panel`,
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
            params: { camera_id }
        }
    );

    return data;
};
