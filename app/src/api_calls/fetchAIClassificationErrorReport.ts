import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IAIClassificationErrorReportData,
} from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    AIClassificationErrorReportData: {
        start_time: string;
        end_time: string;
        service_provider_account_id?: number; // 0 means all SP
        account_id?: number;
        site_id?: number;
        camera_id?: number;
    };
}

export default async ({
    user,
    AIClassificationErrorReportData,
}: IParams): Promise<IAIClassificationErrorReportData> => {
    const { data } = await axios.get<
        StandardApiResponseObj<IAIClassificationErrorReportData>
    >(`${host}/api/reporting/ai_classification_error`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params: AIClassificationErrorReportData,
    });
    return data.response;
};
