// Imports
import StaticRoute from './StaticRoute';

const endpoint = 'api/integrations/validate/token';

export interface IGetProps {
    integration_token: string;
};

export interface IValidToken {
    success: boolean
};

const IntegrationsRoute = () => {
    const api = StaticRoute();
    return {
        get: async (parameters: IGetProps) =>
            api.get<IValidToken, IGetProps>(endpoint, parameters)
    };
};

export default IntegrationsRoute;
