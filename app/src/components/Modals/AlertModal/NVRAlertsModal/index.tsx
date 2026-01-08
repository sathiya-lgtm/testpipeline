/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable no-await-in-loop */
/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, {
    FC,
    useMemo,
    useContext,
    useState,
    useEffect,
    FormEvent,
    useRef,
} from 'react';

// React-Router-Dom
import { useNavigate } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';
import { SingleValue, MultiValue } from 'react-select';
import Papa, { ParseResult } from 'papaparse';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import readXlsxFile from 'read-excel-file';

// Api calls
import createAlert from '../../../../api_calls/createAlert';

// Components
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';

// Custom
import handleHttpRequestError from '../../../../utils/handleHttpRequestError';
import {
    useCustomers,
    useServiceProviders,
    useSites,
    useCameras,
} from '../../../../hooks';
import { createAlertData } from '../AlertModal.controller';
import extractErrorMessage from '../../../../utils/extractErrorMessage';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

// Utils
import getAccountType from '../../../../utils/getAccountType';
import sortByName from '../../../../utils/sortByName';
import OptionsConverter from '../../../../classes/OptionsConverter';

// Types
import { SelectOption, IUser } from '../../../../types/interfaces';
import {
    ISite,
    IServiceProvider,
    ICustomer,
} from '../../../../types/tng-api.interfaces';
import { AccountType } from '../../../../types/enums';

// styles
import '../../../../styles/components/Modals/NVRAlertsModal.scss';

const escapeCSV = (value: any) => {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Escape internal quotes and wrap in double quotes
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

interface BulkImmixNVRUploadColumns {
    NVR_CHANNEL: string;
    ALERT_NAME: string;
    CAMERA_NAME: string;
    CAMERA_ID: string;
    SITE_NAME: string;
    NVR_TYPE: string;
    IMMIX_HOST: string;
    IMMIX_SMTP_PORT: string;
    IMMIX_SITE_NUMBER: string;
    IMMIX_SMTP_DOMAIN: string;
}

interface IProps {
    handleClose: () => void;
    refetchAlerts: () => any;
}

const NVRAlertsModal: FC<IProps> = ({ handleClose, refetchAlerts }) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);

    const accountType: AccountType = useMemo(
        () => getAccountType(activeUser),
        [activeUser]
    );

    /** Default Service Provider option if active user is Service Provider (i.e. not Evolon) and necessary data is available. */
    const defaultServiceProvider = useMemo(() => {
        if (
            accountType === AccountType.ServiceProvider &&
            activeUser?.account_name &&
            activeUser?.service_provider_account
        )
            return {
                label: activeUser.account_name,
                value: String(activeUser.service_provider_account),
            };
        return null;
    }, [activeUser]);

    /** Default Service Provider option if active user is Service Provider (i.e. not Evolon) and necessary data is available. */
    const defaultCustomer = useMemo(() => {
        if (
            accountType === AccountType.Customer &&
            activeUser?.account_name &&
            activeUser?.client_account
        )
            return {
                label: activeUser.account_name,
                value: String(activeUser.client_account),
            };
        return null;
    }, [activeUser]);

    // Refs
    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const hiddenLinkRef = useRef<HTMLAnchorElement | null>(null);

    // Modal State
    const [stepNumber, setStepNumber] = useState(1);

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
    const [selectedSite, setSelectedSite] = useState<any | null>(null);
    const [selectedSiteData, setSelectedSiteData] = useState<ISite | null>(
        null
    );

    // Immix State
    const [immixHost, setImmixHost] = useState('');
    const [immixSMTPPort, setImmixSMTPPort] = useState('');
    const [immixSiteNumber, setImmixSiteNumber] = useState('');
    const [immixSMTPDomain, setImmixSMTPDomain] = useState('@immixalarms.com');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState({
        alertsCreated: 0,
        totalAlerts: 0,
    });
    const [isLoading, setIsLoading] = useState(false);

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
        enabled: accountType === AccountType.Customer || !!selectedCustomer,
    });

    const cameraQuery = useCameras({
        siteId: selectedSiteData?.site_id || 0,
        activeUser: activeUser as IUser,
        enabled: !!selectedSiteData,
    });

    const createAlertMutation = useMutation({
        mutationFn: createAlert,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    const alertTemplateDataIncomplete = useMemo(() => {
        return (
            immixHost === '' ||
            immixSMTPDomain === '' ||
            immixSMTPPort === '' ||
            immixSiteNumber === ''
        );
    }, [immixHost, immixSMTPDomain, immixSMTPPort, immixSiteNumber]);

    const bulkAlertAdd = async (alertsToAdd: BulkImmixNVRUploadColumns[]) => {
        setIsLoading(true);
        for (let i = 0; i < alertsToAdd.length; i += 1) {
            // Create a new Alert
            const alertData = createAlertData('immix', {
                account_id: Number(selectedCustomer?.value),
                camera_id: Number(alertsToAdd[i].CAMERA_ID),
                name: alertsToAdd[i].ALERT_NAME,
                port: Number(alertsToAdd[i].IMMIX_SMTP_PORT),
                server: alertsToAdd[i].IMMIX_HOST,
                to_email: `S${alertsToAdd[i].IMMIX_SITE_NUMBER}.a${alertsToAdd[i].NVR_CHANNEL}${alertsToAdd[i].IMMIX_SMTP_DOMAIN}`,
                from_email: `S${alertsToAdd[i].IMMIX_SITE_NUMBER}.a${alertsToAdd[i].NVR_CHANNEL}${alertsToAdd[i].IMMIX_SMTP_DOMAIN}`,
                subject: 'MotionDetected',
                immixEventType: 'MotionDetected', // createAlertData function should only add this field if immix alert
                identifier: alertsToAdd[i].IMMIX_SITE_NUMBER,
            });

            if (alertData && activeUser) {
                try {
                    await createAlertMutation.mutateAsync({
                        user: activeUser,
                        alertConfig: alertData,
                    });
                } catch (err) {
                    console.error(extractErrorMessage(err));
                    toast.error(
                        `Something went wrong uploading the alert named ${alertsToAdd[i].ALERT_NAME}`
                    );
                }
            }

            setUploadStatus((previousState) => {
                return {
                    alertsCreated: i + 1,
                    totalAlerts: previousState.totalAlerts,
                };
            });
        }

        toast.success('New Immix NVR Alerts created.');
        setIsLoading(false);
        refetchAlerts();
        handleClose();
    };

    // Validates the information in the user uploaded csv
    const checkCSVInput = (csvInputData: BulkImmixNVRUploadColumns[]) => {
        const expectedColumns = [
            'NVR_CHANNEL',
            'ALERT_NAME',
            'CAMERA_NAME',
            'CAMERA_ID',
            'SITE_NAME',
            'NVR_TYPE',
            'IMMIX_HOST',
            'IMMIX_SMTP_PORT',
            'IMMIX_SITE_NUMBER',
            'IMMIX_SMTP_DOMAIN',
        ];
        const errorMessages: string[] = [];

        csvInputData.forEach((csvRow) => {
            expectedColumns.forEach((column) => {
                if (!(column in csvRow)) {
                    errorMessages.push(`${column} missing from csv.`);
                } else if (
                    !csvRow[column as keyof BulkImmixNVRUploadColumns] &&
                    'CAMERA_NAME' in csvRow
                ) {
                    errorMessages.push(
                        `${column} missing data for camera ${csvRow.CAMERA_NAME}`
                    );
                }
            });

            // eslint-disable-next-line no-restricted-globals
            if (isNaN(Number(csvRow.NVR_CHANNEL))) {
                errorMessages.push(
                    `NVR_CHANNEL should be a number for camera ${csvRow.CAMERA_NAME}`
                );
            }
        });

        return errorMessages;
    };

    const printCSV = async (result: ParseResult<BulkImmixNVRUploadColumns>) => {
        const errorMessages = checkCSVInput(result.data);

        if (errorMessages.length > 0) {
            errorMessages.forEach((message) => toast.error(message));
            setUploadedFile(null);

            if (hiddenFileInput && hiddenFileInput.current) {
                hiddenFileInput.current.value = '';
            }
            return;
        }

        setUploadStatus({
            ...uploadStatus,
            totalAlerts: result.data.length,
        });

        await bulkAlertAdd(result.data);
    };

    const handleDownloadCSV = () => {
        if (!cameraQuery.data || !selectedSiteData) return;

        const cameraList = cameraQuery.data;

        const csvHeaders =
            'NVR_CHANNEL,ALERT_NAME,CAMERA_NAME,CAMERA_ID,SITE_NAME,NVR_TYPE,IMMIX_HOST,IMMIX_SMTP_PORT,IMMIX_SITE_NUMBER,IMMIX_SMTP_DOMAIN\n';

        const csvBody = cameraList.map((camera: any) =>
            [
                '',
                '',
                escapeCSV(camera.camera_name),
                camera.camera_id,
                escapeCSV(selectedSiteData.site_name),
                selectedSiteData?.properties?.template || '',
                escapeCSV(immixHost),
                immixSMTPPort,
                immixSiteNumber,
                escapeCSV(immixSMTPDomain),
            ].join(',')
        );

        const csvData = `${csvHeaders}${csvBody.join('\n')}`;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        if (hiddenLinkRef.current) {
            hiddenLinkRef.current.href = url;
            hiddenLinkRef.current.download = 'Immix Alert Template.csv';
            hiddenLinkRef.current.click();
            URL.revokeObjectURL(url); // cleanup right after click
        }

        setStepNumber(stepNumber + 1);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (stepNumber === 1) {
            setStepNumber(2);
            return;
        }

        if (stepNumber === 3 && uploadedFile) {
            if (uploadedFile.type === 'text/csv') {
                Papa.parse(uploadedFile, {
                    header: true,
                    download: true,
                    skipEmptyLines: true,
                    complete: printCSV,
                });
            } else if (
                uploadedFile.type ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ) {
                const rows = await readXlsxFile(uploadedFile);
                const formattedJsonData: BulkImmixNVRUploadColumns[] = [];

                rows.forEach((row, rowIndex) => {
                    const obj: any = {};

                    if (rowIndex !== 0) {
                        row.forEach((colValue, colIndex) => {
                            const colName = rows[0][colIndex] as string;
                            obj[colName] = colValue || '';
                        });

                        formattedJsonData.push(obj);
                    }
                });

                const errorMessages = checkCSVInput(formattedJsonData);

                if (errorMessages.length > 0) {
                    errorMessages.forEach((message) => toast.error(message));
                    return;
                }

                setUploadStatus({
                    ...uploadStatus,
                    totalAlerts: formattedJsonData.length,
                });

                await bulkAlertAdd(formattedJsonData);
            }
        }
    };

    const handleCustomerSelect = async (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ) => {
        // Then set selected customer.
        setSelectedCustomer(selectOption as SingleValue<SelectOption>);
    };

    const handleSiteSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Then set site.
        setSelectedSite(selectOption);

        const selectedOption = selectOption as SelectOption;
        if (selectedOption && sitesQuery.data) {
            const siteId = Number(selectedOption.value);
            const matchedSite = sitesQuery.data.find(
                (site) => site.site_id === siteId
            );

            if (matchedSite) {
                setSelectedSiteData(matchedSite);
            }
        }
    };

    const handleUploadFileBtn = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target && e.target.files && e.target.files.length > 0) {
            const fileUploaded = e.target.files[0];
            const fileReader = new FileReader();
            fileReader.readAsText(fileUploaded);

            setUploadedFile(fileUploaded);
        }
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
            const filteredSites = sitesData.filter((site) => {
                return site?.properties?.job_type === 'email-nvr';
            });
            const sortedSitesData = filteredSites.sort(sortByName);

            const options =
                OptionsConverter.convertNVRSitesToOptions(sortedSitesData);

            setSiteOptions(options);
        }
    }, [sitesQuery.data]);

    return (
        <motion.div
            key="backdrop"
            className="alertModalBackdrop"
            onClick={() => {}}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 1 }}
        >
            <motion.div
                key="modal"
                className="alertModalBase"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.2 } }}
                transition={{ duration: 1 }}
            >
                <header>
                    <h2>Create NVR Alerts</h2>
                    <button type="button" id="x-button" onClick={handleClose}>
                        X
                    </button>
                </header>

                <form className="alert-modal" onSubmit={handleSubmit}>
                    {stepNumber === 1 && (
                        <StepOne
                            accountType={accountType}
                            selectedServiceProvider={selectedServiceProvider}
                            serviceProviderOptions={serviceProviderOptions}
                            setSelectedServiceProvider={
                                setSelectedServiceProvider
                            }
                            defaultServiceProvider={defaultServiceProvider}
                            selectedCustomer={selectedCustomer}
                            customerOptions={customerOptions}
                            handleCustomerSelect={handleCustomerSelect}
                            defaultCustomer={defaultCustomer}
                            siteOptions={siteOptions}
                            selectedSite={selectedSite}
                            handleSiteSelect={handleSiteSelect}
                        />
                    )}
                    {stepNumber === 2 && (
                        <StepTwo
                            selectedCustomer={selectedCustomer}
                            selectedSite={selectedSite}
                            immixHost={immixHost}
                            setImmixHost={setImmixHost}
                            immixSMTPPort={immixSMTPPort}
                            setImmixSMTPPort={setImmixSMTPPort}
                            immixSiteNumber={immixSiteNumber}
                            setImmixSiteNumber={setImmixSiteNumber}
                            immixSMTPDomain={immixSMTPDomain}
                            setImmixSMTPDomain={setImmixSMTPDomain}
                        />
                    )}
                    {stepNumber === 3 && (
                        <StepThree
                            handleFileInputChange={handleFileInputChange}
                            handleUploadFileBtn={handleUploadFileBtn}
                            hiddenFileInput={hiddenFileInput}
                            uploadedFile={uploadedFile}
                        />
                    )}

                    <div className="modal-btns-container">
                        <button
                            className="btn danger"
                            type="button"
                            onClick={() => {
                                if (stepNumber === 1) handleClose();
                                else setStepNumber(stepNumber - 1);
                            }}
                        >
                            {stepNumber === 1 ? 'Cancel' : 'Back'}
                        </button>
                        {stepNumber === 2 && alertTemplateDataIncomplete && (
                            <button className="btn primary" type="submit">
                                Download Alert Template
                            </button>
                        )}
                        {stepNumber === 2 && !alertTemplateDataIncomplete && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleDownloadCSV}
                                    className="btn primary"
                                    style={{ display: 'inline-block' }}
                                >
                                    Download Alert Template
                                </button>

                                {/* Hidden anchor used only for triggering the download */}
                                <a
                                    ref={hiddenLinkRef}
                                    style={{ display: 'none' }}
                                />
                            </>
                        )}

                        {stepNumber !== 2 && (
                            <button className="btn primary" type="submit">
                                {stepNumber === 3 ? 'Create Alerts' : 'Next'}
                            </button>
                        )}
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
                                <h2>Uploading Alerts...</h2>
                                <h2>
                                    {uploadStatus.alertsCreated} /{' '}
                                    {uploadStatus.totalAlerts} Complete
                                </h2>
                            </div>
                        </div>
                    )}
                </form>
            </motion.div>
        </motion.div>
    );
};

export default NVRAlertsModal;
