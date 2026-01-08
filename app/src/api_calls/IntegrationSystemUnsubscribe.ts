// Imports
import StaticRoute, {IResponse} from './StaticRoute';

const endpoint: string = 'api/integrations/system/subscribe';

export interface ISystemUnsubscribeRequest {
    integration_token: string;
    dealer_id: number,
    customer_id: number,
    customer_name: string,
    system_id: number
};

export interface ISystemUnsubscribedResponse extends IResponse {};

const IntegrationsDealerUnsubscribeRoute = () => {
    const api = StaticRoute();
    return {
        update: async (parameters: ISystemUnsubscribeRequest) =>
            api.put<ISystemUnsubscribedResponse, ISystemUnsubscribeRequest>(endpoint, parameters)
    };
};

export default IntegrationsDealerUnsubscribeRoute;
