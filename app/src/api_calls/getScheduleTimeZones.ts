// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
}

export type TimeZoneEntry = {
    description: string;
    time_zone: string;
    schedule_time_zone_id: number;
};

/** Makes a POST request to receive a given camera's mask. */
export default async ({ user }: IParams): Promise<TimeZoneEntry[]> => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ data: TimeZoneEntry[] }>
    >(`${host}/api/schedule/timezones`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    return data.response.data;
};
