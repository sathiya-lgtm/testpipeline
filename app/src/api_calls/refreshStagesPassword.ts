// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IStagesPasswordRefreshResponse,
} from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    user_name: string;
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    user_name,
}: IParams): Promise<
    StandardApiResponseObj<IStagesPasswordRefreshResponse>
> => {
    const { data } = await axios.post<
        StandardApiResponseObj<IStagesPasswordRefreshResponse>
    >(
        `${host}/api/dealer/password/refresh`,
        {
            user_name,
        },
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data;
};
