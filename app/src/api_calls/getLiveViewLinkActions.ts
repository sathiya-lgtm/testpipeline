// Utils
import axios from 'axios';

// Types
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

export interface ILiveViewAction {
    camera_action_id: number;
    camera_action_name: string;
    camera_id: number;
    camera_name: string;
    network_device_id: number;
    network_device_name: string;
    network_device_properties: any;
    camera_action_properties: any;
}

/** Makes a POST request to receive a given camera's mask. */
export default async (
    camera_id: number,
    live_view_link_token: string
): Promise<StandardApiResponseObj<{ data: ILiveViewAction[] }>> => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ data: ILiveViewAction[] }>
    >(`${host}/api/camera/actions/liveview`, {
        params: { camera_id, live_view_link_token },
    });

    return data;
};
