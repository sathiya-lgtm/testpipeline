import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

export interface ISiteUpdateData {
    site_id: number;
    new_site_name: string;
}

interface IParams {
    user: IUser;
    siteUpdateData: ISiteUpdateData;
}

export default async ({
    user,
    siteUpdateData,
}: IParams): Promise<{ account_id: number }> => {
    const data = await customFetch(
        `/api/site/update`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(siteUpdateData),
        },
        'Site Update'
    );

    const result: StandardApiResponseObj<{ account_id: number }> =
        await data.json();
    return result.response;
};
