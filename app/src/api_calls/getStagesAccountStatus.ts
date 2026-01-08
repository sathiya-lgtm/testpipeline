// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    account_id: number;
    site_id: number;
}

export enum StagesAccountStatus {
    Unlinked = 0,
    Pending = 1,
    Testing = 2,
    Active = 3,
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    params,
}: {
    user: IUser;
    params: IParams;
}): Promise<string> => {
    const { data } = await axios.get<
        StandardApiResponseObj<{ data: { status: 0 | 1 | 2 | 3 } }>
    >(`${host}/api/dealer/account/status`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params,
    });

    return StagesAccountStatus[data.response.data.status];
};
