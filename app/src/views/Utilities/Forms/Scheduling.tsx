/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
    ReactElement,
    FC,
    Dispatch,
    SetStateAction,
    useEffect,
    useState,
    useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';
import { SingleValue, MultiValue } from 'react-select';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Api Calls
import { getSchedules } from '../../../api_calls/Schedules';
import getScheduleTimeZones from '../../../api_calls/getScheduleTimeZones';
import { getSiteActiveSubscription } from '../../../api_calls/Subscriptions';

// Custom
import sortByName from '../../../utils/sortByName';
import { useCustomers, useServiceProviders, useSites } from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';

// Components
import Select from '../../../components/Inputs/Select';
import NewScheduleDisplay from '../../../components/Scheduling/NewScheduleDisplay';
import CurrentScheduleDisplay from '../../../components/Scheduling/CurrentScheduleDisplay';

// Controller
import {
    defaultSchedule,
    ScheduleBlock,
} from '../../../components/Scheduling/WeeklySchedule.controller';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType } from '../../../types/enums';
import {
    ICustomer,
    IServiceProvider,
    ISite,
} from '../../../types/tng-api.interfaces';

// Styles
import '../../../styles/views/Utilities/CreateCustomer.scss';
import '../../../styles/views/Utilities/Scheduling.scss';

export type Exception = {
    id: string;
    name: string;
    state: 'armed' | 'disarmed';
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
};

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
}

const Scheduling: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
    defaultCustomer,
}: IProps): ReactElement => {
    const navigate = useNavigate();

    // Service Provider state
    const [serviceProviderOptions, setServiceProviderOptions] = useState<
        SelectOption[]
    >(defaultServiceProvider !== null ? [defaultServiceProvider] : []);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);

    // Customer state
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer !== null ? [defaultCustomer] : []
    );
    const [selectedCustomer, setSelectedCustomer] =
        useState<SingleValue<SelectOption> | null>(defaultCustomer);

    // Site State
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [selectedSites, setSelectedSites] = useState<any | null>(null);
    const [siteHasPanel, setSiteHasPanel] = useState(false);

    // Scheduling State
    const [weeklySchedule, setWeeklySchedule] = useState(defaultSchedule);

    // React Query
    const serviceProvidersQuery = useServiceProviders({
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Evolon,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const customersQuery = useCustomers({
        serviceProviderId: Number(selectedServiceProvider?.value),
        activeUser: activeUser as IUser,
        enabled:
            accountType !== AccountType.Customer &&
            selectedServiceProvider?.value !== undefined,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const sitesQuery = useSites({
        customerId: Number(selectedCustomer?.value),
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Customer,
    });

    const scheduleQuery = useQuery({
        queryFn: () =>
            getSchedules({
                user: activeUser,
                params: {
                    account_id: Number(selectedCustomer?.value),
                    site_id: Number(selectedSites?.value),
                },
            }),
        queryKey: [
            'get-schedule',
            selectedCustomer?.value,
            selectedSites?.value,
        ],
        onSuccess: (data) => {
            if (data) {
                const schedule: ScheduleBlock[] = [];
                data.data.forEach((scheduleData) => {
                    scheduleData.schedule.forEach((scheduleItem) => {
                        schedule.push(scheduleItem);
                    });
                });
                setWeeklySchedule(schedule);
                setSiteHasPanel(data.site_has_panel);
            }
        },
        onError: (error) => {
            console.error(error);
            toast.error("Unable to get site's schedule");
            setSiteHasPanel(false);
        },
        enabled: !!selectedCustomer?.value && !!selectedSites?.value,
    });

    const timeZoneQuery = useQuery({
        queryFn: () => getScheduleTimeZones({ user: activeUser }),
        queryKey: ['get-timezones'],
        onError: (error) => {
            console.error(error);
            toast.error('Unable to get schedule timezones.');
        },
        enabled: !!activeUser,
    });

    const selectedSiteSubscriptionQuery = useQuery({
        queryFn: () =>
            getSiteActiveSubscription({
                user: activeUser,
                params: {
                    service_provider_account_id: Number(
                        selectedServiceProvider?.value
                    ),
                    account_id: Number(selectedCustomer?.value),
                    site_id: Number(selectedSites?.value),
                },
            }),
        queryKey: [
            'get-site-subscription',
            selectedServiceProvider?.value,
            selectedCustomer?.value,
            selectedSites?.value,
        ],
        onError: (error) => {
            console.error(error);
            toast.error('Unable to get site subscription.');
        },
        enabled:
            !!activeUser &&
            !!selectedServiceProvider?.value &&
            !!selectedCustomer?.value &&
            !!selectedSites?.value,
    });

    const siteSubscriptionId = useMemo(() => {
        const subscriptionData = selectedSiteSubscriptionQuery.data;
        if (subscriptionData && subscriptionData.length > 0) {
            return subscriptionData[0].subscription_id;
        }

        return null;
    }, [selectedSiteSubscriptionQuery.data]);

    const apiTimeZoneOptions = useMemo(() => {
        if (timeZoneQuery.data) {
            return timeZoneQuery.data
                .filter((tz) => tz.schedule_time_zone_id !== 0) // Exclude ID 0
                .sort(
                    (a, b) => a.schedule_time_zone_id - b.schedule_time_zone_id
                ) // Sort by ID
                .map((tz) => ({
                    value: tz.schedule_time_zone_id.toString(),
                    label: tz.description,
                }));
        }

        return [];
    }, [timeZoneQuery.data]);

    const noActiveScheduleSet = useMemo(() => {
        if (scheduleQuery.data) {
            return scheduleQuery.data.data[0].schedule_site_id === 0;
        }

        return false;
    }, [scheduleQuery.data]);

    const handleCustomerSelect = async (
        selectOption: SingleValue<SelectOption>
    ) => {
        if (selectedCustomer?.value === selectOption?.value) {
            return;
        }
        // Always reset following fields if user changes customers.
        setSelectedSites(null);
        setSiteOptions([]);

        // Then set selected customer.
        setSelectedCustomer(selectOption as SingleValue<SelectOption>);
    };

    const handleSiteSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Then set site.
        setSelectedSites(selectOption);
    };

    useEffect(() => {
        if (selectedCustomer) {
            sitesQuery.refetch();
        }
    }, [selectedCustomer]);

    useEffect(() => {
        const { data }: { data: IServiceProvider[] | undefined } =
            serviceProvidersQuery;

        if (data) {
            const serviceProvidersSorted: IServiceProvider[] =
                data.sort(sortByName);
            const options: SelectOption[] =
                OptionsConverter.convertServiceProvidersToOptions(
                    serviceProvidersSorted
                );

            setServiceProviderOptions(options);
        }
    }, [serviceProvidersQuery.data]);

    useEffect(() => {
        const { data }: { data: ICustomer[] | undefined } = customersQuery;

        if (data) {
            const customersSorted: ICustomer[] = data.sort(sortByName);
            const options: SelectOption[] =
                OptionsConverter.convertCustomersToOptions(customersSorted);

            setCustomerOptions(options);
        }
    }, [customersQuery.data]);

    useEffect(() => {
        const sitesData: ISite[] | undefined = sitesQuery.data;

        if (sitesData && sitesData.length > 0) {
            const sortedSitesData = sitesData.sort(sortByName);
            const options =
                OptionsConverter.convertSitesToOptions(sortedSitesData);

            setSiteOptions(options);
        }
    }, [sitesQuery.data]);

    return (
        <motion.div
            id="scheduling"
            key="scheduling"
            className="scheduling form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <h3 id="title">
                <span>Scheduling</span>
            </h3>
            {accountType === AccountType.Evolon && (
                <div className="select-container field">
                    <label htmlFor="service-providers">
                        <span>Service Provider</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="service-providers"
                        value={selectedServiceProvider}
                        onChange={(option) => {
                            setSelectedServiceProvider(
                                option as SingleValue<SelectOption>
                            );
                        }}
                        options={serviceProviderOptions}
                        isClearable={false}
                        disabled={defaultServiceProvider !== null}
                        required
                    />
                </div>
            )}

            {accountType !== AccountType.Customer && (
                <div className="select-container field">
                    <label htmlFor="customers">
                        <span>Customer</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="customers"
                        value={selectedCustomer}
                        onChange={handleCustomerSelect}
                        placeholder="None"
                        options={customerOptions}
                        isClearable={defaultCustomer === null}
                        disabled={defaultCustomer !== null}
                        noOptionsMessage="A Service Provider with registered Customers must be selected first."
                        required
                    />
                </div>
            )}

            <div className="select-container field">
                <label htmlFor="customers">
                    <span>Site</span>
                    <span className="asterisk">*</span>
                </label>
                <Select
                    id="site-select"
                    value={selectedSites}
                    onChange={handleSiteSelect}
                    options={siteOptions}
                    required
                />
            </div>

            {siteSubscriptionId === 4 && (
                <p className="alarmVisionInstructions">
                    AlarmVision subscription site. View schedule and status in
                    the AlarmVision admin site.
                </p>
            )}

            {noActiveScheduleSet &&
                selectedSites?.value &&
                selectedCustomer?.value &&
                siteSubscriptionId !== 4 && (
                    <NewScheduleDisplay
                        weeklySchedule={weeklySchedule}
                        apiTimeZoneOptions={apiTimeZoneOptions}
                        accountId={selectedCustomer.value}
                        siteId={selectedSites.value}
                    />
                )}

            {selectedCustomer?.value &&
                selectedSites?.value &&
                scheduleQuery.isLoading === false &&
                !noActiveScheduleSet &&
                siteSubscriptionId !== 4 && (
                    <CurrentScheduleDisplay
                        scheduleData={scheduleQuery?.data?.data || []}
                        apiTimeZoneOptions={apiTimeZoneOptions}
                        accountId={selectedCustomer.value}
                        siteId={selectedSites.value}
                        siteHasPanel={siteHasPanel}
                    />
                )}
        </motion.div>
    );
};

export default Scheduling;
