import { MultiValue, SingleValue } from 'react-select';
import {
    AccountType,
    AccountTypeModifier,
    CustomerRole,
    EvolonRole,
    ServiceProviderRole,
} from './enums';

export interface IAboutInfo {
    version: string;
    api_build: string;
    api_sha: string;
}

/** Represents structure of decoded JWT access token. Features info about the user. */
export interface IDecodedAccessToken {
    account_type: AccountType;
    checksum: string;
    /** Should be the id of the Customer account, but is only available via this
     * property if the user is a Customer. This property will be null if the user
     * is a Service Provider or Evolon.
     */
    client_account: number | null;
    email: string;

    /** Expiration time (seconds since Unix epoch). */
    exp: number;

    /** Issued at (seconds since Unix epoch). */
    iat: number;
    id: number;
    is_active: boolean;

    /** Unique identifier for this token. */
    jti: string;
    live_view_controller_url: string;
    miy_status?: 'MIY' | 'MIY+' | '';

    /** ID for the user's Service Provider account. Only available if user is Evolon or
     * Service Provider.
     */
    service_provider_account: number | null;
    token_type: string;
    username: string;
    properties: any | null;
    /** Denotes any special limits or permissions of the user, such as
     * "read_only_audit" would denotes a user that is not permitted to write data
     * (i.e. create or update SP or Customer specific data) through their account.
     */
    modifier?: AccountTypeModifier[];
    access_roles: EvolonRole[] | ServiceProviderRole[] | CustomerRole[];
}

/**
 * An extension of the user's decoded JWT (i.e. IDecodedAccessToken) with the addition of keys for
 * the original encoded access token and refresh token.
 */
export interface IUser extends IDecodedAccessToken {
    accessToken: string;
    refreshToken: string;
    // TODO (API) account_name should probably exist within the "DecodedAccessToken" like the other info for consistency.
    /** Could be in reference to Customer name or Service Provider name depending on the user. */
    account_name: string | null;

    // Retention days should only be on customer accounts
    properties: {
        thumbnail?: string;
        retention_days?: number;
        customer_camera_view_access?: boolean;
    };
}

/**
 * Interface for an Option in a select or multi select element.
 */
export interface SelectOption {
    value: string;
    label: string;
    isDisabled?: boolean;
    retentiondays?: number;
}

/** JWT returned from API featuring encoded access and refresh variants. */
export interface IJwtToken {
    refresh: string;
    access: string;
    // TODO (API) account_name should probably exist within the "DecodedAccessToken" like the other info for consistency.
    /** Could be in reference to Customer name or Service Provider name depending on the user. */
    account_name: string | null;
    properties: { thumbnail?: string; customer_camera_view_access?: boolean };
}

/**
 * Interface for an object featuring 2 dimensions (height & width)
 */
export interface IDimensions {
    height: number;
    width: number;
}

export interface IColorChannel {
    r: number;
    g: number;
    b: number;
    a: number;
}

/** Represents an array wherein each element defines a masked or unmasked pixel via binary values 0 or 1. */
export type BitMask = Array<0 | 1>;

export type BrushType = 'draw' | 'erase' | undefined;

export interface IEdgeStatusData {
    service_provider_name: string;
    service_provider_account_id: number;
    account_name: string;
    account_id: number;
    site_name: string;
    site_id: number;
    camera_name: string;
    camera_id: number;
    mac_address: string;
    status: 'ONLINE' | 'OFFLINE' | 'PENDING' | 'UNKNOWN';
    last_ping_ut: number;
    from_bridge: boolean;
}

export interface ITimeBlock {
    days: string[];
    startTime: string | null;
    endTime: string | null;
}

export interface ILicenseBlock {
    state: string | undefined;
    license_number: string | undefined;
}

export interface IContactBlock {
    name: string | undefined;
    phone: string | undefined;
    email: string | undefined;
    passcode: string | undefined;
}

export interface IReportSetup {
    operator_signals?: boolean | true;
    test_signals?: boolean | true;
    account_changes?: boolean | false;
}

export interface ISubSectionBlock {
    office_personnel: number | null;
    technical_support: number | null;
}

export interface IDealerChecklist {
    dealer_account_number?: string | undefined;
    company_name?: string | undefined;
    president?: string | undefined;
    company_contact_person?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    county?: string | undefined;
    state?: string | undefined;
    zip?: string | undefined;
    office_hours?: ITimeBlock[];
    office_phone_number?: string | undefined;
    back_line_number?: string | undefined;
    state_burglar_license?: ILicenseBlock[];
    private_security_license?: ILicenseBlock[];
    tech_support_phone_number?: string | undefined;
    tech_support_email_address?: string;
    billing_contact_person?: string | undefined;
    billing_contact_phone_number?: string | undefined;
    billing_contact_email_address?: string;
    company_passcode?: string | undefined;
    authorized_office_personnel?: IContactBlock[];
    technical_support_team?: IContactBlock[];
    report_setup?: IReportSetup;
    report_recipient_emails?: string[];
    status?: 'Pending' | 'Completed' | undefined;
}

export interface ISubscriberFactSheetSubSectionBlock {
    post_dispatch_contacts: number | null;
    subscriber_authorized_delegates: number | null;
    audio_horn_list: number | null;
    sos_notification_recipients: number | null;
}
