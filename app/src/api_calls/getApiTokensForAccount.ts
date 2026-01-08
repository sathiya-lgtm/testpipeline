// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

/** Makes a POST request to receive a given camera's mask. */
export default async (
    user: IUser,
    account_id: string | number
): Promise<{ key: string }[]> => {
    const { data } = await axios.get<StandardApiResponseObj<{ key: string }[]>>(
        `${host}/api/list/api_tokens`,
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
            params: { account_id },
        }
    );

    return data.response;
};
