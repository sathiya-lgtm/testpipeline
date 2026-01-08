// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    INLSearchTokens,
} from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    query: string;
    service_provider_id?: number;
}

export default async ({
    user,
    query,
    service_provider_id,
}: IParams): Promise<INLSearchTokens> => {
    let url = '/api/nl/query';

    if (service_provider_id) {
        url = `${url}?service_provider_id=${service_provider_id}`;
    }

    const data = await customFetch(
        url,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ query }),
            timeout: 30000,
        },
        'Forensic search'
    );

    const { response }: StandardApiResponseObj<{ tokens: INLSearchTokens }> =
        await data.json();

    return response.tokens;
};
