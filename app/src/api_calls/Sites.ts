// Imports
import APIRoute from './APIRoute';
import { IUser } from '../types/interfaces';

const endpoint = `api/sites`;

// export interface ISite {
//     service_provider_account_id: number;
//     service_provider_account_name: string;
//     account_id: number;
//     account_name: string;
//     site_id: number;
//     site_name: string;
//     site_uuid: string;
//     created_at: string;
//     updated_at: string;
//     created_by_id: number;
//     created_by_name: string;
//     updated_by_id: number;
//     updated_by_name: string;
//     properties: any;
//     configuration: any;
//     source_enterprise: boolean;
// }

export interface ISiteData {
    site_id: number;
    site_name: string;
    video_retention_days: number;
}

export interface IGetSitesProps {
    service_provider_account_id?: number | null;
    account_id?: number | null;
    ai_copilot_enabled?: boolean;
}

const SitesRoute = (user: IUser) => {
    const api = APIRoute({ user });
    return {
        get: async (parameters: IGetSitesProps) =>
            api.get<ISiteData[], IGetSitesProps>(endpoint, parameters),
    };
};

export default SitesRoute;
