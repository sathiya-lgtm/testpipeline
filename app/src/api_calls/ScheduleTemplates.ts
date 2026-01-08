// Imports
import axios from 'axios';
import { IUser } from '../types/interfaces';

// Types
import { ScheduleBlock } from '../components/Scheduling/WeeklySchedule.controller';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const endpoint = `api/schedule/templates`;
const host = import.meta.env.VITE_API_DOMAIN || '';

export interface IScheduleTemplate {
    can_edit: boolean;
    schedule: ScheduleBlock[];
    schedule_day_of_week_id: number;
    schedule_day_of_week_long_name: string;
    schedule_day_of_week_short_name: string;
    schedule_day_of_week_value: number;
    schedule_name: string;
    schedule_template_id: number;
    schedule_time_zone: string;
    schedule_time_zone_description: string;
    schedule_time_zone_id: number;
}

interface IGetProps {
    account_id: number;
    schedule_template_id?: number;
}

interface ICreateProps {
    schedule_name: string;
    account_id: number;
    site_id: number;
    schedule_time_zone_id: number;
    make_default: boolean;
    schedules: { [key: string]: ScheduleBlock[] };
}

interface IUpdateProps {
    schedule_template_id: number;
    schedule_name: string;
    account_id: number;
    site_id: number;
    schedule_time_zone_id: number;
    make_default: boolean;
    schedules: { [key: string]: ScheduleBlock[] };
}

interface IDeleteProps {
    account_id: number;
    schedule_template_id: number;
}

export const getScheduleTemplates = async ({
    user,
    params,
}: {
    user: IUser;
    params: IGetProps;
}) => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ data: IScheduleTemplate[] }>
    >(`${host}/${endpoint}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params,
    });

    return data.response.data;
};

export const createScheduleTemplate = async ({
    user,
    params,
}: {
    user: IUser;
    params: ICreateProps;
}) => {
    const { data } = await axios.post<
        StandardApiResponseObj<{ data: IScheduleTemplate[] }>
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

export const updateScheduleTemplate = async ({
    user,
    params,
}: {
    user: IUser;
    params: IUpdateProps;
}) => {
    const { data } = await axios.put<
        StandardApiResponseObj<{ data: IScheduleTemplate[] }>
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

export const deleteScheduleTemplate = async ({
    user,
    params,
}: {
    user: IUser;
    params: IDeleteProps;
}) => {
    const { data } = await axios.delete<
        StandardApiResponseObj<{ data: IScheduleTemplate[] }>
    >(`${host}/${endpoint}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params,
    });

    return data.response.data;
};
