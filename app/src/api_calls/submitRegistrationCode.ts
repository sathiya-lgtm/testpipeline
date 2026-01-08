import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { IRegistrationData } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    registrationData: IRegistrationData;
}

/** Makes a POST request to register a device via registration code. */
export default async ({
    user,
    registrationData,
}: IParams): Promise<Response> => {
    return customFetch(
        `/api/token/complete_registration`,
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
