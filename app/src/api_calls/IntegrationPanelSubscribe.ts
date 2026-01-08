// Imports
import StaticRoute, {IResponse} from './StaticRoute';

const endpoint = 'api/integrations/panel/subscribe';

export interface IPanelSubscribeRequest {
    integration_token: string,
    dealer_id: number,
    customer_id: number,
    system_id: number,
    panel_id: number,
    panel_ip_address: string,
    panel_mac_address: string,
    panel_serial_number?: string
};

export interface IPanelSubscribedResponse extends IResponse {};

const IntegrationsDealerSubscribeRoute = () => {
    const api = StaticRoute();
    return {
        insert: async (parameters: IPanelSubscribeRequest) =>
            api.post<IPanelSubscribedResponse, IPanelSubscribeRequest>(endpoint, parameters)
    };
};

export default IntegrationsDealerSubscribeRoute;
