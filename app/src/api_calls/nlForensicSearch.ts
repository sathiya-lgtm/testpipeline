// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IForensicClipResponse,
} from '../types/tng-api.interfaces';

export interface INLForensicQueryObj {
    date_from: string;
    date_to: string;
    request: 'standard' | 'audit';
    last_index: number;
    order: 'desc';
    customers?: number[];
    sites?: number[];
    cameras?: number[];
    objects?: string[];
    secondary_sex?: string[];
    secondary_vehicle_type?: string[];
    secondary_vehicle_color?: string[];
}

interface IParams {
    user: IUser;
    query: INLForensicQueryObj;
}

export default async ({
    user,
    query,
}: IParams): Promise<IForensicClipResponse> => {
    const data = await customFetch(
        `/api/nl/forensic`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(query),
        },
        'Forensic search'
    );

    const { response }: StandardApiResponseObj<IForensicClipResponse> =
        await data.json();

    return response;
};
