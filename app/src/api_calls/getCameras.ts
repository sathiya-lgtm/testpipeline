import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    ICameraLink,
    StandardApiResponseObj,
} from '../types/tng-api.interfaces';

/** Makes a GET request to retrieve all cameras associated with the supplied Site ID. */
export default async (user: IUser, siteId: Number): Promise<ICameraLink[]> => {
    const data = await customFetch(
        `/api/list/device/${siteId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Camera retrieval'
    );

    // TODO this try/catch shouldn't be necessary, but the request sometimes returns nothing upon success. Need to investigate further.
    try {
        const { response }: StandardApiResponseObj<ICameraLink[]> =
            await data.json();

        return response;
    } catch (err) {
        // This catch block was added to handle a corner case in which nothing is returned and request was successful.
        const errorMessage = err instanceof Error ? err.message : String(err);

        console.error(
            `[getCameras] GET request did not return valid JSON. Error: ${errorMessage}`
        );

        // Returns an empty array because it is presumed that the error is caused by receiving no data.
        return [];
    }
};
