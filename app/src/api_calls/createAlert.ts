import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

export interface IEmailAlertConfig {
    account_id: number;
    camera_id: number;
    name: string;
    alert_type: 'email';
    properties: {
        from_email: string;
        to_email: string;
        subject: string;
    };
}

export interface IImmixAlertConfig {
    account_id: number;
    camera_id: number;
    name: string;
    alert_type: 'immix';
    properties: {
        port: number;
        server: string;
        subject: string;
        to_email: string;
        from_email: string;
        camera_id: number;
    };
}

export interface IDeviceIOAlertConfig {
    account_id: number;
    camera_id: number;
    name: string;
    alert_type: 'device-io';
    properties: {
        port: number;
        server: string;
        subject: string;
        to_email: string;
        from_email: string;
        camera_id: number;
    };
}

export interface IImmixPanelAlertConfig {
    account_id: number;
    camera_id: number;
    name: string;
    alert_type: 'immix-fortify-alert';
    properties: {
        port: number;
        server: string;
        subject: string;
        to_email: string;
        from_email: string;
        camera_id: number;
    };
}

interface IParams {
    user: IUser;
    alertConfig:
        | IEmailAlertConfig
        | IImmixAlertConfig
        | IDeviceIOAlertConfig
        | IImmixPanelAlertConfig;
}

export default async ({ user, alertConfig }: IParams): Promise<Response> => {
    return customFetch(
        `/api/alerts/trigger/new`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(alertConfig),
        },
        'Create Alert'
    );
};
