import { AccountType } from '../../types/enums';
import {
    IServiceProviderUser,
    ICustomerUser,
} from '../../api_calls/createUser';
import { SelectOption } from '../../types/interfaces';
import { AccessLevel } from '../../components/Tables/UserManagementTable.controller';

export enum UtilitiesMenuItem {
    DealerChecklist = 'Dealer Profile',
    CreateServiceProvider = 'Create Service Provider',
    CreateCustomer = 'Create Customer',
    CreateSite = 'Create Site',
    UserManagement = 'User Management',
    RegisterDevice = 'Register Device',
    NetworkDevices = 'Network Devices',
    CameraActions = 'Camera Actions',
    DataRetentionPolicy = 'Data Retention Policy',
    NaturalLanguageSearch = 'AI Copilot Search (Beta)',
    CreateSMTPCamera = 'Create SMTP Camera',
    BulkSMTPCameraCreate = 'Bulk SMTP Camera Creation',
    BulkImmixCreate = 'Bulk Immix Camera Creation',
    CreateNVRSite = 'Create SMTP Site (NVR, DVR)',
    CameraConfigReport = 'Camera Config Report',
    CameraPerformanceReport = 'Camera Performance Report',
    CameraAlertsReport = 'Camera Alerts Report',
    ScheduleAuditReport = 'Schedule Audit Report',
    SPAuditReport = 'SP Audit Report',
    AIClassificationErrorReport = 'AI Error Report',
    ProMonitoringReport = 'Pro Monitoring Report',
    DispatchServiceConfiguration = 'Dispatch Service Configuration',
    Subscriptions = 'Subscriptions',
    Scheduling = 'Scheduling',
    NetworkDeviceTypes = 'Network Device Types',
    NetworkDeviceActionsAvailable = 'Network Device Actions Available',
    BridgeControls = 'Bridge Controls',
    TestClips = 'Test Clips',
}

const validNameCharacters: string =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_. ';

export const removeInvalidCharsFromName = (name: string) => {
    let result = '';

    for (let i = 0; i < name.length; i += 1) {
        if (validNameCharacters.includes(name[i])) result += name[i];
    }

    return result;
};

export const constructNewServiceProviderUser = ({
    name,
    password,
    email,
    accountType,
    selectedServiceProvider,
}: {
    name: string;
    password: string;
    email: string;
    accountType: AccountType;
    selectedServiceProvider: any;
}): IServiceProviderUser => {
    let serviceProviderId: string | number | undefined =
        selectedServiceProvider?.value;

    if (serviceProviderId) {
        serviceProviderId = Number(serviceProviderId);

        return {
            username: name,
            password,
            email,
            roles: [2],
            form: 'Create-Service-Provider-User',
            service_provider_account_reference_id:
                accountType === AccountType.Evolon
                    ? serviceProviderId
                    : undefined,
        };
    }

    throw new Error('Must select Service Provider for new user account.');
};

export const constructNewCustomerUser = ({
    name,
    password,
    email,
    accountType,
    selectedCustomer,
}: {
    name: string;
    password: string;
    email: string;
    accountType: AccountType;
    selectedCustomer: any;
}): ICustomerUser => {
    let customerId: string | number | undefined = selectedCustomer?.value;

    if (customerId) {
        customerId = Number(customerId);

        return {
            username: name,
            password,
            email,
            account_reference_id:
                accountType !== AccountType.Customer ? customerId : undefined,
            is_admin: true,
            properties: {},
            form: 'Create-Account-User',
        };
    }
    throw new Error('Must select Customer for new user account.');
};

/** Throws error if data for creating new Service Provider is not valid. */
export const validateServiceProviderSubmission = (name: string): void => {
    if (name.length < 3) {
        throw new Error(
            'Service Provider name must contain more than 3 characters.'
        );
    }

    if (name.trim().length === 0) {
        throw new Error(
            'Service Provider name must contain more than just spaces.'
        );
    }

    name.split('').forEach((char: string) => {
        if (!validNameCharacters.includes(char)) {
            throw new Error(
                `Service Provider name cannot contain the following character: ${char}`
            );
        }
    });
};

/** Throws error if data for creating new Customer is not valid. */
export const validateCustomerSubmission = (
    accountType: AccountType,
    name: string,
    serviceProviderId: number | undefined
): void => {
    if (name.length < 3) {
        throw new Error('Customer name must contain more than 3 characters.');
    }

    if (name.trim().length === 0) {
        throw new Error('Customer name must contain more than just spaces.');
    }

    name.split('').forEach((char: string) => {
        if (!validNameCharacters.includes(char)) {
            throw new Error(
                `Customer name cannot contain the following character: ${char}`
            );
        }
    });

    if (accountType === AccountType.Evolon && serviceProviderId === undefined) {
        throw new Error(
            'A Customer must be associated with a Service Provider.'
        );
    }
};

/** Throws error if data for creating new Site is not valid. */
export const validateSiteSubmission = ({
    accountType,
    name,
    customerId,
}: {
    accountType: AccountType;
    name: string;
    customerId: string | undefined;
}): void => {
    if (name.length < 3) {
        throw new Error('Site name must contain more than 3 characters.');
    }

    if (name.trim().length === 0) {
        throw new Error('Site name must contain more than just spaces.');
    }

    name.split('').forEach((char: string) => {
        if (!validNameCharacters.includes(char)) {
            throw new Error(
                `Site name cannot contain the following character: ${char}`
            );
        }
    });

    if (
        accountType === AccountType.ServiceProvider &&
        customerId === undefined
    ) {
        throw new Error('A Customer must be selected.');
    }
};

/** Throws error if data for creating new user is not valid. */
export const validateUserSubmission = ({
    accountType,
    name,
    password,
    email,
    serviceProviderId,
}: {
    accountType: AccountType;
    name: string;
    password: string;
    email: string;
    serviceProviderId: string | undefined;
}): void => {
    if (name.length < 3) {
        throw new Error('User name must contain more than 3 characters.');
    }

    if (name.trim().length === 0) {
        throw new Error('User name must contain more than just spaces.');
    }

    name.split('').forEach((char: string) => {
        if (!validNameCharacters.includes(char)) {
            throw new Error(
                `User name cannot contain the following character: ${char}`
            );
        }
    });

    if (password === '') {
        throw new Error('Password can not be empty.');
    }

    if (email === '') {
        throw new Error('Email can not be empty.');
    }

    if (accountType === AccountType.Evolon && serviceProviderId === undefined) {
        throw new Error('A Service Provider must be selected.');
    }
};

/** Throws error if data for creating SMTP Camera is not valid. */
export const validateSmtpCameraSubmission = ({
    accountType,
    name,
    serviceProviderId,
    customerId,
    siteId,
}: {
    accountType: AccountType;
    name: string;
    serviceProviderId: string | undefined;
    customerId: string | undefined;
    siteId: string | undefined;
}): void => {
    if (name.length < 3) {
        throw new Error('Camera name must contain more than 3 characters.');
    }

    if (name.trim().length === 0) {
        throw new Error('Camera name must contain more than just spaces.');
    }

    name.split('').forEach((char: string) => {
        if (!validNameCharacters.includes(char)) {
            throw new Error(
                `Camera name cannot contain the following character: ${char}`
            );
        }
    });

    if (accountType === AccountType.Evolon && serviceProviderId === undefined) {
        throw new Error('A Service Provider must be selected.');
    }

    if (accountType !== AccountType.Customer && customerId === undefined) {
        throw new Error('A Customer must be selected.');
    }

    if (siteId === undefined) {
        throw new Error('A Site must be selected.');
    }
};

export const accessLevelOptions: SelectOption[] = [
    {
        label: AccessLevel.Admin,
        value: AccessLevel.Admin,
    },
    {
        label: AccessLevel.Standard,
        value: AccessLevel.Standard,
    },
];
