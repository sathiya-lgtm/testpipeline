// Axios
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IStagesLinkResponse,
} from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    site_id: number;
    subscription_id: 4 | 5;
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    site_id,
    subscription_id,
}: IParams): Promise<StandardApiResponseObj<IStagesLinkResponse>> => {
    const { data } = await axios.post<
        StandardApiResponseObj<IStagesLinkResponse>
    >(
        `${host}/api/account/stages/sos/enable`,
        { site_id, subscription_id },
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data;
};
