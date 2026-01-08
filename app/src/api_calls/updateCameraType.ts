import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

interface IParams {
    user: IUser;
    cameraId: number;
    cameraType: 'rgb' | 'thermal';
}

export default async ({
    user,
    cameraId,
    cameraType,
}: IParams): Promise<Response> => {
    return customFetch(
        `/api/cameras/update_properties`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({
                camera_id: cameraId,
                changes: { camera_type: cameraType },
            }),
        },
        'Update camera type'
    );
};
