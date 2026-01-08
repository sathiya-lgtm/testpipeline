// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IStagesLoginResponse,
} from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    stagesAccountInfo: {
        account_id: number;
        account_name: string;
        site_id: number;
        site_name: string;
        user_name: string;
        user_password: string;
    };
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    stagesAccountInfo,
}: IParams): Promise<StandardApiResponseObj<IStagesLoginResponse>> => {
    const { data } = await axios.post<
        StandardApiResponseObj<IStagesLoginResponse>
    >(`${host}/api/dealer/login`, stagesAccountInfo, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    return data;
};
