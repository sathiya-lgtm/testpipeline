import React, {
    Dispatch,
    FC,
    FormEvent,
    Fragment,
    ReactElement,
    SetStateAction,
    useEffect,
    useState,
} from 'react';

// Third party
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import jsPDF from 'jspdf';

// Api Calls
import updateSubscriberFactSheet from '../../api_calls/updateSubscriberFactSheet';
// import getScheduleTimeZones from '../../api_calls/getScheduleTimeZones';
// import { getSchedules } from '../../api_calls/Schedules';

// Components
import ModalBase from '../ModalBase';
import LoadingModal from './LoadingModal';
import Input from '../Inputs/Input';
import Button from '../Button';
import SingleSelect from '../Inputs/Select';
import ButtonGroup, { ButtonGroupAlignment } from '../ButtonGroup/ButtonGroup';
import FactSheetProMonitoringSchedule from './FactSheetProMonitoringSchedule';

// Utils
import {
    convertPhoneNumberToFormattedVersion,
    handlePhoneNumberChange,
    handlePhoneNumberFocus,
    handlePhoneNumberBlur,
} from '../../utils/convertPhoneNumberToFormattedVersion';

// Icons
import DeleteIcon from '../../images/icons/EV_ENT_CircleX.7.6.22.svg?react';
import { FaCheck, FaChevronDown, FaChevronRight } from 'react-icons/fa';

// Controller

// Custom types
import {
    IReportSetup,
    ISubscriberFactSheetSubSectionBlock,
    IUser,
} from '../../types/interfaces';
import { AccountType } from '../../types/enums';
import {
    DispatchImmediatelyTypes,
    IAPISubscriberFactSheet,
    IAudioHornDetails,
    ICameraDetails,
    // IPhoneContactOptions,
    IPostDispatchContacts,
    ISecurityContactBlock,
    ISOSNotificationContacts,
    ISubscriberAuthorizedDelegateContact,
    SubscriberAccountTypes,
} from '../../types/tng-api.interfaces';

// Styles
import '../../styles/components/SubscriberFactSheet.scss';

type SubscriberFactSheetErrors = {
    [K in keyof IAPISubscriberFactSheet]?: K extends
        | 'post_dispatch_contacts'
        | 'event_notification_emails'
        | 'subscriber_authorized_delegates'
        | 'sos_action_plan'
        | 'report_recipient_emails'
        ? string[]
        : string;
};

const subscriberAccountTypeOptions = ['Residential', 'Commercial'];
const subscriberVideoSystemType = [
    'Evolon Edge',
    'Evolon Bridge',
    'VMS Plug-In',
    'Immix',
];
const dispatchImmediatelyOptions = ['Police', 'Guard Services'];
const runawayAlarmIntervalOptions = ['15', '30', '60'];

// const availableActionOptions = [
//     { label: 'Contact Police', value: 'Contact-Police' },
//     { label: 'Contact Party', value: 'Contact-Party' },
//     { label: 'Trigger Audio Message', value: 'Trigger-Audio-Message' },
//     { label: 'Trigger Horn / Siren', value: 'Trigger-Horn-Siren' },
// ];

const partyOptions = [
    { label: 'Party - 1', value: '1' },
    { label: 'Party - 2', value: '2' },
    { label: 'Party - 3', value: '3' },
    { label: 'Party - 4', value: '4' },
    { label: 'Party - 5', value: '5' },
    { label: 'Party - 6', value: '6' },
    { label: 'Party - 7', value: '7' },
    { label: 'Party - 8', value: '8' },
];

const defaultSubscriberAccountType = 'Residential' as SubscriberAccountTypes;
const defaultSOSDispatchValue = 'Guard Services' as DispatchImmediatelyTypes;
const defaultRunawayAlarmInterval = '15';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    handleClose: () => void;
    subscriberFactSheetFormData: IAPISubscriberFactSheet;
    accountId: string;
    siteId: string;
}

const EditSubscriberFactSheetModal: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    handleClose,
    subscriberFactSheetFormData,
    accountId,
    siteId,
}: IProps): ReactElement => {
    type SubSectionKey = keyof ISubscriberFactSheetSubSectionBlock;

    const defaultKeys: (keyof typeof subscriberFactSheetData)[] = [
        'subscriber_account_type',
        'post_dispatch_contacts',
        'sos_action_plan',
        'runaway_alarm',
        'report_setup',
    ];

    const requiredFields: (keyof typeof subscriberFactSheetData)[] = [
        'subscriber_account_type',
        'video_system_types',
        'business_name',
        'address',
        'suite_number',
        'city',
        'state',
        'zip',
        'customer_name',
        'customer_email',
        'customer_cell',
        'location_phone_primary',
        'subdivision',
        'cross_street',
        'alarm_permit_number',
        'police_department',
        'fire_department',
        'ems_service',
        'guard_service',
        'post_dispatch_contacts',
        'sos_action_plan',
        'dealer_tech_support_phone',
        'dealer_tech_support_email',
    ];

    const defaultDepartmentDetails = {
        name: '',
        phone: '',
    };

    const defaultPostDispatchContacts = {
        name: '',
        passcode: '',
        primary_phone: { phone: '', text: true, call: false },
        secondary_phone: { phone: '', text: true, call: false },
    };

    const defaultSOSNotificationReceipients = {
        call: false,
        is_from_party: false,
        name: '',
        party_id: 0,
        phone: '',
        text: true,
    };

    const defaultReportSetup = {
        account_changes: false,
        operator_signals: true,
        test_signals: true,
    };

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<SubscriberFactSheetErrors>(
        {}
    );
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [activeSubSection, setActiveSubSection] =
        useState<ISubscriberFactSheetSubSectionBlock>({
            post_dispatch_contacts: null,
            subscriber_authorized_delegates: null,
            audio_horn_list: null,
            sos_notification_recipients: null,
        });

    const [isSubscriberInfoVerified, setIsSubscriberInfoVerified] =
        useState<boolean>(false);
    const [isPostDispatchContactsVerified, setIsPostDispatchContactsVerified] =
        useState<boolean>(false);
    const [
        isSubscriberAuthorizedDelegateVerified,
        setIsSubscriberAuthorizedDelegateVerified,
    ] = useState<boolean>(false);
    // const [isVideoCameraDetailsVerified, setIsVideoCameraDetailsVerified] =
    //     useState<boolean>(true);
    // const [isAudioHornDetailsVerified, setIsAudioHornDetailsVerified] =
    //     useState<boolean>(true);
    const [isVideoCameraDetailsVerified] = useState<boolean>(true);
    const [isAudioHornDetailsVerified] = useState<boolean>(true);
    const [isSOSActionPlanVerified, setIsSOSActionPlanVerified] =
        useState<boolean>(false);
    // const [isRunAwayAlarmVerified, setIsRunAwayAlarmVerified] =
    //     useState<boolean>(true);
    // const [isProMonitorScheduleVerified, setIsProMonitorScheduleVerified] =
    //     useState<boolean>(true);
    const [isRunAwayAlarmVerified] = useState<boolean>(true);
    const [isProMonitorScheduleVerified] = useState<boolean>(true);
    const [isProMonitorActionPlanVerified, setIsProMonitorActionPlanVerified] =
        useState<boolean>(false);
    const [isReportSetupVerified, setIsReportSetupVerified] =
        useState<boolean>(false);
    const [isDealerTechSupportVerified, setIsDealerTechSupportVerified] =
        useState<boolean>(false);

    // Progress state
    const [progressStatus, setProgressStatus] = useState(0);

    const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
    const [subscriberFactSheetData, setSubscriberFactSheetData] =
        useState<IAPISubscriberFactSheet>(
            deepClone(subscriberFactSheetFormData)
        );
    const [savedSubscriberFactSheetData, setSavedSubscriberFactSheetData] =
        useState<IAPISubscriberFactSheet>(
            deepClone(subscriberFactSheetFormData)
        );

    const [subscriberAccountType, setSubscriberAccountType] =
        useState<SubscriberAccountTypes>(
            subscriberFactSheetData.subscriber_account_type
                ? subscriberFactSheetData.subscriber_account_type
                : defaultSubscriberAccountType
        );

    const [customerCellNumber, setCustomerCellNumber] = useState<string>(
        subscriberFactSheetData.customer_cell
            ? convertPhoneNumberToFormattedVersion(
                  subscriberFactSheetData.customer_cell
              )
            : ''
    );
    const [locationPhoneNumber, setLocationPhoneNumber] = useState<string>(
        subscriberFactSheetData.location_phone_primary
            ? convertPhoneNumberToFormattedVersion(
                  subscriberFactSheetData.location_phone_primary
              )
            : ''
    );
    const [locationAltNumber, setLocationAltNumber] = useState<string>(
        subscriberFactSheetData.location_phone_secondary
            ? convertPhoneNumberToFormattedVersion(
                  subscriberFactSheetData.location_phone_secondary
              )
            : ''
    );
    const [dealerTechSupportPhoneNumber, setDealerTechSupportPhoneNumber] =
        useState<string>(
            subscriberFactSheetData.dealer_tech_support_phone
                ? convertPhoneNumberToFormattedVersion(
                      subscriberFactSheetData.dealer_tech_support_phone
                  )
                : ''
        );

    // const [policeDepartmentBlocks, setPoliceDepartmentBlocks] =
    //     useState<ISecurityContactBlock>(
    //         Object.keys(subscriberFactSheetData.police_department).length === 2
    //             ? (subscriberFactSheetData.police_department as ISecurityContactBlock)
    //             : defaultDepartmentDetails
    //     );
    const [policeDepartmentBlocks, setPoliceDepartmentBlocks] =
        useState<ISecurityContactBlock>(
            Object.keys(subscriberFactSheetData.police_department).length === 2
                ? {
                      name:
                          'name' in subscriberFactSheetData.police_department
                              ? subscriberFactSheetData.police_department.name
                              : '',
                      phone:
                          'phone' in subscriberFactSheetData.police_department
                              ? convertPhoneNumberToFormattedVersion(
                                    subscriberFactSheetData.police_department
                                        .phone ?? ''
                                )
                              : '',
                  }
                : defaultDepartmentDetails
        );

    // const [fireDepartmentBlocks, setFireDepartmentBlocks] =
    //     useState<ISecurityContactBlock>(
    //         Object.keys(subscriberFactSheetData.fire_department).length === 2
    //             ? (subscriberFactSheetData.fire_department as ISecurityContactBlock)
    //             : defaultDepartmentDetails
    //     );

    const [fireDepartmentBlocks, setFireDepartmentBlocks] =
        useState<ISecurityContactBlock>(
            Object.keys(subscriberFactSheetData.fire_department).length === 2
                ? {
                      name:
                          'name' in subscriberFactSheetData.fire_department
                              ? subscriberFactSheetData.fire_department.name
                              : '',
                      phone:
                          'phone' in subscriberFactSheetData.fire_department
                              ? convertPhoneNumberToFormattedVersion(
                                    subscriberFactSheetData.fire_department
                                        .phone ?? ''
                                )
                              : '',
                  }
                : defaultDepartmentDetails
        );

    // const [emsServiceBlocks, setEMSServiceBlocks] =
    //     useState<ISecurityContactBlock>(
    //         Object.keys(subscriberFactSheetData.ems_service).length === 2
    //             ? (subscriberFactSheetData.ems_service as ISecurityContactBlock)
    //             : defaultDepartmentDetails
    //     );

    const [emsServiceBlocks, setEMSServiceBlocks] =
        useState<ISecurityContactBlock>(
            Object.keys(subscriberFactSheetData.ems_service).length === 2
                ? {
                      name:
                          'name' in subscriberFactSheetData.ems_service
                              ? subscriberFactSheetData.ems_service.name
                              : '',
                      phone:
                          'phone' in subscriberFactSheetData.ems_service
                              ? convertPhoneNumberToFormattedVersion(
                                    subscriberFactSheetData.ems_service.phone ??
                                        ''
                                )
                              : '',
                  }
                : defaultDepartmentDetails
        );

    // const [guardServiceBlocks, setGuardServiceBlocks] =
    //     useState<ISecurityContactBlock>(
    //         Object.keys(subscriberFactSheetData.guard_service).length === 2
    //             ? (subscriberFactSheetData.guard_service as ISecurityContactBlock)
    //             : defaultDepartmentDetails
    //     );

    const [guardServiceBlocks, setGuardServiceBlocks] =
        useState<ISecurityContactBlock>(
            Object.keys(subscriberFactSheetData.guard_service).length === 2
                ? {
                      name:
                          'name' in subscriberFactSheetData.guard_service
                              ? subscriberFactSheetData.guard_service.name
                              : '',
                      phone:
                          'phone' in subscriberFactSheetData.guard_service
                              ? convertPhoneNumberToFormattedVersion(
                                    subscriberFactSheetData.guard_service
                                        .phone ?? ''
                                )
                              : '',
                  }
                : defaultDepartmentDetails
        );

    // const [postDispatchContactBlocks, setPostDispatchContactBlocks] = useState<
    //     IPostDispatchContacts[]
    // >(
    //     subscriberFactSheetData.post_dispatch_contacts.length != 0
    //         ? subscriberFactSheetData.post_dispatch_contacts.map((contact) => ({
    //               ...contact,
    //               primary_phone: {
    //                   ...contact.primary_phone,
    //                   phone: contact.primary_phone.phone
    //                       ? convertPhoneNumberToFormattedVersion(
    //                             contact.primary_phone.phone
    //                         )
    //                       : '',
    //               },
    //               secondary_phone: {
    //                   ...contact.secondary_phone,
    //                   phone: contact.secondary_phone.phone
    //                       ? convertPhoneNumberToFormattedVersion(
    //                             contact.secondary_phone.phone
    //                         )
    //                       : '',
    //               },
    //           }))
    //         : Array.from({ length: 8 }, () =>
    //               structuredClone(defaultPostDispatchContacts)
    //           )
    //     // [defaultPostDispatchContacts]
    // );

    const [postDispatchContactBlocks, setPostDispatchContactBlocks] = useState<
        IPostDispatchContacts[]
    >([
        ...subscriberFactSheetData.post_dispatch_contacts.map((contact) => ({
            ...contact,
            primary_phone: {
                ...contact.primary_phone,
                phone: contact.primary_phone.phone
                    ? convertPhoneNumberToFormattedVersion(
                          contact.primary_phone.phone
                      )
                    : '',
            },
            secondary_phone: {
                ...contact.secondary_phone,
                phone: contact.secondary_phone.phone
                    ? convertPhoneNumberToFormattedVersion(
                          contact.secondary_phone.phone
                      )
                    : '',
            },
        })),
        ...Array.from(
            {
                length: Math.max(
                    0,
                    8 - subscriberFactSheetData.post_dispatch_contacts.length
                ),
            },
            () => structuredClone(defaultPostDispatchContacts)
        ),
    ]);

    const [eventNotifyEmailBlocks, setEventNotifyEmailBlocks] = useState<
        string[]
    >(
        subscriberFactSheetData.event_notification_emails.length != 0
            ? subscriberFactSheetData.event_notification_emails
            : []
    );

    const [
        subscriberAuthorizedDelegateBlocks,
        setSubscriberAuthorizedDelegateBlocks,
    ] = useState<ISubscriberAuthorizedDelegateContact[]>(
        subscriberFactSheetData.subscriber_authorized_delegates.length != 0
            ? subscriberFactSheetData.subscriber_authorized_delegates.map(
                  (contact) => ({
                      ...contact,
                      primary_phone: contact.primary_phone
                          ? convertPhoneNumberToFormattedVersion(
                                contact.primary_phone
                            )
                          : '',
                      secondary_phone: contact.secondary_phone
                          ? convertPhoneNumberToFormattedVersion(
                                contact.secondary_phone
                            )
                          : '',
                  })
              )
            : [
                  {
                      name: '',
                      passcode: '',
                      primary_phone: '',
                      secondary_phone: '',
                  },
              ]
    );

    const [videoCameraDetailsBlocks, setVideoCameraDetailsBlocks] = useState<
        ICameraDetails[]
    >(
        subscriberFactSheetData.video_camera_list.length != 0
            ? subscriberFactSheetData.video_camera_list
            : [
                  //   {
                  //       zone: '',
                  //       description: '',
                  //       camera_model: '',
                  //   },
              ]
    );
    // const [videoCameraDetailsBlocks, setVideoCameraDetailsBlocks] = useState<
    //     ICameraDetails[]
    // >(
    //     subscriberFactSheetData.video_camera_list.length != 0
    //         ? subscriberFactSheetData.video_camera_list
    //         : [
    //               {
    //                   zone: '9126',
    //                   description: 'AXIS M1054',
    //                   camera_model: '',
    //               },
    //           ]
    // );

    const [audioHornDetailsBlocks, setAudioHornDetailsBlocks] = useState<
        IAudioHornDetails[]
    >(
        subscriberFactSheetData.audio_horn_list.length != 0
            ? subscriberFactSheetData.audio_horn_list
            : [
                  //   {
                  //       network_device_id: '',
                  //       network_device_type_name: '',
                  //       network_device_name: '',
                  //       announcement: '',
                  //   },
              ]
    );

    const [sosDispatchImmediately, setSOSDispatchImmediately] =
        useState<DispatchImmediatelyTypes>(
            'dispatch_immediately' in subscriberFactSheetData.sos_action_plan
                ? subscriberFactSheetData.sos_action_plan.dispatch_immediately
                : defaultSOSDispatchValue
        );

    const [
        sosNotificationReceipientsBlocks,
        setSosNotificationReceipientsBlocks,
    ] = useState<ISOSNotificationContacts[]>(
        'sos_notification_recipients' in
            subscriberFactSheetData.sos_action_plan &&
            subscriberFactSheetData.sos_action_plan.sos_notification_recipients
                .length != 0
            ? subscriberFactSheetData.sos_action_plan.sos_notification_recipients.map(
                  (contact) => ({
                      ...contact,
                      phone: contact.phone
                          ? convertPhoneNumberToFormattedVersion(contact.phone)
                          : '',
                  })
              )
            : [defaultSOSNotificationReceipients]
    );

    const [runAwayAlarmTestDuration, setRunAwayAlarmTestDuration] =
        useState<string>(
            subscriberFactSheetData.runaway_alarm?.test_duration
                ? subscriberFactSheetData.runaway_alarm?.test_duration
                : defaultRunawayAlarmInterval
        );

    const [dailyReport, setDailyReport] = useState<IReportSetup>(
        Object.keys(subscriberFactSheetData.report_setup).length !== 0
            ? subscriberFactSheetData.report_setup
            : defaultReportSetup
    );

    const [reportEmailBlocks, setReportEmailBlocks] = useState<string[]>(
        subscriberFactSheetData.report_recipient_emails.length != 0
            ? subscriberFactSheetData.report_recipient_emails
            : []
    );

    // const handleCameraModelChange = (index: number, cam_model: string) => {
    //     const updated = [...videoCameraDetailsBlocks];
    //     updated[index].camera_model = cam_model;
    //     setVideoCameraDetailsBlocks(updated);
    // };

    // Column definitions
    const videoCameraDetailsColumns: ColumnDef<ICameraDetails>[] = [
        {
            header: 'Zone #',
            accessorKey: 'camera_id',
        },
        {
            header: 'Description',
            accessorKey: 'camera_name',
        },
        {
            header: 'Camera Model',
            accessorKey: 'camera_model',
            cell: (info) => {
                const rowIndex = info.row.index;
                const cam_model = info.getValue<string>();

                const [cameraModel, setCameraModel] = useState<string>(
                    cam_model || ''
                );

                return (
                    <input
                        id="camera_model"
                        name="camera_model"
                        type="text"
                        value={cameraModel ? cameraModel : ''}
                        onChange={(e) => setCameraModel(e.target.value)}
                        onBlur={(e) =>
                            handleBlockFieldBlur(
                                rowIndex,
                                e.target.value,
                                'camera_model',
                                setVideoCameraDetailsBlocks,
                                videoCameraDetailsBlocks
                            )
                        }
                        autoComplete="off"
                        maxLength={255}
                    />
                );
            },
        },
    ];

    const videoCameraDetailsTable = useReactTable<ICameraDetails>({
        data: videoCameraDetailsBlocks,
        columns: videoCameraDetailsColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        sortingFns: {
            markSort: () => {
                return 1;
            },
            timeSort: () => {
                return 1;
            },
            emailSort: () => {
                return 1;
            },
        },
    });

    // Column definitions
    const audioHornColumns: ColumnDef<IAudioHornDetails>[] = [
        {
            header: 'Model',
            accessorKey: 'network_device_type_name',
        },
        {
            header: 'Name / Description',
            accessorKey: 'network_device_name',
        },
        {
            header: 'Announcement / Message',
            accessorKey: 'announcement',
            cell: (info) => {
                const rowIndex = info.row.index;
                const message = info.getValue<string>();

                const [announcement, setAnnouncement] = useState<string>(
                    message || ''
                );

                return (
                    <input
                        id="announcement"
                        name="announcement"
                        type="text"
                        value={announcement ? announcement : ''}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        onBlur={(e) =>
                            handleBlockFieldBlur(
                                rowIndex,
                                e.target.value,
                                'announcement',
                                setAudioHornDetailsBlocks,
                                audioHornDetailsBlocks
                            )
                        }
                        autoComplete="off"
                        maxLength={255}
                    />
                );
            },
        },
    ];

    const audioHornDetailsTable = useReactTable<IAudioHornDetails>({
        data: audioHornDetailsBlocks,
        columns: audioHornColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        sortingFns: {
            markSort: () => {
                return 1;
            },
            timeSort: () => {
                return 1;
            },
            emailSort: () => {
                return 1;
            },
        },
    });

    // const removePostDispatchContactBlock = (targetIndex: number) => {
    //     if (postDispatchContactBlocks.length <= 1) {
    //         toast.error('Must have at least one Post-Dispatch Party details.');
    //         return;
    //     }

    //     const postDispatchContactBlocksCopy = [...postDispatchContactBlocks];
    //     postDispatchContactBlocksCopy.splice(targetIndex, 1);
    //     setPostDispatchContactBlocks(postDispatchContactBlocksCopy);

    //     if (activeSubSection.post_dispatch_contacts === targetIndex) {
    //         setActiveSubSection((prev) => ({
    //             ...prev,
    //             ['post_dispatch_contacts']: targetIndex,
    //         }));
    //     }
    // };

    const removeEventNotifyEmailEmailBlock = (targetIndex: number) => {
        const eventNotifyEmailBlocksCopy = [...eventNotifyEmailBlocks];
        eventNotifyEmailBlocksCopy.splice(targetIndex, 1);
        setEventNotifyEmailBlocks(eventNotifyEmailBlocksCopy);
    };

    const removeSubscriberAuthorizedDelegateBlock = (targetIndex: number) => {
        // if (subscriberAuthorizedDelegateBlocks.length <= 1) {
        //     toast.error('Must have at least one Subscribers Authorized Delegate Contact block.');
        //     return;
        // }

        const subscriberAuthorizedDelegateBlocksCopy = [
            ...subscriberAuthorizedDelegateBlocks,
        ];
        subscriberAuthorizedDelegateBlocksCopy.splice(targetIndex, 1);
        setSubscriberAuthorizedDelegateBlocks(
            subscriberAuthorizedDelegateBlocksCopy
        );

        if (activeSubSection.subscriber_authorized_delegates === targetIndex) {
            setActiveSubSection((prev) => ({
                ...prev,
                ['subscriber_authorized_delegates']: targetIndex,
            }));
        }
    };

    const removeSOSNotificationRecipientsBlock = (targetIndex: number) => {
        if (sosNotificationReceipientsBlocks.length <= 1) {
            toast.error(
                'Must have at least one SOS Notification Recipients Contact block.'
            );
            return;
        }

        const sosNotificationReceipientsBlocksCopy = [
            ...sosNotificationReceipientsBlocks,
        ];
        sosNotificationReceipientsBlocksCopy.splice(targetIndex, 1);
        setSosNotificationReceipientsBlocks(
            sosNotificationReceipientsBlocksCopy
        );

        if (activeSubSection.sos_notification_recipients === targetIndex) {
            setActiveSubSection((prev) => ({
                ...prev,
                ['sos_notification_recipients']: targetIndex,
            }));
        }
    };

    const removeReportEmailBlock = (targetIndex: number) => {
        const reportEmailBlocksCopy = [...reportEmailBlocks];
        reportEmailBlocksCopy.splice(targetIndex, 1);
        setReportEmailBlocks(reportEmailBlocksCopy);
    };

    const toggleSection = (id: number) => {
        setActiveSection((prev) => (prev === id ? null : id));
    };

    const toggleSubSection = (key: SubSectionKey, id: number) => {
        setActiveSubSection((prev) => ({
            ...prev,
            [key]: prev[key] === id ? null : id,
        }));
    };

    const removeObjectsWithAllEmptyValues = <T extends Record<string, any>>(
        array: T[]
    ): T[] => {
        return array
            .map((obj) => {
                const newObj = { ...obj } as T & {
                    primary_phone?: string;
                    secondary_phone?: string;
                };

                // Remove all values except digits
                if (newObj.primary_phone) {
                    newObj.primary_phone = newObj.primary_phone.replace(
                        /\D/g,
                        ''
                    );
                }
                if (newObj.secondary_phone) {
                    newObj.secondary_phone = newObj.secondary_phone.replace(
                        /\D/g,
                        ''
                    );
                }

                return newObj;
            })
            .filter((obj) =>
                Object.values(obj).some((val) => {
                    if (typeof val === 'string') return val.trim() !== '';
                    if (Array.isArray(val)) return val.length > 0;
                    return val !== null && val !== undefined;
                })
            );

        // const isEmpty = (val: any): boolean => {
        //     if (val === null || val === undefined) return true;
        //     if (typeof val === 'string') return val.trim() === '';
        //     if (Array.isArray(val)) return val.length === 0;
        //     if (typeof val === 'object')
        //         return Object.values(val).every(isEmpty);
        //     return false;
        // };

        // return array.filter((obj) => !isEmpty(obj));
    };

    // // Deep comparison helper
    // const isEqual = (a: any, b: any): boolean => {
    //     if (typeof a !== typeof b) return false;

    //     // console.log(a);
    //     // if (typeof a === 'string') return a.trim() === b.trim();
    //     if (typeof a !== 'object' || a === null || b === null) {
    //         return a === b;
    //     }

    //     if (typeof a === 'object') {
    //         const aKeys = Object.keys(a);
    //         const bKeys = Object.keys(b);
    //         if (aKeys.length !== bKeys.length) return false;

    //         return aKeys.every((key) => isEqual(a[key], b[key]));
    //     }
    //     return false;

    //     if (obj === null || obj === undefined) return true;

    // if (typeof obj === 'string') return obj.trim() === '';

    // if (typeof obj === 'boolean') {
    //   // ignore boolean differences — they don’t make an object “non-empty”
    //   return true;
    // }

    // if (Array.isArray(obj)) return obj.length === 0;

    // if (typeof obj === 'object') {
    //   const keys = Object.keys(obj);
    //   return keys.every((key) => isEffectivelyEmpty(obj[key], ref?.[key]));
    // }

    // return false;
    // };

    // // Removes objects that match defaultObject exactly
    // const removeDefaultObjects = <T extends Record<string, any>>(
    //     array: T[],
    //     defaultObj: T
    // ): T[] => {
    //     return array.filter((obj) => !isEqual(obj, defaultObj));
    // };

    // To clean phone numbers deeply
    const normalizePhones = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;

        const newObj: any = Array.isArray(obj) ? [] : {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                newObj[key] = normalizePhones(value);
            } else if (key === 'phone' && typeof value === 'string') {
                newObj[key] = value.replace(/\D/g, '');
            } else {
                newObj[key] = value;
            }
        }

        return newObj;
    };

    // const removeDefaultObjects = <T extends Record<string, any>>(
    //     array: T[],
    //     defaultObj: T
    // ): T[] => {
    //     // To check if all string fields (deeply) are empty
    //     const allStringsEmpty = (obj: any): boolean => {
    //         if (typeof obj === 'string') return obj.trim() === '';
    //         if (typeof obj === 'boolean' || obj === null) return true;

    //         if (typeof obj === 'object' && obj !== null)
    //             return Object.values(obj).every(allStringsEmpty);

    //         return true;
    //     };

    //     // Deep comparison with conditional boolean check
    //     const isEffectivelySame = (
    //         obj: any,
    //         ref: any,
    //         ignoreBooleans: boolean
    //     ): boolean => {
    //         if (typeof obj !== typeof ref) return false;

    //         if (typeof obj === 'string') return obj.trim() === ref.trim();
    //         if (typeof obj === 'boolean')
    //             return ignoreBooleans ? true : obj === ref;

    //         if (typeof obj === 'object' && obj !== null) {
    //             const keys = Object.keys(ref);
    //             return keys.every((key) =>
    //                 isEffectivelySame(obj[key], ref[key], ignoreBooleans)
    //             );
    //         }
    //         return obj === ref;
    //     };

    //     return array
    //         .map((obj) => normalizePhones(obj))
    //         .filter((obj) => {
    //             const shouldIgnoreBooleans = allStringsEmpty(obj);
    //             return !isEffectivelySame(
    //                 obj,
    //                 defaultObj,
    //                 shouldIgnoreBooleans
    //             );
    //         });
    // };

    const removeDefaultObjects = <T extends Record<string, any>>(
        array: T[],
        defaultObj: T,
        shouldIgnoreBooleans: boolean = false
    ): T[] => {
        // Deep comparison with conditional boolean check
        const isEffectivelySame = (obj: any, ref: any): boolean => {
            if (typeof obj !== typeof ref) return false;

            if (typeof obj === 'string') return obj.trim() === ref.trim();

            if (typeof obj === 'boolean')
                return shouldIgnoreBooleans ? true : obj === ref;

            if (typeof obj === 'object' && obj !== null) {
                const keys = Object.keys(ref);

                return keys.every((key) =>
                    isEffectivelySame(obj[key], ref[key])
                );
            }
            return obj === ref;
        };

        return array
            .map((obj) => normalizePhones(obj))
            .filter((obj) => {
                return !isEffectivelySame(obj, defaultObj);
            });
    };

    // const isValidObjects = (arr: Record<string, any>[]): boolean => {
    //     // Must contain at least one object
    //     if (arr.length === 0) return false;

    //     return arr.every((obj) => {
    //         const values = Object.values(obj);

    //         const filledCount = values.filter((val) => {
    //             if (Array.isArray(val)) {
    //                 return val.length > 0;
    //             }

    //             return val !== null && val !== '';
    //         }).length;

    //         // Valid only if all fields are filled
    //         return filledCount === values.length;
    //     });
    // };

    const onInputTextChange = (
        key: keyof IAPISubscriberFactSheet,
        value: string,
        type: string
    ) => {
        if (type == 'number') {
            // Allow digits only
            let formattedZip = value.replace(/\D/g, '');

            if (formattedZip.length > 5) {
                formattedZip = `${formattedZip.slice(
                    0,
                    5
                )}-${formattedZip.slice(5)}`;
            }

            setSubscriberFactSheetData({
                ...subscriberFactSheetData,
                [key]: formattedZip,
            });
        } else {
            if (key === 'alarm_permit_number') {
                // Allow only Alpha-numeric (letters and numbers) characters
                if (/^[a-zA-Z0-9]*$/.test(value)) {
                    setSubscriberFactSheetData({
                        ...subscriberFactSheetData,
                        [key]: value,
                    });
                }
            } else {
                setSubscriberFactSheetData({
                    ...subscriberFactSheetData,
                    [key]: value,
                });
            }
        }
    };

    const handleBlur = (key: keyof IAPISubscriberFactSheet, value: string) => {
        const trimmedValue = value.replace(/\s+/g, ' ').trim();

        if (value !== trimmedValue) {
            setSubscriberFactSheetData({
                ...subscriberFactSheetData,
                [key]: trimmedValue,
            });
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;

        setDailyReport((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const isValidEmail = (email: string): boolean => {
        return /^[a-zA-Z0-9.\-+_]{2,}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(
            email
        );
    };

    const handleBlockValueChange = <
        T extends
            | IPostDispatchContacts
            | ISubscriberAuthorizedDelegateContact
            | ICameraDetails
            | IAudioHornDetails
            | ISOSNotificationContacts
    >(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        if (
            (key === 'phone' ||
                key === 'primary_phone' ||
                key === 'secondary_phone') &&
            !/^\d*$/.test(newValue)
        ) {
            return;
        }

        if (key === 'passcode' && !/^[a-zA-Z0-9]*$/.test(newValue)) {
            return;
        }

        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]: newValue,
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const handleBlockFieldBlur = <
        T extends
            | IPostDispatchContacts
            | ISubscriberAuthorizedDelegateContact
            | ICameraDetails
            | IAudioHornDetails
            | ISOSNotificationContacts
    >(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]:
                          key === 'phone' ||
                          key === 'primary_phone' ||
                          key === 'secondary_phone'
                              ? convertPhoneNumberToFormattedVersion(newValue)
                              : newValue.replace(/\s+/g, ' ').trim(),
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const handleBlockFieldFocus = <
        T extends
            | ISubscriberAuthorizedDelegateContact
            | ISOSNotificationContacts
    >(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]: newValue.replace(/\D/g, ''),
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const handlePostDispatchBlockPhoneValueChange = <
        T extends IPostDispatchContacts
    >(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        if (!/^\d*$/.test(newValue)) {
            return;
        }

        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]: {
                          ...block[key],
                          phone: newValue,
                      },
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const handlePostDispatchBlockPhoneFieldBlur = <
        T extends IPostDispatchContacts
    >(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]: {
                          ...block[key],
                          phone: convertPhoneNumberToFormattedVersion(newValue),
                      },
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const handlePostDispatchBlockPhoneFieldFocus = <
        T extends IPostDispatchContacts
    >(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]: {
                          ...block[key],
                          phone: newValue.replace(/\D/g, ''),
                      },
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const handlePhoneNotificationTypeChange = <T extends IPostDispatchContacts>(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]: {
                          ...block[key],
                          text: newValue === 'TXT' ? true : false,
                          call: newValue === 'Call' ? true : false,
                      },
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const handleSOSSelectPartyChange = <T extends ISOSNotificationContacts>(
        index: number,
        isChecked: boolean,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ) => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      call: false,
                      is_from_party: isChecked,
                      name: '',
                      party_id: 0,
                      phone: '',
                      text: true,
                  }
                : {
                      ...block,
                  }
        );
        setDataBlocks(updatedBlocks);
    };

    const handleSOSPartyChange = <T extends ISOSNotificationContacts>(
        index: number,
        partyNumber: number,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ) => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      party_id: partyNumber,
                      name: postDispatchContactBlocks[partyNumber - 1]?.name,
                      phone: postDispatchContactBlocks[partyNumber - 1]
                          ?.primary_phone.phone,
                      text: postDispatchContactBlocks[partyNumber - 1]
                          ?.primary_phone.text,
                      call: postDispatchContactBlocks[partyNumber - 1]
                          ?.primary_phone.call,
                  }
                : {
                      ...block,
                  }
        );

        setDataBlocks(updatedBlocks);
    };

    const handleSOSNotificationTypeChange = <
        T extends ISOSNotificationContacts
    >(
        index: number,
        newValue: any,
        setDataBlocks: Dispatch<SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      text: newValue === 'TXT' ? true : false,
                      call: newValue === 'Call' ? true : false,
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const verifySubscriberFactSheetInfo = () => {
        const requiredFieldsForSubscriber: (keyof typeof subscriberFactSheetData)[] =
            [
                'subscriber_account_type',
                'video_system_types',
                'business_name',
                'address',
                'suite_number',
                'city',
                'state',
                'zip',
                'customer_name',
                'customer_email',
                'customer_cell',
                'location_phone_primary',
                'subdivision',
                'cross_street',
                'alarm_permit_number',
                'police_department',
                'fire_department',
                'ems_service',
                'guard_service',
            ];

        let isRequiredFieldFilled = true;

        // Validate required fields
        for (const key of requiredFieldsForSubscriber) {
            const value = subscriberFactSheetData[key] as any;
            if (key === 'subscriber_account_type') {
                if (typeof value === 'string' && !value.trim()) {
                    isRequiredFieldFilled = false;
                }
            } else if (key === 'video_system_types') {
                if (value.length === 0) {
                    isRequiredFieldFilled = false;
                }
            } else if (key === 'zip') {
                if (
                    !value.replace(/\D/g, '').trim() ||
                    value.replace(/\D/g, '').trim().length < 5
                ) {
                    isRequiredFieldFilled = false;
                }
            } else if (key === 'customer_cell') {
                if (
                    !customerCellNumber?.replace(/\D/g, '').trim() ||
                    customerCellNumber?.replace(/\D/g, '').trim().length < 10
                ) {
                    isRequiredFieldFilled = false;
                }
            } else if (key === 'location_phone_primary') {
                if (
                    !locationPhoneNumber?.replace(/\D/g, '').trim() ||
                    locationPhoneNumber?.replace(/\D/g, '').trim().length < 10
                ) {
                    isRequiredFieldFilled = false;
                }
            }
            // else if (
            //     key === 'customer_cell' ||
            //     key === 'location_phone_primary' ||
            //     key === 'location_phone_secondary'
            // ) {
            //     if (!value.trim() || value.trim().length < 10) {
            //         isRequiredFieldFilled = false;
            //     }
            // }
            else if (key === 'customer_email') {
                if (!value.trim() || !isValidEmail(value.trim())) {
                    isRequiredFieldFilled = false;
                }
            } else if (key === 'police_department') {
                if (
                    !('name' in policeDepartmentBlocks) ||
                    !policeDepartmentBlocks.name?.trim() ||
                    !('phone' in policeDepartmentBlocks) ||
                    !policeDepartmentBlocks.phone?.replace(/\D/g, '').trim() ||
                    policeDepartmentBlocks.phone?.replace(/\D/g, '').trim()
                        .length < 10
                ) {
                    isRequiredFieldFilled = false;
                }
            } else if (key === 'fire_department') {
                if (
                    !('name' in fireDepartmentBlocks) ||
                    !fireDepartmentBlocks.name?.trim() ||
                    !('phone' in fireDepartmentBlocks) ||
                    !fireDepartmentBlocks.phone?.replace(/\D/g, '').trim() ||
                    fireDepartmentBlocks.phone?.replace(/\D/g, '').trim()
                        .length < 10
                ) {
                    isRequiredFieldFilled = false;
                }
            } else if (key === 'ems_service') {
                if (
                    !('name' in emsServiceBlocks) ||
                    !emsServiceBlocks.name?.trim() ||
                    !('phone' in emsServiceBlocks) ||
                    !emsServiceBlocks.phone?.replace(/\D/g, '').trim() ||
                    emsServiceBlocks.phone?.replace(/\D/g, '').trim().length <
                        10
                ) {
                    isRequiredFieldFilled = false;
                }
            } else if (key === 'guard_service') {
                if (
                    !('name' in guardServiceBlocks) ||
                    !guardServiceBlocks.name?.trim() ||
                    !('phone' in guardServiceBlocks) ||
                    !guardServiceBlocks.phone?.replace(/\D/g, '').trim() ||
                    guardServiceBlocks.phone?.replace(/\D/g, '').trim().length <
                        10
                ) {
                    isRequiredFieldFilled = false;
                }
            }
            // else if (
            //     key === 'police_department' ||
            //     key === 'fire_department' ||
            //     key === 'ems_service' ||
            //     key === 'guard_service'
            // ) {
            //     if (
            //         !('name' in value) ||
            //         !value.name.trim() ||
            //         !('phone' in value) ||
            //         value.phone.trim().length < 10
            //     ) {
            //         isRequiredFieldFilled = false;
            //     }
            // }
            else if (typeof value === 'string' && !value.trim()) {
                isRequiredFieldFilled = false;
            }
        }

        setIsSubscriberInfoVerified(isRequiredFieldFilled);
    };

    const verifyPostDispatchContacts = (): boolean => {
        let isRequiredFieldFilled = true;

        const postDispatchContactEmptyDataRemoved = removeDefaultObjects(
            postDispatchContactBlocks,
            defaultPostDispatchContacts,
            true
        );

        if (postDispatchContactEmptyDataRemoved.length != 0) {
            for (
                let i = 0;
                i < postDispatchContactEmptyDataRemoved.length;
                i++
            ) {
                const block = postDispatchContactEmptyDataRemoved[i];

                const name = block.name?.trim();

                if (!name) {
                    isRequiredFieldFilled = false;
                    break;
                }

                const passcode = block.passcode?.trim();

                if (!passcode || (passcode && passcode.length < 8)) {
                    isRequiredFieldFilled = false;
                    break;
                }

                const primaryPhone = block.primary_phone.phone?.trim();

                if (
                    !primaryPhone ||
                    (primaryPhone && primaryPhone.length < 10)
                ) {
                    isRequiredFieldFilled = false;
                    break;
                }

                const secondaryPhone = block.secondary_phone.phone?.trim();

                if (
                    !secondaryPhone ||
                    (secondaryPhone && secondaryPhone.length < 10)
                ) {
                    isRequiredFieldFilled = false;
                    break;
                }
            }
        } else {
            isRequiredFieldFilled = false;
        }

        for (let i = 0; i < eventNotifyEmailBlocks.length; i++) {
            const block = eventNotifyEmailBlocks[i];
            const email = block.trim();

            if (block.trim() && !isValidEmail(email)) {
                isRequiredFieldFilled = false;
                break;
            }
        }

        setIsPostDispatchContactsVerified(isRequiredFieldFilled);

        return isRequiredFieldFilled;
    };

    const verifySubscriberAuthorizedContacts = (): boolean => {
        let isRequiredFieldFilled = true;

        const subscribersAuthorizedDelegateEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(subscriberAuthorizedDelegateBlocks);

        for (
            let i = 0;
            i < subscribersAuthorizedDelegateEmptyDataRemoved.length;
            i++
        ) {
            const block = subscribersAuthorizedDelegateEmptyDataRemoved[i];

            if (!block.name?.trim()) {
                isRequiredFieldFilled = false;
                break;
            }

            const passcode = block.passcode?.trim();

            if (!passcode || (passcode && passcode.length < 8)) {
                isRequiredFieldFilled = false;
                break;
            }

            const primaryPhone = block.primary_phone?.trim();

            if (!primaryPhone || (primaryPhone && primaryPhone.length < 10)) {
                isRequiredFieldFilled = false;
                break;
            }

            const secondaryPhone = block.secondary_phone?.trim();

            if (
                !secondaryPhone ||
                (secondaryPhone && secondaryPhone.length < 10)
            ) {
                isRequiredFieldFilled = false;
                break;
            }
        }

        setIsSubscriberAuthorizedDelegateVerified(isRequiredFieldFilled);

        return isRequiredFieldFilled;
    };

    const verifySOSActionPlanContacts = (): boolean => {
        let isRequiredFieldFilled = true;

        const sosNotificationReceipientsEmptyDataRemoved = removeDefaultObjects(
            sosNotificationReceipientsBlocks,
            defaultSOSNotificationReceipients,
            false
        );

        if (sosNotificationReceipientsEmptyDataRemoved.length != 0) {
            for (
                let i = 0;
                i < sosNotificationReceipientsEmptyDataRemoved.length;
                i++
            ) {
                const block = sosNotificationReceipientsEmptyDataRemoved[i];

                if (!block.name?.trim()) {
                    isRequiredFieldFilled = false;
                    break;
                }

                const mobileNumber = block.phone?.trim();

                if (
                    !mobileNumber ||
                    (mobileNumber && mobileNumber.length < 10)
                ) {
                    isRequiredFieldFilled = false;
                    break;
                }
            }
        } else {
            isRequiredFieldFilled = false;
        }

        setIsSOSActionPlanVerified(isRequiredFieldFilled);

        return isRequiredFieldFilled;
    };

    const verifyReportSetupInfo = () => {
        let isRequiredFieldFilled = true;

        const reportEmailEmptyDataRamoved = reportEmailBlocks.filter(
            (val) => val.trim() !== ''
        );

        for (let i = 0; i < reportEmailEmptyDataRamoved.length; i++) {
            const block = reportEmailEmptyDataRamoved[i];
            const email = block.trim();

            if (block.trim() && !isValidEmail(email)) {
                isRequiredFieldFilled = false;
                break;
            }
        }

        setIsReportSetupVerified(isRequiredFieldFilled);
    };

    const verifyDealerTechSupportInfo = () => {
        let isRequiredFieldFilled = true;

        // Validate required fields
        if (
            !dealerTechSupportPhoneNumber?.replace(/\D/g, '').trim() ||
            (dealerTechSupportPhoneNumber?.replace(/\D/g, '').trim() &&
                dealerTechSupportPhoneNumber.replace(/\D/g, '').trim().length <
                    10)
        ) {
            isRequiredFieldFilled = false;
        } else if (
            !subscriberFactSheetData.dealer_tech_support_email?.trim() ||
            (subscriberFactSheetData.dealer_tech_support_email?.trim() &&
                !isValidEmail(
                    subscriberFactSheetData.dealer_tech_support_email?.trim()
                ))
        ) {
            isRequiredFieldFilled = false;
        }

        setIsDealerTechSupportVerified(isRequiredFieldFilled);
    };

    // Progress Bar
    const updateProgress = () => {
        let filledRequiredFields = 0;

        // Validate required fields
        for (const key of requiredFields) {
            const value = subscriberFactSheetData[key] as any;

            if (key === 'subscriber_account_type') {
                if (typeof value === 'string' && value.trim()) {
                    filledRequiredFields += 1;
                }
            } else if (key === 'video_system_types') {
                if (value.length !== 0) {
                    filledRequiredFields += 1;
                }
            } else if (key === 'zip') {
                if (
                    typeof value === 'string' &&
                    value.replace(/\D/g, '').trim() &&
                    value.replace(/\D/g, '').trim().length >= 5
                ) {
                    filledRequiredFields += 1;
                }
            } else if (key === 'customer_cell') {
                if (
                    customerCellNumber?.replace(/\D/g, '').trim() &&
                    customerCellNumber?.replace(/\D/g, '').trim().length >= 10
                ) {
                    filledRequiredFields += 1;
                }
            } else if (key === 'location_phone_primary') {
                if (
                    locationPhoneNumber?.replace(/\D/g, '').trim() &&
                    locationPhoneNumber?.replace(/\D/g, '').trim().length >= 10
                ) {
                    filledRequiredFields += 1;
                }
            } else if (key === 'dealer_tech_support_phone') {
                if (
                    dealerTechSupportPhoneNumber?.replace(/\D/g, '').trim() &&
                    dealerTechSupportPhoneNumber?.replace(/\D/g, '').trim()
                        .length >= 10
                ) {
                    filledRequiredFields += 1;
                }
            }
            // else if (
            //     key === 'customer_cell' ||
            //     key === 'location_phone_primary' ||
            //     key === 'location_phone_secondary' ||
            //     key === 'dealer_tech_support_phone'
            // ) {
            //     if (
            //         typeof value === 'string' &&
            //         value.trim() &&
            //         value.trim().length >= 10
            //     ) {
            //         filledRequiredFields += 1;
            //     }
            // }
            else if (
                key === 'customer_email' ||
                key === 'dealer_tech_support_email'
            ) {
                if (
                    typeof value === 'string' &&
                    value.trim() &&
                    isValidEmail(value.trim())
                ) {
                    filledRequiredFields += 1;
                }
            } else if (typeof value === 'string' && value.trim()) {
                filledRequiredFields += 1;
            } else if (key === 'police_department') {
                if (
                    'name' in policeDepartmentBlocks &&
                    policeDepartmentBlocks.name?.trim() &&
                    'phone' in policeDepartmentBlocks &&
                    policeDepartmentBlocks.phone?.replace(/\D/g, '').trim() &&
                    policeDepartmentBlocks.phone?.replace(/\D/g, '').trim()
                        .length >= 10
                ) {
                    filledRequiredFields += 1;
                }
            } else if (key === 'fire_department') {
                if (
                    'name' in fireDepartmentBlocks &&
                    fireDepartmentBlocks.name?.trim() &&
                    'phone' in fireDepartmentBlocks &&
                    fireDepartmentBlocks.phone?.replace(/\D/g, '').trim() &&
                    fireDepartmentBlocks.phone?.replace(/\D/g, '').trim()
                        .length >= 10
                ) {
                    filledRequiredFields += 1;
                }
            } else if (key === 'ems_service') {
                if (
                    'name' in emsServiceBlocks &&
                    emsServiceBlocks.name?.trim() &&
                    'phone' in emsServiceBlocks &&
                    emsServiceBlocks.phone?.replace(/\D/g, '').trim() &&
                    emsServiceBlocks.phone?.replace(/\D/g, '').trim().length >=
                        10
                ) {
                    filledRequiredFields += 1;
                }
            } else if (key === 'guard_service') {
                if (
                    'name' in guardServiceBlocks &&
                    guardServiceBlocks.name?.trim() &&
                    'phone' in guardServiceBlocks &&
                    guardServiceBlocks.phone?.replace(/\D/g, '').trim() &&
                    guardServiceBlocks.phone?.replace(/\D/g, '').trim()
                        .length >= 10
                ) {
                    filledRequiredFields += 1;
                }
            }
            // else if (
            //     key === 'police_department' ||
            //     key === 'fire_department' ||
            //     key === 'ems_service' ||
            //     key === 'guard_service'
            // ) {
            //     if (
            //         'name' in value &&
            //         value.name.trim() &&
            //         'phone' in value &&
            //         value.phone.trim() &&
            //         value.phone.trim().length >= 10
            //     ) {
            //         filledRequiredFields += 1;
            //     }
            // }
            else if (key === 'post_dispatch_contacts') {
                const isRequiredFieldFilled = verifyPostDispatchContacts();

                if (isRequiredFieldFilled) filledRequiredFields += 1;
            } else if (key === 'sos_action_plan') {
                const isRequiredFieldFilled = verifySOSActionPlanContacts();

                if (isRequiredFieldFilled) filledRequiredFields += 1;
            }
        }

        const progressPercentage = Math.round(
            (filledRequiredFields / requiredFields.length) * 100
        );

        setProgressStatus(progressPercentage);
    };

    const validateSubscriberInformation = (requestFrom: string): boolean => {
        const errors: SubscriberFactSheetErrors = {};

        if (requestFrom === 'Submit') {
            if (!subscriberAccountType?.trim())
                errors.subscriber_account_type =
                    'Please select any 1 Account Type!';

            if (subscriberFactSheetData.video_system_types.length === 0)
                errors.video_system_types =
                    'Please select any 1 Video System Type!';

            if (!subscriberFactSheetData.business_name?.trim())
                errors.business_name = 'Please fill the Business Name!';

            if (!subscriberFactSheetData.address?.trim())
                errors.address = 'Please fill the Address!';

            if (!subscriberFactSheetData.suite_number?.trim())
                errors.suite_number = 'Please fill the Suite Number!';

            if (!subscriberFactSheetData.city?.trim())
                errors.city = 'Please fill the City!';

            if (!subscriberFactSheetData.state?.trim())
                errors.state = 'Please fill the State!';

            if (!subscriberFactSheetData.zip?.trim())
                errors.zip = 'Please fill the Zip!';

            if (!subscriberFactSheetData.customer_name?.trim())
                errors.customer_name = 'Please fill the Customer Name!';

            if (!subscriberFactSheetData.customer_email?.trim())
                errors.customer_email = 'Please fill the Customer Email!';

            if (!customerCellNumber?.trim())
                errors.customer_cell = 'Please fill the Customer Cell!';

            if (!locationPhoneNumber?.trim())
                errors.location_phone_primary =
                    'Please fill the Location Phone Number!';

            if (!subscriberFactSheetData.subdivision?.trim())
                errors.subdivision = 'Please fill the Subdivision!';

            if (!subscriberFactSheetData.cross_street?.trim())
                errors.cross_street = 'Please fill the Cross Street!';

            if (!subscriberFactSheetData.alarm_permit_number?.trim())
                errors.alarm_permit_number =
                    'Please fill the Permit Number / Information!';

            if (!policeDepartmentBlocks.name?.trim())
                errors.police_department = 'Please fill the Police Department!';

            if (!policeDepartmentBlocks.phone?.trim())
                errors.police_department =
                    'Please fill the Police Department Phone!';

            if (!fireDepartmentBlocks.name?.trim())
                errors.fire_department = 'Please fill the Fire Department!';

            if (!fireDepartmentBlocks.phone?.trim())
                errors.fire_department =
                    'Please fill the Fire Department Phone!';

            if (!emsServiceBlocks.name?.trim())
                errors.ems_service = 'Please fill the EMS Service!';

            if (!emsServiceBlocks.phone?.trim())
                errors.ems_service = 'Please fill the EMS Service Phone!';

            if (!guardServiceBlocks.name?.trim())
                errors.guard_service = 'Please fill the Guard Service!';

            if (!guardServiceBlocks.phone?.trim())
                errors.guard_service = 'Please fill the Guard Service Phone!';
        }

        if (
            subscriberFactSheetData.zip?.trim() &&
            subscriberFactSheetData.zip?.trim().length < 5
        ) {
            errors.zip = 'Invalid Zip (must contain 5 numbers)!';
        }

        if (
            subscriberFactSheetData.customer_email?.trim() &&
            !isValidEmail(subscriberFactSheetData.customer_email?.trim())
        ) {
            errors.customer_email = 'Invalid Customer Email!';
        }

        if (
            customerCellNumber?.trim() &&
            customerCellNumber?.trim().length < 10
        ) {
            errors.customer_cell =
                'Invalid Customer Cell (must contain 10 numbers)!';
        }

        if (
            locationPhoneNumber?.trim() &&
            locationPhoneNumber?.trim().length < 10
        ) {
            errors.location_phone_primary =
                'Invalid Location Phone Number (must contain 10 numbers)!';
        }

        if (
            locationAltNumber?.trim() &&
            locationAltNumber?.trim().length < 10
        ) {
            errors.location_phone_secondary =
                'Invalid Location Alt Phone Number (must contain 10 numbers)!';
        }

        if (
            policeDepartmentBlocks.phone?.trim() &&
            policeDepartmentBlocks.phone?.trim().length < 10
        ) {
            errors.police_department =
                'Invalid Police Department Phone Number (must contain 10 numbers)!';
        }

        if (
            fireDepartmentBlocks.phone?.trim() &&
            fireDepartmentBlocks.phone?.trim().length < 10
        ) {
            errors.fire_department =
                'Invalid Fire Department Phone Number (must contain 10 numbers)!';
        }

        if (
            emsServiceBlocks.phone?.trim() &&
            emsServiceBlocks.phone?.trim().length < 10
        ) {
            errors.ems_service =
                'Invalid EMS Service Phone Number (must contain 10 numbers)!';
        }

        if (
            guardServiceBlocks.phone?.trim() &&
            guardServiceBlocks.phone?.trim().length < 10
        ) {
            errors.guard_service =
                'Invalid Guard Service Phone Number (must contain 10 numbers)!';
        }

        setErrorMessage(errors);

        if (Object.keys(errors).length !== 0) {
            if (activeSection !== 1) toggleSection(1);
            return false;
        }

        return true;
    };

    const validatePostDispatchContacts = (requestFrom: string): boolean => {
        const errors: SubscriberFactSheetErrors = {};

        if (!errors.post_dispatch_contacts) errors.post_dispatch_contacts = [];
        const postDispatchErrors = errors.post_dispatch_contacts;

        if (!errors.event_notification_emails)
            errors.event_notification_emails = [];
        const eventNotifyEmailErrors = errors.event_notification_emails;

        // const postDispatchContactEmptyDataRemoved =
        //     removeObjectsWithAllEmptyValues(postDispatchContactBlocks);
        const postDispatchContactEmptyDataRemoved = removeDefaultObjects(
            postDispatchContactBlocks,
            defaultPostDispatchContacts,
            true
        );

        if (requestFrom === 'Submit') {
            // if (!isValidObjects(postDispatchContactEmptyDataRemoved)) {
            //     postDispatchErrors[0] =
            //         'Please fill the Post-Dispatch Party details!';
            // }

            if (postDispatchContactEmptyDataRemoved.length !== 0) {
                for (
                    let i = 0;
                    i < postDispatchContactEmptyDataRemoved.length;
                    i++
                ) {
                    const block = postDispatchContactEmptyDataRemoved[i];

                    if (
                        block.name?.trim() === '' ||
                        block.passcode?.trim() === '' ||
                        block.primary_phone.phone?.trim() === '' ||
                        block.secondary_phone.phone?.trim() === ''
                    ) {
                        postDispatchErrors[i] =
                            'Please fill the Post-Dispatch Party details!';
                    }
                }
            } else {
                postDispatchErrors[0] =
                    'Please fill in at least one Post-Dispatch Party detail!';
            }
        }

        for (let i = 0; i < postDispatchContactEmptyDataRemoved.length; i++) {
            const block = postDispatchContactEmptyDataRemoved[i];

            const passcode = block.passcode?.trim();

            if (passcode && passcode.length < 8) {
                postDispatchErrors[i] =
                    'Invalid Passcode (must contain 8 characters)!';
            }

            const primaryPhone = block.primary_phone.phone?.trim();

            if (primaryPhone && primaryPhone.length < 10) {
                postDispatchErrors[i] =
                    'Invalid Primary Phone number (must contain 10 characters)!';
            }

            const secondaryPhone = block.secondary_phone.phone?.trim();

            if (secondaryPhone && secondaryPhone.length < 10) {
                postDispatchErrors[i] =
                    'Invalid Secondary Phone number (must contain 10 characters)!';
            }
        }

        // const eventNotifyEmailEmptyDataRamoved = eventNotifyEmailBlocks.filter(
        //     (val) => val.trim() !== ''
        // );

        for (let i = 0; i < eventNotifyEmailBlocks.length; i++) {
            const block = eventNotifyEmailBlocks[i];
            const email = block.trim();

            if (block.trim() && !isValidEmail(email)) {
                eventNotifyEmailErrors[i] = 'Invalid Email address!';
            }
        }

        setErrorMessage(errors);

        if (
            postDispatchErrors.length !== 0 ||
            eventNotifyEmailErrors.length !== 0
        ) {
            if (activeSection !== 2) toggleSection(2);
            return false;
        }

        return true;
    };

    const validateSubscribersAuthorizedDelegate = (
        requestFrom: string
    ): boolean => {
        const errors: SubscriberFactSheetErrors = {};

        if (!errors.subscriber_authorized_delegates)
            errors.subscriber_authorized_delegates = [];
        const subscriberAuthorizedErrors =
            errors.subscriber_authorized_delegates;

        // const subscribersAuthorizedDelegateEmptyDataRemoved =
        //     removeObjectsWithAllEmptyValues(subscriberAuthorizedDelegateBlocks);

        for (let i = 0; i < subscriberAuthorizedDelegateBlocks.length; i++) {
            const block = subscriberAuthorizedDelegateBlocks[i];

            const passcode = block.passcode?.trim();

            if (passcode && passcode.length < 8) {
                subscriberAuthorizedErrors[i] =
                    'Invalid Passcode (must contain 8 characters)!';
            }

            const primaryPhone = block.primary_phone?.trim();

            if (primaryPhone && primaryPhone.length < 10) {
                subscriberAuthorizedErrors[i] =
                    'Invalid Primary Phone number (must contain 10 characters)!';
            }

            const secondaryPhone = block.secondary_phone?.trim();

            if (secondaryPhone && secondaryPhone.length < 10) {
                subscriberAuthorizedErrors[i] =
                    'Invalid Secondary Phone number (must contain 10 characters)!';
            }
        }

        setErrorMessage(errors);

        if (subscriberAuthorizedErrors.length !== 0) {
            if (activeSection !== 3) toggleSection(3);
            return false;
        }

        return true;
    };

    // const validateVideoCameraDetails = (requestFrom: string): boolean => {
    //     const errors: SubscriberFactSheetErrors = {};

    //     setErrorMessage(errors);

    //     if (Object.keys(errors).length !== 0) {
    //         if (activeSection !== 4) toggleSection(4);
    //         return false;
    //     }

    //     return true;
    // };

    // const validateAudioHornDetails = (requestFrom: string): boolean => {
    //     const errors: SubscriberFactSheetErrors = {};

    //     setErrorMessage(errors);

    //     if (Object.keys(errors).length !== 0) {
    //         if (activeSection !== 5) toggleSection(5);
    //         return false;
    //     }

    //     return true;
    // };

    const validateSOSActionPlan = (requestFrom: string): boolean => {
        const errors: SubscriberFactSheetErrors = {};

        if (!errors.sos_action_plan) errors.sos_action_plan = [];
        const sosNotificationReceipientsErrors = errors.sos_action_plan;

        // const sosNotificationReceipientsEmptyDataRemoved =
        //     removeObjectsWithAllEmptyValues(sosNotificationReceipientsBlocks);
        // const sosNotificationReceipientsEmptyDataRemoved = removeDefaultObjects(
        //     sosNotificationReceipientsBlocks,
        //     defaultSOSNotificationReceipients
        // );

        if (requestFrom === 'Submit') {
            // if (!isValidObjects(sosNotificationReceipientsEmptyDataRemoved)) {
            //     errors.sos_action_plan =
            //         'Please fill the SOS Notification Receipients Contact details!';
            // }

            if (sosNotificationReceipientsBlocks.length !== 0) {
                for (
                    let i = 0;
                    i < sosNotificationReceipientsBlocks.length;
                    i++
                ) {
                    const block = sosNotificationReceipientsBlocks[i];

                    if (block.is_from_party === true && block.party_id === 0) {
                        sosNotificationReceipientsErrors[i] =
                            'Please select the Post-Dispatch Party in the SOS Notification Receipients Contact details!';
                    } else if (
                        block.name?.trim() === '' ||
                        block.phone?.trim() === ''
                    ) {
                        sosNotificationReceipientsErrors[i] =
                            'Please fill the SOS Notification Receipients Contact details!';
                    }
                }
            } else {
                sosNotificationReceipientsErrors[0] =
                    'Please fill the SOS Notification Receipients Contact details!';
            }
        }

        for (let i = 0; i < sosNotificationReceipientsBlocks.length; i++) {
            const block = sosNotificationReceipientsBlocks[i];
            const mobileNumber = block.phone?.trim();

            if (mobileNumber && mobileNumber.length < 10) {
                sosNotificationReceipientsErrors[i] =
                    'Invalid Mobile number (must contain 10 characters)!';
            }
        }

        setErrorMessage(errors);

        if (sosNotificationReceipientsErrors.length !== 0) {
            if (activeSection !== 6) toggleSection(6);
            return false;
        }

        return true;
    };

    const validateReportSetup = (requestFrom: string): boolean => {
        const errors: SubscriberFactSheetErrors = {};

        if (!errors.report_recipient_emails)
            errors.report_recipient_emails = [];

        // const reportEmailEmptyDataRamoved = reportEmailBlocks.filter(
        //     (val) => val.trim() !== ''
        // );

        for (let i = 0; i < reportEmailBlocks.length; i++) {
            const block = reportEmailBlocks[i];
            const email = block.trim();

            if (block.trim() && !isValidEmail(email)) {
                errors.report_recipient_emails[i] = 'Invalid Email address!';
            }
        }

        setErrorMessage(errors);

        if (errors.report_recipient_emails.length !== 0) {
            if (activeSection !== 10) toggleSection(10);
            return false;
        }
        return true;
    };

    const validateDealerTechSupport = (requestFrom: string): boolean => {
        const errors: SubscriberFactSheetErrors = {};

        if (requestFrom === 'Submit') {
            if (!dealerTechSupportPhoneNumber?.trim())
                errors.dealer_tech_support_phone =
                    'Please fill the Dealer Tech Support Phone Number!';

            if (!subscriberFactSheetData.dealer_tech_support_email?.trim())
                errors.dealer_tech_support_email =
                    'Please fill the Dealer Tech Support Email Address!';
        }

        if (
            subscriberFactSheetData.dealer_tech_support_email?.trim() &&
            !isValidEmail(
                subscriberFactSheetData.dealer_tech_support_email?.trim()
            )
        ) {
            errors.dealer_tech_support_email =
                'Invalid Dealer Tech Support Email Address!';
        }

        if (
            dealerTechSupportPhoneNumber?.trim() &&
            dealerTechSupportPhoneNumber?.trim().length < 10
        ) {
            errors.dealer_tech_support_phone =
                'Invalid Dealer Tech Support Phone Number (must contain 10 numbers)!';
        }

        setErrorMessage(errors);

        if (Object.keys(errors).length !== 0) {
            if (activeSection !== 11) toggleSection(11);
            return false;
        }
        return true;
    };

    // const validateAndRemoveEmptyObjects = (): IAPISubscriberFactSheet => {
    //     let updatedSubscriberFactSheetData = { ...subscriberFactSheetData };

    //     if (activeSection === 1) {
    //         const customerPhoneNumberRawDigits = customerCellNumber?.replace(
    //             /\D/g,
    //             ''
    //         );

    //         const locationPhoneNumberRawDigits = locationPhoneNumber?.replace(
    //             /\D/g,
    //             ''
    //         );

    //         const locationAltPhoneNumberRawDigits = locationAltNumber?.replace(
    //             /\D/g,
    //             ''
    //         );

    //         const policeDepartmentContact =
    //             !policeDepartmentBlocks.name?.trim() &&
    //             !policeDepartmentBlocks.phone?.trim()
    //                 ? {}
    //                 : {
    //                       name: policeDepartmentBlocks.name,
    //                       phone: policeDepartmentBlocks.phone?.replace(
    //                           /\D/g,
    //                           ''
    //                       ),
    //                   };

    //         const fireDepartmentContact =
    //             !fireDepartmentBlocks.name?.trim() &&
    //             !fireDepartmentBlocks.phone?.trim()
    //                 ? {}
    //                 : {
    //                       name: fireDepartmentBlocks.name,
    //                       phone: fireDepartmentBlocks.phone?.replace(/\D/g, ''),
    //                   };

    //         const emsServiceContact =
    //             !emsServiceBlocks.name?.trim() &&
    //             !emsServiceBlocks.phone?.trim()
    //                 ? {}
    //                 : {
    //                       name: emsServiceBlocks.name,
    //                       phone: emsServiceBlocks.phone?.replace(/\D/g, ''),
    //                   };

    //         const guardServiceContact =
    //             !guardServiceBlocks.name?.trim() &&
    //             !guardServiceBlocks.phone?.trim()
    //                 ? {}
    //                 : {
    //                       name: guardServiceBlocks.name,
    //                       phone: guardServiceBlocks.phone?.replace(/\D/g, ''),
    //                   };

    //         updatedSubscriberFactSheetData = {
    //             ...updatedSubscriberFactSheetData,
    //             customer_cell: customerPhoneNumberRawDigits,
    //             location_phone_primary: locationPhoneNumberRawDigits,
    //             location_phone_secondary: locationAltPhoneNumberRawDigits,
    //             police_department: policeDepartmentContact,
    //             fire_department: fireDepartmentContact,
    //             ems_service: emsServiceContact,
    //             guard_service: guardServiceContact,
    //         };
    //     }

    //     if (activeSection === 2) {
    //         const postDispatchContactEmptyDataRemoved =
    //             postDispatchContactBlocks.map((obj) => normalizePhones(obj));

    //         const eventNotifyEmailEmptyDataRamoved =
    //             eventNotifyEmailBlocks.filter((val) => val.trim() !== '');

    //         updatedSubscriberFactSheetData = {
    //             ...updatedSubscriberFactSheetData,
    //             post_dispatch_contacts: postDispatchContactEmptyDataRemoved,
    //             event_notification_emails: eventNotifyEmailEmptyDataRamoved,
    //         };
    //     }

    //     if (activeSection === 3) {
    //         const subscriberAuthorizedDelegateEmptyDataRemoved =
    //             removeObjectsWithAllEmptyValues(
    //                 subscriberAuthorizedDelegateBlocks
    //             );

    //         updatedSubscriberFactSheetData = {
    //             ...updatedSubscriberFactSheetData,
    //             subscriber_authorized_delegates:
    //                 subscriberAuthorizedDelegateEmptyDataRemoved,
    //         };
    //     }

    //     if (activeSection === 4) {
    //         const videoCameraDetailsEmptyDataRemoved =
    //             removeObjectsWithAllEmptyValues(videoCameraDetailsBlocks);

    //         updatedSubscriberFactSheetData = {
    //             ...updatedSubscriberFactSheetData,
    //             video_camera_list: videoCameraDetailsEmptyDataRemoved,
    //         };
    //     }

    //     if (activeSection === 5) {
    //         const audioHornDetailsEmptyDataRemoved =
    //             removeObjectsWithAllEmptyValues(audioHornDetailsBlocks);

    //         updatedSubscriberFactSheetData = {
    //             ...updatedSubscriberFactSheetData,
    //             audio_horn_list: audioHornDetailsEmptyDataRemoved,
    //         };
    //     }

    //     if (activeSection === 6) {
    //         const sosNotificationReceipientsEmptyDataRemoved =
    //             removeDefaultObjects(
    //                 sosNotificationReceipientsBlocks,
    //                 defaultSOSNotificationReceipients
    //             );

    //         updatedSubscriberFactSheetData = {
    //             ...updatedSubscriberFactSheetData,
    //             sos_action_plan: {
    //                 ...subscriberFactSheetData.sos_action_plan,
    //                 sos_notification_recipients:
    //                     sosNotificationReceipientsEmptyDataRemoved,
    //             },
    //         };
    //     }

    //     if (activeSection === 10) {
    //         const reportEmailEmptyDataRamoved = reportEmailBlocks.filter(
    //             (val) => val.trim() !== ''
    //         );

    //         updatedSubscriberFactSheetData = {
    //             ...updatedSubscriberFactSheetData,
    //             report_recipient_emails: reportEmailEmptyDataRamoved,
    //         };
    //     }

    //     if (activeSection === 11) {
    //         const dealerTechPhoneNumberRawDigits =
    //             dealerTechSupportPhoneNumber?.replace(/\D/g, '');

    //         updatedSubscriberFactSheetData = {
    //             ...updatedSubscriberFactSheetData,
    //             dealer_tech_support_phone: dealerTechPhoneNumberRawDigits,
    //         };
    //     }

    //     // const updatedSubscriberFactSheetData = {
    //     //     ...subscriberFactSheetData,
    //     //     customer_cell: customerPhoneNumberRawDigits,
    //     //     location_phone_primary: locationPhoneNumberRawDigits,
    //     //     location_phone_secondary: locationAltPhoneNumberRawDigits,
    //     //     police_department: policeDepartmentContact,
    //     //     fire_department: fireDepartmentContact,
    //     //     ems_service: emsServiceContact,
    //     //     guard_service: guardServiceContact,
    //     //     post_dispatch_contacts: postDispatchContactEmptyDataRemoved,
    //     //     event_notification_emails: eventNotifyEmailEmptyDataRamoved,
    //     //     subscriber_authorized_delegates:
    //     //         subscriberAuthorizedDelegateEmptyDataRemoved,
    //     //     video_camera_list: videoCameraDetailsEmptyDataRemoved,
    //     //     audio_horn_list: audioHornDetailsEmptyDataRemoved,
    //     //     sos_action_plan: {
    //     //         ...subscriberFactSheetData.sos_action_plan,
    //     //         sos_notification_recipients:
    //     //             sosNotificationReceipientsEmptyDataRemoved,
    //     //     },
    //     //     report_setup: dailyReport,
    //     //     report_recipient_emails: reportEmailEmptyDataRamoved,
    //     //     dealer_tech_support_phone: dealerTechPhoneNumberRawDigits,
    //     // };

    //     return updatedSubscriberFactSheetData;
    // };

    const validateAndRemoveEmptyObjects = (): IAPISubscriberFactSheet => {
        const customerPhoneNumberRawDigits = customerCellNumber?.replace(
            /\D/g,
            ''
        );

        const locationPhoneNumberRawDigits = locationPhoneNumber?.replace(
            /\D/g,
            ''
        );

        const locationAltPhoneNumberRawDigits = locationAltNumber?.replace(
            /\D/g,
            ''
        );

        const dealerTechPhoneNumberRawDigits =
            dealerTechSupportPhoneNumber?.replace(/\D/g, '');

        const policeDepartmentContact =
            !policeDepartmentBlocks.name?.trim() &&
            !policeDepartmentBlocks.phone?.trim()
                ? {}
                : {
                      name: policeDepartmentBlocks.name,
                      phone: policeDepartmentBlocks.phone?.replace(/\D/g, ''),
                  };

        const fireDepartmentContact =
            !fireDepartmentBlocks.name?.trim() &&
            !fireDepartmentBlocks.phone?.trim()
                ? {}
                : {
                      name: fireDepartmentBlocks.name,
                      phone: fireDepartmentBlocks.phone?.replace(/\D/g, ''),
                  };

        const emsServiceContact =
            !emsServiceBlocks.name?.trim() && !emsServiceBlocks.phone?.trim()
                ? {}
                : {
                      name: emsServiceBlocks.name,
                      phone: emsServiceBlocks.phone?.replace(/\D/g, ''),
                  };

        const guardServiceContact =
            !guardServiceBlocks.name?.trim() &&
            !guardServiceBlocks.phone?.trim()
                ? {}
                : {
                      name: guardServiceBlocks.name,
                      phone: guardServiceBlocks.phone?.replace(/\D/g, ''),
                  };
        // const postDispatchContactEmptyDataRemoved =
        //     removeObjectsWithAllEmptyValues(postDispatchContactBlocks);
        // const postDispatchContactEmptyDataRemoved = removeDefaultObjects(
        //     postDispatchContactBlocks,
        //     defaultPostDispatchContacts
        // );

        const postDispatchContactEmptyDataRemoved =
            postDispatchContactBlocks.map((obj) => normalizePhones(obj));

        const eventNotifyEmailEmptyDataRamoved = eventNotifyEmailBlocks.filter(
            (val) => val.trim() !== ''
        );

        const subscriberAuthorizedDelegateEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(subscriberAuthorizedDelegateBlocks);

        const videoCameraDetailsEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(videoCameraDetailsBlocks);

        const audioHornDetailsEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(audioHornDetailsBlocks);

        // const sosNotificationReceipientsEmptyDataRemoved =
        //     removeObjectsWithAllEmptyValues(sosNotificationReceipientsBlocks);
        const sosNotificationReceipientsEmptyDataRemoved = removeDefaultObjects(
            sosNotificationReceipientsBlocks,
            defaultSOSNotificationReceipients,
            false
        );

        const reportEmailEmptyDataRamoved = reportEmailBlocks.filter(
            (val) => val.trim() !== ''
        );

        const updatedSubscriberFactSheetData = {
            ...subscriberFactSheetData,
            subscriber_account_type: subscriberAccountType,
            customer_cell: customerPhoneNumberRawDigits,
            location_phone_primary: locationPhoneNumberRawDigits,
            location_phone_secondary: locationAltPhoneNumberRawDigits,
            police_department: policeDepartmentContact,
            fire_department: fireDepartmentContact,
            ems_service: emsServiceContact,
            guard_service: guardServiceContact,
            post_dispatch_contacts: postDispatchContactEmptyDataRemoved,
            event_notification_emails: eventNotifyEmailEmptyDataRamoved,
            subscriber_authorized_delegates:
                subscriberAuthorizedDelegateEmptyDataRemoved,
            video_camera_list: videoCameraDetailsEmptyDataRemoved,
            audio_horn_list: audioHornDetailsEmptyDataRemoved,
            sos_action_plan: {
                ...subscriberFactSheetData.sos_action_plan,
                dispatch_immediately: sosDispatchImmediately,
                post_dispatch_action:
                    'post_dispatch_action' in
                    subscriberFactSheetData.sos_action_plan
                        ? subscriberFactSheetData.sos_action_plan
                              ?.post_dispatch_action
                        : '',
                sos_notification_recipients:
                    sosNotificationReceipientsEmptyDataRemoved,
            },
            runaway_alarm: {
                ...subscriberFactSheetData.runaway_alarm,
                test_duration: runAwayAlarmTestDuration,
            },
            report_setup: dailyReport,
            report_recipient_emails: reportEmailEmptyDataRamoved,
            dealer_tech_support_phone: dealerTechPhoneNumberRawDigits,
        };

        return updatedSubscriberFactSheetData;
    };

    const deepEqual = (a: any, b: any): boolean => {
        if (a === b) return true;

        if (typeof a !== typeof b) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((item, index) => deepEqual(item, b[index]));
        }

        if (typeof a === 'object' && typeof b === 'object' && a && b) {
            const aKeys = Object.keys(a);
            const bKeys = Object.keys(b);
            if (aKeys.length !== bKeys.length) return false;
            return aKeys.every((key) => deepEqual(a[key], b[key]));
        }

        return false;
    };

    const getObjectDifferences = (
        obj1: IAPISubscriberFactSheet,
        obj2: IAPISubscriberFactSheet,
        excludeKeys: string[] = []
    ): Partial<IAPISubscriberFactSheet> => {
        const result: Partial<IAPISubscriberFactSheet> = {};

        for (const key of Object.keys(
            obj2
        ) as (keyof IAPISubscriberFactSheet)[]) {
            if (excludeKeys.includes(key)) continue;

            const val1 = obj1[key];
            const val2 = obj2[key];

            if (!deepEqual(val1, val2)) {
                result[key] = val2 as any;
            }
        }

        return result;
    };

    // const deepCopyData = (
    //     blockName: 'Post-Dispatch Contacts' | 'Subscribers Authorized Delegate'
    // ) => {
    //     if (blockName === 'Post-Dispatch Contacts') {
    //         const dataBlocks: IPostDispatchContacts[] =
    //             removeObjectsWithAllEmptyValues(postDispatchContactBlocks);
    //         return dataBlocks.map((block) => ({
    //             name: block.name,
    //             passcode: block.passcode,
    //             primary_phone: {
    //                 phone: block.primary_phone.phone,
    //                 text: block.primary_phone.text,
    //                 call: block.primary_phone.call,
    //             },
    //             secondary_phone: {
    //                 phone: block.secondary_phone.phone,
    //                 text: block.secondary_phone.text,
    //                 call: block.secondary_phone.call,
    //             },
    //         })) as IPostDispatchContacts[];
    //     } else if (blockName === 'Subscribers Authorized Delegate') {
    //         const dataBlocks: ISubscriberAuthorizedDelegateContact[] =
    //             removeObjectsWithAllEmptyValues(
    //                 subscriberAuthorizedDelegateBlocks
    //             );
    //         return dataBlocks.map((block) => ({
    //             name: block.name,
    //             passcode: block.passcode,
    //             primary_phone: block.primary_phone,
    //             secondary_phone: block.secondary_phone,
    //         })) as ISubscriberAuthorizedDelegateContact[];
    //     }

    //     return [];
    // };

    const isPostDispatchDifferent = (contact: IPostDispatchContacts) => {
        return (
            contact.name !== defaultPostDispatchContacts.name ||
            contact.passcode !== defaultPostDispatchContacts.passcode ||
            contact.primary_phone.phone !==
                defaultPostDispatchContacts.primary_phone.phone ||
            contact.primary_phone.call !==
                defaultPostDispatchContacts.primary_phone.call ||
            contact.primary_phone.text !==
                defaultPostDispatchContacts.primary_phone.text ||
            contact.secondary_phone.phone !==
                defaultPostDispatchContacts.secondary_phone.phone ||
            contact.secondary_phone.call !==
                defaultPostDispatchContacts.secondary_phone.call ||
            contact.secondary_phone.text !==
                defaultPostDispatchContacts.secondary_phone.text
        );
    };

    const deepCopyPostDispatchData = (dataBlocks: IPostDispatchContacts[]) => {
        return dataBlocks.map((block) => ({
            name: block.name,
            passcode: block.passcode,
            primary_phone: {
                phone: block.primary_phone.phone,
                text: block.primary_phone.text,
                call: block.primary_phone.call,
            },
            secondary_phone: {
                phone: block.secondary_phone.phone,
                text: block.secondary_phone.text,
                call: block.secondary_phone.call,
            },
        }));
    };

    const deepCopyAuthorizedDelegateData = (
        dataBlocks: ISubscriberAuthorizedDelegateContact[]
    ) => {
        return dataBlocks.map((block) => ({
            name: block.name,
            passcode: block.passcode,
            primary_phone: block.primary_phone,
            secondary_phone: block.secondary_phone,
        }));
    };

    const deepCopySOSNotificationReceipientsData = (
        dataBlocks: ISOSNotificationContacts[]
    ) => {
        return dataBlocks.map((block) => ({
            call: block.call,
            is_from_party: block.is_from_party,
            name: block.name,
            party_id: block.party_id,
            phone: block.phone,
            text: block.text,
        }));
    };

    const deepCopyVideoCameraData = (dataBlocks: ICameraDetails[]) => {
        return dataBlocks.map((block) => ({
            camera_id: block.camera_id,
            camera_name: block.camera_name,
            camera_model: block.camera_model,
        }));
    };

    const deepCopyAudioHornData = (dataBlocks: IAudioHornDetails[]) => {
        return dataBlocks.map((block) => ({
            network_device_id: block.network_device_id,
            network_device_type_name: block.network_device_type_name,
            network_device_name: block.network_device_name,
            announcement: block.announcement,
        }));
    };

    const resetChangesInSubscriberFactSheetData = <
        IAPISubscriberFactSheet extends Record<string, any>
    >(
        diffKeys: Partial<IAPISubscriberFactSheet>,
        savedSubscriberFactSheetData: IAPISubscriberFactSheet
    ) => {
        const errors: SubscriberFactSheetErrors = {};
        setErrorMessage(errors);

        for (const key of Object.keys(diffKeys) as Array<
            keyof IAPISubscriberFactSheet
        >) {
            setSubscriberFactSheetData((prev) => {
                return {
                    ...prev,
                    [key]: savedSubscriberFactSheetData[key],
                };
            });

            if (key === 'subscriber_account_type') {
                setSubscriberAccountType(
                    savedSubscriberFactSheetData.subscriber_account_type
                        ? savedSubscriberFactSheetData.subscriber_account_type
                        : defaultSubscriberAccountType
                );
            } else if (key === 'customer_cell') {
                setCustomerCellNumber(
                    convertPhoneNumberToFormattedVersion(
                        savedSubscriberFactSheetData.customer_cell
                    )
                );
                // setCustomerCellNumber(
                //     savedSubscriberFactSheetData.customer_cell
                //         ? convertPhoneNumberToFormattedVersion(
                //               savedSubscriberFactSheetData.customer_cell
                //           )
                //         : ''
                // );
            } else if (key === 'location_phone_primary') {
                setLocationPhoneNumber(
                    convertPhoneNumberToFormattedVersion(
                        savedSubscriberFactSheetData.location_phone_primary
                    )
                );
            } else if (key === 'location_phone_secondary') {
                setLocationAltNumber(
                    convertPhoneNumberToFormattedVersion(
                        savedSubscriberFactSheetData.location_phone_secondary
                    )
                );
            } else if (key === 'dealer_tech_support_phone') {
                setDealerTechSupportPhoneNumber(
                    convertPhoneNumberToFormattedVersion(
                        savedSubscriberFactSheetData.dealer_tech_support_phone
                    )
                );
            } else if (key === 'police_department') {
                setPoliceDepartmentBlocks(
                    Object.keys(subscriberFactSheetData.police_department)
                        .length === 2
                        ? {
                              name:
                                  'name' in
                                  subscriberFactSheetData.police_department
                                      ? subscriberFactSheetData
                                            .police_department.name
                                      : '',
                              phone:
                                  'phone' in
                                  subscriberFactSheetData.police_department
                                      ? convertPhoneNumberToFormattedVersion(
                                            subscriberFactSheetData
                                                .police_department.phone ?? ''
                                        )
                                      : '',
                          }
                        : defaultDepartmentDetails
                );
            } else if (key === 'fire_department') {
                setFireDepartmentBlocks(
                    Object.keys(subscriberFactSheetData.fire_department)
                        .length === 2
                        ? {
                              name:
                                  'name' in
                                  subscriberFactSheetData.fire_department
                                      ? subscriberFactSheetData.fire_department
                                            .name
                                      : '',
                              phone:
                                  'phone' in
                                  subscriberFactSheetData.fire_department
                                      ? convertPhoneNumberToFormattedVersion(
                                            subscriberFactSheetData
                                                .fire_department.phone ?? ''
                                        )
                                      : '',
                          }
                        : defaultDepartmentDetails
                );
            } else if (key === 'ems_service') {
                setEMSServiceBlocks(
                    Object.keys(subscriberFactSheetData.ems_service).length ===
                        2
                        ? {
                              name:
                                  'name' in subscriberFactSheetData.ems_service
                                      ? subscriberFactSheetData.ems_service.name
                                      : '',
                              phone:
                                  'phone' in subscriberFactSheetData.ems_service
                                      ? convertPhoneNumberToFormattedVersion(
                                            subscriberFactSheetData.ems_service
                                                .phone ?? ''
                                        )
                                      : '',
                          }
                        : defaultDepartmentDetails
                );
            } else if (key === 'guard_service') {
                setGuardServiceBlocks(
                    Object.keys(subscriberFactSheetData.guard_service)
                        .length === 2
                        ? {
                              name:
                                  'name' in
                                  subscriberFactSheetData.guard_service
                                      ? subscriberFactSheetData.guard_service
                                            .name
                                      : '',
                              phone:
                                  'phone' in
                                  subscriberFactSheetData.guard_service
                                      ? convertPhoneNumberToFormattedVersion(
                                            subscriberFactSheetData
                                                .guard_service.phone ?? ''
                                        )
                                      : '',
                          }
                        : defaultDepartmentDetails
                );
            } else if (key === 'post_dispatch_contacts') {
                setPostDispatchContactBlocks([
                    ...savedSubscriberFactSheetData.post_dispatch_contacts.map(
                        (contact: IPostDispatchContacts) => ({
                            ...contact,
                            primary_phone: {
                                ...contact.primary_phone,
                                phone: contact.primary_phone.phone
                                    ? convertPhoneNumberToFormattedVersion(
                                          contact.primary_phone.phone
                                      )
                                    : '',
                            },
                            secondary_phone: {
                                ...contact.secondary_phone,
                                phone: contact.secondary_phone.phone
                                    ? convertPhoneNumberToFormattedVersion(
                                          contact.secondary_phone.phone
                                      )
                                    : '',
                            },
                        })
                    ),
                    ...Array.from(
                        {
                            length: Math.max(
                                0,
                                8 -
                                    savedSubscriberFactSheetData
                                        .post_dispatch_contacts.length
                            ),
                        },
                        () => structuredClone(defaultPostDispatchContacts)
                    ),
                ]);
            } else if (key === 'event_notification_emails') {
                setEventNotifyEmailBlocks(
                    savedSubscriberFactSheetData.event_notification_emails
                        .length !== 0
                        ? savedSubscriberFactSheetData.event_notification_emails
                        : []
                );
            } else if (key === 'subscriber_authorized_delegates') {
                setSubscriberAuthorizedDelegateBlocks(
                    savedSubscriberFactSheetData.subscriber_authorized_delegates
                        .length != 0
                        ? savedSubscriberFactSheetData.subscriber_authorized_delegates
                        : [
                              {
                                  name: '',
                                  passcode: '',
                                  primary_phone: '',
                                  secondary_phone: '',
                              },
                          ]
                );
            } else if (key === 'video_camera_list') {
                setVideoCameraDetailsBlocks(
                    savedSubscriberFactSheetData.video_camera_list.length !== 0
                        ? savedSubscriberFactSheetData.video_camera_list
                        : []
                );
            } else if (key === 'audio_horn_list') {
                setAudioHornDetailsBlocks(
                    savedSubscriberFactSheetData.audio_horn_list.length !== 0
                        ? savedSubscriberFactSheetData.audio_horn_list
                        : []
                );
            } else if (key === 'sos_action_plan') {
                // setSosNotificationReceipientsBlocks(
                //     'sos_notification_recipients' in
                //         savedSubscriberFactSheetData.sos_action_plan &&
                //         savedSubscriberFactSheetData.sos_action_plan
                //             .sos_notification_recipients.length !== 0
                //         ? savedSubscriberFactSheetData.sos_action_plan
                //               ?.sos_notification_recipients
                //         : [
                //               {
                //                   name: '',
                //                   phone: '',
                //                   text: true,
                //                   call: false,
                //               },
                //           ]
                // );
                setSOSDispatchImmediately(
                    'dispatch_immediately' in
                        savedSubscriberFactSheetData.sos_action_plan
                        ? savedSubscriberFactSheetData.sos_action_plan
                              .dispatch_immediately
                        : defaultSOSDispatchValue
                );

                setSosNotificationReceipientsBlocks(
                    'sos_notification_recipients' in
                        savedSubscriberFactSheetData.sos_action_plan &&
                        savedSubscriberFactSheetData.sos_action_plan
                            .sos_notification_recipients.length != 0
                        ? savedSubscriberFactSheetData.sos_action_plan.sos_notification_recipients.map(
                              (contact: ISOSNotificationContacts) => ({
                                  ...contact,
                                  phone: contact.phone
                                      ? convertPhoneNumberToFormattedVersion(
                                            contact.phone
                                        )
                                      : '',
                              })
                          )
                        : [defaultSOSNotificationReceipients]
                );
            } else if (key === 'runaway_alarm') {
                setRunAwayAlarmTestDuration(
                    'test_duration' in
                        savedSubscriberFactSheetData.runaway_alarm &&
                        savedSubscriberFactSheetData.runaway_alarm
                            ?.test_duration
                        ? savedSubscriberFactSheetData.runaway_alarm
                              ?.test_duration
                        : defaultRunawayAlarmInterval
                );
            } else if (key === 'report_setup') {
                setDailyReport(
                    Object.keys(savedSubscriberFactSheetData.report_setup)
                        .length !== 0
                        ? savedSubscriberFactSheetData.report_setup
                        : defaultReportSetup
                );
            } else if (key === 'report_recipient_emails') {
                setReportEmailBlocks(
                    savedSubscriberFactSheetData.report_recipient_emails
                        .length != 0
                        ? savedSubscriberFactSheetData.report_recipient_emails
                        : []
                );
            }
        }
    };

    const checkIsValueChangedByUser = (
        inputDifference: Partial<IAPISubscriberFactSheet>
    ): boolean => {
        const hasOtherThanDefaultKeys = Object.keys(inputDifference).some(
            (key) => !defaultKeys.includes(key as keyof IAPISubscriberFactSheet)
        );

        if (hasOtherThanDefaultKeys) {
            return true;
        }

        if (savedSubscriberFactSheetData.status === 'NotFound') {
            let isDefaultKeyUpdatedByUser = false;
            for (let i = 0; i < defaultKeys.length; i++) {
                if (
                    defaultKeys[i] === 'subscriber_account_type' &&
                    !savedSubscriberFactSheetData.subscriber_account_type &&
                    inputDifference.subscriber_account_type !==
                        defaultSubscriberAccountType
                ) {
                    isDefaultKeyUpdatedByUser = true;
                    break;
                }

                if (
                    defaultKeys[i] === 'post_dispatch_contacts' &&
                    savedSubscriberFactSheetData.post_dispatch_contacts
                        .length === 0 &&
                    inputDifference.post_dispatch_contacts?.some((contact) =>
                        isPostDispatchDifferent(contact)
                    )
                ) {
                    isDefaultKeyUpdatedByUser = true;
                    break;
                }

                if (
                    defaultKeys[i] === 'sos_action_plan' &&
                    Object.keys(savedSubscriberFactSheetData.sos_action_plan)
                        .length === 0 &&
                    inputDifference.sos_action_plan &&
                    (('dispatch_immediately' in
                        inputDifference.sos_action_plan &&
                        inputDifference.sos_action_plan
                            ?.dispatch_immediately !==
                            defaultSOSDispatchValue) ||
                        ('post_dispatch_action' in
                            inputDifference.sos_action_plan &&
                            inputDifference.sos_action_plan
                                ?.post_dispatch_action !== '') ||
                        ('sos_notification_recipients' in
                            inputDifference.sos_action_plan &&
                            inputDifference.sos_action_plan
                                ?.sos_notification_recipients.length !== 0))
                ) {
                    isDefaultKeyUpdatedByUser = true;
                    break;
                }

                if (
                    defaultKeys[i] === 'runaway_alarm' &&
                    Object.keys(savedSubscriberFactSheetData.runaway_alarm)
                        .length === 0 &&
                    inputDifference.runaway_alarm?.test_duration !==
                        defaultRunawayAlarmInterval
                ) {
                    isDefaultKeyUpdatedByUser = true;
                    break;
                }

                if (
                    defaultKeys[i] === 'report_setup' &&
                    Object.keys(savedSubscriberFactSheetData.report_setup)
                        .length === 0 &&
                    inputDifference.report_setup?.account_changes !==
                        defaultReportSetup.account_changes
                ) {
                    isDefaultKeyUpdatedByUser = true;
                    break;
                }
            }

            return isDefaultKeyUpdatedByUser;

            // if (
            //     !isDefaultKeyUpdatedByUser ||
            //     Object.keys(inputDifference).length === 0
            // ) {
            //     return false;
            // }
        } else {
            if (Object.keys(inputDifference).length === 0) {
                return false;
            }

            return true;
        }
    };

    const updateSubscriberFactSheetMutation = useMutation({
        mutationFn: updateSubscriberFactSheet,
    });

    const handleSaveData = async (action: string, nextSectionId?: number) => {
        if (
            !activeUser ||
            // (action !== 'Submit' &&
            //     (activeSection === null || activeSection === undefined)) ||
            !savedSubscriberFactSheetData
        ) {
            return;
        }

        setIsLoading(true);

        let validateData = true;

        if (action !== 'Submit') {
            if (activeSection === 1)
                validateData = validateSubscriberInformation(action);
            else if (activeSection === 2)
                validateData = validatePostDispatchContacts(action);
            else if (activeSection === 3)
                validateData = validateSubscribersAuthorizedDelegate(action);
            // else if (activeSection === 4)
            //     validateData = validateVideoCameraDetails(action);
            // else if (activeSection === 5)
            //     validateData = validateAudioHornDetails(action);
            else if (activeSection === 6)
                validateData = validateSOSActionPlan(action);
            else if (activeSection === 10)
                validateData = validateReportSetup(action);
            else if (activeSection === 11)
                validateData = validateDealerTechSupport(action);
        } else {
            validateData = validateSubscriberInformation(action);

            if (validateData)
                validateData = validatePostDispatchContacts(action);

            if (validateData)
                validateData = validateSubscribersAuthorizedDelegate(action);

            // if (validateData) validateVideoCameraDetails(action);

            // if (validateData) validateAudioHornDetails(action);

            if (validateData) validateData = validateSOSActionPlan(action);

            if (validateData) validateData = validateReportSetup(action);

            if (validateData) validateData = validateDealerTechSupport(action);
        }

        if (!validateData) {
            setIsLoading(false);
            return;
        }

        const updatedSubscriberFactSheetData = validateAndRemoveEmptyObjects();

        let excludeKeys = ['status'];

        let inputDifference = getObjectDifferences(
            savedSubscriberFactSheetData,
            updatedSubscriberFactSheetData,
            excludeKeys
        );
        console.log('JSON Diff:', inputDifference);

        // if (
        //     Object.keys(savedSubscriberFactSheetData.report_setup).length ===
        //         0 &&
        //     Object.keys(inputDifference).every(
        //         (key) => key === 'report_setup'
        //     ) &&
        //     defaultReportSetup.account_changes === dailyReport.account_changes
        // ) {
        //     const { report_setup, ...modifiedInput } = inputDifference;
        //     inputDifference = modifiedInput;
        // }

        const isValueChangedByUser = checkIsValueChangedByUser(inputDifference);

        try {
            if (
                // Object.keys(inputDifference).length !== 0 ||
                isValueChangedByUser ||
                (savedSubscriberFactSheetData.status !== 'Completed' &&
                    action === 'Submit')
            ) {
                // Update API Call
                await updateSubscriberFactSheetMutation.mutateAsync({
                    user: activeUser,
                    subscriberFactSheetData: {
                        ...inputDifference,
                        site_id: Number(siteId),
                        account_id: Number(accountId),
                        status: action === 'Submit' ? 'Completed' : 'Pending',
                    } as IAPISubscriberFactSheet,
                });

                setSavedSubscriberFactSheetData({
                    ...updatedSubscriberFactSheetData,
                    // post_dispatch_contacts: deepCopyPostDispatchData(
                    //     removeDefaultObjects(
                    //         postDispatchContactBlocks,
                    //         defaultPostDispatchContacts
                    //     )
                    // ),
                    post_dispatch_contacts: deepCopyPostDispatchData(
                        postDispatchContactBlocks.map((obj) =>
                            normalizePhones(obj)
                        )
                    ),
                    event_notification_emails: eventNotifyEmailBlocks.filter(
                        (val) => val.trim() !== ''
                    ),
                    subscriber_authorized_delegates:
                        deepCopyAuthorizedDelegateData(
                            removeObjectsWithAllEmptyValues(
                                subscriberAuthorizedDelegateBlocks
                            )
                        ),
                    video_camera_list: deepCopyVideoCameraData(
                        removeObjectsWithAllEmptyValues(
                            videoCameraDetailsBlocks
                        )
                    ),
                    audio_horn_list: deepCopyAudioHornData(
                        removeObjectsWithAllEmptyValues(audioHornDetailsBlocks)
                    ),
                    sos_action_plan: {
                        ...updatedSubscriberFactSheetData.sos_action_plan,
                        dispatch_immediately: sosDispatchImmediately,
                        post_dispatch_action:
                            'post_dispatch_action' in
                            updatedSubscriberFactSheetData.sos_action_plan
                                ? updatedSubscriberFactSheetData.sos_action_plan
                                      ?.post_dispatch_action
                                : '',
                        sos_notification_recipients:
                            deepCopySOSNotificationReceipientsData(
                                removeDefaultObjects(
                                    sosNotificationReceipientsBlocks,
                                    defaultSOSNotificationReceipients,
                                    false
                                )
                            ),
                    },
                    runaway_alarm: {
                        ...updatedSubscriberFactSheetData.runaway_alarm,
                        test_duration:
                            updatedSubscriberFactSheetData.runaway_alarm
                                .test_duration,
                    },
                    report_setup: dailyReport,
                    report_recipient_emails: reportEmailBlocks.filter(
                        (val) => val.trim() !== ''
                    ),
                    status: `${action === 'Submit' ? 'Completed' : 'Pending'}`,
                });

                if (action !== 'Close' && action !== 'Submit') {
                    verifySubscriberFactSheetInfo();
                    verifyPostDispatchContacts();
                    verifySubscriberAuthorizedContacts();
                    verifySOSActionPlanContacts();
                    verifyReportSetupInfo();
                    verifyDealerTechSupportInfo();
                    updateProgress();
                }

                if (action === 'Submit') {
                    toast.success(
                        'Subscriber Fact Sheet submitted successfully.'
                    );
                } else {
                    toast.success(`Subscriber Fact Sheet updated.`);
                }
            }

            if (action === 'Next') {
                // if (Object.keys(inputDifference).length === 0)
                if (!isValueChangedByUser) {
                    toast.info('No changes found!');
                }
                const totalSection =
                    accountType === AccountType.Evolon ? 12 : 11;

                if (activeSection !== null && activeSection < totalSection) {
                    toggleSection(activeSection + 1);
                }
            } else if (action === 'Back' && activeSection !== null) {
                toggleSection(activeSection - 1);
            } else if (action === 'Toggle' && nextSectionId !== undefined) {
                toggleSection(nextSectionId);
            } else if (action === 'Close' || action === 'Submit') {
                handleClose();
            }
        } catch (err) {
            console.error(err);
            toast.error(
                'Error, Update failed — unable to save Subscriber Fact Sheet!'
            );
        }

        setIsLoading(false);
    };

    const handleNavigation = (action: string, nextSectionId?: number) => {
        if (
            action !== 'Toggle' &&
            action !== 'Close' &&
            (activeSection === null || activeSection === undefined)
        ) {
            return;
        }

        if (!savedSubscriberFactSheetData) return;

        if (action === 'Back' || action === 'Toggle' || action === 'Close') {
            const updatedSubscriberFactSheetData =
                validateAndRemoveEmptyObjects();

            let excludeKeys = ['status'];
            // if (accountType !== AccountType.Evolon) {
            //     excludeKeys.push('dealer_account_number');
            // }
            // if (
            //     defaultReportSetup.account_changes ===
            //         dailyReport.account_changes &&
            //     Object.keys(savedDealerChecklistData.report_setup).length === 0
            // ) {
            //     excludeKeys.push('report_setup');
            // }

            let diff = getObjectDifferences(
                savedSubscriberFactSheetData,
                updatedSubscriberFactSheetData,
                excludeKeys
            );

            console.log(diff);

            // if (
            //     Object.keys(savedSubscriberFactSheetData.report_setup)
            //         .length === 0 &&
            //     Object.keys(diff).every((key) => key === 'report_setup') &&
            //     defaultReportSetup.account_changes ===
            //         dailyReport.account_changes
            // ) {
            //     const { report_setup, ...modifiedInput } = diff;
            //     diff = modifiedInput;
            // }

            const isValueChangedByUser = checkIsValueChangedByUser(diff);

            // if (Object.keys(diff).length === 0)
            if (!isValueChangedByUser) {
                if (action === 'Back' && activeSection != null) {
                    toggleSection(activeSection - 1);
                } else if (action === 'Toggle' && nextSectionId !== undefined) {
                    toggleSection(nextSectionId);
                } else if (action === 'Close') {
                    handleClose();
                }
            } else {
                console.log('Saved Subscriber Fact Sheet Data');
                console.log(savedSubscriberFactSheetData);
                const confirmSwitch = confirm(
                    'You have unsaved changes. Save them now. If you cancel, all unsaved changes will be discarded.'
                );
                if (confirmSwitch) {
                    if (action === 'Back' || action === 'Close') {
                        handleSaveData(action);
                    } else if (
                        action === 'Toggle' &&
                        nextSectionId !== undefined
                    ) {
                        handleSaveData(action, nextSectionId);
                    }
                } else {
                    resetChangesInSubscriberFactSheetData(
                        diff,
                        savedSubscriberFactSheetData
                    );

                    if (action === 'Back' && activeSection != null) {
                        toggleSection(activeSection - 1);
                    } else if (
                        action === 'Toggle' &&
                        nextSectionId !== undefined
                    ) {
                        toggleSection(nextSectionId);
                    } else if (action === 'Close') {
                        handleClose();
                    }
                }
            }
        }
    };

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSaveData('Submit');
    };

    // const handlePhoneValueChange = <T extends ISecurityContactBlock>(
    //     newValue: any,
    //     key: keyof T,
    //     setDataBlock: Dispatch<SetStateAction<T>>,
    //     dataBlock: T
    // ): void => {
    //     if (key === 'phone' && !/^\d*$/.test(newValue)) {
    //         return;
    //     }

    //     setDataBlock({
    //         ...dataBlock,
    //         [key]: newValue,
    //     });
    // };

    // const handlePhoneFieldBlur = <T extends ISecurityContactBlock>(
    //     newValue: any,
    //     key: keyof T,
    //     setDataBlock: Dispatch<SetStateAction<T>>,
    //     dataBlock: T
    // ): void => {
    //     setDataBlock({
    //         ...dataBlock,
    //         [key]: convertPhoneNumberToFormattedVersion(newValue),
    //     });
    // };

    // const handlePhoneFieldFocus = <T extends ISecurityContactBlock>(
    //     newValue: any,
    //     key: keyof T,
    //     setDataBlock: Dispatch<SetStateAction<T>>,
    //     dataBlock: T
    // ): void => {
    //     setDataBlock({
    //         ...dataBlock,
    //         [key]: newValue.replace(/\D/g, ''),
    //     });
    // };

    useEffect(() => {
        verifySubscriberFactSheetInfo();
        verifyPostDispatchContacts();
        verifySubscriberAuthorizedContacts();
        verifySOSActionPlanContacts();
        verifyReportSetupInfo();
        verifyDealerTechSupportInfo();
        updateProgress();
    }, []);

    return (
        <ModalBase
            title="Subscriber Fact Sheet"
            handleClose={() => handleNavigation('Close')}
            className="EditSubscriberFactSheetModal"
            closeOnBackdropClick={false}
        >
            <>
                {isLoading && (
                    <LoadingModal
                        modalText="Updating Subscriber Fact Sheet data..."
                        zIndex={96}
                    />
                )}
                {/*  Progress bar */}
                <div>
                    <div
                        style={{
                            width: '80%',
                            margin: '10px auto',
                            border: '1px solid #ccc',
                            borderRadius: '10px',
                        }}
                    >
                        <div
                            style={{
                                width: `${progressStatus}%`,
                                height: '20px',
                                background:
                                    progressStatus === 100 ? 'green' : 'blue',
                                borderRadius: '10px',
                                transition: '0.3s',
                            }}
                        ></div>
                    </div>

                    <p style={{ textAlign: 'center' }}>
                        {progressStatus}% completed
                    </p>
                </div>
                <div className="dealer-grid">
                    <div className="grid-cell">
                        <p>
                            <span>Dealer Name : </span>{' '}
                            {subscriberFactSheetData.dealer_name}
                        </p>
                    </div>
                    <div className="grid-cell">
                        <p>
                            <span>Dealer Number : </span>{' '}
                            {subscriberFactSheetData.dealer_number}
                        </p>
                    </div>
                    <div className="grid-cell">
                        <p>
                            <span>Subscriber Account Number : </span>{' '}
                            {subscriberFactSheetData.subscriber_account_number}
                        </p>
                    </div>
                </div>

                <form
                    id="dealer-checklist-form"
                    key="dealer-checklist-form"
                    onSubmit={onSubmit}
                >
                    {/* Section - Subscriber Information */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 1 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 1)}
                        >
                            <div className="section-container-header-caption">
                                Subscriber Information
                            </div>
                            <div className="section-container-header-toggle">
                                {isSubscriberInfoVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 1 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 1 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        {/* <div>
                                            <Input
                                                id="dealer_name"
                                                name="dealer_name"
                                                label="Dealer Name"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.dealer_name
                                                        ? subscriberFactSheetData.dealer_name
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'dealer_name',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'dealer_name',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                maxLength={255}
                                            />
                                            {errorMessage.dealer_name && (
                                                <p
                                                    id="dealer-name-error"
                                                    className="error"
                                                    data-testid="dealer-name-error"
                                                >
                                                    {errorMessage.dealer_name}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="dealer_number"
                                                name="dealer_number"
                                                label="Dealer Number"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.dealer_number
                                                        ? subscriberFactSheetData.dealer_number
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'dealer_number',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'dealer_number',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                maxLength={255}
                                            />
                                            {errorMessage.dealer_number && (
                                                <p
                                                    id="dealer-number-error"
                                                    className="error"
                                                    data-testid="dealer-number-error"
                                                >
                                                    {errorMessage.dealer_number}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="subscriber_account_number"
                                                name="subscriber_account_number"
                                                label="Subscriber Account Number"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.subscriber_account_number
                                                        ? subscriberFactSheetData.subscriber_account_number
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'subscriber_account_number',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'subscriber_account_number',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                maxLength={255}
                                            />
                                            {errorMessage.subscriber_account_number && (
                                                <p
                                                    id="subscriber-account-number-error"
                                                    className="error"
                                                    data-testid="subscriber-account-number-error"
                                                >
                                                    {
                                                        errorMessage.subscriber_account_number
                                                    }
                                                </p>
                                            )}
                                        </div> */}
                                        <div>
                                            <span>Account Type</span>
                                            <span className="asterisk">*</span>
                                            <div className="radioGroup">
                                                {subscriberAccountTypeOptions.map(
                                                    (account, index) => {
                                                        return (
                                                            <Fragment
                                                                key={`account-${index}`}
                                                            >
                                                                <div className="radioBtn primary">
                                                                    <input
                                                                        type="radio"
                                                                        id={`account-${account.toLowerCase()}`}
                                                                        name="subscriber_account_type"
                                                                        value={
                                                                            account
                                                                        }
                                                                        // checked={
                                                                        //     subscriberFactSheetData.subscriber_account_type ===
                                                                        //     account
                                                                        // }
                                                                        checked={
                                                                            subscriberAccountType ===
                                                                            account
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            const selectedValue =
                                                                                e
                                                                                    .target
                                                                                    .value as SubscriberAccountTypes;
                                                                            // setSubscriberFactSheetData(
                                                                            //     {
                                                                            //         ...subscriberFactSheetData,
                                                                            //         subscriber_account_type:
                                                                            //             selectedValue,
                                                                            //     }
                                                                            // );

                                                                            setSubscriberAccountType(
                                                                                selectedValue
                                                                            );
                                                                        }}
                                                                    />
                                                                    <label
                                                                        htmlFor={`account-${account.toLowerCase()}`}
                                                                    >
                                                                        {
                                                                            account
                                                                        }
                                                                    </label>
                                                                </div>
                                                            </Fragment>
                                                        );
                                                    }
                                                )}
                                            </div>
                                            {errorMessage.subscriber_account_type && (
                                                <p
                                                    id="subscriber-account-type-error"
                                                    className="error"
                                                    data-testid="subscriber-account-type-error"
                                                >
                                                    {
                                                        errorMessage.subscriber_account_type
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <span>Video System Type</span>
                                            <span className="asterisk">*</span>
                                            <div className="videoSystemType">
                                                {subscriberVideoSystemType.map(
                                                    (
                                                        videoSystemType,
                                                        index
                                                    ) => {
                                                        return (
                                                            <Fragment
                                                                key={`video-system-type-${index}`}
                                                            >
                                                                <div>
                                                                    <label
                                                                        htmlFor={`video-system-type-${videoSystemType.toLowerCase()}`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`video-system-type-${videoSystemType.toLowerCase()}`}
                                                                            name={`${videoSystemType.toLowerCase()}`}
                                                                            checked={subscriberFactSheetData.video_system_types.includes(
                                                                                videoSystemType
                                                                            )}
                                                                            className="checkbox-input"
                                                                            onChange={() => {
                                                                                const isSelected =
                                                                                    subscriberFactSheetData.video_system_types.includes(
                                                                                        videoSystemType
                                                                                    );
                                                                                const updatedPurpose =
                                                                                    isSelected
                                                                                        ? subscriberFactSheetData.video_system_types.filter(
                                                                                              (
                                                                                                  item
                                                                                              ) =>
                                                                                                  item !==
                                                                                                  videoSystemType
                                                                                          )
                                                                                        : [
                                                                                              ...subscriberFactSheetData.video_system_types,
                                                                                              videoSystemType,
                                                                                          ];

                                                                                setSubscriberFactSheetData(
                                                                                    (
                                                                                        prev
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        video_system_types:
                                                                                            updatedPurpose,
                                                                                    })
                                                                                );
                                                                            }}
                                                                        />
                                                                        <span className="checkbox-label">
                                                                            {
                                                                                videoSystemType
                                                                            }
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            </Fragment>
                                                        );
                                                    }
                                                )}
                                            </div>
                                            {errorMessage.video_system_types && (
                                                <p
                                                    id="video-system-type-error"
                                                    className="error"
                                                    data-testid="video-system-type-error"
                                                >
                                                    {
                                                        errorMessage.video_system_types
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="business_name"
                                                name="business_name"
                                                label="Business Name"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.business_name
                                                        ? subscriberFactSheetData.business_name
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'business_name',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'business_name',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.business_name && (
                                                <p
                                                    id="business-name-error"
                                                    className="error"
                                                    data-testid="business-name-error"
                                                >
                                                    {errorMessage.business_name}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="address"
                                                name="address"
                                                label="Address"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.address
                                                        ? subscriberFactSheetData.address
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'address',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur('address', value)
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.address && (
                                                <p
                                                    id="address-error"
                                                    className="error"
                                                    data-testid="address-error"
                                                >
                                                    {errorMessage.address}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="suite_number"
                                                name="suite_number"
                                                label="Suite Number"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.suite_number
                                                        ? subscriberFactSheetData.suite_number
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'suite_number',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'suite_number',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.suite_number && (
                                                <p
                                                    id="suite-number-error"
                                                    className="error"
                                                    data-testid="suite-number-error"
                                                >
                                                    {errorMessage.suite_number}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="city"
                                                name="city"
                                                label="City"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.city
                                                        ? subscriberFactSheetData.city
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'city',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur('city', value)
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.city && (
                                                <p
                                                    id="city-error"
                                                    className="error"
                                                    data-testid="city-error"
                                                >
                                                    {errorMessage.city}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="state"
                                                name="state"
                                                label="State"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.state
                                                        ? subscriberFactSheetData.state
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'state',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur('state', value)
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.state && (
                                                <p
                                                    id="state-error"
                                                    className="error"
                                                    data-testid="state-error"
                                                >
                                                    {errorMessage.state}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="zip"
                                                name="zip"
                                                label="Zip"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.zip
                                                        ? subscriberFactSheetData.zip
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'zip',
                                                        value,
                                                        'number'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur('zip', value)
                                                }
                                                autoComplete="off"
                                                required
                                                minLength={5}
                                                maxLength={32}
                                            />
                                            {errorMessage.zip && (
                                                <p
                                                    id="zip-error"
                                                    className="error"
                                                    data-testid="zip-error"
                                                >
                                                    {errorMessage.zip}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="customer_name"
                                                name="customer_name"
                                                label="Customer Name"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.customer_name
                                                        ? subscriberFactSheetData.customer_name
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'customer_name',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'customer_name',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.customer_name && (
                                                <p
                                                    id="customer-name-error"
                                                    className="error"
                                                    data-testid="customer-name-error"
                                                >
                                                    {errorMessage.customer_name}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="customer_email"
                                                name="customer_email"
                                                label="Customer Email"
                                                className="input field"
                                                type="email"
                                                value={
                                                    subscriberFactSheetData.customer_email
                                                        ? subscriberFactSheetData.customer_email
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'customer_email',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'customer_email',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.customer_email && (
                                                <p
                                                    id="customer-email-error"
                                                    className="error"
                                                    data-testid="customer-email-error"
                                                >
                                                    {
                                                        errorMessage.customer_email
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="customer_cell"
                                                name="customer_cell"
                                                label="Customer Cell"
                                                className="input field"
                                                type="text"
                                                value={customerCellNumber}
                                                onChange={(value) => {
                                                    handlePhoneNumberChange(
                                                        value,
                                                        setCustomerCellNumber
                                                    );
                                                }}
                                                onBlur={(value) =>
                                                    handlePhoneNumberBlur(
                                                        value,
                                                        setCustomerCellNumber
                                                    )
                                                }
                                                onFocus={(value) =>
                                                    handlePhoneNumberFocus(
                                                        value,
                                                        setCustomerCellNumber
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.customer_cell && (
                                                <p
                                                    id="customer-cell-error"
                                                    className="error"
                                                    data-testid="customer-cell-error"
                                                >
                                                    {errorMessage.customer_cell}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="location_phone"
                                                name="location_phone"
                                                label="Location Phone #"
                                                className="input field"
                                                type="text"
                                                value={locationPhoneNumber}
                                                onChange={(value) => {
                                                    handlePhoneNumberChange(
                                                        value,
                                                        setLocationPhoneNumber
                                                    );
                                                }}
                                                onBlur={(value) =>
                                                    handlePhoneNumberBlur(
                                                        value,
                                                        setLocationPhoneNumber
                                                    )
                                                }
                                                onFocus={(value) =>
                                                    handlePhoneNumberFocus(
                                                        value,
                                                        setLocationPhoneNumber
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.location_phone_primary && (
                                                <p
                                                    id="location-phone-error"
                                                    className="error"
                                                    data-testid="location-phone-error"
                                                >
                                                    {
                                                        errorMessage.location_phone_primary
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="location_alt_phone"
                                                name="location_alt_phone"
                                                label="Location Alt Phone #"
                                                className="input field"
                                                type="text"
                                                value={locationAltNumber}
                                                onChange={(value) => {
                                                    handlePhoneNumberChange(
                                                        value,
                                                        setLocationAltNumber
                                                    );
                                                }}
                                                onBlur={(value) =>
                                                    handlePhoneNumberBlur(
                                                        value,
                                                        setLocationAltNumber
                                                    )
                                                }
                                                onFocus={(value) =>
                                                    handlePhoneNumberFocus(
                                                        value,
                                                        setLocationAltNumber
                                                    )
                                                }
                                                autoComplete="off"
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.location_phone_secondary && (
                                                <p
                                                    id="location-alt-phone-error"
                                                    className="error"
                                                    data-testid="location-alt-phone-error"
                                                >
                                                    {
                                                        errorMessage.location_phone_secondary
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="subdivision"
                                                name="subdivision"
                                                label="Subdivision"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.subdivision
                                                        ? subscriberFactSheetData.subdivision
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'subdivision',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'subdivision',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.subdivision && (
                                                <p
                                                    id="sub-division-error"
                                                    className="error"
                                                    data-testid="sub-division-error"
                                                >
                                                    {errorMessage.subdivision}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="cross_street"
                                                name="cross_street"
                                                label="Cross Street"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.cross_street
                                                        ? subscriberFactSheetData.cross_street
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'cross_street',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'cross_street',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.cross_street && (
                                                <p
                                                    id="cross-street-error"
                                                    className="error"
                                                    data-testid="cross-street-error"
                                                >
                                                    {errorMessage.cross_street}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="alarm_permit_number"
                                                name="alarm_permit_number"
                                                label="Permit # / Information"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.alarm_permit_number
                                                        ? subscriberFactSheetData.alarm_permit_number
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'alarm_permit_number',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'alarm_permit_number',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.alarm_permit_number && (
                                                <p
                                                    id="alarm-permit-number-error"
                                                    className="error"
                                                    data-testid="alarm-permit-number-error"
                                                >
                                                    {
                                                        errorMessage.alarm_permit_number
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        {/* <div>
                                            <Input
                                                id="police_department"
                                                name="police_department"
                                                label="Police Department"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.police_department
                                                        ? subscriberFactSheetData.police_department
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'police_department',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'police_department',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.police_department && (
                                                <p
                                                    id="police-department-error"
                                                    className="error"
                                                    data-testid="police-department-error"
                                                >
                                                    {
                                                        errorMessage.police_department
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="police_phone"
                                                name="police_phone"
                                                label="Police Phone"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.police_phone
                                                        ? subscriberFactSheetData.police_phone
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'police_phone',
                                                        value,
                                                        'number'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'police_phone',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.police_phone && (
                                                <p
                                                    id="police-phone-error"
                                                    className="error"
                                                    data-testid="police-phone-error"
                                                >
                                                    {errorMessage.police_phone}
                                                </p>
                                            )}
                                        </div> 
                                        <div>
                                            <Input
                                                id="fire_department"
                                                name="fire_department"
                                                label="Fire Department"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.fire_department
                                                        ? subscriberFactSheetData.fire_department
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'fire_department',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'fire_department',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.fire_department && (
                                                <p
                                                    id="fire-department-error"
                                                    className="error"
                                                    data-testid="fire-department-error"
                                                >
                                                    {
                                                        errorMessage.fire_department
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="fire_phone"
                                                name="fire_phone"
                                                label="Fire Phone"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.fire_phone
                                                        ? subscriberFactSheetData.fire_phone
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'fire_phone',
                                                        value,
                                                        'number'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'fire_phone',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.fire_phone && (
                                                <p
                                                    id="fire-phone-error"
                                                    className="error"
                                                    data-testid="fire-phone-error"
                                                >
                                                    {errorMessage.fire_phone}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="ems_service"
                                                name="ems_service"
                                                label="EMS Service"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.ems_service
                                                        ? subscriberFactSheetData.ems_service
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'ems_service',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'ems_service',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.ems_service && (
                                                <p
                                                    id="ems-service-error"
                                                    className="error"
                                                    data-testid="ems-service-error"
                                                >
                                                    {errorMessage.ems_service}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="ems_service_phone"
                                                name="ems_service_phone"
                                                label="EMS Service Phone"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.ems_service_phone
                                                        ? subscriberFactSheetData.ems_service_phone
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'ems_service_phone',
                                                        value,
                                                        'number'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'ems_service_phone',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.ems_service_phone && (
                                                <p
                                                    id="ems-service-phone-error"
                                                    className="error"
                                                    data-testid="ems-service-phone-error"
                                                >
                                                    {
                                                        errorMessage.ems_service_phone
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="guard_service"
                                                name="guard_service"
                                                label="Guard Service"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.guard_service
                                                        ? subscriberFactSheetData.guard_service
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'guard_service',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'guard_service',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.guard_service && (
                                                <p
                                                    id="guard-service-error"
                                                    className="error"
                                                    data-testid="guard-service-error"
                                                >
                                                    {errorMessage.guard_service}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="guard_service_phone"
                                                name="guard_service_phone"
                                                label="Guard Service Phone"
                                                className="input field"
                                                type="text"
                                                value={
                                                    subscriberFactSheetData.guard_service_phone
                                                        ? subscriberFactSheetData.guard_service_phone
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'guard_service_phone',
                                                        value,
                                                        'number'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'police_department',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.guard_service_phone && (
                                                <p
                                                    id="guard-service-phone-error"
                                                    className="error"
                                                    data-testid="guard-service-phone-error"
                                                >
                                                    {
                                                        errorMessage.guard_service_phone
                                                    }
                                                </p>
                                            )}
                                        </div> */}
                                        <div>
                                            {/* <span>Police Department</span> */}
                                            <div className="security_department_info">
                                                <div>
                                                    <Input
                                                        id="police_department"
                                                        name="police_department"
                                                        label="Police Department"
                                                        className="input field"
                                                        type="text"
                                                        value={
                                                            policeDepartmentBlocks.name
                                                                ? policeDepartmentBlocks.name
                                                                : ''
                                                        }
                                                        onChange={(value) =>
                                                            setPoliceDepartmentBlocks(
                                                                {
                                                                    ...policeDepartmentBlocks,
                                                                    name: value,
                                                                }
                                                            )
                                                        }
                                                        onBlur={(value) =>
                                                            setPoliceDepartmentBlocks(
                                                                {
                                                                    ...policeDepartmentBlocks,
                                                                    name: value
                                                                        .replace(
                                                                            /\s+/g,
                                                                            ' '
                                                                        )
                                                                        .trim(),
                                                                }
                                                            )
                                                        }
                                                        autoComplete="off"
                                                        required
                                                        maxLength={255}
                                                    />
                                                    {/* {errorMessage.police_department && (
                                                        <p
                                                            id="police-department-error"
                                                            className="error"
                                                            data-testid="police-department-error"
                                                        >
                                                            {
                                                                errorMessage.police_department
                                                            }
                                                        </p>
                                                    )} */}
                                                </div>
                                                <div>
                                                    <Input
                                                        id="police_phone"
                                                        name="police_phone"
                                                        label="Phone"
                                                        className="input field"
                                                        type="text"
                                                        value={
                                                            policeDepartmentBlocks.phone
                                                                ? policeDepartmentBlocks.phone
                                                                : ''
                                                        }
                                                        onChange={(
                                                            newValue
                                                        ) => {
                                                            if (
                                                                /^\d*$/.test(
                                                                    newValue
                                                                )
                                                            ) {
                                                                setPoliceDepartmentBlocks(
                                                                    {
                                                                        ...policeDepartmentBlocks,
                                                                        phone: newValue,
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                        onBlur={(newValue) =>
                                                            setPoliceDepartmentBlocks(
                                                                {
                                                                    ...policeDepartmentBlocks,
                                                                    phone: convertPhoneNumberToFormattedVersion(
                                                                        newValue
                                                                    ),
                                                                }
                                                            )
                                                        }
                                                        onFocus={(newValue) =>
                                                            setPoliceDepartmentBlocks(
                                                                {
                                                                    ...policeDepartmentBlocks,
                                                                    phone: newValue.replace(
                                                                        /\D/g,
                                                                        ''
                                                                    ),
                                                                }
                                                            )
                                                        }
                                                        autoComplete="off"
                                                        required
                                                        minLength={10}
                                                        maxLength={20}
                                                    />
                                                    {/* {errorMessage.police_department && (
                                                        <p
                                                            id="police-phone-error"
                                                            className="error"
                                                            data-testid="police-phone-error"
                                                        >
                                                            {
                                                                errorMessage.police_department
                                                            }
                                                        </p>
                                                    )} */}
                                                </div>
                                            </div>
                                            {errorMessage.police_department && (
                                                <p
                                                    id="police-department-error"
                                                    className="error"
                                                    data-testid="police-department-error"
                                                >
                                                    {
                                                        errorMessage.police_department
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            {/* <span>Fire Department</span> */}
                                            <div className="security_department_info">
                                                <div>
                                                    <Input
                                                        id="fire_department"
                                                        name="fire_department"
                                                        label="Fire Department"
                                                        className="input field"
                                                        type="text"
                                                        value={
                                                            fireDepartmentBlocks.name
                                                                ? fireDepartmentBlocks.name
                                                                : ''
                                                        }
                                                        onChange={(value) =>
                                                            setFireDepartmentBlocks(
                                                                {
                                                                    ...fireDepartmentBlocks,
                                                                    name: value,
                                                                }
                                                            )
                                                        }
                                                        onBlur={(value) =>
                                                            setFireDepartmentBlocks(
                                                                {
                                                                    ...fireDepartmentBlocks,
                                                                    name: value
                                                                        .replace(
                                                                            /\s+/g,
                                                                            ' '
                                                                        )
                                                                        .trim(),
                                                                }
                                                            )
                                                        }
                                                        autoComplete="off"
                                                        required
                                                        maxLength={255}
                                                    />
                                                    {/* {errorMessage.fire_department && (
                                                        <p
                                                            id="fire-department-error"
                                                            className="error"
                                                            data-testid="fire-department-error"
                                                        >
                                                            {
                                                                errorMessage.fire_department
                                                            }
                                                        </p>
                                                    )} */}
                                                </div>
                                                <div>
                                                    <Input
                                                        id="fire_phone"
                                                        name="fire_phone"
                                                        label="Phone"
                                                        className="input field"
                                                        type="text"
                                                        value={
                                                            fireDepartmentBlocks.phone
                                                                ? fireDepartmentBlocks.phone
                                                                : ''
                                                        }
                                                        onChange={(
                                                            newValue
                                                        ) => {
                                                            if (
                                                                /^\d*$/.test(
                                                                    newValue
                                                                )
                                                            ) {
                                                                setFireDepartmentBlocks(
                                                                    {
                                                                        ...fireDepartmentBlocks,
                                                                        phone: newValue,
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                        onBlur={(newValue) =>
                                                            setFireDepartmentBlocks(
                                                                {
                                                                    ...fireDepartmentBlocks,
                                                                    phone: convertPhoneNumberToFormattedVersion(
                                                                        newValue
                                                                    ),
                                                                }
                                                            )
                                                        }
                                                        onFocus={(newValue) =>
                                                            setFireDepartmentBlocks(
                                                                {
                                                                    ...fireDepartmentBlocks,
                                                                    phone: newValue.replace(
                                                                        /\D/g,
                                                                        ''
                                                                    ),
                                                                }
                                                            )
                                                        }
                                                        autoComplete="off"
                                                        required
                                                        minLength={10}
                                                        maxLength={20}
                                                    />
                                                    {/* {errorMessage.fire_department && (
                                                        <p
                                                            id="fire-phone-error"
                                                            className="error"
                                                            data-testid="fire-phone-error"
                                                        >
                                                            {
                                                                errorMessage.fire_department
                                                            }
                                                        </p>
                                                    )} */}
                                                </div>
                                            </div>
                                            {errorMessage.fire_department && (
                                                <p
                                                    id="fire-department-error"
                                                    className="error"
                                                    data-testid="fire-department-error"
                                                >
                                                    {
                                                        errorMessage.fire_department
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            {/* <span>EMS Service</span> */}
                                            <div className="security_department_info">
                                                <div>
                                                    <Input
                                                        id="ems_service"
                                                        name="ems_service"
                                                        label="EMS Service"
                                                        className="input field"
                                                        type="text"
                                                        value={
                                                            emsServiceBlocks.name
                                                                ? emsServiceBlocks.name
                                                                : ''
                                                        }
                                                        onChange={(value) =>
                                                            setEMSServiceBlocks(
                                                                {
                                                                    ...emsServiceBlocks,
                                                                    name: value,
                                                                }
                                                            )
                                                        }
                                                        onBlur={(value) =>
                                                            setEMSServiceBlocks(
                                                                {
                                                                    ...emsServiceBlocks,
                                                                    name: value
                                                                        .replace(
                                                                            /\s+/g,
                                                                            ' '
                                                                        )
                                                                        .trim(),
                                                                }
                                                            )
                                                        }
                                                        autoComplete="off"
                                                        required
                                                        maxLength={255}
                                                    />
                                                    {/* {errorMessage.ems_service && (
                                                        <p
                                                            id="ems-service-error"
                                                            className="error"
                                                            data-testid="ems-service-error"
                                                        >
                                                            {
                                                                errorMessage.ems_service
                                                            }
                                                        </p>
                                                    )} */}
                                                </div>
                                                <div>
                                                    <Input
                                                        id="ems_service_phone"
                                                        name="ems_service_phone"
                                                        label="Phone"
                                                        className="input field"
                                                        type="text"
                                                        value={
                                                            emsServiceBlocks.phone
                                                                ? emsServiceBlocks.phone
                                                                : ''
                                                        }
                                                        onChange={(
                                                            newValue
                                                        ) => {
                                                            if (
                                                                /^\d*$/.test(
                                                                    newValue
                                                                )
                                                            ) {
                                                                setEMSServiceBlocks(
                                                                    {
                                                                        ...emsServiceBlocks,
                                                                        phone: newValue,
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                        onBlur={(newValue) =>
                                                            setEMSServiceBlocks(
                                                                {
                                                                    ...emsServiceBlocks,
                                                                    phone: convertPhoneNumberToFormattedVersion(
                                                                        newValue
                                                                    ),
                                                                }
                                                            )
                                                        }
                                                        onFocus={(newValue) =>
                                                            setEMSServiceBlocks(
                                                                {
                                                                    ...emsServiceBlocks,
                                                                    phone: newValue.replace(
                                                                        /\D/g,
                                                                        ''
                                                                    ),
                                                                }
                                                            )
                                                        }
                                                        autoComplete="off"
                                                        required
                                                        minLength={10}
                                                        maxLength={20}
                                                    />
                                                    {/* {errorMessage.ems_service && (
                                                        <p
                                                            id="ems-service-phone-error"
                                                            className="error"
                                                            data-testid="ems-service-phone-error"
                                                        >
                                                            {
                                                                errorMessage.ems_service
                                                            }
                                                        </p>
                                                    )} */}
                                                </div>
                                            </div>
                                            {errorMessage.ems_service && (
                                                <p
                                                    id="ems-service-error"
                                                    className="error"
                                                    data-testid="ems-service-error"
                                                >
                                                    {errorMessage.ems_service}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            {/* <span>Guard Service</span> */}
                                            <div className="security_department_info">
                                                <div>
                                                    <Input
                                                        id="guard_service"
                                                        name="guard_service"
                                                        label="Guard Service"
                                                        className="input field"
                                                        type="text"
                                                        value={
                                                            guardServiceBlocks.name
                                                                ? guardServiceBlocks.name
                                                                : ''
                                                        }
                                                        onChange={(value) =>
                                                            setGuardServiceBlocks(
                                                                {
                                                                    ...guardServiceBlocks,
                                                                    name: value,
                                                                }
                                                            )
                                                        }
                                                        onBlur={(value) =>
                                                            setGuardServiceBlocks(
                                                                {
                                                                    ...guardServiceBlocks,
                                                                    name: value
                                                                        .replace(
                                                                            /\s+/g,
                                                                            ' '
                                                                        )
                                                                        .trim(),
                                                                }
                                                            )
                                                        }
                                                        autoComplete="off"
                                                        required
                                                        maxLength={255}
                                                    />
                                                    {/* {errorMessage.guard_service && (
                                                        <p
                                                            id="guard-service-error"
                                                            className="error"
                                                            data-testid="guard-service-error"
                                                        >
                                                            {
                                                                errorMessage.guard_service
                                                            }
                                                        </p>
                                                    )} */}
                                                </div>
                                                <div>
                                                    <Input
                                                        id="guard_service_phone"
                                                        name="guard_service_phone"
                                                        label="Phone"
                                                        className="input field"
                                                        type="text"
                                                        value={
                                                            guardServiceBlocks.phone
                                                                ? guardServiceBlocks.phone
                                                                : ''
                                                        }
                                                        onChange={(
                                                            newValue
                                                        ) => {
                                                            if (
                                                                /^\d*$/.test(
                                                                    newValue
                                                                )
                                                            ) {
                                                                setGuardServiceBlocks(
                                                                    {
                                                                        ...guardServiceBlocks,
                                                                        phone: newValue,
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                        onBlur={(newValue) =>
                                                            setGuardServiceBlocks(
                                                                {
                                                                    ...guardServiceBlocks,
                                                                    phone: convertPhoneNumberToFormattedVersion(
                                                                        newValue
                                                                    ),
                                                                }
                                                            )
                                                        }
                                                        onFocus={(newValue) =>
                                                            setGuardServiceBlocks(
                                                                {
                                                                    ...guardServiceBlocks,
                                                                    phone: newValue.replace(
                                                                        /\D/g,
                                                                        ''
                                                                    ),
                                                                }
                                                            )
                                                        }
                                                        autoComplete="off"
                                                        required
                                                        minLength={10}
                                                        maxLength={20}
                                                    />
                                                    {/* {errorMessage.guard_service && (
                                                        <p
                                                            id="guard-service-phone-error"
                                                            className="error"
                                                            data-testid="guard-service-phone-error"
                                                        >
                                                            {
                                                                errorMessage.guard_service
                                                            }
                                                        </p>
                                                    )} */}
                                                </div>
                                            </div>
                                            {errorMessage.guard_service && (
                                                <p
                                                    id="guard-service-error"
                                                    className="error"
                                                    data-testid="guard-service-error"
                                                >
                                                    {errorMessage.guard_service}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Post-Dispatch Contacts */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 2 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 2)}
                        >
                            <div className="section-container-header-caption">
                                Post-Dispatch Parties
                            </div>
                            <div className="section-container-header-toggle">
                                {isPostDispatchContactsVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 2 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 2 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <p style={{ fontWeight: 'bold' }}>
                                                After the responding Agency has
                                                been notified, the subscriber
                                                requests that one of the
                                                following parties be notified
                                                (up to 8 contacts) Please check
                                                TXT or Call Option
                                            </p>
                                            {/* <p>
                                                (List is a contact priority list
                                                1 - 8)
                                            </p> */}
                                        </div>
                                        <div>
                                            {/* Section - Post-Dispatch Parties Subsections */}
                                            {postDispatchContactBlocks.map(
                                                (contactBlock, index) => {
                                                    return (
                                                        <Fragment
                                                            key={`post-dispatch-contacts-block-${index}`}
                                                        >
                                                            <div className="section-container">
                                                                <div
                                                                    className={`section-container-header ${
                                                                        activeSubSection.post_dispatch_contacts ===
                                                                        index
                                                                            ? 'active-header'
                                                                            : ''
                                                                    }`}
                                                                    onClick={() =>
                                                                        toggleSubSection(
                                                                            'post_dispatch_contacts',
                                                                            index
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="section-container-header-caption">
                                                                        Party -{' '}
                                                                        {index +
                                                                            1}
                                                                    </div>
                                                                    {/* {index !==
                                                                        0 && (
                                                                        <div className="section-container-header-toolbar">
                                                                            <div className="section-node-toolbar-button">
                                                                                <DeleteIcon
                                                                                    className="deleteIcon"
                                                                                    onClick={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.stopPropagation();
                                                                                        removePostDispatchContactBlock(
                                                                                            index
                                                                                        );
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )} */}
                                                                    <div className="section-container-header-toggle">
                                                                        {(activeSubSection.post_dispatch_contacts ===
                                                                            index && (
                                                                            <FaChevronDown />
                                                                        )) || (
                                                                            <FaChevronRight />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {activeSubSection.post_dispatch_contacts ===
                                                                    index && (
                                                                    <div className="section-container-body">
                                                                        <div className="section-node">
                                                                            <Input
                                                                                id={`post-dispatch-contact-name-${index}`}
                                                                                name={`post-dispatch-contact-name-${index}`}
                                                                                label="Name"
                                                                                className="input field"
                                                                                type="text"
                                                                                value={
                                                                                    contactBlock.name
                                                                                        ? contactBlock.name
                                                                                        : ''
                                                                                }
                                                                                onChange={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockValueChange(
                                                                                        index,
                                                                                        newValue,
                                                                                        'name',
                                                                                        setPostDispatchContactBlocks,
                                                                                        postDispatchContactBlocks
                                                                                    )
                                                                                }
                                                                                onBlur={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldBlur(
                                                                                        index,
                                                                                        newValue,
                                                                                        'name',
                                                                                        setPostDispatchContactBlocks,
                                                                                        postDispatchContactBlocks
                                                                                    )
                                                                                }
                                                                                autoComplete="off"
                                                                                required
                                                                                maxLength={
                                                                                    255
                                                                                }
                                                                            />
                                                                            <Input
                                                                                id={`post-dispatch-contact-passcode-${index}`}
                                                                                name={`post-dispatch-contact-passcode-${index}`}
                                                                                label="Passcode"
                                                                                tooltip="At least 8 alpha-numeric characters"
                                                                                pattern="^[a-zA-Z0-9]{8,}$"
                                                                                title="Passcode must include a minimum of 8 alphanumeric characters."
                                                                                className="input field"
                                                                                type="text"
                                                                                value={
                                                                                    contactBlock.passcode
                                                                                        ? contactBlock.passcode
                                                                                        : ''
                                                                                }
                                                                                onChange={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockValueChange(
                                                                                        index,
                                                                                        newValue,
                                                                                        'passcode',
                                                                                        setPostDispatchContactBlocks,
                                                                                        postDispatchContactBlocks
                                                                                    )
                                                                                }
                                                                                onBlur={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldBlur(
                                                                                        index,
                                                                                        newValue,
                                                                                        'passcode',
                                                                                        setPostDispatchContactBlocks,
                                                                                        postDispatchContactBlocks
                                                                                    )
                                                                                }
                                                                                autoComplete="off"
                                                                                required
                                                                                minLength={
                                                                                    8
                                                                                }
                                                                                maxLength={
                                                                                    100
                                                                                }
                                                                            />
                                                                            <div>
                                                                                <Input
                                                                                    id={`post-dispatch-contact-primary-phone-${index}`}
                                                                                    name={`post-dispatch-contact-primary-phone-${index}`}
                                                                                    label="Primary Phone #"
                                                                                    className="input field"
                                                                                    type="text"
                                                                                    value={
                                                                                        contactBlock
                                                                                            .primary_phone
                                                                                            .phone
                                                                                            ? contactBlock
                                                                                                  .primary_phone
                                                                                                  .phone
                                                                                            : ''
                                                                                    }
                                                                                    onChange={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handlePostDispatchBlockPhoneValueChange(
                                                                                            index,
                                                                                            newValue,
                                                                                            'primary_phone',
                                                                                            setPostDispatchContactBlocks,
                                                                                            postDispatchContactBlocks
                                                                                        )
                                                                                    }
                                                                                    onBlur={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handlePostDispatchBlockPhoneFieldBlur(
                                                                                            index,
                                                                                            newValue,
                                                                                            'primary_phone',
                                                                                            setPostDispatchContactBlocks,
                                                                                            postDispatchContactBlocks
                                                                                        )
                                                                                    }
                                                                                    onFocus={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handlePostDispatchBlockPhoneFieldFocus(
                                                                                            index,
                                                                                            newValue,
                                                                                            'primary_phone',
                                                                                            setPostDispatchContactBlocks,
                                                                                            postDispatchContactBlocks
                                                                                        )
                                                                                    }
                                                                                    autoComplete="off"
                                                                                    required
                                                                                    minLength={
                                                                                        10
                                                                                    }
                                                                                    maxLength={
                                                                                        20
                                                                                    }
                                                                                />
                                                                                <div className="radioGroup">
                                                                                    <div className="radioBtn primary">
                                                                                        <input
                                                                                            type="radio"
                                                                                            id={`post-dispatch-contact-primary-phone-txt-${index}`}
                                                                                            name={`primary-phone-${index}`}
                                                                                            value="TXT"
                                                                                            checked={
                                                                                                contactBlock
                                                                                                    .primary_phone
                                                                                                    .text
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                const selectedValue =
                                                                                                    e
                                                                                                        .target
                                                                                                        .value;

                                                                                                handlePhoneNotificationTypeChange(
                                                                                                    index,
                                                                                                    selectedValue,
                                                                                                    'primary_phone',
                                                                                                    setPostDispatchContactBlocks,
                                                                                                    postDispatchContactBlocks
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                        <label
                                                                                            htmlFor={`post-dispatch-contact-primary-phone-txt-${index}`}
                                                                                        >
                                                                                            TXT
                                                                                        </label>
                                                                                    </div>
                                                                                    <div className="radioBtn primary">
                                                                                        <input
                                                                                            type="radio"
                                                                                            id={`post-dispatch-contact-primary-phone-call-${index}`}
                                                                                            name={`primary-phone-${index}`}
                                                                                            value="Call"
                                                                                            checked={
                                                                                                contactBlock
                                                                                                    .primary_phone
                                                                                                    .call
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                const selectedValue =
                                                                                                    e
                                                                                                        .target
                                                                                                        .value;

                                                                                                handlePhoneNotificationTypeChange(
                                                                                                    index,
                                                                                                    selectedValue,
                                                                                                    'primary_phone',
                                                                                                    setPostDispatchContactBlocks,
                                                                                                    postDispatchContactBlocks
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                        <label
                                                                                            htmlFor={`post-dispatch-contact-primary-phone-call-${index}`}
                                                                                        >
                                                                                            Call
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <Input
                                                                                    id={`post-dispatch-contact-second-phone-${index}`}
                                                                                    name={`post-dispatch-contact-second-phone-${index}`}
                                                                                    label="Secondary Phone #"
                                                                                    className="input field"
                                                                                    type="text"
                                                                                    value={
                                                                                        contactBlock
                                                                                            .secondary_phone
                                                                                            .phone
                                                                                            ? contactBlock
                                                                                                  .secondary_phone
                                                                                                  .phone
                                                                                            : ''
                                                                                    }
                                                                                    onChange={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handlePostDispatchBlockPhoneValueChange(
                                                                                            index,
                                                                                            newValue,
                                                                                            'secondary_phone',
                                                                                            setPostDispatchContactBlocks,
                                                                                            postDispatchContactBlocks
                                                                                        )
                                                                                    }
                                                                                    onBlur={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handlePostDispatchBlockPhoneFieldBlur(
                                                                                            index,
                                                                                            newValue,
                                                                                            'secondary_phone',
                                                                                            setPostDispatchContactBlocks,
                                                                                            postDispatchContactBlocks
                                                                                        )
                                                                                    }
                                                                                    onFocus={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handlePostDispatchBlockPhoneFieldFocus(
                                                                                            index,
                                                                                            newValue,
                                                                                            'secondary_phone',
                                                                                            setPostDispatchContactBlocks,
                                                                                            postDispatchContactBlocks
                                                                                        )
                                                                                    }
                                                                                    autoComplete="off"
                                                                                    required
                                                                                    minLength={
                                                                                        10
                                                                                    }
                                                                                    maxLength={
                                                                                        20
                                                                                    }
                                                                                />
                                                                                <div className="radioGroup">
                                                                                    <div className="radioBtn primary">
                                                                                        <input
                                                                                            type="radio"
                                                                                            id={`post-dispatch-contact-second-phone-txt-${index}`}
                                                                                            name={`second-phone-${index}`}
                                                                                            value="TXT"
                                                                                            checked={
                                                                                                contactBlock
                                                                                                    .secondary_phone
                                                                                                    .text
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                const selectedValue =
                                                                                                    e
                                                                                                        .target
                                                                                                        .value;

                                                                                                handlePhoneNotificationTypeChange(
                                                                                                    index,
                                                                                                    selectedValue,
                                                                                                    'secondary_phone',
                                                                                                    setPostDispatchContactBlocks,
                                                                                                    postDispatchContactBlocks
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                        <label
                                                                                            htmlFor={`post-dispatch-contact-second-phone-txt-${index}`}
                                                                                        >
                                                                                            TXT
                                                                                        </label>
                                                                                    </div>
                                                                                    <div className="radioBtn primary">
                                                                                        <input
                                                                                            type="radio"
                                                                                            id={`post-dispatch-contact-second-phone-call-${index}`}
                                                                                            name={`second-phone-${index}`}
                                                                                            value="Call"
                                                                                            checked={
                                                                                                contactBlock
                                                                                                    .secondary_phone
                                                                                                    .call
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                const selectedValue =
                                                                                                    e
                                                                                                        .target
                                                                                                        .value;

                                                                                                handlePhoneNotificationTypeChange(
                                                                                                    index,
                                                                                                    selectedValue,
                                                                                                    'secondary_phone',
                                                                                                    setPostDispatchContactBlocks,
                                                                                                    postDispatchContactBlocks
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                        <label
                                                                                            htmlFor={`post-dispatch-contact-second-phone-call-${index}`}
                                                                                        >
                                                                                            Call
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {errorMessage
                                                                .post_dispatch_contacts?.[
                                                                index
                                                            ] && (
                                                                <p
                                                                    id={`post-dispatch-contacts-error-${index}`}
                                                                    className="error"
                                                                    data-testid={`post-dispatch-contacts-error-${index}`}
                                                                >
                                                                    {
                                                                        errorMessage
                                                                            .post_dispatch_contacts?.[
                                                                            index
                                                                        ]
                                                                    }
                                                                </p>
                                                            )}
                                                        </Fragment>
                                                    );
                                                }
                                            )}

                                            {/* <div>
                                                <Button
                                                    id="add"
                                                    className={`btn outline ${
                                                        postDispatchContactBlocks.length >=
                                                        8
                                                            ? ''
                                                            : 'primary'
                                                    }`}
                                                    label="Add Parties +"
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            postDispatchContactBlocks.length <
                                                            8
                                                        ) {
                                                            setPostDispatchContactBlocks(
                                                                [
                                                                    ...postDispatchContactBlocks,
                                                                    {
                                                                        name: '',
                                                                        passcode:
                                                                            '',
                                                                        primary_phone:
                                                                            {
                                                                                phone: '',
                                                                                text: true,
                                                                                call: false,
                                                                            },
                                                                        secondary_phone:
                                                                            {
                                                                                phone: '',
                                                                                text: true,
                                                                                call: false,
                                                                            },
                                                                    },
                                                                ]
                                                            );
                                                        }
                                                    }}
                                                    disabled={
                                                        postDispatchContactBlocks.length <
                                                        8
                                                            ? false
                                                            : true
                                                    }
                                                />
                                            </div> */}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 'bold' }}>
                                                When a First Responder is
                                                dispatched, the event clip that
                                                triggered dispatch can be
                                                emailed. Please list the parties
                                                you wish to receive this video
                                                clip. mp4 is the file format.
                                            </p>
                                        </div>
                                        <div>
                                            <div className="report-email-template">
                                                {eventNotifyEmailBlocks.map(
                                                    (emailId, index) => {
                                                        return (
                                                            <Fragment
                                                                key={`event-notify-emailid-${index}`}
                                                            >
                                                                <div className="report-email-row">
                                                                    <div>
                                                                        <Input
                                                                            id={`event-notify-email-${index}`}
                                                                            name={`event-notify-email-${index}`}
                                                                            label={`Email ${
                                                                                index +
                                                                                1
                                                                            }`}
                                                                            className="input field"
                                                                            type="email"
                                                                            value={
                                                                                emailId
                                                                            }
                                                                            onChange={(
                                                                                newEmail
                                                                            ) => {
                                                                                const eventNotifyEmailBlocksCopy =
                                                                                    [
                                                                                        ...eventNotifyEmailBlocks,
                                                                                    ];

                                                                                eventNotifyEmailBlocksCopy[
                                                                                    index
                                                                                ] =
                                                                                    newEmail;
                                                                                setEventNotifyEmailBlocks(
                                                                                    eventNotifyEmailBlocksCopy
                                                                                );
                                                                            }}
                                                                            onBlur={(
                                                                                newEmail
                                                                            ) => {
                                                                                const eventNotifyEmailBlocksCopy =
                                                                                    [
                                                                                        ...eventNotifyEmailBlocks,
                                                                                    ];

                                                                                eventNotifyEmailBlocksCopy[
                                                                                    index
                                                                                ] =
                                                                                    newEmail
                                                                                        .replace(
                                                                                            /\s+/g,
                                                                                            ' '
                                                                                        )
                                                                                        .trim();
                                                                                setEventNotifyEmailBlocks(
                                                                                    eventNotifyEmailBlocksCopy
                                                                                );
                                                                            }}
                                                                            autoComplete="off"
                                                                            maxLength={
                                                                                255
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="deleteMonitorBlockContainer reportEmail">
                                                                        <DeleteIcon
                                                                            className="deleteIcon"
                                                                            onClick={() =>
                                                                                removeEventNotifyEmailEmailBlock(
                                                                                    index
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {errorMessage
                                                                    .event_notification_emails?.[
                                                                    index
                                                                ] && (
                                                                    <p
                                                                        id={`event-notification-emails-error-${index}`}
                                                                        className="error"
                                                                        data-testid={`event-notification-emails-error-${index}`}
                                                                    >
                                                                        {
                                                                            errorMessage
                                                                                .event_notification_emails?.[
                                                                                index
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                            </Fragment>
                                                        );
                                                    }
                                                )}

                                                <div className="timeBlocksButtonContainer">
                                                    <button
                                                        type="button"
                                                        className="btn outline primary"
                                                        onClick={() => {
                                                            setEventNotifyEmailBlocks(
                                                                [
                                                                    ...eventNotifyEmailBlocks,
                                                                    '',
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        Add More Email +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Subscribers Authorized Delegate */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 3 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 3)}
                        >
                            <div className="section-container-header-caption">
                                Subscribers Authorized Delegate
                            </div>
                            <div className="section-container-header-toggle">
                                {isSubscriberAuthorizedDelegateVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 3 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 3 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <p>
                                                If applicable, the subscriber
                                                can have an authorized delegate
                                                to contact the monitoring
                                                operations center to arm or
                                                disarm the video monitoring.
                                                These individuals can also be
                                                the primary point of contact
                                                when the subscriber provides
                                                notice to the monitoring
                                                operations center. Example would
                                                be the subscriber will be out of
                                                country or unavailable should
                                                operations need to contact a
                                                primary point of contact other
                                                than the dealer. (Up to 4
                                                delegates)
                                            </p>
                                        </div>
                                        <div>
                                            {/* Section - Subscribers Authorized Delegate Subsections */}
                                            {subscriberAuthorizedDelegateBlocks.map(
                                                (contactBlock, index) => {
                                                    return (
                                                        <Fragment
                                                            key={`subscriber-authorized-delegate-block-${index}`}
                                                        >
                                                            <div className="section-container">
                                                                <div
                                                                    className={`section-container-header ${
                                                                        activeSubSection.subscriber_authorized_delegates ===
                                                                        index
                                                                            ? 'active-header'
                                                                            : ''
                                                                    }`}
                                                                    onClick={() =>
                                                                        toggleSubSection(
                                                                            'subscriber_authorized_delegates',
                                                                            index
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="section-container-header-caption">
                                                                        Contacts
                                                                    </div>
                                                                    <div className="section-container-header-toolbar">
                                                                        <div className="section-node-toolbar-button">
                                                                            <DeleteIcon
                                                                                className="deleteIcon"
                                                                                onClick={(
                                                                                    event
                                                                                ) => {
                                                                                    event.stopPropagation();
                                                                                    removeSubscriberAuthorizedDelegateBlock(
                                                                                        index
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="section-container-header-toggle">
                                                                        {(activeSubSection.subscriber_authorized_delegates ===
                                                                            index && (
                                                                            <FaChevronDown />
                                                                        )) || (
                                                                            <FaChevronRight />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {activeSubSection.subscriber_authorized_delegates ===
                                                                    index && (
                                                                    <div className="section-container-body">
                                                                        <div className="section-node">
                                                                            <Input
                                                                                id={`subscriber-authorized-delegate-name-${index}`}
                                                                                name={`subscriber-authorized-delegate-name-${index}`}
                                                                                label="Name"
                                                                                className="input field"
                                                                                type="text"
                                                                                value={
                                                                                    contactBlock.name
                                                                                        ? contactBlock.name
                                                                                        : ''
                                                                                }
                                                                                onChange={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockValueChange(
                                                                                        index,
                                                                                        newValue,
                                                                                        'name',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                onBlur={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldBlur(
                                                                                        index,
                                                                                        newValue,
                                                                                        'name',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                autoComplete="off"
                                                                                maxLength={
                                                                                    255
                                                                                }
                                                                            />
                                                                            <Input
                                                                                id={`subscriber-authorized-delegate-passcode-${index}`}
                                                                                name={`subscriber-authorized-delegate-passcode-${index}`}
                                                                                label="Passcode"
                                                                                tooltip="At least 8 alpha-numeric characters"
                                                                                pattern="^[a-zA-Z0-9]{8,}$"
                                                                                title="Passcode must include a minimum of 8 alphanumeric characters."
                                                                                className="input field"
                                                                                type="text"
                                                                                value={
                                                                                    contactBlock.passcode
                                                                                        ? contactBlock.passcode
                                                                                        : ''
                                                                                }
                                                                                onChange={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockValueChange(
                                                                                        index,
                                                                                        newValue,
                                                                                        'passcode',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                onBlur={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldBlur(
                                                                                        index,
                                                                                        newValue,
                                                                                        'passcode',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                autoComplete="off"
                                                                                minLength={
                                                                                    8
                                                                                }
                                                                                maxLength={
                                                                                    100
                                                                                }
                                                                            />
                                                                            <Input
                                                                                id={`subscriber-authorized-delegate-primary-phone-${index}`}
                                                                                name={`subscriber-authorized-delegate-primary-phone-${index}`}
                                                                                label="Primary Phone #"
                                                                                className="input field"
                                                                                type="text"
                                                                                value={
                                                                                    contactBlock.primary_phone
                                                                                        ? contactBlock.primary_phone
                                                                                        : ''
                                                                                }
                                                                                onChange={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockValueChange(
                                                                                        index,
                                                                                        newValue,
                                                                                        'primary_phone',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                onBlur={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldBlur(
                                                                                        index,
                                                                                        newValue,
                                                                                        'primary_phone',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                onFocus={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldFocus(
                                                                                        index,
                                                                                        newValue,
                                                                                        'primary_phone',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                autoComplete="off"
                                                                                minLength={
                                                                                    10
                                                                                }
                                                                                maxLength={
                                                                                    20
                                                                                }
                                                                            />
                                                                            <Input
                                                                                id={`subscriber-authorized-delegate-second-phone-${index}`}
                                                                                name={`subscriber-authorized-delegate-second-phone-${index}`}
                                                                                label="Secondary Phone #"
                                                                                className="input field"
                                                                                type="text"
                                                                                value={
                                                                                    contactBlock.secondary_phone
                                                                                        ? contactBlock.secondary_phone
                                                                                        : ''
                                                                                }
                                                                                onChange={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockValueChange(
                                                                                        index,
                                                                                        newValue,
                                                                                        'secondary_phone',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                onBlur={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldBlur(
                                                                                        index,
                                                                                        newValue,
                                                                                        'secondary_phone',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                onFocus={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldFocus(
                                                                                        index,
                                                                                        newValue,
                                                                                        'secondary_phone',
                                                                                        setSubscriberAuthorizedDelegateBlocks,
                                                                                        subscriberAuthorizedDelegateBlocks
                                                                                    )
                                                                                }
                                                                                autoComplete="off"
                                                                                minLength={
                                                                                    10
                                                                                }
                                                                                maxLength={
                                                                                    20
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {errorMessage
                                                                .subscriber_authorized_delegates?.[
                                                                index
                                                            ] && (
                                                                <p
                                                                    id={`subscriber-authorized-delegate-error-${index}`}
                                                                    className="error"
                                                                    data-testid={`subscriber-authorized-delegate-error-${index}`}
                                                                >
                                                                    {
                                                                        errorMessage
                                                                            .subscriber_authorized_delegates?.[
                                                                            index
                                                                        ]
                                                                    }
                                                                </p>
                                                            )}
                                                        </Fragment>
                                                    );
                                                }
                                            )}

                                            <div>
                                                <Button
                                                    id="add"
                                                    className={`btn outline ${
                                                        subscriberAuthorizedDelegateBlocks.length >=
                                                        4
                                                            ? ''
                                                            : 'primary'
                                                    }`}
                                                    label="Add Contacts +"
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            subscriberAuthorizedDelegateBlocks.length <
                                                            4
                                                        ) {
                                                            setSubscriberAuthorizedDelegateBlocks(
                                                                [
                                                                    ...subscriberAuthorizedDelegateBlocks,
                                                                    {
                                                                        name: '',
                                                                        passcode:
                                                                            '',
                                                                        primary_phone:
                                                                            '',
                                                                        secondary_phone:
                                                                            '',
                                                                    },
                                                                ]
                                                            );
                                                        }
                                                    }}
                                                    disabled={
                                                        subscriberAuthorizedDelegateBlocks.length <
                                                        4
                                                            ? false
                                                            : true
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Video Camera Details */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 4 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 4)}
                        >
                            <div className="section-container-header-caption">
                                Video Camera Details
                            </div>
                            <div className="section-container-header-toggle">
                                {isVideoCameraDetailsVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 4 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 4 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <p style={{ fontWeight: 'bold' }}>
                                                Video Camera Details (Zone #
                                                will be added after cameras are
                                                enrolled into Evolon Insites)
                                            </p>
                                            <p style={{ fontWeight: 'bold' }}>
                                                Dealer and Subscriber, please
                                                add model sections
                                            </p>
                                        </div>
                                        <div className="camera-details-section">
                                            <table
                                                id="camera-details-table"
                                                className="camera-details-table"
                                                border={1}
                                                cellPadding={5}
                                                cellSpacing={0}
                                            >
                                                <thead>
                                                    {videoCameraDetailsTable
                                                        .getHeaderGroups()
                                                        .map((headerGroup) => (
                                                            <tr
                                                                key={
                                                                    headerGroup.id
                                                                }
                                                            >
                                                                {headerGroup.headers.map(
                                                                    (
                                                                        header
                                                                    ) => (
                                                                        <th
                                                                            key={
                                                                                header.id
                                                                            }
                                                                        >
                                                                            {header.isPlaceholder
                                                                                ? null
                                                                                : flexRender(
                                                                                      header
                                                                                          .column
                                                                                          .columnDef
                                                                                          .header,
                                                                                      header.getContext()
                                                                                  )}
                                                                        </th>
                                                                    )
                                                                )}
                                                            </tr>
                                                        ))}
                                                </thead>
                                                <tbody>
                                                    {videoCameraDetailsTable.getRowModel()
                                                        .rows.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={
                                                                    videoCameraDetailsColumns.length
                                                                }
                                                            >
                                                                No Camera found.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        videoCameraDetailsTable
                                                            .getRowModel()
                                                            .rows.map((row) => (
                                                                <tr
                                                                    key={row.id}
                                                                >
                                                                    {row
                                                                        .getVisibleCells()
                                                                        .map(
                                                                            (
                                                                                cell
                                                                            ) => (
                                                                                <td
                                                                                    key={
                                                                                        cell.id
                                                                                    }
                                                                                >
                                                                                    {flexRender(
                                                                                        cell
                                                                                            .column
                                                                                            .columnDef
                                                                                            .cell,
                                                                                        cell.getContext()
                                                                                    )}
                                                                                </td>
                                                                            )
                                                                        )}
                                                                </tr>
                                                            ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Audio Horn Details */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 5 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 5)}
                        >
                            <div className="section-container-header-caption">
                                Audio Horn Details
                            </div>
                            <div className="section-container-header-toggle">
                                {isAudioHornDetailsVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 5 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 5 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <p style={{ fontWeight: 'bold' }}>
                                                Audio Horn Details (document:
                                                type / name / message the will
                                                be announced)
                                            </p>
                                            <p style={{ fontWeight: 'bold' }}>
                                                Currently Horn support is
                                                limited to Axis Communications
                                                Horns/Strobes
                                            </p>
                                        </div>
                                        <div>
                                            {/* Section - Audio Horn Details Subsections */}
                                            <div className="audio-horn-details-section">
                                                <table
                                                    id="audio-horn-details-table"
                                                    className="audio-horn-details-table"
                                                    border={1}
                                                    cellPadding={5}
                                                    cellSpacing={0}
                                                >
                                                    <thead>
                                                        {audioHornDetailsTable
                                                            .getHeaderGroups()
                                                            .map(
                                                                (
                                                                    headerGroup
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            headerGroup.id
                                                                        }
                                                                    >
                                                                        {headerGroup.headers.map(
                                                                            (
                                                                                header
                                                                            ) => (
                                                                                <th
                                                                                    key={
                                                                                        header.id
                                                                                    }
                                                                                >
                                                                                    {header.isPlaceholder
                                                                                        ? null
                                                                                        : flexRender(
                                                                                              header
                                                                                                  .column
                                                                                                  .columnDef
                                                                                                  .header,
                                                                                              header.getContext()
                                                                                          )}
                                                                                </th>
                                                                            )
                                                                        )}
                                                                    </tr>
                                                                )
                                                            )}
                                                    </thead>
                                                    <tbody>
                                                        {audioHornDetailsTable.getRowModel()
                                                            .rows.length ===
                                                        0 ? (
                                                            <tr>
                                                                <td
                                                                    colSpan={
                                                                        audioHornColumns.length
                                                                    }
                                                                >
                                                                    No Audio
                                                                    horn details
                                                                    found.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            audioHornDetailsTable
                                                                .getRowModel()
                                                                .rows.map(
                                                                    (row) => (
                                                                        <tr
                                                                            key={
                                                                                row.id
                                                                            }
                                                                        >
                                                                            {row
                                                                                .getVisibleCells()
                                                                                .map(
                                                                                    (
                                                                                        cell
                                                                                    ) => (
                                                                                        <td
                                                                                            key={
                                                                                                cell.id
                                                                                            }
                                                                                        >
                                                                                            {flexRender(
                                                                                                cell
                                                                                                    .column
                                                                                                    .columnDef
                                                                                                    .cell,
                                                                                                cell.getContext()
                                                                                            )}
                                                                                        </td>
                                                                                    )
                                                                                )}
                                                                        </tr>
                                                                    )
                                                                )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {/* {audioHornDetailsBlocks.map(
                                                (hornBlock, index) => {
                                                    return (
                                                        <Fragment
                                                            key={`audio-horn-details-block-${index}`}
                                                        >
                                                            <div className="section-container">
                                                                <div
                                                                    className={`section-container-header ${
                                                                        activeSubSection.audio_horn_list ===
                                                                        index
                                                                            ? 'active-header'
                                                                            : ''
                                                                    }`}
                                                                    onClick={() =>
                                                                        toggleSubSection(
                                                                            'audio_horn_list',
                                                                            index
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="section-container-header-caption">
                                                                        Horn
                                                                        Details
                                                                    </div>
                                                                    <div className="section-container-header-toggle">
                                                                        {(activeSubSection.audio_horn_list ===
                                                                            index && (
                                                                            <FaChevronDown />
                                                                        )) || (
                                                                            <FaChevronRight />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {activeSubSection.audio_horn_list ===
                                                                    index && (
                                                                    <div className="section-container-body">
                                                                        <div className="section-node">
                                                                            <Input
                                                                                id={`audio-horn-details-model-${index}`}
                                                                                name={`audio-horn-details-model-${index}`}
                                                                                label="Model"
                                                                                className="input field"
                                                                                type="text"
                                                                                value={
                                                                                    hornBlock.network_device_type_name
                                                                                        ? hornBlock.network_device_type_name
                                                                                        : ''
                                                                                }
                                                                                onChange={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockValueChange(
                                                                                        index,
                                                                                        newValue,
                                                                                        'network_device_type_name',
                                                                                        setAudioHornDetailsBlocks,
                                                                                        audioHornDetailsBlocks
                                                                                    )
                                                                                }
                                                                                onBlur={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldBlur(
                                                                                        index,
                                                                                        newValue,
                                                                                        'network_device_type_name',
                                                                                        setAudioHornDetailsBlocks,
                                                                                        audioHornDetailsBlocks
                                                                                    )
                                                                                }
                                                                                autoComplete="off"
                                                                                maxLength={
                                                                                    255
                                                                                }
                                                                            />
                                                                            <Input
                                                                                id={`audio-horn-details-name-${index}`}
                                                                                name={`audio-horn-details-name-${index}`}
                                                                                label=" Name / Description"
                                                                                className="input field"
                                                                                type="text"
                                                                                value={
                                                                                    hornBlock.network_device_name
                                                                                        ? hornBlock.network_device_name
                                                                                        : ''
                                                                                }
                                                                                onChange={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockValueChange(
                                                                                        index,
                                                                                        newValue,
                                                                                        'network_device_name',
                                                                                        setAudioHornDetailsBlocks,
                                                                                        audioHornDetailsBlocks
                                                                                    )
                                                                                }
                                                                                onBlur={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldBlur(
                                                                                        index,
                                                                                        newValue,
                                                                                        'network_device_name',
                                                                                        setAudioHornDetailsBlocks,
                                                                                        audioHornDetailsBlocks
                                                                                    )
                                                                                }
                                                                                autoComplete="off"
                                                                                maxLength={
                                                                                    255
                                                                                }
                                                                            />
                                                                            <Input
                                                                                id={`audio-horn-details-message-${index}`}
                                                                                name={`audio-horn-details-message-${index}`}
                                                                                label="Announcement / Message"
                                                                                className="input field"
                                                                                type="text"
                                                                                value={
                                                                                    hornBlock.anouncement
                                                                                        ? hornBlock.anouncement
                                                                                        : ''
                                                                                }
                                                                                onChange={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockValueChange(
                                                                                        index,
                                                                                        newValue,
                                                                                        'anouncement',
                                                                                        setAudioHornDetailsBlocks,
                                                                                        audioHornDetailsBlocks
                                                                                    )
                                                                                }
                                                                                onBlur={(
                                                                                    newValue
                                                                                ) =>
                                                                                    handleBlockFieldBlur(
                                                                                        index,
                                                                                        newValue,
                                                                                        'anouncement',
                                                                                        setAudioHornDetailsBlocks,
                                                                                        audioHornDetailsBlocks
                                                                                    )
                                                                                }
                                                                                autoComplete="off"
                                                                                maxLength={
                                                                                    255
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Fragment>
                                                    );
                                                }
                                            )} */}

                                            {/* <div>
                                                <Button
                                                    id="add"
                                                    className={`btn outline ${
                                                        subscriberAuthorizedDelegateBlocks.length >=
                                                        4
                                                            ? ''
                                                            : 'primary'
                                                    }`}
                                                    label="Add Contacts +"
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            subscriberAuthorizedDelegateBlocks.length <
                                                            4
                                                        ) {
                                                            setSubscriberAuthorizedDelegateBlocks(
                                                                [
                                                                    ...subscriberAuthorizedDelegateBlocks,
                                                                    {
                                                                        name: '',
                                                                        passcode:
                                                                            '',
                                                                        primary_phone:
                                                                            '',
                                                                        secondary_phone:
                                                                            '',
                                                                    },
                                                                ]
                                                            );
                                                        }
                                                    }}
                                                    disabled={
                                                        subscriberAuthorizedDelegateBlocks.length <
                                                        4
                                                            ? false
                                                            : true
                                                    }
                                                />
                                            </div> */}
                                            {/* {errorMessage.audio_horn_list && (
                                                <p
                                                    id="audio-horn-details-error"
                                                    className="error"
                                                    data-testid="audio-horn-details-error"
                                                >
                                                    {
                                                        errorMessage.audio_horn_list
                                                    }
                                                </p>
                                            )} */}
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - SOS Action Plan */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 6 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 6)}
                        >
                            <div className="section-container-header-caption">
                                SOS Action Plan
                            </div>
                            <div className="section-container-header-toggle">
                                {isSOSActionPlanVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 6 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 6 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <div>
                                                <p
                                                    style={{
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    SOS Action Plan: for
                                                    Professional Monitoring and
                                                    SOS plans, please provide
                                                    the Action Plan for the
                                                    Professional Monitoring
                                                    Center to follow
                                                </p>
                                            </div>
                                            <div>
                                                <span>
                                                    Dispatch Immediately
                                                </span>
                                                <span className="asterisk">
                                                    *
                                                </span>
                                                <div className="radioGroup">
                                                    {dispatchImmediatelyOptions.map(
                                                        (
                                                            dispatchTeam,
                                                            index
                                                        ) => {
                                                            return (
                                                                <Fragment
                                                                    key={`dispatch-team-${index}`}
                                                                >
                                                                    <div className="radioBtn primary">
                                                                        <input
                                                                            type="radio"
                                                                            id={`dispatch-team-${dispatchTeam.toLowerCase()}`}
                                                                            name="dispatch-team"
                                                                            value={`${dispatchTeam}`}
                                                                            checked={
                                                                                sosDispatchImmediately ===
                                                                                dispatchTeam
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) => {
                                                                                const selectedValue =
                                                                                    e
                                                                                        .target
                                                                                        .value as DispatchImmediatelyTypes;
                                                                                setSubscriberFactSheetData(
                                                                                    {
                                                                                        ...subscriberFactSheetData,
                                                                                        sos_action_plan:
                                                                                            {
                                                                                                ...subscriberFactSheetData.sos_action_plan,
                                                                                                dispatch_immediately:
                                                                                                    selectedValue,
                                                                                            },
                                                                                    }
                                                                                );

                                                                                setSOSDispatchImmediately(
                                                                                    selectedValue
                                                                                );
                                                                            }}
                                                                        />
                                                                        <label
                                                                            htmlFor={`dispatch-team-${dispatchTeam.toLowerCase()}`}
                                                                        >
                                                                            {
                                                                                dispatchTeam
                                                                            }
                                                                        </label>
                                                                    </div>
                                                                </Fragment>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p>
                                                    After Primary Dispatch has
                                                    occured, the following
                                                    action should be taken
                                                </p>
                                                <p>
                                                    <span
                                                        style={{
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        Example:{' '}
                                                    </span>
                                                    Sound Horn and Siren -
                                                    Strobe: Announcement:
                                                    Trespassing , trigger siren
                                                    and strobe profile #2.
                                                </p>
                                            </div>
                                            <div>
                                                <Input
                                                    id="post_dispatch_action"
                                                    name="post_dispatch_action"
                                                    label=""
                                                    className="input field"
                                                    type="text"
                                                    value={
                                                        'post_dispatch_action' in
                                                            subscriberFactSheetData.sos_action_plan &&
                                                        subscriberFactSheetData.sos_action_plan.post_dispatch_action?.trim()
                                                            ? subscriberFactSheetData
                                                                  .sos_action_plan
                                                                  .post_dispatch_action
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        setSubscriberFactSheetData(
                                                            {
                                                                ...subscriberFactSheetData,
                                                                sos_action_plan:
                                                                    {
                                                                        ...subscriberFactSheetData.sos_action_plan,
                                                                        post_dispatch_action:
                                                                            value,
                                                                    },
                                                            }
                                                        )
                                                    }
                                                    onBlur={(value) => {
                                                        const trimmedValue =
                                                            value
                                                                .replace(
                                                                    /\s+/g,
                                                                    ' '
                                                                )
                                                                .trim();
                                                        if (
                                                            value !==
                                                            trimmedValue
                                                        ) {
                                                            setSubscriberFactSheetData(
                                                                {
                                                                    ...subscriberFactSheetData,
                                                                    sos_action_plan:
                                                                        {
                                                                            ...subscriberFactSheetData.sos_action_plan,
                                                                            post_dispatch_action:
                                                                                trimmedValue,
                                                                        },
                                                                }
                                                            );
                                                        }
                                                    }}
                                                    autoComplete="off"
                                                    maxLength={1024}
                                                />
                                            </div>
                                            <div>
                                                <p>
                                                    Notification to the
                                                    following parties that a SOS
                                                    dispatch has occurred.
                                                </p>
                                                <p>
                                                    <span
                                                        style={{
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        Note:{' '}
                                                    </span>
                                                    If party details are
                                                    deleted, the contact details
                                                    will also be removed from
                                                    the SOS Action Plan.
                                                </p>
                                            </div>
                                            <div>
                                                {/* Section - SOS Notification Recipients Subsections */}
                                                {sosNotificationReceipientsBlocks.map(
                                                    (
                                                        recipientsDetails,
                                                        index
                                                    ) => {
                                                        return (
                                                            <Fragment
                                                                key={`sos-notification-recipients-block-${index}`}
                                                            >
                                                                <div className="section-container">
                                                                    <div
                                                                        className={`section-container-header ${
                                                                            activeSubSection.sos_notification_recipients ===
                                                                            index
                                                                                ? 'active-header'
                                                                                : ''
                                                                        }`}
                                                                        onClick={() =>
                                                                            toggleSubSection(
                                                                                'sos_notification_recipients',
                                                                                index
                                                                            )
                                                                        }
                                                                    >
                                                                        <div className="section-container-header-caption">
                                                                            Contacts
                                                                            {recipientsDetails.is_from_party &&
                                                                                recipientsDetails.party_id !==
                                                                                    0 &&
                                                                                ` (Party - ${
                                                                                    recipientsDetails.party_id
                                                                                }${
                                                                                    recipientsDetails.name
                                                                                        ? ` - ${recipientsDetails.name}`
                                                                                        : ''
                                                                                })`}
                                                                        </div>
                                                                        {index !==
                                                                            0 && (
                                                                            <div className="section-container-header-toolbar">
                                                                                <div className="section-node-toolbar-button">
                                                                                    <DeleteIcon
                                                                                        className="deleteIcon"
                                                                                        onClick={(
                                                                                            event
                                                                                        ) => {
                                                                                            event.stopPropagation();
                                                                                            removeSOSNotificationRecipientsBlock(
                                                                                                index
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        <div className="section-container-header-toggle">
                                                                            {(activeSubSection.sos_notification_recipients ===
                                                                                index && (
                                                                                <FaChevronDown />
                                                                            )) || (
                                                                                <FaChevronRight />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {activeSubSection.sos_notification_recipients ===
                                                                        index && (
                                                                        <div className="section-container-body">
                                                                            <div className="section-node">
                                                                                <div className="checkbox-spacing">
                                                                                    <label
                                                                                        htmlFor={`select_from_party-${index}`}
                                                                                    >
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={
                                                                                                'is_from_party' in
                                                                                                recipientsDetails
                                                                                                    ? recipientsDetails.is_from_party
                                                                                                    : false
                                                                                            }
                                                                                            id={`select_from_party-${index}`}
                                                                                            // name="operator_signals"
                                                                                            className="checkbox-input"
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                const isChecked =
                                                                                                    e
                                                                                                        .target
                                                                                                        .checked;
                                                                                                handleSOSSelectPartyChange(
                                                                                                    index,
                                                                                                    isChecked,
                                                                                                    setSosNotificationReceipientsBlocks,
                                                                                                    sosNotificationReceipientsBlocks
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                        <span className="checkbox-label">
                                                                                            Select
                                                                                            from
                                                                                            Post-Dispatch
                                                                                            Party
                                                                                        </span>
                                                                                    </label>
                                                                                </div>
                                                                                {recipientsDetails.is_from_party && (
                                                                                    <div className="select-container field">
                                                                                        <label
                                                                                            htmlFor={`license-type-select-${index}`}
                                                                                        >
                                                                                            <span className="label">
                                                                                                Party
                                                                                            </span>
                                                                                            <span className="asterisk">
                                                                                                *
                                                                                            </span>
                                                                                        </label>
                                                                                        <SingleSelect
                                                                                            id={`license-type-select-${index}`}
                                                                                            placeholder="Please select Party"
                                                                                            value={partyOptions.find(
                                                                                                (
                                                                                                    option
                                                                                                ) =>
                                                                                                    option.value ===
                                                                                                    String(
                                                                                                        recipientsDetails.party_id
                                                                                                    )
                                                                                            )}
                                                                                            onChange={(
                                                                                                newValue
                                                                                            ) => {
                                                                                                handleSOSPartyChange(
                                                                                                    index,
                                                                                                    Number(
                                                                                                        newValue?.value
                                                                                                    ),
                                                                                                    setSosNotificationReceipientsBlocks,
                                                                                                    sosNotificationReceipientsBlocks
                                                                                                );
                                                                                            }}
                                                                                            options={
                                                                                                partyOptions
                                                                                            }
                                                                                            required
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                                <Input
                                                                                    id={`sos-notification-recipients-name-${index}`}
                                                                                    name={`sos-notification-recipients-name-${index}`}
                                                                                    label="Name"
                                                                                    className={`input field ${
                                                                                        recipientsDetails.is_from_party &&
                                                                                        'disabled'
                                                                                    }`}
                                                                                    type="text"
                                                                                    value={
                                                                                        recipientsDetails.name
                                                                                            ? recipientsDetails.name
                                                                                            : ''
                                                                                    }
                                                                                    onChange={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handleBlockValueChange(
                                                                                            index,
                                                                                            newValue,
                                                                                            'name',
                                                                                            setSosNotificationReceipientsBlocks,
                                                                                            sosNotificationReceipientsBlocks
                                                                                        )
                                                                                    }
                                                                                    onBlur={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handleBlockFieldBlur(
                                                                                            index,
                                                                                            newValue,
                                                                                            'name',
                                                                                            setSosNotificationReceipientsBlocks,
                                                                                            sosNotificationReceipientsBlocks
                                                                                        )
                                                                                    }
                                                                                    autoComplete="off"
                                                                                    required
                                                                                    maxLength={
                                                                                        255
                                                                                    }
                                                                                    disabled={
                                                                                        recipientsDetails.is_from_party
                                                                                            ? true
                                                                                            : false
                                                                                    }
                                                                                />
                                                                                <Input
                                                                                    id={`sos-notification-recipients-phone-${index}`}
                                                                                    name={`sos-notification-recipients-phone-${index}`}
                                                                                    label="Mobile"
                                                                                    className={`input field ${
                                                                                        recipientsDetails.is_from_party &&
                                                                                        'disabled'
                                                                                    }`}
                                                                                    type="text"
                                                                                    value={
                                                                                        recipientsDetails.phone
                                                                                            ? recipientsDetails.phone
                                                                                            : ''
                                                                                    }
                                                                                    onChange={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handleBlockValueChange(
                                                                                            index,
                                                                                            newValue,
                                                                                            'phone',
                                                                                            setSosNotificationReceipientsBlocks,
                                                                                            sosNotificationReceipientsBlocks
                                                                                        )
                                                                                    }
                                                                                    onBlur={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handleBlockFieldBlur(
                                                                                            index,
                                                                                            newValue,
                                                                                            'phone',
                                                                                            setSosNotificationReceipientsBlocks,
                                                                                            sosNotificationReceipientsBlocks
                                                                                        )
                                                                                    }
                                                                                    onFocus={(
                                                                                        newValue
                                                                                    ) =>
                                                                                        handleBlockFieldFocus(
                                                                                            index,
                                                                                            newValue,
                                                                                            'phone',
                                                                                            setSosNotificationReceipientsBlocks,
                                                                                            sosNotificationReceipientsBlocks
                                                                                        )
                                                                                    }
                                                                                    autoComplete="off"
                                                                                    required
                                                                                    minLength={
                                                                                        10
                                                                                    }
                                                                                    maxLength={
                                                                                        20
                                                                                    }
                                                                                    disabled={
                                                                                        recipientsDetails.is_from_party
                                                                                            ? true
                                                                                            : false
                                                                                    }
                                                                                />
                                                                                <div className="radioGroup">
                                                                                    <div className="radioBtn primary">
                                                                                        <input
                                                                                            type="radio"
                                                                                            id={`sos-notification-recipients-phone-txt-${index}`}
                                                                                            name={`phone-${index}`}
                                                                                            value="TXT"
                                                                                            checked={
                                                                                                recipientsDetails.text
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                const selectedValue =
                                                                                                    e
                                                                                                        .target
                                                                                                        .value;

                                                                                                handleSOSNotificationTypeChange(
                                                                                                    index,
                                                                                                    selectedValue,
                                                                                                    setSosNotificationReceipientsBlocks,
                                                                                                    sosNotificationReceipientsBlocks
                                                                                                );
                                                                                            }}
                                                                                            disabled={
                                                                                                recipientsDetails.is_from_party
                                                                                                    ? true
                                                                                                    : false
                                                                                            }
                                                                                        />
                                                                                        <label
                                                                                            className={`${
                                                                                                recipientsDetails.is_from_party &&
                                                                                                'disabled'
                                                                                            }`}
                                                                                            htmlFor={`sos-notification-recipients-phone-txt-${index}`}
                                                                                        >
                                                                                            TXT
                                                                                        </label>
                                                                                    </div>
                                                                                    <div className="radioBtn primary">
                                                                                        <input
                                                                                            type="radio"
                                                                                            id={`sos-notification-recipients-phone-call-${index}`}
                                                                                            name={`phone-${index}`}
                                                                                            value="Call"
                                                                                            checked={
                                                                                                recipientsDetails.call
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                const selectedValue =
                                                                                                    e
                                                                                                        .target
                                                                                                        .value;

                                                                                                handleSOSNotificationTypeChange(
                                                                                                    index,
                                                                                                    selectedValue,
                                                                                                    setSosNotificationReceipientsBlocks,
                                                                                                    sosNotificationReceipientsBlocks
                                                                                                );
                                                                                            }}
                                                                                            disabled={
                                                                                                recipientsDetails.is_from_party
                                                                                                    ? true
                                                                                                    : false
                                                                                            }
                                                                                        />
                                                                                        <label
                                                                                            className={`${
                                                                                                recipientsDetails.is_from_party &&
                                                                                                'disabled'
                                                                                            }`}
                                                                                            htmlFor={`sos-notification-recipients-phone-call-${index}`}
                                                                                        >
                                                                                            Call
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {errorMessage
                                                                    .sos_action_plan?.[
                                                                    index
                                                                ] && (
                                                                    <p
                                                                        id={`sos-action-plan-error-${index}`}
                                                                        className="error"
                                                                        data-testid={`sos-action-plan-error-${index}`}
                                                                    >
                                                                        {
                                                                            errorMessage
                                                                                .sos_action_plan?.[
                                                                                index
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                            </Fragment>
                                                        );
                                                    }
                                                )}
                                                <div>
                                                    <Button
                                                        id="add"
                                                        className="btn outline primary"
                                                        label="Add Recipients +"
                                                        type="button"
                                                        onClick={() => {
                                                            setSosNotificationReceipientsBlocks(
                                                                [
                                                                    ...sosNotificationReceipientsBlocks,
                                                                    defaultSOSNotificationReceipients,
                                                                ]
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Runaway Alarms */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 7 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 7)}
                        >
                            <div className="section-container-header-caption">
                                Runaway Alarms
                            </div>
                            <div className="section-container-header-toggle">
                                {isRunAwayAlarmVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 7 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 7 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <p
                                                style={{
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                Runaway Alarms: Procedure for
                                                Professional Monitoring
                                                Operations to follow.
                                            </p>
                                        </div>
                                        <div>
                                            <p>
                                                Runaway alarms from cameras can
                                                be caused by a number of issues;
                                                a malfunctioning camera,
                                                weather, insects around the
                                                lens, debris/flapping tarps,
                                                etc. When events like this
                                                occur, the Monitoring Center
                                                Operators can be overwhelmed
                                                with alarms. When this occurs,
                                                the Operators will need to
                                                follow the following procedure.
                                            </p>
                                        </div>
                                        <div>
                                            <div className="runaway-alarm-grid">
                                                {/* <div className="grid-row"> */}
                                                <div className="grid-cell">
                                                    <p>1) Notify Dealer</p>
                                                </div>
                                                <div className="grid-cell">
                                                    <p>
                                                        Notify the Dealer of the
                                                        runaway zone/camera and
                                                        site. The Monitor Center
                                                        Operator will
                                                        communicate to the
                                                        Dealer the condition
                                                        that is causing the
                                                        runaway alarm.
                                                    </p>
                                                </div>
                                                {/* </div>
                                                    <div className="grid-row"> */}
                                                <div className="grid-cell">
                                                    <p>
                                                        2) Put specific
                                                        zone/camera/site on test
                                                        for the following times
                                                    </p>
                                                </div>
                                                <div className="grid-cell">
                                                    <div className="radioGroup">
                                                        {runawayAlarmIntervalOptions.map(
                                                            (
                                                                interval,
                                                                index
                                                            ) => {
                                                                return (
                                                                    <Fragment
                                                                        key={`interval-${index}`}
                                                                    >
                                                                        <div className="radioBtn primary">
                                                                            <input
                                                                                type="radio"
                                                                                id={`interval-${interval.toLowerCase()}`}
                                                                                name="runaway_alarm_interval"
                                                                                value={
                                                                                    interval
                                                                                }
                                                                                // checked={
                                                                                //     subscriberFactSheetData.runaway_alarm
                                                                                //         ? subscriberFactSheetData
                                                                                //               .runaway_alarm
                                                                                //               .test_duration ===
                                                                                //           interval
                                                                                //         : defaultRunawayAlarmInterval ===
                                                                                //           interval
                                                                                // }
                                                                                checked={
                                                                                    runAwayAlarmTestDuration ===
                                                                                    interval
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) => {
                                                                                    const selectedValue =
                                                                                        e
                                                                                            .target
                                                                                            .value as DispatchImmediatelyTypes;
                                                                                    // setSubscriberFactSheetData(
                                                                                    //     {
                                                                                    //         ...subscriberFactSheetData,
                                                                                    //         runaway_alarm:
                                                                                    //             {
                                                                                    //                 ...subscriberFactSheetData.runaway_alarm,
                                                                                    //                 test_duration:
                                                                                    //                     selectedValue,
                                                                                    //             },
                                                                                    //     }
                                                                                    // );
                                                                                    setRunAwayAlarmTestDuration(
                                                                                        selectedValue
                                                                                    );
                                                                                }}
                                                                            />
                                                                            <label
                                                                                htmlFor={`interval-${interval.toLowerCase()}`}
                                                                            >
                                                                                {`${interval} Minutes`}
                                                                            </label>
                                                                        </div>
                                                                    </Fragment>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                                {/* </div> */}
                                            </div>
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Pro Monitoring Schedule */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 8 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 8)}
                        >
                            <div className="section-container-header-caption">
                                Pro Monitoring Schedule
                            </div>
                            <div className="section-container-header-toggle">
                                {isProMonitorScheduleVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 8 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 8 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <FactSheetProMonitoringSchedule
                                            accountId={Number(accountId)}
                                            siteId={Number(siteId)}
                                        />
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Next"
                                            type="button"
                                            // onClick={() =>
                                            //     handleSaveData('Next')
                                            // }
                                            onClick={() => toggleSection(9)}
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Pro Monitoring Operator Action Plans */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 9 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 9)}
                        >
                            <div className="section-container-header-caption">
                                Pro Monitoring Operator Action Plans
                            </div>
                            <div className="section-container-header-toggle">
                                {isProMonitorActionPlanVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 9 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 9 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        {/* <div>
                                            <div className="select-container form-item">
                                                <label htmlFor="site">
                                                    <span>
                                                        Available Actions
                                                    </span>
                                                    <span className="asterisk">
                                                        *
                                                    </span>
                                                </label>
                                                <Select
                                                    id="actions-select"
                                                    value={{
                                                        label: 'Trigger Audio Message',
                                                        value: 'Trigger-Audio-Message',
                                                    }}
                                                    // onChange={
                                                    //     handleLicenseTypeSelect
                                                    // }
                                                    options={
                                                        availableActionOptions
                                                    }
                                                    required
                                                />
                                            </div>
                                        </div> */}
                                        <p style={{ textAlign: 'center' }}>
                                            Pro Monitoring Operator Action Plans
                                            Section under construction...
                                        </p>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            // onClick={() =>
                                            //     handleSaveData('Next')
                                            // }
                                            onClick={() => toggleSection(10)}
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Report Setup */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 10 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 10)}
                        >
                            <div className="section-container-header-caption">
                                Report Setup
                            </div>
                            <div className="section-container-header-toggle">
                                {isReportSetupVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 10 && (
                                    <FaChevronDown />
                                )) || <FaChevronRight />}
                            </div>
                        </div>
                        {activeSection === 10 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <p>
                                                Please check the daily reports
                                                you would like to receive via
                                                email.
                                            </p>
                                        </div>
                                        <div className="report-options">
                                            <div className="checkbox-spacing">
                                                <label htmlFor="all_signals">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            dailyReport.operator_signals
                                                        }
                                                        id="all_signals"
                                                        name="operator_signals"
                                                        disabled={true}
                                                        className="checkbox-input"
                                                        onChange={
                                                            handleCheckboxChange
                                                        }
                                                    />
                                                    <span className="checkbox-label">
                                                        Daily report of all
                                                        signals processed by
                                                        operators (alarms,
                                                        troubles, out of
                                                        schedule open/closes)
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="checkbox-spacing">
                                                <label htmlFor="test_signal_event">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            dailyReport.test_signals
                                                        }
                                                        id="test_signal_event"
                                                        name="test_signals"
                                                        disabled={true}
                                                        className="checkbox-input"
                                                        onChange={
                                                            handleCheckboxChange
                                                        }
                                                    />
                                                    <span className="checkbox-label">
                                                        Daily report of late to
                                                        test and runaway signal
                                                        events
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="checkbox-spacing">
                                                <label htmlFor="account_changes">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            dailyReport.account_changes
                                                        }
                                                        id="account_changes"
                                                        name="account_changes"
                                                        disabled={false}
                                                        onChange={
                                                            handleCheckboxChange
                                                        }
                                                    />
                                                    <span className="checkbox-label">
                                                        Daily report of changes
                                                        made to your accounts
                                                        (Optional)
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <span>
                                                Email Address to send reports to
                                            </span>
                                            <div className="report-email-template">
                                                {reportEmailBlocks.map(
                                                    (emailId, index) => {
                                                        return (
                                                            <Fragment
                                                                key={`emailid-${index}`}
                                                            >
                                                                <div className="report-email-row">
                                                                    <div>
                                                                        <Input
                                                                            id={`report-email-${index}`}
                                                                            name={`report-email-${index}`}
                                                                            label={`Email ${
                                                                                index +
                                                                                1
                                                                            }`}
                                                                            className="input field"
                                                                            type="email"
                                                                            value={
                                                                                emailId
                                                                            }
                                                                            onChange={(
                                                                                newEmail
                                                                            ) => {
                                                                                const reportEmailBlocksCopy =
                                                                                    [
                                                                                        ...reportEmailBlocks,
                                                                                    ];

                                                                                reportEmailBlocksCopy[
                                                                                    index
                                                                                ] =
                                                                                    newEmail;
                                                                                setReportEmailBlocks(
                                                                                    reportEmailBlocksCopy
                                                                                );
                                                                            }}
                                                                            onBlur={(
                                                                                newEmail
                                                                            ) => {
                                                                                const reportEmailBlocksCopy =
                                                                                    [
                                                                                        ...reportEmailBlocks,
                                                                                    ];

                                                                                reportEmailBlocksCopy[
                                                                                    index
                                                                                ] =
                                                                                    newEmail
                                                                                        .replace(
                                                                                            /\s+/g,
                                                                                            ' '
                                                                                        )
                                                                                        .trim();
                                                                                setReportEmailBlocks(
                                                                                    reportEmailBlocksCopy
                                                                                );
                                                                            }}
                                                                            autoComplete="off"
                                                                            maxLength={
                                                                                255
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="deleteMonitorBlockContainer reportEmail">
                                                                        <DeleteIcon
                                                                            className="deleteIcon"
                                                                            onClick={() =>
                                                                                removeReportEmailBlock(
                                                                                    index
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {errorMessage
                                                                    .report_recipient_emails?.[
                                                                    index
                                                                ] && (
                                                                    <p
                                                                        id={`report-email-error-${index}`}
                                                                        className="error"
                                                                        data-testid={`report-email-error-${index}`}
                                                                    >
                                                                        {
                                                                            errorMessage
                                                                                .report_recipient_emails?.[
                                                                                index
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                            </Fragment>
                                                        );
                                                    }
                                                )}

                                                <div className="timeBlocksButtonContainer">
                                                    <button
                                                        type="button"
                                                        className="btn outline primary"
                                                        onClick={() => {
                                                            setReportEmailBlocks(
                                                                [
                                                                    ...reportEmailBlocks,
                                                                    '',
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        Add More Email +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Dealer Tech Support Information */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 11 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 11)}
                        >
                            <div className="section-container-header-caption">
                                Dealer Tech Support Information
                            </div>
                            <div className="section-container-header-toggle">
                                {isDealerTechSupportVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 11 && (
                                    <FaChevronDown />
                                )) || <FaChevronRight />}
                            </div>
                        </div>
                        {activeSection === 11 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <Input
                                                id="dealer_tech_support_phone"
                                                name="dealer_tech_support_phone"
                                                label="Dealer Tech Support Number"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerTechSupportPhoneNumber
                                                }
                                                onChange={(value) => {
                                                    handlePhoneNumberChange(
                                                        value,
                                                        setDealerTechSupportPhoneNumber
                                                    );
                                                }}
                                                onBlur={(value) =>
                                                    handlePhoneNumberBlur(
                                                        value,
                                                        setDealerTechSupportPhoneNumber
                                                    )
                                                }
                                                onFocus={(value) =>
                                                    handlePhoneNumberFocus(
                                                        value,
                                                        setDealerTechSupportPhoneNumber
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.dealer_tech_support_phone && (
                                                <p
                                                    id="dealer-tech-support-phone-error"
                                                    className="error"
                                                    data-testid="dealer-tech-support-phone-error"
                                                >
                                                    {
                                                        errorMessage.dealer_tech_support_phone
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="dealer_tech_support_email"
                                                name="dealer_tech_support_email"
                                                label="Dealer Tech Support Email Address"
                                                className="input field"
                                                type="email"
                                                value={
                                                    subscriberFactSheetData.dealer_tech_support_email
                                                        ? subscriberFactSheetData.dealer_tech_support_email
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'dealer_tech_support_email',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'dealer_tech_support_email',
                                                        value
                                                    )
                                                }
                                                autoComplete="off"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.dealer_tech_support_email && (
                                                <p
                                                    id="dealer-tech-support-email-error"
                                                    className="error"
                                                    data-testid="dealer-tech-support-email-error"
                                                >
                                                    {
                                                        errorMessage.dealer_tech_support_email
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label={
                                                accountType ===
                                                AccountType.Evolon
                                                    ? 'Save & Next'
                                                    : 'Save'
                                            }
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section - Evolon Use Only */}
                    {accountType === AccountType.Evolon && (
                        <div className="section-container">
                            <div
                                className={`section-container-header ${
                                    activeSection === 12 ? 'active-header' : ''
                                }`}
                                onClick={() => handleNavigation('Toggle', 12)}
                            >
                                <div className="section-container-header-caption">
                                    Evolon Use Only
                                </div>
                                <div className="section-container-header-toggle">
                                    {/* {isReportSetupVerified && (
                                    <FaCheck color="green" size={30} />
                                )} */}
                                    {(activeSection === 12 && (
                                        <FaChevronDown />
                                    )) || <FaChevronRight />}
                                </div>
                            </div>
                            {activeSection === 12 && (
                                <div className="section-container-body">
                                    <div className="section-node">
                                        <div></div>
                                        <ButtonGroup
                                            alignment={
                                                ButtonGroupAlignment.bottomright
                                            }
                                        >
                                            <Button
                                                id="clear"
                                                className="btn danger"
                                                label="Back"
                                                type="button"
                                                onClick={() =>
                                                    handleNavigation('Back')
                                                }
                                            />
                                            <Button
                                                id="create"
                                                className="btn primary"
                                                label="Save"
                                                type="button"
                                                onClick={() =>
                                                    handleSaveData('Next')
                                                }
                                            />
                                        </ButtonGroup>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                        <Button
                            id="cancel"
                            className="btn danger"
                            label="Close"
                            type="button"
                            onClick={() => handleNavigation('Close')}
                        />
                        <Button
                            id="submit-btn"
                            className="btn primary"
                            label="Submit"
                            type="submit"
                        />
                        {/* {savedDealerChecklistData &&
                        savedDealerChecklistData.status === 'Completed' ? ( */}
                        {/* <Button
                            id="export-btn"
                            className="btn primary"
                            label="Export as PDF"
                            type="button"
                            // onClick={generatePDF}
                            onClick={() => console.log('Print')}
                        /> */}
                        {/* ) : (
                            <></>
                        )} */}
                    </ButtonGroup>
                </form>
            </>
        </ModalBase>
    );
};

export default EditSubscriberFactSheetModal;
