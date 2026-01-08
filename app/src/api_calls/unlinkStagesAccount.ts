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
    account_id: number;
    stages_account_id: number;
}

const host = import.meta.env.VITE_API_DOMAIN || '';

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    account_id,
    stages_account_id,
}: IParams): Promise<StandardApiResponseObj<IStagesLinkResponse>> => {
    const { data } = await axios.post<
        StandardApiResponseObj<IStagesLinkResponse>
    >(
        `${host}/api/dealer/account/unlink`,
        { account_id, stages_account_id },
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data;
};
