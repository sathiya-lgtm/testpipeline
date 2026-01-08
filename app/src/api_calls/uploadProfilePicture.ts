import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    profilePictureData: string;
}

/** Makes a POST request to save mask. */
export default async ({
    user,
    profilePictureData,
}: IParams): Promise<{ thumbnail: string }> => {
    const data = await customFetch(
        `/api/user/set_profile_picture`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ thumbnail: profilePictureData }),
        },
        'Upload Profile Picture'
    );

    const result: StandardApiResponseObj<{
        thumbnail: string;
    }> = await data.json();
    return result.response;
};
