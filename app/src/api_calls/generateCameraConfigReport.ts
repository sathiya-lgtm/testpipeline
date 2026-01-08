import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

import { StandardApiResponseObj } from '../types/tng-api.interfaces';

export interface ICameraConfigReport {
    headers: string[];
    rows: string[];
}

export interface ICameraReportData {
    group: string;
    group_id: number;
}

interface IParams {
    user: IUser;
    cameraReportData: ICameraReportData;
}

export default async ({
    user,
    cameraReportData: createSiteData,
}: IParams): Promise<ICameraConfigReport> => {
    const data = await customFetch(
        `/api/reporting/camera_config`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(createSiteData),
            timeout: 15000,
        },
        'Camera Config Report'
    );

    const result: StandardApiResponseObj<ICameraConfigReport> =
        await data.json();
    return result.response;
};
