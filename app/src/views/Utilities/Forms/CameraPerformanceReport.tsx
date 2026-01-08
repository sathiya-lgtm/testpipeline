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
import generateCameraPerformanceReport, {
    IPerformanceReportInputData,
} from '../../../api_calls/generateCameraPerformanceReport';

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
// import getTimeZoneName from '../../../utils/getTimeZoneName';
// import csvCleanField from '../../../utils/csvCleanField';
// import generatePerformanceReportCSV from '../../../utils/generatePerformanceReportCSV';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import {
    ICustomer,
    ISite,
    IServiceProvider,
} from '../../../types/tng-api.interfaces';

import ButtonGroup, { ButtonGroupAlignment } from '../../../components/ButtonGroup/ButtonGroup';
import ReportsRoute, {IReportRequest, IReportResponse} from '../../../api_calls/Reports';


const allSelectOption = [{ value: 'all', label: 'All' }];

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
}

/**
 * Form for creating Customers.
 * @returns {ReactElement}
 */
const CameraPerformanceReport: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
}: IProps): ReactElement => {
    const navigate = useNavigate();

    const serviceProviderName = useMemo(() => {
        return activeUser?.account_name || '';
    }, [activeUser]);

    // state
    const [serviceProviderOptions, setServiceProviderOptions] = useState<
        SelectOption[]
    >(defaultServiceProvider !== null ? [defaultServiceProvider] : []);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);
    const [customerOptions, setCustomerOptions] =
        useState<SelectOption[]>(allSelectOption);
    const [selectedCustomer, setSelectedCustomer] =
        useState<SingleValue<SelectOption> | null>(allSelectOption[0]);
    const [siteOptions, setSiteOptions] =
        useState<SelectOption[]>(allSelectOption);
    const [selectedSite, setSelectedSite] =
        useState<SingleValue<SelectOption> | null>(allSelectOption[0]);
    const [cameraOptions, setCameraOptions] =
        useState<SelectOption[]>(allSelectOption);
    const [selectedCamera, setSelectedCamera] =
        useState<SingleValue<SelectOption> | null>(allSelectOption[0]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>(getMaxDate());
    const [cameraPerformanceReportCSV, setCameraPerformanceReportCSV] =
        useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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

    /*
    const cameraReportMutation = useMutation({
        mutationFn: generateCameraPerformanceReport,
        onError: (err: any) => {
            handleHttpRequestError(err, setActiveUser, navigate);
            setIsLoading(false);
        },
    });
    */

    const isWithinDayRange = (startDateStr: string, endDateStr: string, maxDays: number = 7): boolean => {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Invalid date format');
            return true;
        }

        const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        return diffDays <= maxDays;
    }

    const getCameraPerformanceReport = async ( request: IReportRequest ) => {
        try {
            const route = ReportsRoute(activeUser);    
            return await route.camera_performance( request );
        } catch( e: any ) {
            if( e.details.dealer) {
                toast.error( e.details?.description);
            } else {
                toast.error( 'Unhandled error occurred!' );
            }
            setCameraPerformanceReportCSV('');
            setIsLoading(false);
        }
    }

    const createCSVReport = ( headers: Array<string>, rows: Array<string>): string => {
        let csvData: string =  ''
        let csvHeaders: string = headers.join(',') + '\n';
        csvData += csvHeaders;
        rows.forEach(row => {
            csvData += row;
        })
        return csvData;
    }

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
        setIsLoading(true);

        if (!activeUser) return;

        if(activeUser.account_type === AccountType.Evolon && !serviceProviderId) {
            setIsLoading(false);
            toast.warning('The service provider account must be selected');
            return;
        }

        if(!isWithinDayRange(startDate, endDate)) {
            setIsLoading(false);
            toast.warning('The start and end date cannot be greater than 7 days');
            return;
        }

        const request: IReportRequest = {
            service_provider_account_id: Number(selectedServiceProvider?.value ?? null),
            account_id: Number(selectedCustomer?.value ?? null),
            site_id: Number(selectedSite?.value ?? null),
            start_date: startDate ?? null,
            end_date: endDate ?? null
        }
        
        const data = await getCameraPerformanceReport( request ) as IReportResponse;
        if( data?.headers && data?.rows) {
            const csvData = createCSVReport( data?.headers ?? [],  data?.rows ?? []);
            setCameraPerformanceReportCSV(csvData);
            setIsLoading(false);
            toast.success('Camera Report Generated');
        }

        // const performanceReportInputData: IPerformanceReportInputData = {
        //     group: '',
        //     group_id: 0,
        //     start_date: `${startDate} 00:00:00`,
        //     end_date: `${endDate} 23:59:59`,
        //     timezone,
        // };

        // if (selectedCamera && selectedCamera.value !== 'all') {
        //     performanceReportInputData.group = 'camera';
        //     performanceReportInputData.group_id = Number(selectedCamera.value);
        // } else if (selectedSite && selectedSite.value !== 'all') {
        //     performanceReportInputData.group = 'site';
        //     performanceReportInputData.group_id = Number(selectedSite.value);
        // } else if (selectedCustomer && selectedCustomer?.value !== 'all') {
        //     performanceReportInputData.group = 'customer';
        //     performanceReportInputData.group_id = Number(
        //         selectedCustomer.value
        //     );
        // } else if (
        //     selectedCustomer &&
        //     selectedCustomer.value === 'all' &&
        //     selectedServiceProvider
        // ) {
        //     performanceReportInputData.group = 'service_provider';
        //     performanceReportInputData.group_id = Number(
        //         selectedServiceProvider.value
        //     );
        // }

        // const results = await cameraReportMutation.mutateAsync({
        //     user: activeUser,
        //     performanceReportInputData,
        // });

        /**
         * We can added the sp_name from the active user since camera performance reports only come from service providers.
         * If this changes in the future, we will need to update how we are getting the sp_name for customer accounts because
         * this method won't work.
         */
        // const formattedResults = results.map((item) => {
        //     return {
        //         ...item,
        //         name: csvCleanField(item.name),
        //         sp_name: serviceProviderName,
        //         account_name: csvCleanField(item.account_name),
        //         site_name: csvCleanField(item.site_name),
        //         uuid: csvCleanField(item.uuid),
        //     };
        // });
        // const reportCSV = generatePerformanceReportCSV(formattedResults);
        // setIsLoading(false);
        // setCameraPerformanceReportCSV(reportCSV);
        // toast.success('Camera Report Generated');
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
                <span>Camera Performance Report</span>
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

                            setSelectedCustomer(null);
                            setCustomerOptions([]);
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
                        <span className="asterisk">*</span>
                    </label>
                    <input
                        className="input"
                        type="date"
                        id="performance-report-start-date"
                        name="performance-report-start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate}
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
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        max={getMaxDate()}
                        required
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
            {isLoading && <LoadingModal modalText="Generating Report..." />}
            {cameraPerformanceReportCSV && (
                <div className="download-container">
                    <hr />
                    <a
                        id="camera-performance-report-download"
                        href={`data:text/csv;charset=utf-8,${encodeURI(
                            cameraPerformanceReportCSV
                        )}`}
                        download={`${serviceProviderName}-CameraPerformanceReport`}
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

export default CameraPerformanceReport;
