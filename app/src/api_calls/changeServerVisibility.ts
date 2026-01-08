import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

export default async (
    user: IUser,
    uuid: string,
    spAccount: string
): Promise<void> => {
    await customFetch(
        `/api/sp/servers/register-viewable`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ uuid, sp_account: spAccount }),
        },
        'Server visibility update'
    );
};
