// Axios
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IStagesLinkResponse,
} from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    stagesAccountInfo: {
        account_id: number;
        site_id: number;
        user_name: string;
        user_password: string;
        stages_site_group_id: number;
        stages_site_group_name: string;
        stages_account_id: number;
        stages_account_name: string;
        stages_site_id: number;
        stages_site_name: string;
    };
}

const host = import.meta.env.VITE_API_DOMAIN || '';

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    stagesAccountInfo,
}: IParams): Promise<StandardApiResponseObj<IStagesLinkResponse>> => {
    const { data } = await axios.post<
        StandardApiResponseObj<IStagesLinkResponse>
    >(`${host}/api/dealer/account/link`, stagesAccountInfo, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    return data;
};
