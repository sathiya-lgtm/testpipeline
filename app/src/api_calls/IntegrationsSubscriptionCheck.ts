// Imports
import StaticRoute, {IResponse} from './StaticRoute';

const endpoint = 'api/integrations/subscription/status';

export interface IIntegrationDealer {
    exists?: boolean | undefined | null,
    link_id?: number | undefined | null,
    id: number,
    name: string,
    access_token?: string | undefined | null,
    is_access_token_expired?: boolean | undefined | null,
    refresh_token?: string | undefined | null,
    is_refresh_token_expired?: boolean | undefined | null,
    subscribed?: boolean | undefined | null,
    unsubscribe?: boolean | undefined | null
};

export interface IIntegrationUser {
    exists?: boolean | undefined | null,
    link_id?: number | undefined | null,
    email: string,
    username: string,
    access_token?: string | undefined | null,
    is_access_token_expired?: boolean | undefined | null,
    refresh_token?: string | undefined | null,
    is_refresh_token_expired?: string | undefined | null,
    password?: string | undefined | null,
    accepted_eula: boolean | undefined | null,
    subscribed: boolean | undefined | null,
    unsubscribe?: boolean | undefined | null
};

export interface IIntegrationCustomer {
    exists?: boolean | undefined | null,
    link_id?: number | undefined | null,
    id: number 
    name:  string,
    name_changed?: boolean | undefined | null,
    subscribed?: boolean | undefined | null,
    unsubscribe?: boolean | undefined | null
};

export interface IIntegrationSystem {
    exists?: boolean | undefined | null,
    link_id?: number | undefined | null,
    id: number,
    name:  string,
    type?: string | undefined | null,
    name_changed?: boolean | undefined | null,
    retention_days: number,
    retention_days_changed?: boolean | undefined | null,
    subscribed?: boolean | undefined | null,
    unsubscribe?: boolean | undefined | null
};

export interface IIntegrationPanel {
    exists?: boolean | undefined | null,
    link_id?: number | undefined | null,
    id: number,
    type: string,
    mac_address: string,
    mac_address_changed?: boolean | undefined | null,
    ip_address?: string,
    ip_address_changed?: boolean | undefined | null,
    serial_number?: string | undefined | null
    serial_number_changed?: boolean | undefined | null,
    subscribed?: boolean | undefined | null,
    unsubscribe?: boolean | undefined | null
};

export interface IIntegrationsSubscriptionStatusRequest {
    integration_token: string,
    dealer_id: number,
    dealer_name: string,
    email: string,
    username: string,
    customer_id: number,
    customer_name: string,
    system_id: number,
    system_name: string,
    system_type?: string | undefined | null,
    retention_days: number,
    device_id: number,
    device_type: string,
    device_ip_address: string,
    device_mac_address: string,
    device_serial_number?: string | undefined | null
};

export interface IResponseData {
  dealer: IIntegrationDealer,
  user: IIntegrationUser,
  customer: IIntegrationCustomer,
  system: IIntegrationSystem,
  panel: IIntegrationPanel
}

export interface IIntegrationSubscriptionStatusResponse extends IResponse {
  data?: IResponseData | undefined | null
};

const IntegrationsSubscriptionStatusRoute = () => {
    const api = StaticRoute();
    return {
        check: async (parameters: IIntegrationsSubscriptionStatusRequest) =>
            api.post<IIntegrationSubscriptionStatusResponse, IIntegrationsSubscriptionStatusRequest>(endpoint, parameters)
    };
};

export default IntegrationsSubscriptionStatusRoute;