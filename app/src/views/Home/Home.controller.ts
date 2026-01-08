// Custom
import getAccountType from '../../utils/getAccountType';

// API Calls
import getServiceProviders from '../../api_calls/getServiceProviders';
import getCustomers from '../../api_calls/getCustomers';
import getSites from '../../api_calls/getSites';

// Types
import { AccountType } from '../../types/enums';
import { IUser } from '../../types/interfaces';
import {
    ICustomer,
    IServiceProvider,
    ISite,
} from '../../types/tng-api.interfaces';

export type RootDataQueryKey = 'service-providers' | 'customers' | 'sites';

/** Dynamically creates a query key for root data useQuery based on the active user's account type.
 * @param {AccountType} accountType - Active user's account type (Service Provider, Customer, etc).
 * @returns {RootDataQueryKey}
 */
export const createQueryKey = (accountType: AccountType): RootDataQueryKey => {
    switch (accountType) {
        case AccountType.Evolon:
            return 'service-providers';

        case AccountType.ServiceProvider:
            return 'customers';

        default:
            return 'sites';
    }
};

export const createQueryId = (
    accountType: AccountType,
    activeUser: IUser | null
) => {
    if (!activeUser) {
        return null;
    }

    if (
        accountType === AccountType.ServiceProvider &&
        activeUser?.service_provider_account
    ) {
        return activeUser?.service_provider_account;
    }

    return activeUser.id;
};

/** Returns an array of data for CameraTree/CameraList. Data returned varies depending on the level of
 * the user account. Evolon users receive an array of Service Providers, Service Provider users receive an array
 * of Customers, and Customer users receive an array of site.
 * @param {IUser} activeUser - Object featuring the active user's account information.
 * @returns {Promise<IServiceProvider[] | ICustomer[] | ISite[]>} Promise object that resolves to array of of Service Providers, Customers or Sites.
 */
export const getCameraTreeRootData = async (
    activeUser: IUser
): Promise<IServiceProvider[] | ICustomer[] | ISite[]> => {
    const accountType = getAccountType(activeUser);

    if (accountType === AccountType.Evolon) {
        return getServiceProviders(activeUser);
    }

    if (accountType === AccountType.ServiceProvider) {
        return getCustomers(
            activeUser,
            activeUser.service_provider_account || activeUser.id
        );
    }

    if (activeUser.client_account === null) {
        console.warn('Client account ID not found');
    }

    return getSites(activeUser, activeUser.client_account || 0);
};

/**
 * Determines if the screen is in a loop by keep tracking of the last 6 screen sizes.  If sizes at indexes 0, 2, 4 are the same, then we are in a loop
 */
export const containerIsInResizeLoop = (arr: any[]) => {
    if (arr.length < 6) {
        return false;
    }

    if (arr[0] === arr[2] && arr[0] === arr[4]) {
        return true;
    }

    if (arr[1] === arr[3] && arr[1] === arr[5]) {
        return true;
    }

    return false;
};
