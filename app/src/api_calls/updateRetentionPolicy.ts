import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    account_id: number;
    retention_days: number;
}

export default async ({
    user,
    account_id,
    retention_days,
}: IParams): Promise<any> => {
    const data = await customFetch(
        `/api/user/update_retention_policy`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ account_id, retention_days }),
        },
        'Update Retention Policy'
    );

    const result: StandardApiResponseObj<any> = await data.json();
    return result.response;
};
