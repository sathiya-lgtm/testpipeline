// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    IDashboardResponse,
    StandardApiResponseObj,
} from '../types/tng-api.interfaces';

interface IDashboardSearch {
    range_start: string;
    range_end: string;
    /** Value determining what timezone format the data is returned in. Leverages PostgreSQL date-time keywords:
     * https://www.postgresql.org/docs/8.1/datetime-keywords.html. Defaults to UTC if not provided.  */
    '*timezone'?: string;
    '*sites'?: number[];
    '*objects'?: string[];
    '*cameras'?: number[];
    '*accounts'?: number[];
}

interface IParams {
    user: IUser;
    dashboardSearch: IDashboardSearch;
}

export default async ({
    user,
    dashboardSearch,
}: IParams): Promise<IDashboardResponse> => {
    const data = await customFetch(
        `/api/alerts/dashboard`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(dashboardSearch),
            timeout: 15000,
        },
        'Dashboard query'
    );

    // TODO this try/catch shouldn't be necessary, but the request sometimes returns nothing upon success. Need to investigate further.
    try {
        const { response }: StandardApiResponseObj<IDashboardResponse> =
            await data.json();

        return response;
    } catch (err) {
        // This catch block was added to handle a corner case in which nothing is returned and request was successful.
        const errorMessage = err instanceof Error ? err.message : String(err);

        console.error(
            `[getDashboard] GET request did not return valid JSON. Error: ${errorMessage}`
        );

        // Returns an empty array because it is presumed that the error is caused by receiving no data.
        return { dashboard_data: {}, features: { loitering: false } };
    }
};
