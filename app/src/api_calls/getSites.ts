// Custom
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { ISite, StandardApiResponseObj } from '../types/tng-api.interfaces';

/** Makes a GET request to retrieve a list of sites associated with the supplied Customer ID. */
export default async (user: IUser, customerId: number): Promise<ISite[]> => {
    const httpResponse = await customFetch(
        `/api/list/site/${customerId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Site retrieval'
    );

    try {
        const { response }: StandardApiResponseObj<ISite[]> =
            await httpResponse.json();

        return response;
    } catch (err) {
        // This catch block was added to handle a corner case in which nothing is returned and request was successful.
        const errorMessage = err instanceof Error ? err.message : String(err);

        console.error(
            `[getSites] GET request did not return valid JSON. Error: ${errorMessage}`
        );

        // Returns an empty array because it is presumed that the error is caused by receiving no data.
        return [];
    }
};
