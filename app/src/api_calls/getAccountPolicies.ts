// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IAccountPolicy,
} from '../types/tng-api.interfaces';

export default async (user: IUser): Promise<IAccountPolicy[]> => {
    const data = await customFetch(
        `/api/account/sp_get_view`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Get Multi Modal Policies'
    );

    const { response }: StandardApiResponseObj<{ view: IAccountPolicy[] }> =
        await data.json();

    return response.view;
};
