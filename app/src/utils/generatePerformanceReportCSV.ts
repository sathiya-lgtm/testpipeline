// Types
import { CameraPerformanceReport } from '../api_calls/generateCameraPerformanceReport';
import { JobType } from '../types/enums';

const convertCameraType = (cameraType: string | number) => {
    if (cameraType === 'rgb' || cameraType === 1) {
        return 'RGB (Color)';
    }

    if (cameraType === 'flir' || cameraType === 2) {
        return 'Thermal';
    }

    return 'RGB (Color)';
};

export const convertJobType = (jobType: JobType | undefined) => {
    if (jobType === 'email') return 'SMTP';
    if (jobType === 'milestone') return 'Milestone';
    if (jobType === 'verify') return 'Immix';
    if (jobType === 'edge') return 'Edge';
    return undefined;
};

const formatMotionConfidenceValue = (
    confidence: number | undefined,
    defaultValue: string
) => {
    if (typeof confidence === 'number') {
        return (confidence / 100).toFixed(2);
    }

    return defaultValue;
};

export default (reportData: CameraPerformanceReport[]) => {
    const csvJSONData = reportData.map((camera) => {
        return {
            SERVICE_PROVIDER: camera.sp_name,
            CAMERA_NAME: camera.name,
            CUSTOMER: camera.account_name,
            SITE: camera.site_name,
            CAMERA_UUID: camera.uuid,
            RETENTION_POLICY: `${camera.retention_days} days`,
            CAMERA_TYPE: convertCameraType(camera.camera_type),
            EVENT_TYPE: convertJobType(camera.properties.job_type),
            MASKED: camera.mask ? 'yes' : 'no',
            PERSON_CONFIDENCE_THRESHOLD: camera.confidence.person || '0.75',
            PERSON_MOTION_CONFIDENCE_THRESHOLD: formatMotionConfidenceValue(
                camera.properties.person_motion_confidence,
                '0.04'
            ),
            VEHICLE_CONFIDENCE_THRESHOLD: camera.confidence.vehicle || '0.75',
            VEHICLE_MOTION_CONFIDENCE_THRESHOLD: formatMotionConfidenceValue(
                camera.properties.vehicle_motion_confidence,
                '0.3'
            ),
            PERSON_EVENTS: camera.events_summary.person,
            VEHICLE_EVENTS: camera.events_summary.vehicle,
            PERSON_AND_VEHICLE_EVENTS: camera.events_summary.person_and_vehicle,
            TRUE_EVENTS: camera.events_summary.true_events,
            FALSE_EVENTS: camera.events_summary.false_events,
            TOTAL_EVENTS: camera.events_summary.total_events,
            PERSON_LOITERING: camera.events_summary.person_loitering,
            VEHICLE_LOITERING: camera.events_summary.vehicle_loitering,
            DATE_RANGE: camera.date_range,
        };
    });

    let csvString = '';
    csvString += `${Object.keys(csvJSONData[0]).join(',')}\n`;
    csvJSONData.forEach((dataPoint) => {
        csvString += `${Object.values(dataPoint).join(',')}\n`;
    });
    return csvString;
};
