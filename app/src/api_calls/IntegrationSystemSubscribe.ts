// Imports
import StaticRoute, {IResponse} from './StaticRoute';

const endpoint = 'api/integrations/system/subscribe';

export interface ISystemSubscribeRequest {
    integration_token: string,
    dealer_id: number,
    email: string,
    username: string,
    password: string,
    customer_id: number,
    customer_name: string,
    system_id: number,
    system_name: string,
    retention_days: number,
    panel_id: number,
    panel_ip_address: string,
    panel_mac_address: string,
    panel_serial_number?: string
};

export interface ISystemSubscribeResponse extends IResponse {};

const IntegrationsDealerSubscribeRoute = () => {
    const api = StaticRoute();
    return {
        insert: async (parameters: ISystemSubscribeRequest) =>
            api.post<ISystemSubscribeResponse, ISystemSubscribeRequest>(endpoint, parameters)
    };
};

export default IntegrationsDealerSubscribeRoute;
