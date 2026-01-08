import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    camera_id: number;
    dmp_user_id?: string;
    dmp_password?:  string;
}

export default async ({
    user,
    camera_id,
    dmp_user_id,
    dmp_password
}: IParams): Promise<{ camera_id: number; is_active: boolean }> => {
    const data = await customFetch(
        `/api/cameras/delete_camera`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ camera_id, is_active: false, dmp_user_id, dmp_password }),
        },
        'Delete Camera'
    );

    const result: StandardApiResponseObj<{
        camera_id: number;
        is_active: boolean;
    }> = await data.json();
    return result.response;
};
