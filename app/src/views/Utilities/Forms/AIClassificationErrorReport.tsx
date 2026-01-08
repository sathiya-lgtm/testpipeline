/* eslint-disable no-await-in-loop */
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
import { parseISO, differenceInDays, addDays } from 'date-fns';

// API Calls
import fetchAIClassificationErrorReport from '../../../api_calls/fetchAIClassificationErrorReport';

// Custom
import {
    useServiceProviders,
    useCustomers,
    useSites,
    useCameras,
} from '../../../hooks';

import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';

// Components
import Button from '../../../components/Button';
import Select from '../../../components/Inputs/Select';

// Utils
import getMinDate from '../../../utils/getMinDate';
import getMaxDate from '../../../utils/getMaxDate';
import generateAIClassificationErrorReport, {
    addAIClassificationErrorReportHeaders,
} from '../../../utils/generateAIClassificationErrorReport';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import {
    IServiceProvider,
    ICustomer,
    ISite,
} from '../../../types/tng-api.interfaces';

const allSelectOption = [{ value: '0', label: 'All' }];

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
const AIClassificationErrorReport: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
}: IProps): ReactElement => {
    const navigate = useNavigate();

    // const serviceProviderName = useMemo(() => {
    //    return activeUser?.account_name || '';
    // }, [activeUser]);

    // state
    const [serviceProviderOptions, setServiceProviderOptions] =
        useState<SelectOption[]>(allSelectOption);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(allSelectOption[0]);
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
    const [startDate, setStartDate] = useState(getMinDate());
    const [endDate, setEndDate] = useState(getMaxDate());
    const [AIClassificationErrorReportCSV, setAIClassificationErrorReportCSV] =
        useState<string>('');
    const [reportStatus, setReportStatus] = useState({
        daysGenerated: 0,
        totalDays: 0,
    });
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

    const AIClassificationErrorReportMutation = useMutation({
        mutationFn: fetchAIClassificationErrorReport,
        onError: (err: any) => {
            handleHttpRequestError(err, setActiveUser, navigate);
            setIsLoading(false);
        },
    });

    const clearForm = () => {
        setSelectedServiceProvider(allSelectOption[0]);
        setSelectedCustomer(allSelectOption[0]);
        setSelectedSite(allSelectOption[0]);
        setSelectedCamera(allSelectOption[0]);
        setStartDate(getMinDate());
        setEndDate(getMaxDate());
        setAIClassificationErrorReportCSV('');
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

        // if (!serviceProviderId) {
        //     return;
        // }

        const startDateObj = parseISO(`${startDate} 00:00:00`);
        const endDateObj = parseISO(`${endDate} 23:59:59`);
        const diffDays = differenceInDays(endDateObj, startDateObj) + 1;

        if (diffDays > 45) {
            toast.warning(
                'Time range between start and end date must not exceed 45 days'
            );
            return;
        }

        setReportStatus({
            ...reportStatus,
            totalDays: diffDays,
        });

        setIsLoading(true);

        let csvString = '';
        if (diffDays === 1) {
            const startTime = startDateObj.toISOString();
            const endTime = endDateObj.toISOString();

            const AIClassificationErrorReportData = {
                start_time: startTime,
                end_time: endTime,
                service_provider_account_id: Number(
                    selectedServiceProvider?.value ?? 0
                ),
                account_id: Number(selectedCustomer?.value ?? 0),
                site_id: Number(selectedSite?.value ?? 0),
                camera_id: Number(selectedCamera?.value ?? 0),
            };

            const results =
                await AIClassificationErrorReportMutation.mutateAsync({
                    user: activeUser,
                    AIClassificationErrorReportData,
                });

            csvString = addAIClassificationErrorReportHeaders(results.headers);
            csvString = generateAIClassificationErrorReport(results, csvString);

            setReportStatus((previousState) => {
                return {
                    daysGenerated: 1,
                    totalDays: previousState.totalDays,
                };
            });

            if (AIClassificationErrorReportCSV) {
                URL.revokeObjectURL(AIClassificationErrorReportCSV);
            }

            const blob = new Blob([csvString], {
                type: 'text/csv;charset=utf-8;',
            });

            const url = URL.createObjectURL(blob);

            setAIClassificationErrorReportCSV(url);
            setIsLoading(false);
            setReportStatus({
                daysGenerated: 0,
                totalDays: 0,
            });
            toast.success('AI Classification Error Report Generated');
        } else {
            for (let i = 0; i < diffDays; i += 1) {
                const currentStartDate = addDays(startDateObj, i);
                let currentEndDate = addDays(startDateObj, i + 1);

                if (currentEndDate > endDateObj) {
                    currentEndDate = endDateObj;
                }

                const serviceProviderAccountId =
                    selectedServiceProvider?.value ?? '0';
                const accountId = selectedCustomer?.value ?? '0';
                const siteId = selectedSite?.value ?? '0';
                const cameraId = selectedCamera?.value ?? '0';
                const AIClassificationErrorReportData = {
                    start_time: currentStartDate.toISOString(),
                    end_time: currentEndDate.toISOString(),
                    service_provider_account_id: Number(
                        serviceProviderAccountId
                    ),
                    account_id: Number(accountId),
                    site_id: Number(siteId),
                    camera_id: Number(cameraId),
                };
                const results =
                    await AIClassificationErrorReportMutation.mutateAsync({
                        user: activeUser,
                        AIClassificationErrorReportData,
                    });

                if (i === 0) {
                    csvString = addAIClassificationErrorReportHeaders(
                        results.headers
                    );
                }
                csvString = generateAIClassificationErrorReport(
                    results,
                    csvString
                );
                setReportStatus((previousState) => {
                    return {
                        daysGenerated: i + 1,
                        totalDays: previousState.totalDays,
                    };
                });
            }

            if (AIClassificationErrorReportCSV) {
                URL.revokeObjectURL(AIClassificationErrorReportCSV);
            }

            const blob = new Blob([csvString], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);

            setAIClassificationErrorReportCSV(url);
            setIsLoading(false);
            setReportStatus({
                daysGenerated: 0,
                totalDays: 0,
            });
            toast.success('AI Classification Error Report Generated');
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
                <span>AI Classification Error Report</span>
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
                        min={getMinDate(45)}
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
                        onChange={(e) => setEndDate(e.target.value)}
                        max={getMaxDate()}
                        required
                    />
                </div>
            </div>
            <div className="button-container">
                <Button
                    id="create"
                    className="btn primary"
                    label="Generate Report"
                    type="submit"
                    disabled={activeUser?.modifier?.includes(
                        AccountTypeModifier.ReadOnly
                    )}
                />

                <Button
                    id="clear"
                    type="button"
                    className="btn danger"
                    label="Clear"
                    onClick={clearForm}
                />
            </div>
            {isLoading && (
                <div
                    className="bulk-upload-loading-screen"
                    style={{
                        position: 'fixed',
                        height: '100%',
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.7)',
                        top: 0,
                        left: 0,
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div className="bulk-upload-text-container">
                        <h2>Generating AI Error Report...</h2>
                        <h2>
                            {reportStatus.daysGenerated} /{' '}
                            {reportStatus.totalDays} Days Generated
                        </h2>
                    </div>
                </div>
            )}
            {AIClassificationErrorReportCSV && (
                <div className="download-container">
                    <hr />
                    <a
                        id="camera-performance-report-download"
                        href={AIClassificationErrorReportCSV}
                        download={`${startDate}-AI_ERROR_REPORT`}
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

export default AIClassificationErrorReport;
