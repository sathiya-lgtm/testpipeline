import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    account_id: number;
    site_id: number;
}

export default async ({
    user,
    account_id,
    site_id,
}: IParams): Promise<{ account_id: number; site_id: number }> => {
    const data = await customFetch(
        `/api/site/cameras`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ account_id, site_id }),
        },
        'Site Delete With Camera'
    );

    const result: StandardApiResponseObj<{
        account_id: number;
        site_id: number;
    }> = await data.json();
    return result.response;
};
