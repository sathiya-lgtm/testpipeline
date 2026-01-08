// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    start_dt: string;
    end_dt: string;
    account_id: number;
    site_id: number; // 0 means all sites
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    account_id,
    site_id,
    start_dt,
    end_dt,
}: IParams) => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ headers: string[]; rows: string[] }>
    >(`${host}/api/reporting/scheduling-audit`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params: {
            account_id,
            site_id,
            start_dt,
            end_dt,
        },
    });

    return data.response;
};
