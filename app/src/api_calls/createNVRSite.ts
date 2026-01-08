import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

/**
 * {
    "code": 200,
    "response": {
        "email": "site-evt03521@mail.evolon.net",
        "site_id": 3521,
        "account_id": 2830,
        "name": "Test Site 3"
    },
    "details": null
}
 */

/** Represents data needed for POST request for creating a new Site. */
export interface ICreateSite {
    name: string;
    account_reference_id: number;
    template: string;
}

interface IParams {
    user: IUser;
    createSiteData: ICreateSite;
}

/** Makes a POST request for creating a new camera. */
export default async ({
    user,
    createSiteData,
}: IParams): Promise<{
    name: string;
    email: string;
    account_id: number;
    site_id: number;
}> => {
    const data = await customFetch(
        `/api/jwt/sign-up`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({
                form: 'Create-SMTP-Site',
                ...createSiteData,
            }),
        },
        'NVR Site Creation'
    );

    const result: StandardApiResponseObj<{
        name: string;
        email: string;
        account_id: number;
        site_id: number;
    }> = await data.json();
    return result.response;
};
