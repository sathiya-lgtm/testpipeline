/* eslint-disable no-await-in-loop */
/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, {
    FormEvent,
    useState,
    Dispatch,
    SetStateAction,
    FC,
    useEffect,
    useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';
import { SingleValue, MultiValue } from 'react-select';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import readXlsxFile from 'read-excel-file';

// API Calls
import createSMTPCamera, {
    ISMTPCameraConfig,
} from '../../../api_calls/createSMTPCamera';
import createAlert from '../../../api_calls/createAlert';
import { createAlertData } from '../../../components/Modals/AlertModal/AlertModal.controller';

// Custom
import { removeInvalidCharsFromName } from '../Utilities.controller';
import sortByName from '../../../utils/sortByName';
import {
    useCustomers,
    useServiceProviders,
    useSites,
    useAlerts,
} from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';

// Components
import Select from '../../../components/Inputs/Select';
import Button from '../../../components/Button';
import Input from '../../../components/Inputs/Input';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import {
    ICustomer,
    IServiceProvider,
    ISite,
} from '../../../types/tng-api.interfaces';
import ButtonGroup, { ButtonGroupAlignment } from '../../../components/ButtonGroup/ButtonGroup';

const subjectOptions: SelectOption[] = [
    { value: 'MotionDetected', label: 'Motion Detected' },
    { value: 'ObjectDetected', label: 'Object Detected' },
    { value: 'PersonDetected', label: 'Person Detected' },
    { value: 'VehicleDetected', label: 'Vehicle Detected' },
];

interface ImmixExcelColumns {
    AccountNumber: string;
    BackupHost: string;
    BackupPort: string;
    Comment: string;
    DeviceIdentifier: string;
    EdgePassword: string;
    EdgePath: string;
    EdgeUser: string;
    ExtraValue: string; // "rtsp://192.168.1.76:8554/AGS"
    GroupID: string;
    GroupSyncId: string;
    HeartbeatCheckedAt: string;
    HeartbeatEnabled: string;
    HeartbeatFailCount: string;
    HeartbeatFailThreshold: string;
    HeartbeatInterval: string;
    HeartbeatProcessingTimeout: string;
    Host: string;
    LastAlarmReceivedAt: string;
    LastSyncUpdate: string;
    LineNumber: string;
    LogDisarmedAlarms: string;
    Port: string;
    ReceiveUndefinedAlarms: string;
    ServerConnectionTypeId: string;
    ServerID: string;
    ServerLineProfileID: string;
    ServerTypeID: string;
    ShowEdge: string;
    Sync: string;
    SyncIdentifier: string;
    Title: string;
    UsePassthrough: string;
    Username: string;
}

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
}

const CreateSMTPCamera: FC<IProps> = ({
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

    // Customer state
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer !== null ? [defaultCustomer] : []
    );
    const [selectedCustomer, setSelectedCustomer] =
        useState<SingleValue<SelectOption> | null>(defaultCustomer);

    // Site State
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [selectedSites, setSelectedSites] = useState<any | null>(null);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Immix Alert Data
    const [server, setServer] = useState('');
    const [port, setPort] = useState('');
    const [selectedImmixEventType, setSelectedImmixEventType] =
        useState<SingleValue<SelectOption> | null>(subjectOptions[0]);
    const [immixDomainName, setImmixDomainName] = useState('immixalarms.com');

    // File Upload
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({
        camerasUploaded: 0,
        totalCameras: 0,
    });
    const [generatedEmailsCSV, setGeneratedEmailsCSV] = useState('');
    const [generatedCSVSiteName, setGeneratedCSVSiteName] = useState(''); // Used to Name the csv file

    const hiddenFileInput = useRef<HTMLInputElement>(null);

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

    const handleClear = () => {
        if (defaultServiceProvider === null) {
            setSelectedServiceProvider(null);
            setSelectedCustomer(null);

            // Reset Customer options only if user can choose a Service Provider thus generate new options.
            setCustomerOptions([]);
        }

        if (defaultCustomer === null) {
            setSelectedCustomer(null);
        }

        if (hiddenFileInput && hiddenFileInput.current) {
            hiddenFileInput.current.value = '';
        }

        setSelectedSites(null);
        setUploadedFile(null);
        setServer('');
        setPort('');
        setSelectedImmixEventType(subjectOptions[0]);
        setImmixDomainName('immixalarms.com');
    };

    const generateCSVString = (
        emailList: { name: string; email: string }[]
    ) => {
        const csvHeaders =
            'CAMERA NAME,GENERATED EMAIL,DNS NAME,SMTP SERVER,PORT\n';
        const csvBody = emailList.map((result) => {
            const { name, email } = result;
            return [
                name,
                email,
                'mail.evolon.net',
                '44.215.189.141',
                '8025',
            ].join(',');
        });

        const csvData = `${csvHeaders}${csvBody.join('\n')}`;

        return `data:text/csv;charset=utf-8,${encodeURI(csvData)}`;
    };

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

    const { refetch } = useAlerts({
        activeUser: activeUser as IUser,
        enabled: true,
    });

    const createSMTPCameraMutation = useMutation({
        mutationFn: createSMTPCamera,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    const createAlertMutation = useMutation({
        mutationFn: createAlert,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    // Helper functions
    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (uploadedFile) {
            setIsLoading(true);
            if (
                uploadedFile.type ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ) {
                const rows = await readXlsxFile(uploadedFile);
                const formattedJsonData: ImmixExcelColumns[] = [];

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

                setUploadStatus({
                    ...uploadStatus,
                    totalCameras: formattedJsonData.length,
                });

                const generatedEmails: { name: string; email: string }[] = [];

                for (let i = 0; i < formattedJsonData.length; i += 1) {
                    const cameraName = removeInvalidCharsFromName(
                        formattedJsonData[i].Title
                    );

                    const newSMTPCamera: ISMTPCameraConfig = {
                        name: cameraName,
                        camera_type: 1,
                        site_id: Number(selectedSites.value),
                        properties: {},
                        form: 'Create-SMTP-Camera' as 'Create-SMTP-Camera',
                    };

                    // If the current account is not a customer, we must add account id to the properties
                    if (accountType !== 'cl') {
                        // selectedCustomer shouldn't be null because validation should've occurred above and returned if so.
                        newSMTPCamera.account_id = Number(
                            selectedCustomer?.value
                        );
                    }

                    try {
                        const response =
                            await createSMTPCameraMutation.mutateAsync({
                                user: activeUser,
                                smtpCameraConfig: newSMTPCamera,
                            });

                        generatedEmails.push({
                            name: response.name,
                            email: response.email,
                        });

                        const alertData = createAlertData('immix', {
                            account_id: response.account_id,
                            camera_id: response.camera_id,
                            name: `${cameraName} Default Alert`,
                            port: Number(port),
                            server,
                            to_email: `s${formattedJsonData[i].ServerID}@${immixDomainName}`,
                            from_email: `s${formattedJsonData[i].ServerID}@${immixDomainName}`,
                            immixEventType: `${
                                selectedImmixEventType?.value ||
                                'MotionDetected'
                            }`,
                            subject: `${
                                selectedImmixEventType?.value ||
                                'MotionDetected'
                            }`, // subject not really need for immix right now
                            identifier: formattedJsonData[i].ServerID,
                        });

                        if (alertData) {
                            await createAlertMutation.mutateAsync({
                                user: activeUser,
                                alertConfig: alertData,
                            });
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error(
                            `Something went wrong uploading the camera named ${cameraName}`
                        );
                    }

                    setUploadStatus((previousState) => {
                        return {
                            camerasUploaded: i + 1,
                            totalCameras: previousState.totalCameras,
                        };
                    });
                }

                const csvString = generateCSVString(generatedEmails);

                setGeneratedEmailsCSV(csvString);
                setGeneratedCSVSiteName(selectedSites.label);
            }

            // Need to refetch alert data after all new alerts have been added
            await refetch();

            toast.success(
                'New SMTP Cameras Added and default alerts configured'
            );
            handleClear();
            setIsLoading(false);
        }
    };

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

    const handleSubjectSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        const selectedItem = selectOption as SingleValue<SelectOption>;
        setSelectedImmixEventType(selectedItem);
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

    useEffect(() => {
        // Reset error message whenever user updates form.
        setErrorMessage(null);
    }, [
        selectedServiceProvider?.value,
        selectedCustomer?.value,
        selectedSites?.value,
    ]);

    return (
        <motion.form
            id="CreateSite"
            key="CreateSite"
            onSubmit={onSubmit}
            autoComplete="off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <h3 id="title">
                <span>Bulk Immix Camera Creation</span>
            </h3>
            {errorMessage && <p className="error">{errorMessage}</p>}
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

            <div className="field">
                <Input
                    id="serverIpInput"
                    name="serverIpInput"
                    className="input"
                    label="Server Host/IP"
                    type="text"
                    value={server}
                    onChange={setServer}
                    required
                />
            </div>

            <div className="field">
                <Input
                    id="portInput"
                    name="portInput"
                    className="input"
                    label="Port"
                    type="number"
                    value={port}
                    onChange={setPort}
                    required
                />
            </div>

            <div className="field">
                <Input
                    name="immixDomainName"
                    className="input"
                    label="Immix Domain Name"
                    type="text"
                    value={immixDomainName}
                    onChange={setImmixDomainName}
                    required
                />
            </div>

            <div className="select-container field">
                <label htmlFor="customers">
                    <span>Immix Event Type</span>
                    <span className="asterisk">*</span>
                </label>
                <Select
                    id="immix-event-type-select"
                    value={selectedImmixEventType}
                    onChange={handleSubjectSelect}
                    options={subjectOptions}
                    required
                    isClearable={false}
                />
            </div>

            <div className="selectFileContainer field">
                <span>
                    Immix Server Report (Excel File){' '}
                    <span className="asterisk">*</span>
                </span>

                <div className="selectFileBtn">
                    <button
                        type="button"
                        className="btn neutral"
                        onClick={handleUploadFileBtn}
                        style={{ marginBottom: 15 }}
                    >
                        Choose File
                    </button>

                    <input
                        id="bulkImmixFileUpload"
                        type="file"
                        ref={hiddenFileInput}
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                    />
                </div>
                {uploadedFile && (
                    <span>Selected File: {uploadedFile.name} </span>
                )}
            </div>

            <div className="button-container">
                <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                    <Button
                        id="clear"
                        className="btn danger"
                        label="Clear"
                        onClick={() => handleClear()}
                    />
                    <Button
                        id="create"
                        className="btn primary"
                        label="Upload"
                        type="submit"
                        disabled={activeUser?.modifier?.includes(
                            AccountTypeModifier.ReadOnly
                        )}
                    />
                </ButtonGroup>
            </div>
            {generatedEmailsCSV && (
                <div className="generatedEmailContainer">
                    <h3>Generated Email From Insites System</h3>
                    <a
                        href={generatedEmailsCSV}
                        download={`${generatedCSVSiteName} - SMTP Email List`}
                        className="btn primary outline"
                        id="generatedEmailsCSVDownload"
                        style={{ display: 'inline-block' }}
                    >
                        Download Generated Emails CSV
                    </a>

                    <p className="success">SMTP Cameras Created!</p>
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
                        <h2>Uploading Cameras...</h2>
                        <h2>
                            {uploadStatus.camerasUploaded} /{' '}
                            {uploadStatus.totalCameras} Complete
                        </h2>
                    </div>
                </div>
            )}
        </motion.form>
    );
};

export default CreateSMTPCamera;
