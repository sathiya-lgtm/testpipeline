import { MonitorMode } from '../api_calls/Subscriptions';
import { JobType, TrackingSensitivity } from './enums';
import {
    IContactBlock,
    IEdgeStatusData,
    ILicenseBlock,
    IReportSetup,
    ITimeBlock,
} from './interfaces';

/**
 * Used to add types to the fetch response from the api
 */
export interface StandardApiResponseObj<T> {
    code: number;
    details: any | null;
    response: T;
}

export interface IManagedUser {
    /** User ID is not unique to each user. An SP can have the same user id
     * as a Customer because they exist in different tables. When performing
     * an operation where user id is required, the UI must specify whether it
     * refers to an SP or a Customer.
     */
    user_id: number;
    account_type: 'service provider' | 'customer' | 'evolon';
    company: string;
    company_id: number;
    username: string;
    email: string;
    /** In 2023-03-08 17:57:12 format */
    created_at: string;
    /** Should always be true unless being queried by Evolon user. */
    is_active: boolean;
    /** Details whether user is admin of some kind. Property will be undefined
     * if the answer is no (i.e. it is either true or undefined).
     */
    roles: {
        /** If Evolon */
        GlobalAdmin?: true;
        /** If Service Provider admin */
        AccountAdmin?: true;
        /** If Customer admin */
        UserIsAdmin?: true;
    };
    properties: {};
    /** Either empty string or in 2023-09-20 07:04:37 format */
    last_login: string;
}

/**
 * Provides the general information about an account
 */
export interface IAccountPolicy {
    account_id: number;
    camera_count: number;
    name: string;
    natural_language_search: boolean;
    retention_days: number;
    miy_status: null | 'MIY' | 'MIY+';
}

/**
 * Represents a service provider account which owns Customer accounts and service provider accounts.
 */
export interface IServiceProvider {
    service_provider_account_id: number;
    name: string;
    _next: string;
    _scope: string;
}

/** Represents a customer account. Billing entity that owns sites, cameras, and standard users. */
export interface ICustomer {
    account_id: number;
    account_name: string;
    site_count: number;
    service_provider_account_name: string;
    stages_subscription: '' | 'MIY' | 'MIY+';
    _next: string;
    _scope: string;
    _edge_status: IEdgeStatusData[];
}

/**
 * Represents a site which forwards camera information.
 */
export interface ISite {
    service_provider_account_name: string;
    account_name: string;
    site_name: string;
    site_id: number;
    site_uuid: string;
    source_enterprise: boolean;
    job_types: (JobType | null)[];
    properties: {
        email?: string;
        job_type?: string;
        template?: string;
    };
    _edge_status: IEdgeStatusData[];
}

/**
 * Represents a site which forwards camera information.
 */

export interface BridgeDeviceType {
    bridge_device_type_id: number;
    bridge_device_type_name: string;
    model: string;
}

/**
 * Represents data necessary for clickable link
 */
export interface ICameraLink {
    service_provider_account_name: string;
    camera_properties: {
        job_type?: JobType;
    };
    account_name: string;
    site_name: string;
    camera_id: number;
    camera_uuid: string;
    camera_name: string;
    camera_ip: string;
    _edge_status: IEdgeStatusData[];
    _next: string;
    _scope: string;
}

export interface IMaskData {
    /** Assume that a 0 means default to current mask dimensions (i.e. is the current mask in history). */
    width: 0 | number;
    /** Assume that a 0 means default to current mask dimensions (i.e. is the current mask in history). */
    height: 0 | number;
    /** zlib compressed bitmask then converted to a base64 encoded string. Will be empty if no mask is available. */
    mask: string;
}

export interface ILoiteringOptions {
    analyze_person_loitering: boolean | undefined;
    person_min_time_in_scene: number | undefined;
    person_timeout_duration: number | undefined;
    analyze_vehicle_loitering: boolean | undefined;
    vehicle_min_time_in_scene: number | undefined;
    vehicle_timeout_duration: number | undefined;
}

export type EdgeLicenseTypes = 'CP-EDGE' | 'CS-EDGE';

export interface IConfigurationData {
    alarm_vision: {
        panel: {
            mac_address: string;
            request_type: string;
            serial_number: string;
            panel_confirmation: number;
        };
        ax_number: number;
        lx_number: [number];
        account_number: number;
        available_zones: number[];
        control_system_id: number;
    };
}

/** Represents the "response" key from the API for an individual camera.
 */
export interface ICameraData extends IMaskData {
    service_provider_account_name: string;
    account_id: number;
    account_name: string;
    site_id: number;
    site_name: string;
    camera_id: number;
    camera_uuid: string;
    camera_unique_string: string;
    camera_name: string;
    camera_ip: string;
    camera_properties: {
        /** The optional properties are only present if camera has mask. */
        job_type: JobType;
        mask_hash?: string;
        mask_history_reference?: number;
        /** Default true unless job_type is "milestone" */
        allow_masking: boolean;
        camera_type?: 'rgb' | 'thermal';
        email?: string;
        device_id?: string; // For panels
        panel_type?: string; // For panels
        /** Allows for TrackingSensitivity enum for backwards compatibility. Consider removing whenever
         * backwards compatibility is no longer a concern.
         */
        vehicle_motion_sensitivity?: TrackingSensitivity | number;
        vehicle_motion_confidence?: number;
        person_motion_confidence?: number;
        disable_person_ai?: boolean;
        disable_vehicle_ai?: boolean;
        license_type?: EdgeLicenseTypes;
        version?: string;
        apply_blur?: boolean;
        apply_tiling?: boolean;
        suppress_untracked_persons?: boolean;
        suppress_untracked_vehicles?: boolean;
        analyze_person_loitering?: boolean;
        analyze_secondary_attributes?: boolean;
        analyze_vehicle_loitering?: boolean;
        apply_person_pixel_motion_filter?: boolean;
        apply_sharpening?: boolean;
        apply_vehicle_pixel_motion_filter?: boolean;
        secondary_verification?: boolean;
        mac_address?: string;
        camera_scene?: string;
        is_alarm_vision?: boolean;
    } & ILoiteringOptions;
    configuration: IConfigurationData;
    /** Min confidences as they exist in the database. In which case, thresholds may not be set yet. */
    camera_confidence: {
        /** Decimal between 0 - 1. Represents camera's AI confidence threshold. */
        person?: number;

        /** Decimal between 0 - 1. Represents camera's AI confidence threshold. */
        vehicle?: number;
    };
    /** Default min confidence / threshold. Should be used as fallback if "camera_confidence" was not set. */
    min_confidence: {
        /** Decimal between 0 - 1. Represents camera's AI confidence threshold. */
        person: number;

        /** Decimal between 0 - 1. Represents camera's AI confidence threshold. */
        vehicle: number;
    };
    monitor_mode: MonitorMode;
    _edge_status: IEdgeStatusData[];
}

/** Represents data returned from API upon clicking on "CameraLink" and/or making
 * a GET request for a specific camera using its camera_id.
 */
export interface ICameraLinkResponse {
    code: number;
    response: ICameraData;
    details: null;
}

export interface IClipPayload {
    mask?: string | null;
    is_armed?: boolean;
    camera_id: number;
    alert_type?: string[];
    apply_blur?: boolean;
    video_path?: string;
    camera_type: 'rgb' | 'thermal';
    apply_tiling?: boolean;
    min_confidence?: {
        /** Decimal between 0 - 1. Represents event's AI confidence threshold. */
        person: number;

        /** Decimal between 0 - 1. Represents event's AI confidence threshold. */
        vehicle: number;
    };
    subscription_id?: number;
    apply_sharpening?: boolean;
    disable_person_ai?: boolean;
    disable_vehicle_ai?: boolean;
    annotation_required?: boolean;
    max_frames_to_process?: number;
    secondary_verification?: boolean;
    person_timeout_duration?: number;
    analyze_person_loitering?: boolean;
    person_min_time_in_scene?: number;
    person_motion_confidence?: number;
    vehicle_timeout_duration?: number;
    analyze_vehicle_loitering?: boolean;
    vehicle_min_time_in_scene?: number;
    vehicle_motion_confidence?: number;
    suppress_untracked_persons?: boolean;
    suppress_untracked_vehicles?: boolean;
    analyze_secondary_attributes?: boolean;
    apply_person_pixel_motion_filter?: boolean;
    apply_vehicle_pixel_motion_filter?: boolean;
}

export interface IClip {
    /** e.g. 2023-03-08 18:35:30|tz=UTC */
    alert_id: number;
    created_at: string;
    aws_pre_sign_annotated: string;
    aws_pre_sign_origin: string;
    aws_pre_sign_alarm: string;
    aws_pre_sign_detection_boxes: string;
    aws_pre_sign_message: string;
    aws_pre_sign_thumbnail: string;
    aws_pres_sign_multimodal_detections: string;
    origin_path: string;
    job_type: JobType;
    /** Represents configuration of the camera when the event / clip was processed. */
    payload: IClipPayload;
    results: {
        alarm_info: {
            numeric_score: number;
            vehicle: boolean;
            person: boolean;

            /** Decimal between 0 - 1 */
            max_conf_vehicle: number;

            /** Decimal between 0 - 1 */
            max_conf_person: number;
            analytic_events?: string;
            person_is_loitering?: boolean;
            vehicle_is_loitering?: boolean;
            /** Allows for TrackingSensitivity enum for backwards compatibility. Consider removing whenever
             * backwards compatibility is no longer a concern. Number is between 1-99.
             */
            vehicle_motion_confidence: TrackingSensitivity | number;
            person_motion_confidence?: number;
        };
    };
    /** Current confidence of the camera itself (as opposed to when the clip / event was processed). */
    camera_confidence: {
        /** Decimal between 0 - 1. Represents camera's AI confidence threshold. */
        person?: number;

        /** Decimal between 0 - 1. Represents camera's AI confidence threshold. */
        vehicle?: number;
    };
    analytic_events?: string;
    account_id: number;
    site_id: number;
    camera_id: number;
    camera_name: string;
    account_name: string;
    site_name: string;
    clip_id: string;
    ai_error_comment: string | null;
    ai_error_event: string | null;
}

/**
 * We cut down on the clips response from the api.  Basically, the clips response might be missing fields if they are repeated a lot in different clips.
 * If the clip is missing a field it will be found in the default values.
 */
export interface IDefaultClipValues {
    account_id: number;
    account_name: string;
    ai_error_comment: string | null;
    ai_error_event: string | null;
    alerts_bound_to_camera: number;
    analytic_events: string;
    camera_confidence: {
        person?: number;
        vehicle?: number;
    };
    job_type: JobType;
    secondary_attributes: string[];
    service_provider_account_name: string;
    site_id: number;
    site_name: string;
}

export interface INewForensicClip {
    file_id: number;
    event_dt: string;
    account_id: number;
    account_name: string;
    ai_classification_error_comment: string;
    ai_classification_error_event: string;
    ai_classification_error_id: number;
    site_id: number;
    site_name: string;
    camera_id: number;
    camera_name: string;
    classifications: string[];
    event_types: string[];
    events: string[];
    min_conf_person: string; // '0.63'
    min_conf_vehicle: string; // '0.32'
    person_motion_confidence: string; // '22.00'
    vehicle_motion_confidence: string; // '81.00'
    classified_max_conf_person: string; // '0.94'
    classified_max_conf_vehicle: string; // '0.00'
    classified_person_motion_confidence: string; // '100.00'
    classified_vehicle_motion_confidence: string; // '0.00'
    is_armed: boolean;
    zone_ids: string[];
}

export interface IForensicClip {
    account_id?: number;
    account_name?: string;
    ai_error_comment?: string | null;
    ai_error_event?: string | null;
    alerts_bound_to_camera?: number;
    aws_pre_sign_annotated: string;
    aws_pre_sign_origin: string;
    analytic_events?: string;
    camera_confidence?: {
        person?: number;
        vehicle?: number;
    };
    camera_id: number;
    camera_name: string;
    /** e.g. 2023-03-08 18:35:30|tz=UTC */
    created_at: string;
    job_type?: JobType;
    origin_path: string;
    /** Represents configuration of the camera when the event / clip was processed. */
    payload: {
        mask?: string | null;
        camera_type: 'rgb' | 'thermal';
        video_path?: string;
        min_confidence?: {
            person: number;
            vehicle: number;
        };
        disable_person_ai?: boolean;
        disable_vehicle_ai?: boolean;
        vehicle_motion_confidence: TrackingSensitivity | number;
    };
    results: {
        alarm_info: {
            numeric_score: number;
            vehicle: boolean;
            person: boolean;
            max_conf_vehicle: number;
            max_conf_person: number;
            analytic_events?: string;
            person_is_loitering?: boolean;
            vehicle_is_loitering?: boolean;
            vehicle_motion_confidence: TrackingSensitivity | number;
        };
    };
    secondary_attributes?: string[];
    service_provider_account_name?: string;
    site_id?: number;
    site_name?: string;
}

export interface IForensicClipResponse {
    audit: {
        [clipId: string]: IForensicClip;
    };
    defaults: {
        audit: IDefaultClipValues;
        standard: IDefaultClipValues;
    };
    standard: {
        [clipId: string]: IForensicClip;
    };
}

/** Value for "response" key for an API call for clips.
 */
export interface IClipResponse {
    audit: {
        [clipId: string]: IClip;
    };
    standard: {
        [clipId: string]: IClip;
    };
}

export interface IAISearchTokens {
    start_date: string;
    end_date: string;
    // site_id: number;
    camera_names?: string[];
    cameras?: number[];
    event_type_filter?: string[];
    events_filter?: string[];
    classifications_filter?: string[];
    gender_types?: string[];
    vehicle_colors?: string[];
    vehicle_types?: string[];
}

export interface IAIQueryBuilderKeywordMismatchObj {
    invalid_camera_names?: string[];
}

export interface INLSearchTokens {
    date_from: string;
    date_to: string;
    customers?: string[];
    sites?: string[];
    cameras?: string[];
    objects?: string[];
    secondary_sex?: string[];
    secondary_vehicle_type?: string[];
    secondary_vehicle_color?: string[];
}

export interface INLSearchClipResponse extends IClipResponse {
    tokens: INLSearchTokens;
}

/** Interface for data required to register a device via posting registration code. */
export interface IRegistrationData {
    account_id: number;
    token: string;
    site: null | undefined | number;
}

/** Interface for data required to register a edge device via mac_address. */
export interface IEdgeRegistrationData {
    account_id: number;
    site_id: null | undefined | number;
    ['mac-address']: string;
    camera_name: string;
    license_type: EdgeLicenseTypes;
    dmp_username?: string | undefined | null;
    dmp_password?: string | undefined | null;
}

/** Data representing one hour's worth of events. */
export interface IEventHour {
    /** Total number of events processed by AI. */
    captured_events: number;

    /** Number of events in which AI did not detect an object (person or vehicle). */
    mitigated: number;

    /** Number of events in which AI detected a vehicle. This number is person inclusive,
     * meaning it counts events where AI detected either a vehicle exclusively or a vehicle
     * and a person. Math has to be done on the event data to calculate events with vehicles exclusively.
     */
    vehicle: number;

    /** Number of events in which AI detected a person. This number is vehicle inclusive,
     * meaning it counts events where AI detected either a person exclusively or a person
     * and a vehicle. Math has to be done on the event data to calculate events with persons exclusively.
     */
    person: number;
    person_loitering: number;
    vehicle_loitering: number;
}

/** Data representing one day's worth of events. */
export interface IEventDay {
    [hour: string]: IEventHour;
}

/** Represents data to be displayed on Dashboard. */
export interface IDashboardData {
    /** "date" key should be in "yyyy-MM-dd" format (e.g. 2023-07-13) in UTC. */
    [date: string]: IEventDay;
}

export interface IDashboardResponse {
    dashboard_data: IDashboardData;
    features: { loitering: boolean };
}

export interface IAlertProperties {
    from_email: string;
    to_email: string;
    subject: string;
    server?: string;
    port?: number;
    identifier?: string;
}

/** Interface for alert data */
export interface IAlert {
    alert_id: number;
    alert_name: string;
    alert_created_at: string; // ex. "2023-04-27 18:19:14.434746"
    alert_type: 'email' | 'immix';
    alert_properties: IAlertProperties;
    camera_id: number;
    camera_name: string;
    camera_properties: any; // This may be used later
    account_name: string;
    account_id: number;
    service_provider_name: string;
    site_name: string;
    site_id: number;
    last_alert: string; // ex. "2023-04-27 18:19:14.434746";
    last_alert_properties: {
        type: 'create';
        details: {
            camera_id: number;
            account_id: number;
            alert_name: string;
            alert_type: 'email';
            created_by: number;
            account_type: string;
        };
    };
    last_alert_result_code: number;
}

export interface ISPAuditReportData {
    defaults: { [key: string]: string };
    headers: string[];
    rows: { [key: string]: string }[];
}

export interface IAIClassificationErrorReportData {
    headers: string[];
    rows: string[];
}

/** Stages Stuff */
export interface IStagesAccount {
    stages_account_id: number;
    stages_account_name: string;
    stages_site_id: number;
    stages_site_name: string;
}

export interface IStagesLoginResponse {
    account_id: number;
    account_name: string;
    matched_account_name: false;
    matched_stages_account_id: number; // 0 if none found
    matched_stages_account_name: string;
    session_existed: boolean;
    stages_accounts: IStagesAccount[];
    stages_site_group_id: number;
    stages_site_group_name: string;
    success: boolean;
}

export interface IStagesLinkResponse {
    account_created: boolean;
    account_id: number;
    account_name: string;
    site_id: number;
    site_name: string;
    is_active: boolean;
    properties: string;
    stages_account_id: number;
    stages_account_name: string;
    stages_accounts_id: number;
    stages_site_group_id: number;
    stages_site_group_name: string;
    success: boolean;
    user_name: string;
    user_password: string;
}

export interface IStagesAlertResponse {
    alerts: { transaction_id: string };
    is_test: boolean;
    success: boolean;
}

export interface IStagesPasswordRefreshResponse {
    account_id: number;
    days_to_expire: number;
    db_commited: boolean;
    db_updated: boolean;
    dealer_name: string;
    stages_updated: boolean;
    updated_at: string;
    user_name: string;
    user_password: string;
}

export interface IStagesDealerAccount {
    stages_account_id: number;
    stages_accounts_id: number;
    account_id: number;
    account_name: string;
    site_id: number;
    site_name: string;
    user_name: string;
    user_password: string;
    stages_site_group_id: number;
    stages_site_group_name: string;
    stages_account_name: string;
    stages_site_name: string;
    stages_site_id: number;
    properties: null;
    stages_account_state_id: number;
}

export interface IStagesDealerCreds {
    account_id: number;
    dealer_name: string;
    user_name: string;
    user_password: string;
    updated_at: string; // 2024-05-16 22:02:52.053317
    days_to_expire: number;
}

export interface IMIYSiteStatus {
    site_id: number;
    site_name: string;
    stages_account_state_id: 0 | 1 | 2 | 3;
    stages_account_state_name: 'Testing' | 'Pending' | 'Active';
    subscription_id: 0 | 4 | 5;
    subscription_name: 'None' | 'SOS' | 'Pro Monitor';
}

export interface IMIYAccountStatus {
    account_name: string;
    account_id: number;
    miy_status: null | 'eligable' | 'MIY' | 'MIY+';
    service_provider_name: string;
    service_provider_id: number;
    sites: IMIYSiteStatus[];
}

export interface IAPIDealerChecklist {
    dealer_onboarding_checklist_id?: string | undefined;
    service_provider_account_id?: string | undefined;
    dealer_account_number: string | undefined;
    company_name: string | undefined;
    president: string | undefined;
    company_contact_person: string | undefined;
    address: string | undefined;
    city: string | undefined;
    county: string | undefined;
    state: string | undefined;
    zip: string | undefined;
    office_hours: ITimeBlock[];
    office_phone_number: string | undefined;
    back_line_number: string | undefined;
    state_burglar_license: ILicenseBlock[];
    private_security_license: ILicenseBlock[];
    tech_support_phone_number: string | undefined;
    tech_support_email_address: string;
    billing_contact_person: string | undefined;
    billing_contact_phone_number: string | undefined;
    billing_contact_email_address: string;
    company_passcode: string | undefined;
    authorized_office_personnel: IContactBlock[];
    technical_support_team: IContactBlock[];
    report_setup: IReportSetup;
    report_recipient_emails: string[];
    created_at?: string | undefined;
    updated_at?: string | undefined;
    status: 'Pending' | 'Completed' | undefined;
}

export interface IDealerList {
    service_provider_account_id: number;
    dealer_checklist_id: number;
    service_provider_name: string;
    company_name: string;
    dealer_account_number: string;
    updated_at: string;
    status: 'Pending' | 'Completed';
}

export interface ISecurityContactBlock {
    name?: string | undefined;
    phone?: string | undefined;
}

export interface IPhoneContactOptions {
    phone: string | undefined;
    text: boolean;
    call: boolean;
}

export interface IPostDispatchContacts {
    name: string | undefined;
    passcode: string | undefined;
    primary_phone: IPhoneContactOptions;
    secondary_phone: IPhoneContactOptions;
}

export interface ISubscriberAuthorizedDelegateContact {
    name: string | undefined;
    passcode: string | undefined;
    primary_phone?: string | undefined;
    secondary_phone?: string | undefined;
}

export interface ICameraDetails {
    camera_id: string | undefined;
    camera_name: string | undefined;
    camera_model: string | undefined;
}

export interface IAudioHornDetails {
    network_device_id: string | undefined;
    network_device_name: string | undefined;
    network_device_type_name: string | undefined;
    announcement: string | undefined;
}

export interface ISOSNotificationContacts extends IPhoneContactOptions {
    is_from_party: boolean;
    party_id: number | null;
    name: string | undefined;
}

export type SubscriberAccountTypes = 'Residential' | 'Commercial';
export type DispatchImmediatelyTypes = 'Police' | 'Guard Services';

export interface ISOSActionPlan {
    dispatch_immediately: DispatchImmediatelyTypes;
    post_dispatch_action: string | undefined;
    sos_notification_recipients: ISOSNotificationContacts[];
}

export interface IAPISubscriberFactSheet {
    site_id: number;
    dealer_number?: string | undefined;
    dealer_name?: string | undefined;
    subscriber_account_number?: string | undefined;
    subscriber_account_type: SubscriberAccountTypes;
    video_system_types: string[];
    business_name: string | undefined;
    address: string | undefined;
    suite_number: string | undefined;
    city: string | undefined;
    state: string | undefined;
    zip: string | undefined;
    customer_name: string | undefined;
    customer_email: string | undefined;
    customer_cell: string | undefined;
    location_phone_primary: string | undefined;
    location_phone_secondary: string | undefined;
    subdivision: string | undefined;
    cross_street: string | undefined;
    alarm_permit_number: string;
    police_department: ISecurityContactBlock;
    fire_department: ISecurityContactBlock;
    ems_service: ISecurityContactBlock;
    guard_service: ISecurityContactBlock;

    post_dispatch_contacts: IPostDispatchContacts[];
    event_notification_emails: string[];

    subscriber_authorized_delegates: ISubscriberAuthorizedDelegateContact[];

    video_camera_list: ICameraDetails[];

    audio_horn_list: IAudioHornDetails[];

    sos_action_plan: ISOSActionPlan;

    runaway_alarm: {
        test_duration: string | undefined;
    };

    report_setup: IReportSetup;
    report_recipient_emails: string[];

    dealer_tech_support_phone: string | undefined;
    dealer_tech_support_email: string | undefined;

    status: 'Pending' | 'Completed' | 'NotFound' | undefined;
}
