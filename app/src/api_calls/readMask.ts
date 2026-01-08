import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj, IMaskData } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    historyId: number;
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({ user, historyId }: IParams): Promise<IMaskData> => {
    const data = await customFetch(
        `/api/cameras/read_mask`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ history_id: historyId }),
        },
        'Load mask'
    );

    const { response }: StandardApiResponseObj<IMaskData> = await data.json();

    return response;
};
