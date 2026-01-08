// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    stagesAccountInfo: {
        account_id: number;
        account_name: string;
        site_id: number;
        site_name: string;
    };
}

interface IStagesLogoutResponse {
    logout_at: string; // 2024-05-01 17:32:11.508188
    session_existed: boolean;
    success: boolean;
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    stagesAccountInfo,
}: IParams): Promise<StandardApiResponseObj<IStagesLogoutResponse>> => {
    const { data } = await axios.post<
        StandardApiResponseObj<IStagesLogoutResponse>
    >(`${host}/api/dealer/logout`, stagesAccountInfo, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    return data;
};
