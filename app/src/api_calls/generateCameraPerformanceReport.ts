import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { JobType, TrackingSensitivity } from '../types/enums';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

export interface CameraPerformanceReport {
    account_id: number;
    account_name: string;
    sp_name: string;
    camera_id: number;
    camera_type: number;
    confidence: {
        person?: number; // Decimal between 0 - 1.
        vehicle?: number; // Decimal between 0 - 1.
    };
    configuration: {};
    created_at: string; // date string
    ip: string;
    is_active: boolean;
    mask: boolean;
    name: string;
    events_summary: {
        vehicle: number;
        person: number;
        person_and_vehicle: number;
        true_events: number;
        false_events: number;
        total_events: number;
        person_loitering: number;
        vehicle_loitering: number;
    };
    date_range: string;
    properties: {
        /** The optional properties are only present if camera has mask. */
        job_type: JobType;
        mask_hash?: string;
        mask_history_reference?: number;
        /** Default true unless job_type is "milestone" */
        allow_masking: boolean;
        camera_type?: 'rgb' | 'flir';
        vehicle_motion_sensitivity?: TrackingSensitivity | number;
        person_motion_confidence?: number;
        vehicle_motion_confidence?: number;
        email?: string;
    };
    retention_days: number;
    site_id: number;
    site_name: string;
    uuid: string;
}

export interface IPerformanceReportInputData {
    group: string;
    group_id: number;
    start_date: string;
    end_date: string;
    timezone: string;
}

interface IParams {
    user: IUser;
    performanceReportInputData: IPerformanceReportInputData;
}

export default async ({
    user,
    performanceReportInputData,
}: IParams): Promise<CameraPerformanceReport[]> => {
    const data = await customFetch(
        `/api/reporting/camera_performance`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(performanceReportInputData),
            timeout: 15000,
        },
        'Camera Performance Report'
    );

    const result: StandardApiResponseObj<CameraPerformanceReport[]> =
        await data.json();
    return result.response;
};
