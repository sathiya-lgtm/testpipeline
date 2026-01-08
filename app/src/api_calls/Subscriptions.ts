// Imports
import axios from 'axios';
import { IUser } from '../types/interfaces';

// Types
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const endpoint = `api/site/subscriptions`;

// https://dev.api.evolon.net/api/site/subscription?service_provider_account_id=1996&account_id=2125&site_id=2158
// const subscriptionsEndpoint = '/api/subscriptions';
const host = import.meta.env.VITE_API_DOMAIN || '';

export type MonitorMode =
    | ''
    | 'Virtual Guard'
    | 'Smart Sensor'
    | 'MIY'
    | 'None';

export interface ICameraSubscription {
    camera_id: number;
    camera_name: string;
    monitor_mode: MonitorMode;
}

export interface ISubscriptionData {
    subscription_id: number;
    subscription_name: string;
    description: string;
}

export interface ISiteSubsriptionData {
    service_provider_name: string;
    subscription_id: number;
    ai_copilot_enabled: boolean;
    sos_enabled: boolean;
    video_retention_days: number;
    number_of_customers: number;
    number_of_sites: number;
    number_cameras: number;
    cameras: ICameraSubscription[];
}

interface IGetProps {
    service_provider_account_id: number;
    account_id: number;
    site_id: number;
}

interface ICreateProps {
    service_provider_account_id: number;
    account_id: number;
    site_id: number;
    subscription_id: number /* 1 = No Subscription, 2 = MIY, 3 = Pro Monitoring */;
    video_retention_days: number;
    ai_copilot_enabled: boolean;
    sos_enabled: boolean;
    previous_subscription_id: number;
    previous_sos_enabled: boolean;
    cameras: ICameraSubscription[];
}

export const getSubscriptions = async ({ user }: { user: IUser }) => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ data: ISubscriptionData[] }>
    >(`${host}/api/subscriptions`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    return data.response;
};

export const getSiteActiveSubscription = async ({
    user,
    params,
}: {
    user: IUser;
    params: IGetProps;
}) => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ data: ISiteSubsriptionData[] }>
    >(`${host}/${endpoint}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params,
    });

    return data.response.data;
};

export const setSiteActiveSubscription = async ({
    user,
    params,
}: {
    user: IUser;
    params: ICreateProps;
}) => {
    const { data } = await axios.post<
        StandardApiResponseObj<{ data: ISiteSubsriptionData[] }>
    >(
        `${host}/${endpoint}`,
        {
            ...params,
        },
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data.response.data;
};

interface ICreateReportProps {
    service_provider_account_id: number;
    account_id?: number;
    site_id?: number;
}

export const getSiteSubscriptionReport = async ({
    user,
    params,
}: {
    user: IUser;
    params: ICreateReportProps;
}) => {
    const { data } = await axios.post<
        StandardApiResponseObj<{ headers: string[]; rows: string[] }>
    >(
        `${host}/api/reporting/site/subscriptions`,
        {
            ...params,
        },
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data.response;
};
