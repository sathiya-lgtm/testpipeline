import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    IServiceProvider,
    StandardApiResponseObj,
} from '../types/tng-api.interfaces';

/** Makes a GET request to the customers route using a static "0" as a path param. The "0" attempts to
 * request a list of service providers from the route, but will only work if the current active user
 * is Evolon.
 */
export default async (user: IUser): Promise<IServiceProvider[]> => {
    const data = await customFetch(
        `/api/list/customers/0`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Service Provider retrieval'
    );

    // TODO this try/catch shouldn't be necessary, but the request sometimes returns nothing upon success. Need to investigate further.
    try {
        const { response }: StandardApiResponseObj<IServiceProvider[]> =
            await data.json();

        return response;
    } catch (err) {
        // This catch block was added to handle a corner case in which nothing is returned and request was successful.
        const errorMessage = err instanceof Error ? err.message : String(err);

        console.error(
            `[getServiceProviders] GET request did not return valid JSON. Error: ${errorMessage}`
        );

        // Returns an empty array because it is presumed that the error is caused by receiving no data.
        return [];
    }
};
