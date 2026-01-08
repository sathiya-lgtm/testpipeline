// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    INewForensicClip,
} from '../types/tng-api.interfaces';

export interface IForensicSearchParams {
    start_date: string;
    end_date: string;
    service_provider_account_id?: number;
    account_id: number;
    site_id: number; // 0 or site_id
    camera_id: number; // 0 or camera_id
    classifications_filter?: string[]; // ["Person","Vehicle"] or subset of these values
    event_type_filter?: string[]; // ["Device","Panel"] or subset of these values
    events_filter?: string[]; // ["Loitering","Access Request"] or subset of these values
    is_audit_mode: boolean; // optional parameter default false */
    page_limit?: number; // defaults to 50
    file_id?: number; // last file id displayed in the table
}

interface IParams {
    user: IUser;
    forensicSearch: IForensicSearchParams;
}

export default async ({
    user,
    forensicSearch,
}: IParams): Promise<{ data: INewForensicClip[]; last_dt: string }> => {
    const data = await customFetch(
        `/api/alerts/forensic/search`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(forensicSearch),
        },
        'Forensic search'
    );

    const {
        response,
    }: StandardApiResponseObj<{ data: INewForensicClip[]; last_dt: string }> =
        await data.json();

    return response;
};
