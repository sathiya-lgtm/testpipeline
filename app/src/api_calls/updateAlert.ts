import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    IImmixAlertConfig,
    IEmailAlertConfig,
    IDeviceIOAlertConfig,
    IImmixPanelAlertConfig,
} from './createAlert';

interface IParams {
    user: IUser;
    alertConfig:
        | IImmixAlertConfig
        | IEmailAlertConfig
        | IDeviceIOAlertConfig
        | IImmixPanelAlertConfig;
    alertId: number;
}

export default async ({
    user,
    alertConfig,
    alertId,
}: IParams): Promise<Response> => {
    const newAlertData = {
        alert_name: alertConfig.name,
        alert_id: alertId,
        account_id: alertConfig.account_id,
        camera_id: alertConfig.camera_id,
        properties: alertConfig.properties,
    };

    return customFetch(
        `/api/alerts/trigger/update`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(newAlertData),
        },
        'Update Alert'
    );
};
