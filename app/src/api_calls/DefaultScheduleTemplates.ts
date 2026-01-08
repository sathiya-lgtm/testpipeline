// Imports
import axios from 'axios';
import { IUser } from '../types/interfaces';

// Types
import { IScheduleTemplate } from './ScheduleTemplates';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const endpoint = `api/schedule/templates/default`;
const host = import.meta.env.VITE_API_DOMAIN || '';

interface IGetProps {
    account_id: number;
    site_id: number;
}

interface IUpdateProps {
    schedule_template_id: number;
    account_id: number;
    site_id: number;
}

export const getDefaultSchedule = async ({
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

export const updateDefaultSchedule = async ({
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
