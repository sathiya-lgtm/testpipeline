import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

/** Represents data needed for POST request for creating a new Site. */
export interface ICreateSite {
    name: string;
    /** References what Customer the Site will be assigned to. Not necessary
     * if active user is Customer (API will just grab id from token).
     */
    account_reference_id?: number;
}

interface IParams {
    user: IUser;
    createSiteData: ICreateSite;
}

interface SiteCreationResult {
    name: string;
    account_id: number;
    site_id: number;
}

/** Makes a POST request for creating a new camera. */
export default async ({
    user,
    createSiteData,
}: IParams): Promise<SiteCreationResult> => {
    const data = await customFetch(
        `/api/jwt/sign-up`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({
                properties: {},
                form: 'Create-Site',
                ...createSiteData,
            }),
        },
        'Site creation'
    );

    const result: StandardApiResponseObj<SiteCreationResult> =
        await data.json();
    return result.response;
};
