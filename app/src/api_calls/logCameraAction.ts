// Utils
import axios from 'axios';

// Types
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

export interface ICameraActionLog {
    camera_id: number;
    camera_action_id: number;
    token: string;
}

/** Makes a POST request to receive a given camera's mask. */
export default async (
    CameraActionLog: ICameraActionLog
): Promise<StandardApiResponseObj<any>> => {
    const { data } = await axios.post<StandardApiResponseObj<any>>(
        `${host}/api/camera/action/alert/liveview`,
        CameraActionLog
    );

    return data;
};
