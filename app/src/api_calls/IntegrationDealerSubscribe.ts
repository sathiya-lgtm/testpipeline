// Imports
import StaticRoute, {IResponse} from './StaticRoute';
import { IIntegrationDealer, IIntegrationCustomer, IIntegrationSystem, IIntegrationPanel, IIntegrationUser } from './IntegrationsSubscriptionCheck';


const endpoint = 'api/integrations/dealer/subscribe';


export interface IDealerSubscribeRequest {
    integration_token: string | undefined,
    dealer_id: number | undefined,
    dealer_name: string | undefined,
    email: string | undefined,
    username: string | undefined,
    password: string | undefined,
    access_token: string | undefined,
    refresh_token: string | undefined,
    customer_id: number | undefined,
    customer_name: string | undefined,
    system_id: number | undefined,
    system_name: string | undefined,
    retention_days: number | undefined,
    panel_id: number | undefined,
    panel_type: string | undefined,
    panel_ip_address: string | undefined,
    panel_mac_address: string | undefined,
    panel_serial_number?: string | undefined | null,
    accepted_eula: boolean | undefined | null
};

export interface IRequestData {
  dealer?: IIntegrationDealer | undefined | null,
  user?: IIntegrationUser | undefined | null,
  customer?: IIntegrationCustomer | undefined | null,
  system?: IIntegrationSystem | undefined | null,
  panel?: IIntegrationPanel | undefined | null
}

export interface IDealerSubscribedResponse extends IResponse {
    data?: IRequestData | undefined | null
};

const IntegrationsDealerSubscribeRoute = () => {
    const api = StaticRoute();
    return {
        subscribe: async (parameters: IDealerSubscribeRequest) =>
            api.post<IDealerSubscribedResponse, IDealerSubscribeRequest>(endpoint, parameters)
    };
};

export default IntegrationsDealerSubscribeRoute;
