// Imports
import StaticRoute, {IResponse} from './StaticRoute';

const endpoint = 'api/integrations/dealer/unsubscribe';

export interface IDealerUnsubscribeRequest {
    integration_token: string;
    dealer_id: number,
    customer_id: number,
    system_id: number,
    access_token?: string | undefined | null,
    refresh_token?: string | undefined | null
};


export interface IDealerUnsubscribedResponse extends IResponse { };

const IntegrationsDealerUnsubscribeRoute = () => {
    const api = StaticRoute();
    return {
        unsubscribe: async (parameters: IDealerUnsubscribeRequest) =>
            api.put<IDealerUnsubscribedResponse, IDealerUnsubscribeRequest>(endpoint, parameters)
    };
};

export default IntegrationsDealerUnsubscribeRoute;
