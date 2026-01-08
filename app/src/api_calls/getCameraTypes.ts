import customFetch from '../utils/customFetch';

// Types
import { IUser, SelectOption } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

/** Makes a GET request to retrieve all the possible camera types. */
export default async (user: IUser): Promise<SelectOption[]> => {
    const data = await customFetch(
        `/api/ext/cameras/models`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Camera types'
    );

    // TODO this try/catch shouldn't be necessary, but the request sometimes returns nothing upon success. Need to investigate further.
    try {
        const { response }: StandardApiResponseObj<SelectOption[]> =
            await data.json();

        return response;
    } catch (err) {
        // This catch block was added to handle a corner case in which nothing is returned and request was successful.
        const errorMessage = err instanceof Error ? err.message : String(err);

        console.error(
            `[getCameraTypes] GET request did not return valid JSON. Error: ${errorMessage}`
        );

        // Returns an empty array because it is presumed that the error is caused by receiving no data.
        return [];
    }
};
