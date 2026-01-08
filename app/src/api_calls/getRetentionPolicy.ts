import customFetch from '../utils/customFetch';

// Custom types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

/** Fetch the data retention policy for a specific customer */
export default async (
    user: IUser,
    accountId: string
): Promise<{ retention_days: number }> => {
    const data = await customFetch(
        `/api/user/retention_policy/${accountId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'GET Retention Policy'
    );

    const result: StandardApiResponseObj<{ retention_days: number }> =
        await data.json();
    return result.response;
};
