// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

export default async ({
    user,
    accounts,
    natural_language_search,
}: {
    user: IUser;
    accounts: number[];
    natural_language_search: boolean;
}): Promise<any> => {
    const data = await customFetch(
        `/api/account/sp_modify_account_properties`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({
                properties: {
                    enable_natural_language_search: natural_language_search,
                },
                accounts,
                view: true,
            }),
        },
        'SP Modify Account Properties'
    );

    const { response }: StandardApiResponseObj<any> = await data.json();

    return response;
};
