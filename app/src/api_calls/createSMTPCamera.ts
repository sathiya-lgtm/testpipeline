import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

export interface ISMTPCameraConfig {
    name: string;
    site_id: number;
    account_id?: number; // Need for Evolon and Service provider camera creation
    camera_type: number;
    properties: { [key: string]: any };
    form: 'Create-SMTP-Camera';
}

interface IParams {
    user: IUser;
    smtpCameraConfig: ISMTPCameraConfig;
}

export default async ({
    user,
    smtpCameraConfig,
}: IParams): Promise<{
    name: string;
    email: string;
    account_id: number;
    camera_id: number;
}> => {
    const data = await customFetch(
        `/api/jwt/sign-up`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(smtpCameraConfig),
        },
        'Create SMTP Camera'
    );

    const result: StandardApiResponseObj<{
        name: string;
        email: string;
        account_id: number;
        camera_id: number;
    }> = await data.json();
    return result.response;
};
