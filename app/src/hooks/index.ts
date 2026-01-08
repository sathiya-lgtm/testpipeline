import { useEffect, useRef } from 'react';

// Third party
import { useQuery } from '@tanstack/react-query';

// API Calls
import getServiceProviders from '../api_calls/getServiceProviders';
import getCustomers from '../api_calls/getCustomers';
import getSites from '../api_calls/getSites';
import getCameras from '../api_calls/getCameras';
import getAllAlerts from '../api_calls/getAllAlerts';
import getCameraData from '../api_calls/getCameraData';

// Types
import { IUser } from '../types/interfaces';

export const usePrevious = (value: any) => {
    // The ref object is a generic container whose current property is mutable ...
    // ... and can hold any value, similar to an instance property on a class
    const ref = useRef<any>();
    // Store current value in ref
    useEffect(() => {
        ref.current = value;
    }, [value]); // Only re-run if value changes
    // Return previous value (happens before update in useEffect above)
    return ref.current;
};

export const useServiceProviders = ({
    activeUser,
    enabled,
    onError,
}: {
    activeUser: IUser;
    enabled?: boolean;
    onError?: (error: unknown) => void;
}) =>
    useQuery({
        queryKey: ['service-providers'],
        queryFn: () => getServiceProviders(activeUser),
        cacheTime: 300_000, // 5 minutes in milliseconds.
        staleTime: Infinity, // Forces query to use cache if available and "enabled" is set to true.
        enabled,
        onError,
    });

export const useCustomers = ({
    serviceProviderId,
    activeUser,
    enabled,
    onError,
}: {
    serviceProviderId: number;
    activeUser: IUser;
    enabled?: boolean;
    onError?: (error: unknown) => void;
}) =>
    useQuery({
        queryKey: ['customers', serviceProviderId],
        queryFn: () => getCustomers(activeUser, serviceProviderId),
        cacheTime: 300_000, // 5 minutes in milliseconds.
        staleTime: Infinity, // Forces query to use cache if available and "enabled" is set to true.
        enabled,
        onError,
    });

export const useSites = ({
    customerId,
    activeUser,
    enabled,
    onError,
}: {
    customerId: number;
    activeUser: IUser;
    enabled?: boolean;
    onError?: (error: unknown) => void;
}) =>
    useQuery({
        queryKey: ['sites', customerId],
        queryFn: () => getSites(activeUser, customerId),
        enabled,
        onError,
    });

export const useCameras = ({
    siteId,
    activeUser,
    enabled,
    onError,
}: {
    siteId: number;
    activeUser: IUser;
    enabled?: boolean;
    onError?: (error: unknown) => void;
}) =>
    useQuery({
        queryKey: ['cameras', siteId],
        queryFn: () => getCameras(activeUser, siteId),
        enabled,
        onError,
        select: (d) => [...d],
    });

export const useCameraData = ({
    cameraId,
    activeUser,
    enabled,
    onError,
}: {
    cameraId: number;
    activeUser: IUser;
    enabled?: boolean;
    onError?: (error: unknown) => void;
}) =>
    useQuery({
        queryKey: ['camera-data', cameraId],
        queryFn: () => getCameraData(activeUser, cameraId.toString()),
        cacheTime: 30_000,
        staleTime: 30_000,
        enabled,
        onError,
    });

export const useAlerts = ({
    activeUser,
    enabled,
    onError,
}: {
    activeUser: IUser;
    enabled?: boolean;
    onError?: (error: unknown) => void;
}) =>
    useQuery({
        queryKey: ['getAllAlerts'],
        queryFn: () => getAllAlerts(activeUser),
        cacheTime: 300_000,
        // This query was not able to be invalidated use invalidateQuery, so now it will be called when the user navigates to this page
        // staleTime: Infinity,
        enabled,
        onError,
    });
