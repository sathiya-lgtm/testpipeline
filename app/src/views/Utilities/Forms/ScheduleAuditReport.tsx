/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
    ReactElement,
    FC,
    Dispatch,
    SetStateAction,
    useEffect,
    useState,
    FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SingleValue, MultiValue } from 'react-select';
import { toast } from 'react-toastify';
import { parseISO, differenceInDays, format } from 'date-fns';

// Api Calls
import getScheduleAuditReport from '../../../api_calls/getScheduleAuditReport';

// Custom
import sortByName from '../../../utils/sortByName';
import { useCustomers, useServiceProviders, useSites } from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';

// Components
import Select from '../../../components/Inputs/Select';
import Button from '../../../components/Button';
import LoadingModal from '../../../components/Modals/LoadingModal';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import {
    ICustomer,
    IServiceProvider,
    ISite,
} from '../../../types/tng-api.interfaces';

// Styles
import '../../../styles/views/Utilities/CreateCustomer.scss';
import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../../components/ButtonGroup/ButtonGroup';

const getMaxDate = () => {
    const today = new Date();
    return format(today, 'yyyy-MM-dd');
};

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

const ScheduleAuditReport: FC<IProps> = ({
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

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [scheduleAuditReportCSV, setScheduleAuditReportCSV] =
        useState<string>('');

    const clearForm = () => {
        if (!defaultServiceProvider) {
            setSelectedServiceProvider(null);
        }

        setSelectedCustomer(null);
        setSelectedSites(null);
        setStartDate('');
        setEndDate('');
        setScheduleAuditReportCSV('');
    };

    const scheduleAuditReportMutation = useMutation({
        mutationFn: getScheduleAuditReport,
        onError: (err: any) => {
            console.log(err);
            toast.error('Unable to generate schedule audit report.');
        },
    });

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

    const handleCustomerSelect = async (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ) => {
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

    const getReport = async (e: FormEvent) => {
        e.preventDefault();

        if (!selectedCustomer || !selectedSites || !activeUser) {
            return;
        }

        const account_id = Number(selectedCustomer.value);
        const site_id =
            selectedSites.value === 'all' ? 0 : Number(selectedSites.value);
        const startDateObj = parseISO(`${startDate}T00:00:00`);
        const endDateObj = parseISO(`${endDate}T23:59:59`);
        const diffDays = differenceInDays(endDateObj, startDateObj) + 1;

        if (startDateObj >= endDateObj) {
            toast.warning('Start Date/Time must be before end Date/Time.');
            return;
        }

        if (diffDays > 45) {
            toast.warning(
                'Time range between start and end date must not exceed 45 days'
            );
            return;
        }

        const result = await scheduleAuditReportMutation.mutateAsync({
            user: activeUser,
            account_id,
            site_id,
            start_dt: `${startDate}T00:00:00`,
            end_dt: `${endDate}T23:59:59`,
        });

        if (result.headers.length === 0) {
            toast.warning(
                'No schedule changes reported for this account, site(s), and time period.'
            );
            return;
        }

        const csvString = `${result.headers.join(',')}\n${result.rows.join(
            ''
        )}`;

        if (scheduleAuditReportCSV) {
            URL.revokeObjectURL(scheduleAuditReportCSV);
        }

        const blob = new Blob([csvString], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        setScheduleAuditReportCSV(url);

        toast.success('Schedule Audit Report Generated');
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
            const modifiedOptions = [
                { value: 'all', label: 'All' },
                ...options,
            ];

            setSiteOptions(modifiedOptions);
        }
    }, [sitesQuery.data]);

    return (
        <motion.form
            id="scheduling"
            key="scheduling"
            className="scheduling form"
            onSubmit={getReport}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <h3 id="title">
                <span>Scheduling Change Audit Report</span>
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

                            setSelectedCustomer(null);
                            setCustomerOptions([]);
                            setSelectedSites(null);
                            setSiteOptions([]);
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

            <div className="report-time-range-container">
                <div>
                    <label htmlFor="performance-report-start-date">
                        <span>Start Date</span>
                        <span className="asterisk">*</span>
                    </label>
                    <input
                        className="input"
                        type="date"
                        id="performance-report-start-date"
                        name="performance-report-start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || getMaxDate()}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="performance-report-end-date">
                        <span>End Date</span>
                        <span className="asterisk">*</span>
                    </label>
                    <input
                        className="input"
                        type="date"
                        id="performance-report-end-date"
                        name="performance-report-end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        max={getMaxDate()}
                    />
                </div>
            </div>
            <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                <Button
                    id="clear"
                    type="button"
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

            {scheduleAuditReportCSV && (
                <div className="download-container">
                    <hr />
                    <a
                        id="camera-performance-report-download"
                        href={scheduleAuditReportCSV}
                        download="Schedule_Audit_Report"
                        className="btn primary outline"
                        style={{ display: 'inline-block' }}
                    >
                        Download Report
                    </a>
                </div>
            )}

            {scheduleAuditReportMutation.isLoading && (
                <LoadingModal modalText="Generating Schedule Audit Report..." />
            )}
        </motion.form>
    );
};

export default ScheduleAuditReport;
