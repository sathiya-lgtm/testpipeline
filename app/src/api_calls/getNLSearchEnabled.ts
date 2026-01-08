// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

export default async (user: IUser): Promise<0 | 1> => {
    const data = await customFetch(
        `/api/account/has_nl_option`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'GET NL Search Enabled'
    );

    const {
        response,
    }: StandardApiResponseObj<{ enable_natural_language_search: 0 | 1 }> =
        await data.json();

    return response.enable_natural_language_search;
};
