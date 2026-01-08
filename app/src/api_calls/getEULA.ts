import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';
import customFetch from '../utils/customFetch';

interface IGetEULAResponse {
    accepted_eula: boolean;
    accepted_eula_dt: string;
}

interface IParams {
    user: IUser;
}

/** POST call to Get EULA Details. */
export default async ({ user }: IParams): Promise<IGetEULAResponse> => {
    const data = await customFetch(
        `/api/user/get_eula`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Get EULA Details'
    );

    const { response }: StandardApiResponseObj<IGetEULAResponse> =
        await data.json();

    return response;
};
