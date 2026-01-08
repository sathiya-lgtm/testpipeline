import customFetch from '../utils/customFetch';
// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IManagedUser,
} from '../types/tng-api.interfaces';

/** Makes a GET request to retrieve all customers associated with a particular Service Provider. */
export default async (user: IUser): Promise<IManagedUser[]> => {
    const data = await customFetch(
        `/api/user/list`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Managed users retrieval'
    );

    // TODO this try/catch shouldn't be necessary, but the request sometimes returns nothing upon success. Need to investigate further.
    try {
        const { response }: StandardApiResponseObj<IManagedUser[]> =
            await data.json();

        return response;
    } catch (err) {
        // This catch block was added to handle a corner case in which nothing is returned and request was successful.
        const errorMessage = err instanceof Error ? err.message : String(err);

        console.error(
            `[getManagedUsers] GET request did not return valid JSON. Error: ${errorMessage}`
        );

        // Returns an empty array because it is presumed that the error is caused by receiving no data.
        return [];
    }
};
