/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
    FC,
    Dispatch,
    SetStateAction,
    useEffect,
    useState,
    useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { toast } from 'react-toastify';
import { SingleValue, MultiValue } from 'react-select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Custom
import { useCustomers, useSites, useServiceProviders } from '../../../hooks';
import { getSchedules } from '../../../api_calls/Schedules';
import createPanel, { IPanelConfig } from '../../../api_calls/createPanel';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';

// Custom types
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import { IUser, SelectOption } from '../../../types/interfaces';
import {
    ICustomer,
    ISite,
    IServiceProvider,
} from '../../../types/tng-api.interfaces';

// Components
import Select from '../../../components/Inputs/Select';
import Button from '../../../components/Button';
import Input from '../../../components/Inputs/Input';
import LoadingModal from '../../../components/Modals/LoadingModal';

/**
 * Component for rendering the page for entering registration code.
 * @returns {ReactElement} Registration Code view.
 */

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
}

const RegisterPanel: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
    defaultCustomer,
}) => {
    const navigate = useNavigate();

    // Service Provider state
    const [serviceProviderOptions, setServiceProviderOptions] = useState<
        SelectOption[]
    >(defaultServiceProvider !== null ? [defaultServiceProvider] : []);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);

    const [panelName, setPanelName] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [panelType, setPanelType] =
        useState<SingleValue<SelectOption> | null>(null);
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer === null ? [] : [defaultCustomer]
    );
    const [selectedCustomer, setSelectedCustomer] =
        useState<SingleValue<SelectOption> | null>(defaultCustomer);

    // Site State
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [selectedSites, setSelectedSites] =
        useState<SingleValue<SelectOption> | null>(null);
    const [newSiteName, setNewSiteName] = useState('');
    const [siteHasSchedule, setSiteHasSchedule] = useState(false);
    const [siteHasPanel, setSiteHasPanel] = useState(false);

    const onSuccess = useCallback((): void => {
        toast.success('Panel Created.');
        setPanelName('');
        setDeviceId('');
        setNewSiteName('');
        setSelectedServiceProvider(defaultServiceProvider);
        setSelectedCustomer(defaultCustomer);
        setSelectedSites(null);
        setPanelType(null);
    }, [defaultServiceProvider, defaultCustomer]);

    const serviceProvidersQuery = useServiceProviders({
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Evolon,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const customersQuery = useCustomers({
        serviceProviderId: Number(selectedServiceProvider?.value),
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.ServiceProvider, // This should only execute if active user is SP and therefore default SP is assumed to be used as "selectedServiceProver.value".
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const sitesQuery = useSites({
        customerId: Number(selectedCustomer?.value),
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Customer,
    });

    // http://localhost:8000/api/schedule/site?account_id=4519&site_id=4019

    useQuery({
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
                if (data.site_has_panel) {
                    toast.warn(
                        'This site already has a panel. You can only add only panel per site.'
                    );
                    setSiteHasPanel(data.site_has_panel);
                } else {
                    setSiteHasPanel(data.site_has_panel);
                }

                if (data.data[0].schedule_site_id === 0) {
                    toast.warn(
                        'You need to add a schedule to this site to add a panel.'
                    );
                    setSiteHasSchedule(false);
                    console.log('site has no schedule');
                } else {
                    setSiteHasSchedule(true);
                }
            }
        },
        onError: (error) => {
            console.error(error);
            toast.error("Unable to get site's schedule");
            setSiteHasSchedule(false);
        },
        enabled: !!selectedCustomer?.value && !!selectedSites?.value,
    });

    const createPanelMutation = useMutation({
        mutationFn: createPanel,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const handleSubmit = async (): Promise<void> => {
        if (!activeUser) return;

        if (siteHasPanel) {
            toast.warn(
                'This site already has a panel. You can only add only panel per site.'
            );
            return;
        }

        if (!selectedCustomer?.value) {
            toast.warn('A Customer must be selected.');
            return;
        }

        if (!selectedSites?.value) {
            toast.warn('A Site must be selected.');
            return;
        }

        if (!siteHasSchedule) {
            toast.warn(
                'You need to add a schedule to this site to add a panel.'
            );
            return;
        }

        if (!panelType) {
            toast.warn('You need to select a panel type');
            return;
        }

        const newPanel: IPanelConfig = {
            name: panelName,
            camera_type: 1,
            site_id: Number(selectedSites.value),
            properties: {},
            device_id: deviceId,
            panel_type: panelType.value,
            template:
                panelType.value === 'Amarok / Resideo'
                    ? 'amarok-panel'
                    : 'stages-panel',
            form: 'Create-Panel' as 'Create-Panel',
        };

        // If the current account is not a customer, we must add account id to the properties
        if (accountType !== AccountType.Customer) {
            // selectedCustomer shouldn't be null because validation should've occurred above and returned if so.
            newPanel.account_id = Number(selectedCustomer?.value);
        }

        const response = await createPanelMutation.mutateAsync({
            user: activeUser,
            panelConfig: newPanel,
        });

        setGeneratedEmail(response.email);
    };

    const handleSiteSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Then set site.
        setSelectedSites(selectOption as SingleValue<SelectOption>);
    };

    const handlePanelTypeSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Then set site.
        setPanelType(selectOption as SingleValue<SelectOption>);
    };

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
        if (customersQuery.data) {
            const sortedCustomers = customersQuery.data.sort(sortByName);

            const customersAsOptions =
                OptionsConverter.convertCustomersToOptions(
                    sortedCustomers as ICustomer[]
                );

            setSelectedCustomer(null);
            setCustomerOptions(customersAsOptions);
        }
    }, [customersQuery.data]);

    useEffect(() => {
        const sitesData: ISite[] | undefined = sitesQuery.data;

        setSelectedSites(null);

        if (sitesData && sitesData.length > 0) {
            const sortedSitesData = sitesData.sort(sortByName);
            const options =
                OptionsConverter.convertSitesToOptions(sortedSitesData);

            setSiteOptions(options);
        } else {
            setSiteOptions([]);
        }
    }, [sitesQuery.data]);

    useEffect(() => {
        if (selectedServiceProvider?.value) {
            customersQuery.refetch();
        }
    }, [selectedServiceProvider, selectedServiceProvider?.value]);

    useEffect(() => {
        if (selectedCustomer) {
            sitesQuery.refetch();
        }
    }, [selectedCustomer]);

    return (
        <motion.div
            id="RegisterDevice"
            key="RegisterDevice"
            className="RegisterDevice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            {customersQuery.isFetching && (
                <LoadingModal
                    modalText="Loading Customer data..."
                    zIndex={96}
                />
            )}

            {createPanelMutation.isLoading && (
                <LoadingModal modalText="Creating panel..." zIndex={96} />
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                {accountType === AccountType.Evolon && (
                    <div className="select-container form-item">
                        <label htmlFor="service-providers">
                            <span>Under SP Account</span>
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
                            required
                        />
                    </div>
                )}
                <div className="select-container form-item">
                    <label htmlFor="customers">
                        <span>Customer</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="customers"
                        value={selectedCustomer}
                        onChange={(option) => {
                            setSelectedCustomer(
                                option as SingleValue<SelectOption>
                            );
                            setSelectedSites(null);
                            setSiteOptions([]);
                        }}
                        options={customerOptions}
                        isClearable={false}
                        disabled={defaultCustomer !== null}
                        required
                    />
                </div>
                <div className="select-container form-item">
                    <label htmlFor="site">
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

                {selectedSites?.value === 'create-new-site' && (
                    <Input
                        id="new-site-name"
                        name="new-site-name"
                        label="New Site Name"
                        className="input field"
                        type="text"
                        value={newSiteName}
                        onChange={setNewSiteName}
                        required
                    />
                )}

                <Input
                    id="panel-name"
                    name="panel-name"
                    label="Panel Name"
                    className="input field"
                    type="text"
                    value={panelName}
                    onChange={setPanelName}
                    required
                />

                <Input
                    id="device-id"
                    name="device-id"
                    label="Device ID"
                    className="input field"
                    type="text"
                    value={deviceId}
                    onChange={setDeviceId}
                    required
                />

                <div className="select-container form-item">
                    <label htmlFor="panel-type-select">
                        <span>Panel Type</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="panel-type-select"
                        value={panelType}
                        onChange={handlePanelTypeSelect}
                        options={[
                            {
                                value: 'Amarok / Resideo',
                                label: 'Amarok / Resideo',
                            },
                            { value: 'DMP', label: 'DMP' },
                        ]}
                        required
                    />
                </div>

                <Button
                    id="submit"
                    className="btn primary register-site-btn"
                    label="Register"
                    type="submit"
                    disabled={activeUser?.modifier?.includes(
                        AccountTypeModifier.ReadOnly
                    )}
                />
            </form>

            {generatedEmail && (
                <div className="generatedEmailContainer">
                    <h3>Generated Email From Insites System</h3>
                    <div className="generatedEmailInputContainer">
                        <input
                            className="input"
                            value={generatedEmail}
                            disabled
                            onChange={(e) => setGeneratedEmail(e.target.value)}
                        />
                        <button
                            type="button"
                            className="btn primary"
                            data-toggle="tooltip"
                            data-placement="bottom"
                            title="Copy to clipboard"
                            onClick={() => {
                                navigator.clipboard.writeText(generatedEmail);
                                toast.success('Email address copied!');
                            }}
                        >
                            <svg
                                className="icon"
                                xmlns="http://www.w3.org/2000/svg"
                                xmlnsXlink="http://www.w3.org/1999/xlink"
                                version="1.1"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                            >
                                <path d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" />
                            </svg>
                        </button>
                    </div>

                    <p className="success">Panel Created!</p>
                    <p>
                        Make sure to copy and keep the generated email address
                        above.
                    </p>
                    <p>
                        Send in a test event to Insites with an image to
                        complete camera configuration.
                    </p>
                    <div className="smtpConfigInfo">
                        <p>DNS Name: mail.evolon.net</p>
                        <p>SMTP server: 44.215.189.141</p>

                        <p>Port: 8025</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default RegisterPanel;
