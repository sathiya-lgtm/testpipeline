import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    site_id: number;
}

export default async ({
    user,
    site_id,
}: IParams): Promise<{ account_id: number; site_id: number }> => {
    const data = await customFetch(
        `/api/site/remove`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ site_id }),
        },
        'Site Delete'
    );

    const result: StandardApiResponseObj<{
        account_id: number;
        site_id: number;
    }> = await data.json();
    return result.response;
};
