// Imports
import axios from 'axios';
import { IUser } from '../types/interfaces';

// Types
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const endpoint = `api/schedule/site/overrides`;
const host = import.meta.env.VITE_API_DOMAIN || '';

export interface IScheduleOverride {
    end_dt: string | null;
    is_armed: boolean;
    override_reason: string;
    schedule_reason_code_id: number;
    schedule_site_id: number;
    schedule_site_override_id: number;
    start_dt: string;
}

interface IGetProps {
    schedule_site_id: number;
    account_id: number;
    site_id: number;
}

interface ICreateProps {
    schedule_site_id: number;
    schedule_reason_code_id: number;
    override_reason: string;
    start_dt: string;
    end_dt: string | null;
    is_armed: boolean;
}

interface IUpdateProps {
    schedule_site_override_id: number;
    schedule_site_id: number;
    schedule_reason_code_id: number;
    override_reason: string;
    start_dt: string;
    end_dt: string | null;
    is_armed: boolean;
}

interface IDeleteProps {
    schedule_site_override_id: number;
}

export const getScheduleOverrides = async ({
    user,
    params,
}: {
    user: IUser;
    params: IGetProps;
}) => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ data: IScheduleOverride[] }>
    >(`${host}/${endpoint}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params,
    });

    return data.response.data;
};

export const createScheduleOverride = async ({
    user,
    params,
}: {
    user: IUser;
    params: ICreateProps;
}) => {
    const { data } = await axios.post<
        StandardApiResponseObj<{ data: IScheduleOverride[] }>
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

export const updateScheduleOverride = async ({
    user,
    params,
}: {
    user: IUser;
    params: IUpdateProps;
}) => {
    const { data } = await axios.put<
        StandardApiResponseObj<{ data: IScheduleOverride[] }>
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

export const deleteScheduleOverride = async ({
    user,
    params,
}: {
    user: IUser;
    params: IDeleteProps;
}) => {
    const { data } = await axios.delete<
        StandardApiResponseObj<{ data: IScheduleOverride[] }>
    >(`${host}/${endpoint}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params,
    });

    return data.response.data;
};
