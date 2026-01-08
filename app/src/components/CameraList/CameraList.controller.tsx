// Custom types
import { ListTarget } from '../../contexts/ListTarget.controller';
import { JobType } from '../../types/enums';

export const isServiceProviderActive = (
    listTarget: ListTarget | null,
    serviceProviderId: number
): boolean => {
    if (listTarget && 'serviceProviderId' in listTarget) {
        return listTarget.serviceProviderId === serviceProviderId;
    }

    return false;
};

export const isCustomerActive = (
    listTarget: ListTarget | null,
    customerId: number
): boolean => {
    if (listTarget && 'customerId' in listTarget) {
        return listTarget.customerId === customerId;
    }

    return false;
};

export const isSiteActive = (
    listTarget: ListTarget | null,
    siteId: number
): boolean => {
    if (listTarget && 'siteId' in listTarget) {
        return listTarget.siteId === siteId;
    }

    return false;
};

export const isCameraActive = (
    listTarget: ListTarget | null,
    cameraId: number
): boolean => {
    if (listTarget && 'cameraId' in listTarget) {
        return listTarget.cameraId === cameraId;
    }

    return false;
};

export const isOnCameraPage = (location: string): boolean => {
    return (
        location.includes('home/camera/') ||
        location.includes('home/edge/') ||
        location.includes('home/device-io/') ||
        location.includes('home/panel/') ||
        location.includes('home/dmp-panel/')
    );
};

export const isSiteEmpty = (jobTypes: (JobType | null)[]): boolean => {
    let isEmpty: boolean = true;

    jobTypes.forEach((jobType) => {
        if (jobType !== null) {
            isEmpty = false;
        }
    });

    return isEmpty;
};
