/* eslint-disable object-shorthand */
/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, {
    ReactElement,
    FC,
    Dispatch,
    SetStateAction,
    useEffect,
    useMemo,
    useState,
    FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';
import { SingleValue } from 'react-select';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// API Calls
import generateProMonitoringReport, {
    IProMonitoringReportInputData,
} from '../../../api_calls/generateProMonitoringReport';

// Custom
import {
    useCustomers,
    useSites,
    useServiceProviders,
    useCameras,
} from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';

// Components
import Button from '../../../components/Button';
import Select from '../../../components/Inputs/Select';
import LoadingModal from '../../../components/Modals/LoadingModal';

// Utils
import getMaxDate from '../../../utils/getMaxDate';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import {
    ICustomer,
    ISite,
    IServiceProvider,
} from '../../../types/tng-api.interfaces';
import ButtonGroup, { ButtonGroupAlignment } from '../../../components/ButtonGroup/ButtonGroup';

const allSelectOption = [{ value: 'all', label: 'All' }];

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
}

/**
 * Form for creating Customers.
 * @returns {ReactElement}
 */
const ProMonitoringReport: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
    defaultCustomer,
}: IProps): ReactElement => {
    const navigate = useNavigate();

    // state
    const [serviceProviderOptions, setServiceProviderOptions] = useState<
        SelectOption[]
    >(defaultServiceProvider !== null ? [defaultServiceProvider] : []);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer !== null ? [defaultCustomer] : allSelectOption
    );
    const [selectedCustomer, setSelectedCustomer] =
        useState<SingleValue<SelectOption> | null>(
            defaultCustomer !== null ? defaultCustomer : allSelectOption[0]
        );
    const [siteOptions, setSiteOptions] =
        useState<SelectOption[]>(allSelectOption);
    const [selectedSite, setSelectedSite] =
        useState<SingleValue<SelectOption> | null>(allSelectOption[0]);
    const [cameraOptions, setCameraOptions] =
        useState<SelectOption[]>(allSelectOption);
    const [selectedCamera, setSelectedCamera] =
        useState<SingleValue<SelectOption> | null>(allSelectOption[0]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [proMonitoringReportCSV, setProMonitoringReportCSV] = useState('');

    const serviceProvidersQuery = useServiceProviders({
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Evolon,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const serviceProviderId = useMemo(() => {
        if (accountType === AccountType.Evolon && selectedServiceProvider) {
            return Number(selectedServiceProvider?.value);
        }

        if (accountType === AccountType.ServiceProvider) {
            return activeUser.service_provider_account as number;
        }

        return null;
    }, [activeUser, selectedServiceProvider]);

    const customersQuery = useCustomers({
        serviceProviderId: serviceProviderId || 0,
        activeUser: activeUser as IUser,
        enabled: serviceProviderId !== null,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const sitesQuery = useSites({
        customerId: Number(selectedCustomer?.value),
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Customer,
    });

    const camerasQuery = useCameras({
        siteId: Number(selectedSite?.value),
        activeUser: activeUser as IUser,
        enabled: false,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const proMonitoringReportMutation = useMutation({
        mutationFn: generateProMonitoringReport,
    });

    const clearForm = () => {
        setServiceProviderOptions(
            defaultServiceProvider !== null ? [defaultServiceProvider] : []
        );
        setSelectedServiceProvider(defaultServiceProvider);
        setSelectedCustomer(allSelectOption[0]);
        setSelectedSite(allSelectOption[0]);
        setSelectedCamera(allSelectOption[0]);
        setStartDate('');
        setEndDate(getMaxDate());
        setProMonitoringReportCSV('');
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
            const modifiedOptions = [
                { value: 'all', label: 'All' },
                ...customersAsOptions,
            ];

            setCustomerOptions(modifiedOptions);
        }
    }, [customersQuery.data]);

    useEffect(() => {
        const sitesData: ISite[] | undefined = sitesQuery.data;

        if (sitesData && sitesData.length > 0) {
            const sortedSitesData = sitesData.sort(sortByName);
            const options =
                OptionsConverter.convertSitesToOptions(sortedSitesData);
            const modifiedOptions = [
                { value: 'all', label: 'All' },
                ...options,
            ];

            setSiteOptions(modifiedOptions);
        } else {
            setSiteOptions(allSelectOption);
        }
    }, [sitesQuery.data]);

    useEffect(() => {
        const cameraData = camerasQuery.data;

        if (cameraData && cameraData.length > 0) {
            const sortedCamerasData = cameraData.sort(sortByName);
            const options =
                OptionsConverter.convertCamerasToOptions(sortedCamerasData);
            const modifiedOptions = [
                { value: 'all', label: 'All' },
                ...options,
            ];
            setCameraOptions(modifiedOptions);
        } else {
            setCameraOptions(allSelectOption);
        }
    }, [camerasQuery.data]);

    useEffect(() => {
        if (selectedServiceProvider) {
            customersQuery.refetch();
        }
    }, [selectedServiceProvider]);

    useEffect(() => {
        if (selectedCustomer && selectedCustomer.value !== 'all') {
            sitesQuery.refetch();
        }
    }, [selectedCustomer]);

    useEffect(() => {
        if (selectedSite && selectedSite.value !== 'all') {
            camerasQuery.refetch();
        }
    }, [selectedSite]);

    const getReport = async (e: FormEvent) => {
        e.preventDefault();

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (!activeUser || !timezone) return;

        const reportParams: IProMonitoringReportInputData = {
            group: 'service_provider',
            group_id: 0,
        };

        if (selectedCamera && selectedCamera.value !== 'all') {
            reportParams.group = 'camera';
            reportParams.group_id = Number(selectedCamera.value);
        } else if (selectedSite && selectedSite.value !== 'all') {
            reportParams.group = 'site';
            reportParams.group_id = Number(selectedSite.value);
        } else if (selectedCustomer && selectedCustomer?.value !== 'all') {
            reportParams.group = 'customer';
            reportParams.group_id = Number(selectedCustomer.value);
        } else if (
            selectedCustomer &&
            selectedCustomer.value === 'all' &&
            selectedServiceProvider
        ) {
            reportParams.group = 'service_provider';
            reportParams.group_id = Number(selectedServiceProvider.value);
        }

        if (startDate) {
            reportParams.start_dt = `${startDate} 00:00`;
        }

        if (endDate) {
            reportParams.end_dt = `${endDate} 23:59`;
        }

        reportParams.time_zone = timezone;

        try {
            const results = await proMonitoringReportMutation.mutateAsync({
                user: activeUser,
                reportParams,
            });
            let csvString = `${results.response.headers.join(',')}\n`;

            results.response.rows.forEach((row: string) => {
                csvString += row;
            });

            if (proMonitoringReportCSV) {
                URL.revokeObjectURL(proMonitoringReportCSV);
            }

            const blob = new Blob([csvString], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            setProMonitoringReportCSV(url);
            toast.success('Pro Monitoring Report generated');
        } catch (err) {
            toast.error('Unable to generate report');
        }
    };

    return (
        <motion.form
            id="CreateCustomer"
            key="CreateCustomer"
            autoComplete="off"
            onSubmit={getReport}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <h3 id="title">
                <span>Pro Monitoring Report</span>
            </h3>

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
                            if (
                                option?.value === selectedServiceProvider?.value
                            ) {
                                return;
                            }

                            setSelectedServiceProvider(
                                option as SingleValue<SelectOption>
                            );

                            setSelectedCustomer(allSelectOption[0]);
                            setSelectedSite(allSelectOption[0]);
                            setCustomerOptions(allSelectOption);
                            setSiteOptions(allSelectOption);
                        }}
                        options={serviceProviderOptions}
                        isClearable={false}
                        disabled={defaultServiceProvider !== null}
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
                        if (option?.value === selectedCustomer?.value) {
                            return;
                        }

                        setSelectedCustomer(
                            option as SingleValue<SelectOption>
                        );
                        setSelectedSite(allSelectOption[0]);
                        setSiteOptions(allSelectOption);
                    }}
                    options={customerOptions}
                    isClearable={false}
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
                    value={selectedSite}
                    onChange={(option) => {
                        if (option?.value === selectedSite?.value) {
                            return;
                        }

                        setSelectedSite(option as SingleValue<SelectOption>);
                        setSelectedCamera(allSelectOption[0]);
                        setCameraOptions(allSelectOption);
                    }}
                    options={siteOptions}
                    required
                />
            </div>
            <div className="select-container form-item">
                <label htmlFor="site">
                    <span>Camera(s)</span>
                    <span className="asterisk">*</span>
                </label>
                <Select
                    id="camera-select"
                    value={selectedCamera}
                    onChange={(option) => {
                        setSelectedCamera(option as SingleValue<SelectOption>);
                    }}
                    options={cameraOptions}
                    required
                />
            </div>
            <div className="report-time-range-container">
                <div>
                    <label htmlFor="performance-report-start-date">
                        <span>Start Date</span>
                    </label>
                    <input
                        className="input"
                        type="date"
                        id="performance-report-start-date"
                        name="performance-report-start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="performance-report-end-date">
                        <span>End Date</span>
                    </label>
                    <input
                        className="input"
                        type="date"
                        id="performance-report-end-date"
                        name="performance-report-end-date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>
            <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                <Button
                    id="clear"
                    className="btn danger"
                    label="Clear"
                    onClick={clearForm}
                />
                <Button
                    id="create"
                    className="btn primary"
                    label="Generate"
                    type="submit"
                    disabled={activeUser?.modifier?.includes(
                        AccountTypeModifier.ReadOnly
                    )}
                />
            </ButtonGroup>
            {proMonitoringReportMutation.isLoading && (
                <LoadingModal modalText="Generating Report..." />
            )}
            {proMonitoringReportCSV && (
                <div className="download-container">
                    <hr />
                    <a
                        href={proMonitoringReportCSV}
                        id="camera-config-report-download"
                        download={`${activeUser?.account_name}-ProMonitoringReport`}
                        className="btn primary outline"
                        style={{ display: 'inline-block' }}
                    >
                        Download Report
                    </a>
                </div>
            )}
        </motion.form>
    );
};

export default ProMonitoringReport;
