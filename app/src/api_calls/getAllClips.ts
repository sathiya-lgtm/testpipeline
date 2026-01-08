import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    IClipResponse,
    StandardApiResponseObj,
} from '../types/tng-api.interfaces';

/** Makes a GET request to retrieve the 200 most recent alerts / clips for given account. */
export default async (
    user: IUser,
    accountId: Number
): Promise<IClipResponse> => {
    const data = await customFetch(
        `/api/alerts/account`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({
                account_id: accountId,
                '*audit_mode': true,
            }),
        },
        'Clip retrieval'
    );

    // TODO this try/catch shouldn't be necessary, but the request sometimes returns nothing upon success. Need to investigate further.
    try {
        const { response }: StandardApiResponseObj<IClipResponse> =
            await data.json();

        return response;
    } catch (err) {
        // This catch block was added to handle a corner case in which nothing is returned and request was successful.
        const errorMessage = err instanceof Error ? err.message : String(err);

        console.error(
            `[getAllClips] GET request did not return valid JSON. Error: ${errorMessage}`
        );

        // Returns an empty array because it is presumed that the error is caused by receiving no data.
        return {
            audit: {},
            standard: {},
        };
    }
};
