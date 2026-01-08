// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';
import { ForensicSearchPaginatedResponse } from './forensicSearchPaginated';

export interface INLForensicQueryObj {
    date_from: string;
    date_to: string;
    request: string;
    order: string;
    last_index?: number;
    '*service_provider'?: number;
    customers?: number[];
    sites?: number[];
    cameras?: number[];
    objects?: string[];
    secondary_sex?: string[];
    secondary_vehicle_type?: string[];
    secondary_vehicle_color?: string[];
}

export interface INLForensicSearchPaginatedParams {
    user: IUser;
    nlSearch: INLForensicQueryObj | undefined;
}

export default async ({
    user,
    nlSearch,
}: INLForensicSearchPaginatedParams): Promise<ForensicSearchPaginatedResponse> => {
    const data = await customFetch(
        `/api/alerts/forensic/paginated`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(nlSearch),
            timeout: 30000,
        },
        'Forensic search'
    );

    const {
        response,
    }: StandardApiResponseObj<ForensicSearchPaginatedResponse> =
        await data.json();

    return response;
};
