import customFetch from '../utils/customFetch';
// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IDealerList,
} from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
}

/** Makes a GET request to retrieve all customers associated with a particular Service Provider. */
export default async ({ user }: IParams): Promise<IDealerList[]> => {
    const data = await customFetch(
        `/api/dealer-onboarding-checklist`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Managed Dealer retrieval'
    );

    // TODO this try/catch shouldn't be necessary, but the request sometimes returns nothing upon success. Need to investigate further.
    try {
        const { response }: StandardApiResponseObj<{ data: IDealerList[] }> =
            await data.json();

        return response.data;
    } catch (err) {
        // This catch block was added to handle a corner case in which nothing is returned and request was successful.
        const errorMessage = err instanceof Error ? err.message : String(err);

        console.error(
            `[getManagedDealers] GET request did not return valid JSON. Error: ${errorMessage}`
        );

        // Returns an empty array because it is presumed that the error is caused by receiving no data.
        return [];
    }
};
