// Imports
import axios from 'axios';
import { IUser } from '../types/interfaces';

// Types
import { ScheduleBlock } from '../components/Scheduling/WeeklySchedule.controller';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const endpoint = `api/schedule/site`;
const host = import.meta.env.VITE_API_DOMAIN || '';

export interface ISchedule {
    schedule: ScheduleBlock[];
    schedule_day_of_week_id: number;
    schedule_day_of_week_long_name: string;
    schedule_day_of_week_short_name: string;
    schedule_day_of_week_value: number;
    schedule_name: string;
    schedule_site_id: number;
    schedule_time_zone: string;
    schedule_time_zone_description: string;
    schedule_time_zone_id: number;
}

interface IGetProps {
    account_id: number;
    site_id: number;
}

interface ICreateProps {
    schedule_name: string;
    account_id: number;
    site_id: number;
    schedule_time_zone_id: number;
    is_active: boolean;
    schedules: { [key: string]: ScheduleBlock[] };
}

interface IUpdateProps {
    schedule_site_id: number;
    schedule_name: string;
    account_id: number;
    site_id: number;
    schedule_time_zone_id: number;
    is_active: boolean;
    schedules: { [key: string]: ScheduleBlock[] };
}

interface IDeleteProps {
    schedule_site_id: number;
}

export const getSiteStatus = async ({
    user,
    params,
}: {
    user: IUser;
    params: IGetProps;
}) => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ is_armed: boolean; process_clip: boolean }>
    >(`${host}/api/schedule/site/armed`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params,
    });

    return data.response;
};

export const getSchedules = async ({
    user,
    params,
}: {
    user: IUser;
    params: IGetProps;
}) => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ data: ISchedule[]; site_has_panel: boolean }>
    >(`${host}/${endpoint}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params,
    });

    return data.response;
};

export const createSchedule = async ({
    user,
    params,
}: {
    user: IUser;
    params: ICreateProps;
}) => {
    const { data } = await axios.post<
        StandardApiResponseObj<{ data: ISchedule[] }>
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

export const updateSchedule = async ({
    user,
    params,
}: {
    user: IUser;
    params: IUpdateProps;
}) => {
    const { data } = await axios.put<
        StandardApiResponseObj<{ data: ISchedule[] }>
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

export const deleteSchedule = async ({
    user,
    params,
}: {
    user: IUser;
    params: IDeleteProps;
}) => {
    const { data } = await axios.delete<
        StandardApiResponseObj<{ data: ISchedule[] }>
    >(`${host}/${endpoint}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params,
    });

    return data.response.data;
};
