// Types
import {
    IImmixAlertConfig,
    IDeviceIOAlertConfig,
    IEmailAlertConfig,
    IImmixPanelAlertConfig,
} from '../../../api_calls/createAlert';

interface AlertInputData {
    account_id: number;
    camera_id: number;
    name: string;
    port: Number;
    server: string;
    subject: string;
    immixEventType: string;
    to_email: string;
    from_email: string;
    identifier: string;
}

export const createAlertData: (
    alertType: string | null,
    alertInputData: AlertInputData
) =>
    | IImmixAlertConfig
    | IDeviceIOAlertConfig
    | IEmailAlertConfig
    | IImmixPanelAlertConfig
    | undefined = (
    alertType: string | null,
    alertInputData: AlertInputData
) => {
    const {
        account_id,
        camera_id,
        name,
        port,
        server,
        subject,
        immixEventType,
        to_email,
        from_email,
        identifier,
    } = alertInputData;

    if (alertType === 'immix') {
        return {
            account_id,
            camera_id,
            name,
            alert_type: alertType as 'immix',
            properties: {
                identifier,
                port: Number(port),
                server,
                subject: immixEventType,
                to_email,
                from_email,
                camera_id,
            },
        };
    }

    if (alertType === 'device-io') {
        return {
            account_id,
            camera_id,
            name,
            alert_type: alertType as 'device-io',
            properties: {
                identifier,
                port: Number(port),
                server,
                subject: immixEventType,
                to_email,
                from_email,
                camera_id,
            },
        };
    }

    if (alertType === 'immix-fortify-alert') {
        return {
            account_id,
            camera_id,
            name,
            alert_type: alertType as 'immix-fortify-alert',
            properties: {
                identifier,
                port: Number(port),
                server,
                subject: immixEventType,
                to_email,
                from_email,
                camera_id,
            },
        };
    }

    if (alertType === 'email') {
        return {
            account_id,
            camera_id,
            name,
            alert_type: alertType as 'email',
            properties: {
                subject,
                to_email,
                from_email: 'alerts@evolontech.com',
            },
        };
    }

    return undefined;
};
