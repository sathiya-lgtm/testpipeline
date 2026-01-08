import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

export interface IUpdateCameraConfig {
    camera_id: number;
    camera_name?: string;
    site_id?: number;
    camera_ip?: string;
    camera_properties?: { [key: string]: any };
    used_zones?: string[] | number[];
    zones?: any[];
}

interface IParams {
    user: IUser;
    cameraConfig: IUpdateCameraConfig;
}

export default async ({ user, cameraConfig }: IParams): Promise<Response> => {
    return customFetch(
        `/api/cameras/update_camera`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(cameraConfig),
        },
        'Update Camera'
    );
};
