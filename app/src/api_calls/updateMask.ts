import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

interface IUpdateMaskData {
    camera_id: number;
    mask: string;
}

interface IParams {
    user: IUser;
    maskData: IUpdateMaskData;
}

/** Makes a POST request to save mask. */
export default async ({ user, maskData }: IParams): Promise<void> => {
    await customFetch(
        `/api/cameras/mask`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(maskData),
        },
        'Mask update'
    );
};
