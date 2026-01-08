// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    INewForensicClip,
    StandardApiResponseObj,
} from '../types/tng-api.interfaces';

export interface IAIForensicQueryObj {
    start_date: string;
    end_date: string;
    site_id: number;
    camera_names?: string[];
    cameras?: number[];
    events_filter?: string[];
    event_type_filter?: string[];
    classifications_filter?: string[];
    gender_types?: string[];
    vehicle_colors?: string[];
    vehicle_types?: string[];
    '*service_provider'?: number;
    file_id?: number;
    page_limit?: number;
    is_audit_mode: boolean;
}

interface IParams {
    user: IUser;
    aiSearch: IAIForensicQueryObj | undefined;
}

export default async ({
    user,
    aiSearch,
}: IParams): Promise<{
    data: INewForensicClip[];
    last_dt: string;
}> => {
    const data = await customFetch(
        `/api/ai/forensic/context_search`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(aiSearch),
            timeout: 30000,
        },
        'AI Forensic search'
    );

    const {
        response,
    }: StandardApiResponseObj<{ data: INewForensicClip[]; last_dt: string }> =
        await data.json();

    return response;
};
