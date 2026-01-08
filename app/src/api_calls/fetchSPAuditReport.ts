import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    ISPAuditReportData,
} from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    spAuditReportData: {
        start_time: string;
        end_time: string;
        service_provider_account_id?: number; // 0 means no results for Evolon, and service provider will always be set to their service_provider_account_id by default
        account_id?: number;
        site_id?: number;
        camera_id?: number;
    };
}

export default async ({
    user,
    spAuditReportData,
}: IParams): Promise<ISPAuditReportData> => {
    const data = await customFetch(
        `/api/reporting/sp_audit`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(spAuditReportData),
            timeout: 30000,
        },
        'SP Audit Report'
    );

    const result: StandardApiResponseObj<ISPAuditReportData> =
        await data.json();
    return result.response;
};
