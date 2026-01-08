// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

export interface IProMonitoringReportInputData {
    group: 'service_provider' | 'customer' | 'camera' | 'site';
    group_id: number;
    start_dt?: string;
    end_dt?: string;
    time_zone?: string;
}

interface IParams {
    user: IUser;
    reportParams: IProMonitoringReportInputData;
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    reportParams,
}: IParams): Promise<
    StandardApiResponseObj<{ headers: string[]; rows: string[] }>
> => {
    const { data } = await axios.post<
        StandardApiResponseObj<{ headers: string[]; rows: string[] }>
    >(
        `${host}/api/reporting/pro_monitoring`,

        reportParams,
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data;
};
