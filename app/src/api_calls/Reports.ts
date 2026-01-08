// Imports
import { IUser } from '../types/interfaces';
import PrivateRoute, {IResponse} from './PrivateRoute';

const camera_performance_endpoint = 'api/reporting/camera/performance';

export interface IReportRequest {
    service_provider_account_id?: number | undefined | null;
    account_id?: number | undefined | null;
    site_id?: number | undefined | null;
    start_date?: string | undefined | null;
    end_date?: string | undefined | null;
};


export interface IReportResponse extends IResponse {
    headers?: Array<string> | undefined | null,
    rows?: Array<any> | undefined | null
};

const ReportsRoute = (user: IUser) => {
    const api = PrivateRoute({ user });
    return {
        camera_performance: async (parameters: IReportRequest) =>
            api.post<IReportResponse, IReportRequest>(camera_performance_endpoint, parameters)
    };
};

export default ReportsRoute;