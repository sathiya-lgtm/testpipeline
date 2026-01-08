// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IStagesAlertResponse,
} from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    account_id: number;
    site_id: number;
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    account_id,
    site_id,
}: IParams): Promise<StandardApiResponseObj<IStagesAlertResponse>> => {
    const { data } = await axios.post<
        StandardApiResponseObj<IStagesAlertResponse>
    >(
        `${host}/api/dealer/account/event/person_vehicle`,
        {
            account_id,
            site_id,
            url: 'https://youtu.be/hl6402i9AjQ',
            video_type: 'Live Preview',
        },
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data;
};
