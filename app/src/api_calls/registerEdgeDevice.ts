import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { IEdgeRegistrationData } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    registrationData: IEdgeRegistrationData;
}

/** Makes a POST request to register a device via registration code. */
export default async ({
    user,
    registrationData,
}: IParams): Promise<Response> => {
    return customFetch(
        `/api/edge/register`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(registrationData),
        },
        'Registration'
    );
};
