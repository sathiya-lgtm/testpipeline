// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IClipResponse,
} from '../types/tng-api.interfaces';

interface IForensicSearch {
    range_start: string;
    range_end: string;
    '*audit_mode'?: boolean;
    '*sites'?: number[];
    '*objects'?: string[];
    '*cameras'?: number[];
    '*accounts'?: number[];
}

interface IParams {
    user: IUser;
    forensicSearch: IForensicSearch;
}

export default async ({
    user,
    forensicSearch,
}: IParams): Promise<IClipResponse> => {
    const data = await customFetch(
        `/api/alerts/forensic/v2`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(forensicSearch),
        },
        'Forensic search'
    );

    const { response }: StandardApiResponseObj<IClipResponse> =
        await data.json();

    return response;
};
