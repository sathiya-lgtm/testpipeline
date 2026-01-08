import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

export default async (
    user: IUser,
    uuid: string,
    account: string
): Promise<void> => {
    // TODO speak with Dayron about updating API to use "sites" term instead of "servers" (for parity).
    await customFetch(
        `/api/sp/servers/register`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ uuid, account }),
        },
        'Registration'
    );
};
