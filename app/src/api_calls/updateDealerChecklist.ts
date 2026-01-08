import customFetch from '../utils/customFetch';
// Types
import { IDealerChecklist, IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';
// import axios from 'axios';

// const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    dealerId: string;
    dealerChecklistData: IDealerChecklist;
}

/** Makes a GET request to retrieve all customers associated with a particular Service Provider. */
export default async ({
    user,
    dealerId,
    dealerChecklistData,
}: IParams): Promise<void> => {
    const data = await customFetch(
        `/api/dealer-onboarding-checklist/${dealerId}`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(dealerChecklistData),
        },
        'Update Dealer Profile'
    );

    // const { response }: StandardApiResponseObj<IDealerChecklist> =
    //     await data.json();

    // return response;
};
