/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, {
    FormEvent,
    useState,
    Dispatch,
    SetStateAction,
    FC,
    useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';
import { SingleValue, MultiValue } from 'react-select';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// API Calls
import createSMTPCamera, {
    ISMTPCameraConfig,
} from '../../../api_calls/createSMTPCamera';

// Custom
import extractErrorMessage from '../../../utils/extractErrorMessage';
import { validateSmtpCameraSubmission } from '../Utilities.controller';
import sortByName from '../../../utils/sortByName';
import { useCustomers, useServiceProviders, useSites } from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';

// Components
import Select from '../../../components/Inputs/Select';
import Input from '../../../components/Inputs/Input';
import Button from '../../../components/Button';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import {
    ICustomer,
    IServiceProvider,
    ISite,
} from '../../../types/tng-api.interfaces';

import ButtonGroup, { ButtonGroupAlignment } from '../../../components/ButtonGroup/ButtonGroup';

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

    // Camera State
    const [name, setName] = useState('');
    const [generatedEmail, setGeneratedEmail] = useState('');

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

        setSelectedSites(null);
        setName('');
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

    const onSuccess = async () => {
        toast.success('New SMTP Camera Created!');
        handleClear();
    };

    const createSMTPCameraMutation = useMutation({
        mutationFn: createSMTPCamera,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    // Helper functions
    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        try {
            validateSmtpCameraSubmission({
                name,
                accountType,
                serviceProviderId: selectedServiceProvider?.value,
                customerId: selectedCustomer?.value,
                siteId: selectedSites?.value,
            });
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));

            // Exit prematurely if error.
            return;
        }

        const newSMTPCamera: ISMTPCameraConfig = {
            name,
            camera_type: 1,
            site_id: Number(selectedSites.value),
            properties: {},
            form: 'Create-SMTP-Camera' as 'Create-SMTP-Camera',
        };

        // If the current account is not a customer, we must add account id to the properties
        if (accountType !== AccountType.Customer) {
            // selectedCustomer shouldn't be null because validation should've occurred above and returned if so.
            newSMTPCamera.account_id = Number(selectedCustomer?.value);
        }

        const response = await createSMTPCameraMutation.mutateAsync({
            user: activeUser,
            smtpCameraConfig: newSMTPCamera,
        });

        setGeneratedEmail(response.email);
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
        name,
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
                <span>Create SMTP Camera</span>
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
            <Input
                id="new-smtp-camera-name"
                name="new-smtp-camera-name"
                label="Camera Name"
                className="input field"
                type="text"
                value={name}
                autoComplete="false"
                onChange={setName}
                required
            />
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
                    label="Save"
                    type="submit"
                    disabled={activeUser?.modifier?.includes(
                        AccountTypeModifier.ReadOnly
                    )}
                />
            </ButtonGroup>
            <div className="button-container">
                
            </div>
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

                    <p className="success">SMTP Camera Created!</p>
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
        </motion.form>
    );
};

export default CreateSMTPCamera;
