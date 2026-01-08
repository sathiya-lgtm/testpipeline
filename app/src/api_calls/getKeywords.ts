// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

interface IKeywordDetails {
    text: string;
    id: number;
}

export interface ITokenResponse {
    tokens: {
        cameras: IKeywordDetails[];
        customers: IKeywordDetails[];
        sites: IKeywordDetails[];
    };
}

export default async (
    user: IUser | null,
    service_provider_id?: number | null
): Promise<ITokenResponse> => {
    let url = '/api/nl/keywords';

    if (service_provider_id) {
        url = `${url}?service_provider_id=${service_provider_id}`;
    }

    const data = await customFetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.accessToken}`,
        },
    });

    const result: StandardApiResponseObj<ITokenResponse> = await data.json();
    return result.response;
};
