// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    sp_id: string | number;
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({ user, sp_id }: IParams): Promise<string> => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ controller_url: string }>
    >(`${host}/api/live_view/find_controller_url_by_sp_id`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params: { sp_id },
    });

    return data.response.controller_url;
};
