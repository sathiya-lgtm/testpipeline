/** Features the various account types for a user. */
export enum AccountType {
    Evolon = 'ev',
    ServiceProvider = 'sp',
    Customer = 'cl',
}

export enum EvolonRole {
    GlobalAdmin = 'GlobalAdmin',
}

export enum ServiceProviderRole {
    AccountAdmin = 'AccountAdmin',
    CreateUser = 'CreateUser',
    EditUser = 'EditUser',
    ViewUser = 'ViewUser',
    CreateDevice = 'CreateDevice',
    EditDevice = 'EditDevice',
    DeleteDevice = 'DeleteDevice',
    CanLockAccount = 'CanLockAccount',
    CanAssignMultipleAccounts = 'CanAssignMultipleAccounts',
    HolderAccounts = 'HolderAccounts',
    CanRegisterDevice = 'CanRegisterDevice',
}

export enum CustomerRole {
    UserIsAdmin = 'UserIsAdmin',
}

/** Denotes any special limits or permissions of the user, such as
 * "read_only_audit" would denotes a user that is not permitted to write data
 * (i.e. create or update SP or Customer specific data) through their account.
 */
export enum AccountTypeModifier {
    ReadOnly = 'read_only_audit',
}

/** Values to be displayed that indicate result of Forensic Search. */
export enum ForensicSearchStatus {
    Fetching = 'Retrieving clips...',
    Success = '',
    NotFound = 'No clips found',
    Idle = 'Select Filter to begin search',
}

export enum JobType {
    Verify = 'verify',
    Email = 'email',
    Milestone = 'milestone',
    Edge = 'edge',
    NVR = 'email-nvr',
    NetworkOptix = 'network-optix',
    DeviceIO = 'device-io',
    Panel = 'panel',
}

/** Represents old / original "motion sensitivity" values.
 * Is only here for backwards compatibility.
 */
export enum TrackingSensitivity {
    VeryLow = 'very-low',
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    VeryHigh = 'very-high',
}
