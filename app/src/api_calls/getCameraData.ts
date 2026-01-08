import customFetch from '../utils/customFetch';

// Custom types
import { IUser } from '../types/interfaces';
import { ICameraLinkResponse, ICameraData } from '../types/tng-api.interfaces';

/** Fetch request for getting data for an individual camera via camera_id (e.g. 1, 215, 340, etc). */
export default async (user: IUser, cameraId: string): Promise<ICameraData> => {
    const data = await customFetch(
        `/api/list/camera/${cameraId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Camera retrieval'
    );

    const result: ICameraLinkResponse = await data.json();
    const camera: ICameraData = result.response;

    return camera;
};
