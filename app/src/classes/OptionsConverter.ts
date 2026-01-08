import {
    IServiceProvider,
    ICustomer,
    ISite,
    ICameraLink,
} from '../types/tng-api.interfaces';
import { SelectOption } from '../types/interfaces';
import { ISiteData } from '../api_calls/Sites';

/** Class featuring methods for converted data into Select Option format. */
export default class OptionsConverter {
    // TODO these methods could probably be consolidated into one. Not sure if it would tradeoff type checking.
    /** Converts input into data compliant with HTML Select dropdown options (i.e. objects with a label and value). */
    static convertServiceProvidersToOptions(
        customers: IServiceProvider[]
    ): SelectOption[] {
        return customers.map((customer: IServiceProvider) => {
            return {
                label: customer.name,
                value: String(customer.service_provider_account_id),
            };
        });
    }

    /** Converts input into data compliant with HTML Select dropdown options (i.e. objects with a label and value). */
    static convertCustomersToOptions(customers: ICustomer[]): SelectOption[] {
        return customers.map((customer: ICustomer) => {
            return {
                label: customer.account_name,
                value: String(customer.account_id),
            };
        });
    }

    /** Converts input into data compliant with HTML Select dropdown options (i.e. objects with a label and value). */
    static convertSitesToOptions(sites: ISite[]): SelectOption[] {
        return sites.map((site: ISite) => {
            return {
                label: site.site_name,
                value: String(site.site_id),
            };
        });
    }

    static convertNVRSitesToOptions(sites: ISite[]): SelectOption[] {
        return sites.map((site: ISite) => {
            return {
                label: `${site.site_name} - (${site?.properties?.template})`,
                value: String(site.site_id),
            };
        });
    }

    /** Converts input into data compliant with HTML Select dropdown options (i.e. objects with a label and value). */
    static convertCamerasToOptions(customers: ICameraLink[]): SelectOption[] {
        return customers.map((camera: ICameraLink) => {
            return {
                label: camera.camera_name,
                value: String(camera.camera_id),
            };
        });
    }

    /** Converts input into data compliant with HTML Select dropdown options (i.e. objects with a label, value and retention_days). */
    static convertAIEnabledSitesToOptions(sites: ISiteData[]): SelectOption[] {
        return sites.map((site: ISiteData) => {
            return {
                label: site.site_name,
                value: String(site.site_id),
                retentiondays: site.video_retention_days,
            };
        });
    }
}
