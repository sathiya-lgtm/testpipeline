// Imports
import StaticRoute, {IResponse} from './StaticRoute';

const endpoint = 'api/integrations/panel/subscribe';

export interface IPanelUnsubscribeRequest {
    integration_token: string;
    dealer_id: number,
    customer_id: number,
    system_id: number,
    panel_id: number
};

export interface IPanelUnsubscribedResponse extends IResponse {};

const IntegrationsDealerUnsubscribeRoute = () => {
    const api = StaticRoute();
    return {
        update: async (parameters: IPanelUnsubscribeRequest) =>
            api.put<IPanelUnsubscribedResponse, IPanelUnsubscribeRequest>(endpoint, parameters)
    };
};

export default IntegrationsDealerUnsubscribeRoute;
