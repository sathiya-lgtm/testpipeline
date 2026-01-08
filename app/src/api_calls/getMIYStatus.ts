// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IMIYAccountStatus,
} from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

/** Makes a POST request to receive a given camera's mask. */
export default async (
    user: IUser,
    service_provider_id: number
): Promise<StandardApiResponseObj<IMIYAccountStatus[]>> => {
    const { data } = await axios.post<
        StandardApiResponseObj<IMIYAccountStatus[]>
    >(
        `${host}/api/account/stages/sp/status`,
        { service_provider_id },
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data;
};
