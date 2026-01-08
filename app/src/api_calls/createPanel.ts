import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

export interface IPanelConfig {
    name: string;
    site_id: number;
    account_id?: number; // Need for Evolon and Service provider camera creation
    camera_type: number;
    properties: { [key: string]: any };
    device_id: string;
    panel_type: string;
    template: string; // amarok-panel or stages-panel
    form: 'Create-Panel';
}

interface IParams {
    user: IUser;
    panelConfig: IPanelConfig;
}

export default async ({
    user,
    panelConfig,
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
            body: JSON.stringify(panelConfig),
        },
        'Create Panel'
    );

    const result: StandardApiResponseObj<{
        name: string;
        email: string;
        account_id: number;
        camera_id: number;
    }> = await data.json();
    return result.response;
};
