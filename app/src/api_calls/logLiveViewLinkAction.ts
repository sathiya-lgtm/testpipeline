// Utils
import axios from 'axios';

// Types
import { StandardApiResponseObj } from '../types/tng-api.interfaces';
import { IAxisHornAction } from '../views/LiveViewLinks/LiveViewLinks';

const host = import.meta.env.VITE_API_DOMAIN || '';

export interface IHornActionLog {
    camera_id: number;
    device_id: number;
    live_view_link_token: string;
    request_id: string; // uuid
    action: 'send' | 'response';
    details: string;
    properties: IAxisHornAction;
}

/** Makes a POST request to receive a given camera's mask. */
export default async (
    hornActionLog: IHornActionLog
): Promise<StandardApiResponseObj<any>> => {
    const { data } = await axios.post<StandardApiResponseObj<any>>(
        `${host}/api/network/device/action/log`,
        hornActionLog
    );

    return data;
};
