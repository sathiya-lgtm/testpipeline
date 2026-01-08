/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, {
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
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Custom
import { useCustomers, useSites, useServiceProviders } from '../../../hooks';
import submitRegistrationCode from '../../../api_calls/submitRegistrationCode';
import createSite from '../../../api_calls/createSite';
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
import ButtonGroup, { ButtonGroupAlignment } from '../../../components/ButtonGroup/ButtonGroup';

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

const RegisterDeviceWithCode: FC<IProps> = ({
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

    const [registrationCode, setRegistrationCode] = useState<string>('');
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

    const onSiteCreated = useCallback((): void => {
        toast.success('New Site Created.');
    }, []);

    const onSuccess = useCallback((): void => {
        toast.success('Device successfully registered.');
        setRegistrationCode('');
    }, []);

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

    const createSiteMutation = useMutation({
        mutationFn: createSite,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSiteCreated(),
    });

    const registerMutation = useMutation({
        mutationFn: submitRegistrationCode,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const clearInputs = ( ) => {
        setSelectedCustomer(null);
        setSelectedSites(null);
        setRegistrationCode('');
    }

    const handleSubmit = async (): Promise<void> => {
        if (!activeUser) return;

        if (!selectedCustomer?.value) {
            toast.warn('A Customer must be selected.');
            return;
        }

        if (!selectedSites?.value) {
            toast.warn('A Site must be selected.');
            return;
        }

        if (registrationCode.length !== 5) {
            toast.warn('Short Key must be 5 characters.');
            return;
        }

        if (selectedSites?.value === 'create-new-site') {
            const customerId: string | undefined = selectedCustomer?.value;
            const createSiteData = {
                name: newSiteName,
                account_reference_id:
                    accountType !== AccountType.Customer
                        ? Number(customerId)
                        : undefined,
            };

            const result = await createSiteMutation.mutateAsync({
                user: activeUser,
                createSiteData,
            });

            if (result?.site_id) {
                await registerMutation.mutateAsync({
                    user: activeUser as IUser,
                    registrationData: {
                        account_id: Number(selectedCustomer?.value),
                        token: registrationCode,
                        site: result.site_id,
                    },
                });
            }
            return;
        }

        registerMutation.mutate({
            user: activeUser as IUser,
            registrationData: {
                account_id: Number(selectedCustomer?.value),
                token: registrationCode,
                site: Number(selectedSites?.value),
            },
        });
    };

    const handleSiteSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Then set site.
        setSelectedSites(selectOption as SingleValue<SelectOption>);
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
            const modifiedOptions = [
                { value: 'create-new-site', label: 'Create New Site +' },
                ...options,
            ];

            setSiteOptions(modifiedOptions);
        } else {
            setSiteOptions([
                { value: 'create-new-site', label: 'Create New Site +' },
            ]);
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

            <h2 id="title">
                <span>Enter Code Received</span>
                <span>to register your device</span>
            </h2>
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
                    id="registration-code"
                    name="registration-code"
                    label="Registration Code"
                    className="input field"
                    type="text"
                    value={registrationCode}
                    onChange={setRegistrationCode}
                    required
                />
                <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                    <Button
                        id="clear"
                        className="btn danger"
                        label="Clear"
                        type="button"
                        onClick={() => clearInputs()}
                        disabled={activeUser?.modifier?.includes(
                            AccountTypeModifier.ReadOnly
                        )}
                    />
                    <Button
                        id="submit"
                        className="btn primary register-site-btn"
                        label="Save"
                        type="submit"
                        disabled={activeUser?.modifier?.includes(
                            AccountTypeModifier.ReadOnly
                        )}
                    />
                </ButtonGroup>

            </form>
        </motion.div>
    );
};

export default RegisterDeviceWithCode;
