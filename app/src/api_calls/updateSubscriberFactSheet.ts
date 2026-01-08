import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { IAPISubscriberFactSheet } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    subscriberFactSheetData: IAPISubscriberFactSheet;
}

/** Makes a PUT request to save a Site’s Fact Sheet.. */
export default async ({
    user,
    subscriberFactSheetData,
}: IParams): Promise<void> => {
    const data = await customFetch(
        `/api/sites/fact-sheet`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(subscriberFactSheetData),
        },
        'Update Subscriber Fact Sheet'
    );
};
