/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, { FC, useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// react-select
import { SingleValue, MultiValue } from 'react-select';

// Third party
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { isAxiosError } from 'axios';

// Components
import SingleSelect from '../../Inputs/Select';
import Input from '../../Inputs/Input';
import LoadingModal from '../LoadingModal';

// Api Call
import createAlert from '../../../api_calls/createAlert';
import updateAlert from '../../../api_calls/updateAlert';
import testAlert from '../../../api_calls/testImmixAlert';

// Controller
import { createAlertData } from './AlertModal.controller';

// Custom
import { useCustomers, useSites, useCameras } from '../../../hooks';
import sortByName from '../../../utils/sortByName';
import OptionsConverter from '../../../classes/OptionsConverter';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import getAccountType from '../../../utils/getAccountType';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';
import { ListTargetContext } from '../../../contexts/ListTarget';

// Types
import { IAlert, ICustomer, ISite } from '../../../types/tng-api.interfaces';
import { SelectOption, IUser } from '../../../types/interfaces';
import { AccountType } from '../../../types/enums';

// styles
import '../../../styles/components/Modals/AlertModal.scss';

// We currently only support the first option.
// const immixEventTypeOptions: SelectOption[] = [
//     { value: 'MotionDetected', label: 'Motion Detected' },
//     { value: 'ObjectDetected', label: 'Object Detected' },
//     { value: 'PersonDetected', label: 'Person Detected' },
//     { value: 'VehicleDetected', label: 'Vehicle Detected' },
// ];

interface IProps {
    handleClose: () => void;
    selectedAlert: IAlert | null;
    refetchAlerts?: () => any;
}

const AlertModal: FC<IProps> = ({
    handleClose,
    selectedAlert,
    refetchAlerts,
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const { activeUser, setActiveUser } = useContext(AuthContext);
    const { listTarget } = useContext(ListTargetContext);

    const accountType: AccountType = useMemo(
        () => getAccountType(activeUser),
        [activeUser]
    );

    const alertTypeOptions = useMemo(() => {
        const allAlertOptions = [
            { value: 'email', label: 'Email' },
            { value: 'immix', label: 'Immix Event' },
            { value: 'device-io', label: 'Immix Input Alarm' },
            { value: 'immix-fortify-alert', label: 'Immix Fortifeye Alert' },
        ];

        if (
            location.pathname.includes('/home/camera') ||
            location.pathname.includes('/home/edge')
        ) {
            return allAlertOptions.filter((item) => item.value !== 'device-io');
        }

        if (location.pathname.includes('/home/device-io')) {
            return allAlertOptions.filter((item) => item.value === 'device-io');
        }

        if (location.pathname.includes('/home/panel')) {
            return allAlertOptions.filter(
                (item) => item.value === 'immix-fortify-alert'
            );
        }

        return allAlertOptions;
    }, [location]);

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

    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer !== null ? [defaultCustomer] : []
    );
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [cameraOptions, setCameraOptions] = useState<SelectOption[]>([]);

    const [alertName, setAlertName] = useState('');
    const [selectedCustomers, setSelectedCustomers] = useState<any | null>(
        defaultCustomer
    );
    const [selectedSites, setSelectedSites] = useState<any | null>(null);
    const [selectedCameras, setSelectedCameras] = useState<any | null>(null);
    const [alertType, setAlertType] = useState<SelectOption | null>(
        alertTypeOptions[0]
    );

    const [identifier, setIdentifier] = useState(''); // Immix identifier field
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [server, setServer] = useState('');
    const [port, setPort] = useState('0');
    const [loadingText, setLoadingText] = useState('');

    const customersQuery = useCustomers({
        serviceProviderId: (activeUser as IUser).id,
        activeUser: activeUser as IUser,
        enabled: accountType !== AccountType.Customer,
    });

    const sitesQuery = useSites({
        customerId: Number(selectedCustomers?.value),
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Customer,
    });

    const camerasQuery = useCameras({
        siteId: Number(selectedSites?.value),
        activeUser: activeUser as IUser,
        enabled: false,
    });

    const onSuccess = async () => {
        if (selectedAlert) toast.success('Alert successfully updated!');
        else toast.success('New alert added!');
        if (refetchAlerts) refetchAlerts();

        handleClose();
    };

    const createAlertMutation = useMutation({
        mutationFn: createAlert,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const updateAlertMutation = useMutation({
        mutationFn: updateAlert,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let accountId: number = 0;

        if (!activeUser || !alertType) {
            return;
        }

        // If user is a customer, the accountId will equal the active user id. Else, the selectedCustomer will have the
        // accountId
        if (activeUser.account_type === 'cl') accountId = activeUser.id;
        else if (!selectedAlert) accountId = Number(selectedCustomers.value);

        if (selectedAlert) {
            const alertData = createAlertData(alertType.value, {
                account_id: selectedAlert.account_id,
                camera_id: selectedAlert.camera_id,
                name: alertName,
                port: Number(port),
                server,
                to_email: email,
                from_email: email,
                subject,
                immixEventType: selectedAlert.alert_properties.subject, // createAlertData function only should only add this field if immix alert
                identifier,
            });

            if (alertData) {
                updateAlertMutation.mutate({
                    user: activeUser,
                    alertConfig: alertData,
                    alertId: selectedAlert.alert_id,
                });
            }

            return;
        }

        // Create a new Alert
        const alertData = createAlertData(alertType.value, {
            account_id: accountId,
            camera_id: Number(selectedCameras.value),
            name: alertName,
            port: Number(port),
            server,
            to_email: email,
            from_email: email,
            subject,
            immixEventType:
                alertType.value === 'device-io'
                    ? 'InputAlarm'
                    : 'MotionDetected', // createAlertData function should only add this field if immix alert
            identifier,
        });

        if (alertData) {
            createAlertMutation.mutate({
                user: activeUser,
                alertConfig: alertData,
            });
        }
    };

    useEffect(() => {
        if (selectedAlert) {
            setAlertName(selectedAlert.alert_name);

            const selectedAlertType = alertTypeOptions.find(
                (option) => option.value === selectedAlert.alert_type
            );

            setAlertType(selectedAlertType || alertTypeOptions[0]);

            // Used for populating the customer input
            const customer = customerOptions.find(
                (option) => option.value === selectedAlert.account_id.toString()
            );
            const site = siteOptions.find(
                (option) => option.value === selectedAlert.site_id.toString()
            );
            const camera = cameraOptions.find(
                (option) => option.value === selectedAlert.camera_id.toString()
            );

            if (customer) setSelectedCustomers(customer);
            if (site) setSelectedSites(site);
            if (camera) setSelectedCameras(camera);

            setEmail(selectedAlert.alert_properties.to_email);
            setSubject(selectedAlert.alert_properties.subject);
            setPort(selectedAlert.alert_properties?.port?.toString() || '0');
            setServer(selectedAlert.alert_properties.server || '');
            setIdentifier(selectedAlert.alert_properties.identifier || '');
        }
    }, [selectedAlert, customerOptions, siteOptions, cameraOptions]);

    const handleCustomerSelect = async (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ) => {
        // Always reset following fields if user changes customers.
        setSelectedSites(null);
        setSelectedCameras(null);
        setSiteOptions([]);
        setCameraOptions([]);

        // Then set selected customer.
        setSelectedCustomers(selectOption);
    };

    const handleSiteSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Always reset following fields when user selects a site.
        setSelectedCameras(null);
        setCameraOptions([]); // The options for cameras should be refetched upon setting site (if appropriate).

        // Then set site.
        setSelectedSites(selectOption);
    };

    const handleCameraSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        setSelectedCameras(selectOption);
    };

    const handleIdentiferChange = (newValue: string) => {
        setIdentifier(newValue);
        setEmail(`s${newValue}@immixalarms.com`);
    };

    const handleTestAlert = async () => {
        if (!activeUser) {
            return;
        }

        if (!server) {
            toast.warn('Please enter your immix server Host/IP.');
            return;
        }

        if (!port) {
            toast.warn('Please enter your immix server port.');
            return;
        }

        if (!email) {
            toast.warn('Please enter your SMTP server address.');
            return;
        }

        if (!alertType) {
            toast.warn('Please select an alert type.');
            return;
        }

        let alertSubject = 'MotionDetected';

        if (alertType.value === 'device-io') {
            alertSubject = 'InputAlarm';
        }

        setLoadingText(
            'Sending test alert to immix. This may take a few seconds...'
        );

        try {
            const result = await testAlert({
                user: activeUser,
                server,
                port: Number(port),
                email_to: email,
                subject: alertSubject,
            });

            toast.success('Alert successfully sent to immix!');

            console.log({ result });
        } catch (err) {
            if (isAxiosError(err)) {
                if (err.status === 400) {
                    const message =
                        err?.response?.data.details.description ||
                        'Test Alert Failed';

                    toast.error(message);
                }
            } else {
                toast.error('Test alert failed');
            }
        }

        setLoadingText('');
    };

    useEffect(() => {
        const isListTargetActive =
            listTarget !== null && 'customerId' in listTarget;
        /** If these values are equal, it means the user
         * selected a customer via dropdown in ForensicSearchFilter
         * and not the CameraList.
         */
        const areListTargetAndSelectedCustomerEqual =
            isListTargetActive &&
            selectedCustomers?.value !== undefined &&
            String(listTarget.customerId) === selectedCustomers?.value;

        if (
            selectedCustomers?.value &&
            !areListTargetAndSelectedCustomerEqual
        ) {
            sitesQuery.refetch();
        }
    }, [selectedCustomers]);

    useEffect(() => {
        const isListTargetActive =
            listTarget !== null && 'siteId' in listTarget;
        /** If these values are equal, it means the user
         * selected a site via dropdown in ForensicSearchFilter
         * and not the CameraList.
         */
        const areListTargetAndSelectedSiteEqual =
            isListTargetActive &&
            selectedSites?.value !== undefined &&
            String(listTarget.siteId) === selectedSites?.value;

        if (selectedSites?.value && !areListTargetAndSelectedSiteEqual) {
            camerasQuery.refetch();
        }
    }, [selectedSites]);

    useEffect(() => {
        if (
            listTarget === null &&
            selectedCustomers !== null &&
            accountType !== AccountType.Customer
        ) {
            setSelectedCustomers(null);
            setSelectedSites(null);
            setSelectedCameras(null);
        }

        if (listTarget !== null && listTarget.src === 'camera-list') {
            if (listTarget.type === 'account') {
                const listTargetCustomerOption: SelectOption = {
                    label: listTarget.customerName,
                    value: String(listTarget.customerId),
                };

                setSelectedCustomers(listTargetCustomerOption);
                setSelectedSites(null);
                setSelectedCameras(null);
            }

            if (listTarget.type === 'site') {
                const listTargetCustomerOption: SelectOption = {
                    label: listTarget.customerName,
                    value: String(listTarget.customerId),
                };
                const listTargetSiteOption: SelectOption = {
                    label: listTarget.siteName,
                    value: String(listTarget.siteId),
                };

                setSelectedCustomers(listTargetCustomerOption);
                setSelectedSites(listTargetSiteOption);
                setSelectedCameras(null);
            }

            if (listTarget.type === 'camera') {
                const listTargetCustomerOption: SelectOption = {
                    label: listTarget.customerName,
                    value: String(listTarget.customerId),
                };
                const listTargetSiteOption: SelectOption = {
                    label: listTarget.siteName,
                    value: String(listTarget.siteId),
                };
                const listTargetCameraOption: SelectOption = {
                    label: listTarget.cameraName,
                    value: String(listTarget.cameraId),
                };

                setSelectedCustomers(listTargetCustomerOption);
                setSelectedSites(listTargetSiteOption);
                setSelectedCameras(listTargetCameraOption);
            }
        }
    }, []);

    useEffect(() => {
        const customersData: ICustomer[] | undefined = customersQuery.data;

        if (customersData && customersData.length > 0) {
            const sortedCustomersData = customersData.sort(sortByName);
            const options =
                OptionsConverter.convertCustomersToOptions(sortedCustomersData);

            setCustomerOptions(options);
        }
    }, [customersQuery.data]);

    useEffect(() => {
        const sitesData: ISite[] | undefined = sitesQuery.data;

        if (sitesData && sitesData.length > 0 && siteOptions.length === 0) {
            const sortedSitesData = sitesData.sort(sortByName);
            const options =
                OptionsConverter.convertSitesToOptions(sortedSitesData);

            setSiteOptions(options);
        }
    }, [sitesQuery.data, siteOptions]);

    useEffect(() => {
        const camerasData = camerasQuery.data;

        if (
            camerasData &&
            camerasData.length > 0 &&
            cameraOptions.length === 0
        ) {
            const sortedCameraData = camerasData.sort(sortByName);
            const options =
                OptionsConverter.convertCamerasToOptions(sortedCameraData);

            setCameraOptions(options);
        }
    }, [camerasQuery.data]);

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
                    <h2>{selectedAlert ? 'Edit Alert' : 'Create Alert'}</h2>
                    <button type="button" id="x-button" onClick={handleClose}>
                        X
                    </button>
                </header>
                <form className="alert-modal" onSubmit={handleFormSubmit}>
                    <div className="field">
                        <Input
                            name="alertNameInput"
                            className="input"
                            label="Alert Name"
                            type="text"
                            value={alertName}
                            onChange={setAlertName}
                            required
                        />
                    </div>

                    {activeUser?.account_type === 'sp' && (
                        <div className="field">
                            <span className="label">
                                Customer <br />
                                {selectedAlert !== null ? (
                                    <span className="text-secondary">
                                        Can&apos;t change after creation.
                                    </span>
                                ) : (
                                    ''
                                )}
                            </span>
                            <SingleSelect
                                id="customer-select"
                                value={selectedCustomers}
                                onChange={handleCustomerSelect}
                                options={customerOptions}
                                disabled={!!selectedAlert}
                                required
                            />
                        </div>
                    )}

                    <div className="field">
                        <span className="label">
                            Site/Device <br />
                            {selectedAlert !== null ? (
                                <span className="text-secondary">
                                    Can&apos;t change after creation.
                                </span>
                            ) : (
                                ''
                            )}
                        </span>
                        <SingleSelect
                            id="site-select"
                            value={selectedSites}
                            onChange={handleSiteSelect}
                            options={siteOptions}
                            disabled={!!selectedAlert}
                            required
                        />
                    </div>
                    <div className="field">
                        <span className="label">
                            Camera Name <br />
                            {selectedAlert !== null ? (
                                <span className="text-secondary">
                                    Can&apos;t change after creation.
                                </span>
                            ) : (
                                ''
                            )}
                        </span>
                        <SingleSelect
                            id="camera-select"
                            value={selectedCameras}
                            onChange={handleCameraSelect}
                            options={cameraOptions}
                            disabled={!!selectedAlert}
                            required
                        />
                    </div>

                    <div className="field">
                        <span className="label">
                            Alert Recipient
                            <br />
                            {selectedAlert !== null ? (
                                <span className="text-secondary">
                                    Can&apos;t change after creation.
                                </span>
                            ) : (
                                ''
                            )}
                        </span>
                        <SingleSelect
                            id="alert-type-select"
                            value={alertType}
                            onChange={(selectOption) => {
                                const result =
                                    selectOption as SingleValue<SelectOption>;
                                setAlertType(result);
                            }}
                            disabled={selectedAlert !== null}
                            options={alertTypeOptions}
                            required
                        />
                    </div>

                    <p>Send To</p>
                    <hr className="separator" />

                    <div className="inputsContainer">
                        {(alertType?.value === 'immix' ||
                            alertType?.value === 'device-io' ||
                            alertType?.value === 'immix-fortify-alert') && (
                            <Input
                                type="text"
                                name="identifierInput"
                                className="input"
                                label="Identifier"
                                value={identifier}
                                onChange={handleIdentiferChange}
                                required
                                id="identifierInput"
                            />
                        )}
                        <Input
                            name="emailInput"
                            className="input"
                            label={
                                alertType?.value === 'immix' ||
                                alertType?.value === 'device-io' ||
                                alertType?.value === 'immix-fortify-alert'
                                    ? 'SMTP Server Address'
                                    : 'Email'
                            }
                            type="text"
                            value={email}
                            onChange={setEmail}
                            required
                        />

                        {alertType?.value === 'email' && (
                            <Input
                                name="subjectInput"
                                className="input"
                                label="Subject (Optional)"
                                type="text"
                                value={subject}
                                onChange={setSubject}
                                tooltip="The default subject is {AlertType} at {Site} (ex. MotionDetected at Parkview).  Changing this overwrites the default."
                            />
                        )}

                        {(alertType?.value === 'immix' ||
                            alertType?.value === 'device-io' ||
                            alertType?.value === 'immix-fortify-alert') && (
                            <>
                                <Input
                                    name="serverIpInput"
                                    className="input"
                                    label="Server Host/IP"
                                    type="text"
                                    value={server}
                                    onChange={setServer}
                                    required
                                />
                                <Input
                                    name="portInput"
                                    className="input"
                                    label="Port"
                                    type="number"
                                    value={port}
                                    onChange={setPort}
                                    required
                                />
                            </>
                        )}
                    </div>

                    {alertType?.value !== 'email' && (
                        <div className="text-alert-container">
                            <p>
                                * Ensure your Immix site is armed for effective
                                test message results.
                            </p>
                            <button
                                className="btn primary outline"
                                type="button"
                                onClick={handleTestAlert}
                            >
                                Test Alert
                            </button>
                        </div>
                    )}

                    <div className="modal-btns-container">
                        <button className="btn primary" type="submit">
                            Confirm
                        </button>
                        <button
                            className="btn danger"
                            type="button"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                {loadingText && <LoadingModal modalText={loadingText} />}
            </motion.div>
        </motion.div>
    );
};

export default AlertModal;
