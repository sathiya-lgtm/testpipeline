/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
    useMemo,
    FC,
    useState,
    useEffect,
    Dispatch,
    SetStateAction,
    ChangeEvent,
    useRef,
} from 'react';

// Third Party
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SingleValue } from 'react-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FaDownload } from 'react-icons/fa';

// Api Calls
import {
    getSubscriptions,
    getSiteActiveSubscription,
    setSiteActiveSubscription,
    getSiteSubscriptionReport,
    MonitorMode,
    ICameraSubscription,
} from '../../../api_calls/Subscriptions';
import getStagesAccountStatus from '../../../api_calls/getStagesAccountStatus';
import getSubscriberFactSheet from '../../../api_calls/getSubscriberFactSheet';

// Custom
import { useServiceProviders, useCustomers, useSites } from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';

// Components
import Select from '../../../components/Inputs/Select';
import LoadingModal from '../../../components/Modals/LoadingModal';
import Toggle from '../../../components/Inputs/Toggle';
import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../../components/ButtonGroup/ButtonGroup';
import Button, { SaveButton } from '../../../components/Button';
import CameraSubscriptionsTable from '../../../components/Tables/CameraSubscriptionsTable';
import EditSubscriberFactSheetModal from '../../../components/Modals/EditSubscriberFactSheetModal';

// Types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType } from '../../../types/enums';
import {
    ISite,
    ICustomer,
    IServiceProvider,
    IAPISubscriberFactSheet,
} from '../../../types/tng-api.interfaces';

// Styles
import '../../../styles/views/Utilities/Subscriptions.scss';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
}

const Subscriptions: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
    defaultCustomer,
}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // State
    const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);
    const [serviceProviderOptions, setServiceProviderOptions] = useState<
        SelectOption[]
    >(defaultServiceProvider !== null ? [defaultServiceProvider] : []);
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer !== null ? [defaultCustomer] : []
    );
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);

    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);
    const [selectedCustomer, setSelectedCustomer] =
        useState<SingleValue<SelectOption> | null>(defaultCustomer);
    const [selectedSite, setSelectedSite] =
        useState<SingleValue<SelectOption> | null>(null);
    const [siteSubscriptionId, setSiteSubscriptionId] = useState(1);
    const [hasAICopilot, setAICopilot] = useState<boolean>(false);
    const [hasSOS, setSOS] = useState<boolean>(false);
    const [videoRetentionPolicy, setVideoRetentionPolicy] =
        useState<number>(30);
    const [currentCameraSubscriptions, setCurrentCameraSubscriptions] =
        useState<ICameraSubscription[]>([]);

    // Fact Sheet
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showFactSheet, setShowFactSheet] = useState<boolean>(false);
    const [subscriberFactSheetFormData, setSubscriberFactSheetFormData] =
        useState<IAPISubscriberFactSheet>();

    const fillInSubscriptionDefaults = () => {
        const cameraSubscriptionCopy = currentCameraSubscriptions.map(
            (item) => {
                if (item.monitor_mode === '') {
                    return {
                        ...item,
                        monitor_mode: 'Virtual Guard' as MonitorMode,
                    };
                }

                return item;
            }
        );

        setCurrentCameraSubscriptions(cameraSubscriptionCopy);
    };

    const handleSiteSubscriptionChange = (subscriptionId: number) => {
        setVideoRetentionPolicy(30);

        if (subscriptionId === 1) {
            setSOS(false);
        } else if (subscriptionId === 2) {
            setSOS(false);
        } else if (subscriptionId === 3) {
            setSOS(true);
            fillInSubscriptionDefaults();
        }

        setSiteSubscriptionId(subscriptionId);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setVideoRetentionPolicy(Number(e.target.value));
    };

    const serviceProviderAccountId = useMemo(() => {
        if (selectedServiceProvider?.value) {
            return Number(selectedServiceProvider.value);
        }

        if (
            activeUser.service_provider_account &&
            activeUser.service_provider_account !== 1
        ) {
            return activeUser.service_provider_account;
        }

        return null;
    }, [activeUser, selectedServiceProvider]);

    // Query
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
        enabled: selectedCustomer?.value !== undefined,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const subscriptionsQuery = useQuery({
        queryFn: () => getSubscriptions({ user: activeUser }),
        queryKey: ['get-subscriptions'],
        onError: () => {
            toast.error('Unable to get subscriptions.');
        },
        enabled: !!activeUser,
    });

    const selectedSiteSubscriptionQuery = useQuery({
        queryFn: () =>
            getSiteActiveSubscription({
                user: activeUser,
                params: {
                    service_provider_account_id:
                        serviceProviderAccountId as number,
                    account_id: Number(selectedCustomer?.value),
                    site_id: Number(selectedSite?.value),
                },
            }),
        queryKey: [
            'get-site-subscription',
            serviceProviderAccountId,
            selectedCustomer?.value,
            selectedSite?.value,
        ],
        onSuccess: (data) => {
            if (data.length > 0) {
                const siteSubscriptionData = data[0];
                setAICopilot(siteSubscriptionData.ai_copilot_enabled);
                setSOS(siteSubscriptionData.sos_enabled);
                setSiteSubscriptionId(siteSubscriptionData.subscription_id);
                setVideoRetentionPolicy(
                    siteSubscriptionData.video_retention_days
                );
                setCurrentCameraSubscriptions(siteSubscriptionData.cameras);
            }
        },
        onError: (error) => {
            console.error(error);
            toast.error('Unable to get site subscription.');
        },
        enabled:
            !!activeUser &&
            !!serviceProviderAccountId &&
            !!selectedCustomer?.value &&
            !!selectedSite?.value,
    });

    const stagesAccountStatusQuery = useQuery({
        queryFn: () =>
            getStagesAccountStatus({
                user: activeUser,
                params: {
                    account_id: Number(selectedCustomer?.value),
                    site_id: Number(selectedSite?.value),
                },
            }),
        onError: (error) => {
            console.log(error);
            toast.error('Unable to get Stages Account Status.');
        },
        queryKey: [
            'get-stages-account-status',
            selectedCustomer?.value,
            selectedSite?.value,
            siteSubscriptionId,
        ],
        cacheTime: 0,
        enabled: !!selectedCustomer?.value && !!selectedSite?.value,
    });

    const stagesAccountStatusText = useMemo(() => {
        const status = stagesAccountStatusQuery.data;

        if (status && siteSubscriptionId === 3) {
            return `Status: ${status}`;
        }

        if (status && siteSubscriptionId === 2 && hasSOS) {
            return `SOS Status: ${status}`;
        }

        return null;
    }, [stagesAccountStatusQuery.data, hasSOS, siteSubscriptionId]);

    const setSubscriptionMutation = useMutation({
        mutationFn: setSiteActiveSubscription,
    });

    const getSiteSubscriptionReportMutation = useMutation({
        mutationFn: getSiteSubscriptionReport,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to get report.');
        },
        onSuccess: (data) => {
            let csvContent = `${data.headers.join(',')}\n`;
            data.rows.forEach((row) => {
                csvContent += row;
            });

            const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);

            let reportTitle = `${selectedServiceProvider?.label}-service-provider-subscription-report.csv`;

            if (selectedCustomer?.label) {
                reportTitle = `${selectedCustomer?.label}-customer-subscription-report.csv`;
            }

            if (downloadLinkRef.current) {
                downloadLinkRef.current.href = url;
                downloadLinkRef.current.download = reportTitle;
                downloadLinkRef.current.click();
            }
        },
    });

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
        const { data }: { data: ISite[] | undefined } = sitesQuery;
        if (data) {
            const sortedSitesData = data.sort(sortByName);
            const options =
                OptionsConverter.convertSitesToOptions(sortedSitesData);
            setSiteOptions(options);
        }
    }, [sitesQuery.data]);

    const loadingText = useMemo(() => {
        if (selectedSiteSubscriptionQuery.isFetching) {
            return 'Getting subscription data...';
        }

        return null;
    }, [selectedSiteSubscriptionQuery]);

    const onSaveSubscription = async () => {
        if (serviceProviderAccountId && selectedSiteSubscriptionQuery.data) {
            try {
                await setSubscriptionMutation.mutateAsync({
                    user: activeUser,
                    params: {
                        service_provider_account_id: serviceProviderAccountId,
                        account_id: Number(selectedCustomer?.value),
                        site_id: Number(selectedSite?.value),
                        subscription_id: siteSubscriptionId,
                        video_retention_days: Number(videoRetentionPolicy),
                        ai_copilot_enabled: hasAICopilot,
                        sos_enabled: hasSOS,
                        previous_subscription_id:
                            selectedSiteSubscriptionQuery.data[0]
                                .subscription_id,
                        previous_sos_enabled:
                            selectedSiteSubscriptionQuery.data[0].sos_enabled,
                        cameras: currentCameraSubscriptions,
                    },
                });

                queryClient.invalidateQueries([
                    'get-site-subscription',
                    serviceProviderAccountId,
                    selectedCustomer?.value,
                    selectedSite?.value,
                ]);

                toast.success('Subscription Updated.');
            } catch (error) {
                console.log(error);
                toast.error('Unable to update camera subscriptions.');
            }
        }
    };

    const onCancelSubscription = () => {
        queryClient.invalidateQueries([
            'get-site-subscription',
            serviceProviderAccountId,
            selectedCustomer?.value,
            selectedSite?.value,
        ]);
        queryClient.invalidateQueries([
            'get-site-camera-subscriptions',
            serviceProviderAccountId,
            selectedCustomer?.value,
            selectedSite?.value,
        ]);
    };

    const downloadSiteReport = () => {
        if (!serviceProviderAccountId) {
            toast.warning('Select a service provider to create a report.');
            return;
        }

        if (selectedCustomer) {
            getSiteSubscriptionReportMutation.mutate({
                user: activeUser,
                params: {
                    service_provider_account_id: serviceProviderAccountId,
                    account_id: Number(selectedCustomer?.value),
                },
            });

            return;
        }

        getSiteSubscriptionReportMutation.mutate({
            user: activeUser,
            params: {
                service_provider_account_id: serviceProviderAccountId,
            },
        });
    };

    const getSubscriberFactSheetMutation = useMutation({
        mutationFn: getSubscriberFactSheet,
    });

    const handleFactSheetButtonClick = async (
        siteId: string
    ): Promise<void> => {
        setIsLoading(true);
        const subscriberFactSheetDetails =
            await getSubscriberFactSheetMutation.mutateAsync({
                user: activeUser,
                siteId: siteId,
            });

        setSubscriberFactSheetFormData(subscriberFactSheetDetails);
        setShowFactSheet(true);
        setIsLoading(false);
    };

    return (
        <motion.div
            id="Subscriptions"
            key="Subscriptions"
            className="multiModalModelForm subscriptions form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <div className="title-container">
                <h3 className="title">
                    <span>Subscriptions</span>
                </h3>

                <span
                    className="label tooltip wide left download-csv-container"
                    data-tooltip={
                        selectedCustomer?.value
                            ? 'Download Customer Subscriptions'
                            : 'Download Service Provider Subscriptions'
                    }
                >
                    <div className="download-csv">
                        <div
                            className="download-button"
                            onClick={downloadSiteReport}
                        >
                            <FaDownload />
                        </div>
                        <a ref={downloadLinkRef} style={{ display: 'none' }} />
                    </div>
                </span>
            </div>

            {accountType === AccountType.Evolon && (
                <div className="select-container field">
                    <label htmlFor="service-providers">
                        <span>Select Service Provider</span>
                        <span className="asterisk">*</span>
                    </label>

                    <Select
                        id="service-providers-select"
                        value={selectedServiceProvider}
                        onChange={(option) => {
                            setSelectedServiceProvider(
                                option as SingleValue<SelectOption>
                            );
                            setSelectedCustomer(null);
                            setSelectedSite(null);
                        }}
                        options={serviceProviderOptions}
                        isClearable={false}
                        disabled={defaultServiceProvider !== null}
                    />
                </div>
            )}

            {accountType !== AccountType.Customer && (
                <div className="select-container field">
                    <label htmlFor="customers-select">
                        <span>Select Customer</span>
                        <span className="asterisk">*</span>
                    </label>

                    <Select
                        id="customers-select"
                        value={selectedCustomer}
                        onChange={(option) => {
                            setSelectedCustomer(
                                option as SingleValue<SelectOption>
                            );
                            setSelectedSite(null);
                        }}
                        placeholder="None"
                        options={customerOptions}
                        isClearable={defaultCustomer === null}
                        disabled={defaultCustomer !== null}
                        required
                    />
                </div>
            )}

            <div className="select-container field">
                <label htmlFor="sites-select">
                    <span>Select Site</span>
                    <span className="asterisk">*</span>
                </label>
                <Select
                    id="sites-select"
                    value={selectedSite}
                    onChange={(option) => {
                        if (option?.value === selectedSite?.value) {
                            return;
                        }
                        setSelectedSite(option as SingleValue<SelectOption>);
                    }}
                    options={siteOptions}
                    required
                />
            </div>
            <br />
            {selectedSiteSubscriptionQuery?.data &&
                selectedSiteSubscriptionQuery.data.length === 0 && (
                    <p className="no-cameras-registered-text">
                        No cameras currently registered to this site. Please
                        register a camera to this site before editing this
                        site&apos;s subscription.
                    </p>
                )}

            {selectedSite && !!selectedSiteSubscriptionQuery?.data?.length && (
                <>
                    <ul>
                        {subscriptionsQuery.data?.data.map(
                            (subscription, index) => {
                                if (siteSubscriptionId !== 4) {
                                    if (subscription.subscription_id !== 4) {
                                        return (
                                            <>
                                                <li
                                                    key={`subscription-card-${subscription.subscription_id}`}
                                                    role="presentation"
                                                    className={`subscription-card ${
                                                        siteSubscriptionId ===
                                                        subscription.subscription_id
                                                            ? 'selected'
                                                            : ''
                                                    }`}
                                                    onClick={() => {
                                                        handleSiteSubscriptionChange(
                                                            subscription.subscription_id
                                                        );
                                                    }}
                                                >
                                                    <h3>
                                                        {
                                                            subscription.subscription_name
                                                        }
                                                        {stagesAccountStatusText &&
                                                        siteSubscriptionId ===
                                                            subscription.subscription_id
                                                            ? ` - ${stagesAccountStatusText}`
                                                            : ''}
                                                    </h3>
                                                    {((siteSubscriptionId ===
                                                        2 &&
                                                        hasSOS) ||
                                                        siteSubscriptionId ===
                                                            3) &&
                                                    subscription.subscription_id ===
                                                        siteSubscriptionId ? (
                                                        <div>
                                                            <Button
                                                                id={`factsheet_btn_${siteSubscriptionId}`}
                                                                type="button"
                                                                className="btn primary"
                                                                label={`${
                                                                    siteSubscriptionId ===
                                                                    2
                                                                        ? 'MIY with SOS'
                                                                        : siteSubscriptionId ===
                                                                          3
                                                                        ? 'Pro Monitoring'
                                                                        : ''
                                                                }  Fact Sheet`}
                                                                onClick={() =>
                                                                    handleFactSheetButtonClick(
                                                                        selectedSite?.value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        ''
                                                    )}
                                                    <div className="subscription-card-content">
                                                        <p>
                                                            {
                                                                subscription.description
                                                            }
                                                        </p>
                                                    </div>

                                                    <div className="detail" />
                                                </li>

                                                {siteSubscriptionId === 3 &&
                                                    index === 2 && (
                                                        <CameraSubscriptionsTable
                                                            currentCameraSubscriptions={
                                                                currentCameraSubscriptions
                                                            }
                                                            setCurrentCameraSubscriptions={
                                                                setCurrentCameraSubscriptions
                                                            }
                                                        />
                                                    )}
                                            </>
                                        );
                                    }

                                    return (
                                        <li
                                            key={`subscription-card-${subscription.subscription_id}`}
                                            role="presentation"
                                            className={`subscription-card ${
                                                siteSubscriptionId ===
                                                subscription.subscription_id
                                                    ? 'selected'
                                                    : ''
                                            }`}
                                        >
                                            <h3>
                                                {subscription.subscription_name}
                                                {stagesAccountStatusText &&
                                                siteSubscriptionId ===
                                                    subscription.subscription_id
                                                    ? ` - ${stagesAccountStatusText}`
                                                    : ''}
                                            </h3>
                                            <div className="subscription-card-content">
                                                <p>
                                                    {subscription.description}
                                                </p>
                                            </div>

                                            <div className="detail" />
                                        </li>
                                    );
                                }

                                return (
                                    <li
                                        key={`subscription-card-${subscription.subscription_id}`}
                                        role="presentation"
                                        className={`subscription-card ${
                                            siteSubscriptionId ===
                                            subscription.subscription_id
                                                ? 'selected'
                                                : ''
                                        }`}
                                    >
                                        <h3>
                                            {subscription.subscription_name}
                                            {stagesAccountStatusText &&
                                            siteSubscriptionId ===
                                                subscription.subscription_id
                                                ? ` - ${stagesAccountStatusText}`
                                                : ''}
                                        </h3>
                                        <div className="subscription-card-content">
                                            <p>{subscription.description}</p>
                                        </div>

                                        <div className="detail" />
                                    </li>
                                );
                            }
                        )}
                    </ul>

                    <hr />
                    {siteSubscriptionId === 4 && (
                        <div className="addons-container">
                            <h3>Add Ons</h3>
                            <div className="subscription-add-ons">
                                {`Video Retention Policy ${videoRetentionPolicy} Days.`}
                            </div>
                            <div className="subscription-add-ons">
                                <br />
                                {`If you need more or less than ${videoRetentionPolicy} Days please contact sales`}
                            </div>
                        </div>
                    )}

                    {siteSubscriptionId !== 4 && (
                        <div className="addons-container">
                            <h3>Add-Ons</h3>
                            <div className="subscription-add-ons subscription-card-content">
                                <div className="subscription-toggles-container">
                                    <div className="subscription-card-table">
                                        <span
                                            id="ai-copilot-col"
                                            className="subscription-card-table-column"
                                        >
                                            AI Copilot
                                        </span>
                                        <span
                                            id="ai-copilot-enabled-cell"
                                            className="subscription-card-table-cell"
                                        >
                                            <Toggle
                                                toggleOnText="ON"
                                                toggleOffText="OFF"
                                                value={hasAICopilot}
                                                onToggleChange={() =>
                                                    setAICopilot(!hasAICopilot)
                                                }
                                            />
                                        </span>
                                        <span
                                            id="sos-enabled-col"
                                            className="subscription-card-table-column"
                                        >
                                            SOS
                                        </span>
                                        <span
                                            id="sos-enabled-cell"
                                            className="subscription-card-table-cell"
                                        >
                                            <Toggle
                                                toggleOnText="ON"
                                                toggleOffText="OFF"
                                                value={hasSOS}
                                                onToggleChange={() =>
                                                    setSOS(!hasSOS)
                                                }
                                                disabled={
                                                    siteSubscriptionId === 1
                                                }
                                            />
                                        </span>
                                    </div>
                                </div>
                                <div className="radioContainer">
                                    <span className="label">
                                        Video Retention Policy
                                    </span>
                                    <div className="radioGroup">
                                        <div className="radioBtn primary">
                                            <input
                                                type="radio"
                                                id="option1"
                                                name="options"
                                                value={2}
                                                checked={
                                                    videoRetentionPolicy === 2
                                                }
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="option1">
                                                2 Days
                                            </label>
                                        </div>
                                        <div className="radioBtn primary">
                                            <input
                                                type="radio"
                                                id="option2"
                                                name="options"
                                                value={30}
                                                checked={
                                                    videoRetentionPolicy === 30
                                                }
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="option2">
                                                30 Days
                                            </label>
                                        </div>
                                        <div className="radioBtn primary disabled">
                                            <input
                                                type="radio"
                                                id="option3"
                                                name="options"
                                                value={60}
                                                checked={
                                                    videoRetentionPolicy === 60
                                                }
                                                disabled
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="option3">
                                                60 Days (Contact Sales)
                                            </label>
                                        </div>
                                        <div className="radioBtn primary disabled">
                                            <input
                                                type="radio"
                                                id="option4"
                                                name="options"
                                                value={90}
                                                disabled
                                                checked={
                                                    videoRetentionPolicy === 90
                                                }
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="option4">
                                                90 Days (Contact Sales)
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showFactSheet && subscriberFactSheetFormData && (
                        <EditSubscriberFactSheetModal
                            activeUser={activeUser}
                            setActiveUser={setActiveUser}
                            accountType={accountType}
                            handleClose={() => setShowFactSheet(false)}
                            subscriberFactSheetFormData={
                                subscriberFactSheetFormData
                            }
                            accountId={selectedCustomer!.value}
                            siteId={selectedSite?.value}
                            serviceProviderName={selectedServiceProvider?.label}
                            customerName={selectedCustomer!.label}
                            siteName={selectedSite.label}
                        ></EditSubscriberFactSheetModal>
                    )}

                    <ButtonGroup alignment={ButtonGroupAlignment.middleright}>
                        <Button
                            id="clear"
                            className="btn danger"
                            label="Clear"
                            onClick={onCancelSubscription}
                            visible={siteSubscriptionId !== 4}
                        />
                        <SaveButton
                            onClick={onSaveSubscription}
                            visible={siteSubscriptionId !== 4}
                        />
                    </ButtonGroup>
                </>
            )}
            {loadingText && <LoadingModal modalText={loadingText} />}
            {isLoading && (
                <LoadingModal
                    modalText="Loading Subscriber Fact Sheet data..."
                    zIndex={96}
                />
            )}
        </motion.div>
    );
};

export default Subscriptions;
