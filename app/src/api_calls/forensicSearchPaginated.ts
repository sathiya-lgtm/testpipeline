// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { IClip, StandardApiResponseObj } from '../types/tng-api.interfaces';

export type ForesenicSearchOverviewData = {
    pages: number;
    records: number;
    last_page_count: number;
    request_type: 'standard' | 'audit';
};

export type ForensicSearchPaginatedResponse = {
    set?: ForesenicSearchOverviewData;
} & {
    [key: Exclude<string, 'set'>]: {
        hash: string;
        rows: {
            [key: string]: IClip;
        } | null;
    };
};

interface IForensicSearch {
    range_start: string;
    range_end: string;
    request?: string;
    hash: string;
    order: string;
    last_index?: number;
    '*sites'?: number[];
    '*objects'?: string[];
    '*cameras'?: number[];
    '*accounts'?: number[];
    '*service_provider'?: number;
}

// hash: hash,
// last_index: lastIndex

export interface IForensicSearchPaginatedParams {
    user: IUser;
    forensicSearch: IForensicSearch;
}

export default async ({
    user,
    forensicSearch,
}: IForensicSearchPaginatedParams): Promise<ForensicSearchPaginatedResponse> => {
    const data = await customFetch(
        '/api/alerts/forensic/paginated',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(forensicSearch),
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
