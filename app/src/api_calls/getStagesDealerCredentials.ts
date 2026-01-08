// Utils
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IStagesDealerCreds,
} from '../types/tng-api.interfaces';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
}

/** Makes a POST request to receive a given camera's mask. */
export default async ({
    user,
}: IParams): Promise<
    StandardApiResponseObj<{
        stages_dealers: IStagesDealerCreds[];
        success: boolean;
    }>
> => {
    const { data } = await axios.get<
        StandardApiResponseObj<{
            stages_dealers: IStagesDealerCreds[];
            success: boolean;
        }>
    >(`${host}/api/dealers`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    return data;
};
