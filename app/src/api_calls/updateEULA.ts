import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';
import customFetch from '../utils/customFetch';

export interface IUpdateEULARequest {
    accepted_eula: boolean;
}

interface IParams {
    user: IUser;
    acceptedEULARequest: IUpdateEULARequest;
}

/** POST call to update the EULA. */
export default async ({
    user,
    acceptedEULARequest,
}: IParams): Promise<{ accepted_eula: boolean }> => {
    const data = await customFetch(
        `/api/user/update_eula`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(acceptedEULARequest),
            timeout: 30000,
        },
        'Update EULA Details'
    );

    const { response }: StandardApiResponseObj<{ accepted_eula: boolean }> =
        await data.json();

    return response;
};
