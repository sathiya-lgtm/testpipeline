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
    stages_accounts_id: number;
    stages_account_state_id: number;
}

const host = import.meta.env.VITE_API_DOMAIN || '';

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
    stages_accounts_id,
    stages_account_state_id,
}: IParams): Promise<StandardApiResponseObj<IStagesLinkResponse>> => {
    const { data } = await axios.put<
        StandardApiResponseObj<IStagesLinkResponse>
    >(
        `${host}/api/dealer/account/link`,
        { stages_accounts_id, stages_account_state_id },
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data;
};
