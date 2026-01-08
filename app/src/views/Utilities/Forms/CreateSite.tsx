/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, {
    ReactElement,
    FC,
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
    useCallback,
    FormEvent,
    useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SingleValue } from 'react-select';

// Custom
import { useCustomers, useServiceProviders } from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';
import { validateSiteSubmission } from '../Utilities.controller';
import extractErrorMessage from '../../../utils/extractErrorMessage';
import createSite, { ICreateSite } from '../../../api_calls/createSite';
import updateSOSorProMonitoring from '../../../api_calls/updateSOSorProMonitoring';

// Components
import Select from '../../../components/Inputs/Select';
import Input from '../../../components/Inputs/Input';
import Button from '../../../components/Button';
import LoadingModal from '../../../components/Modals/LoadingModal';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import { ICustomer, IServiceProvider } from '../../../types/tng-api.interfaces';

// Styles
import '../../../styles/views/Utilities/CreateSite.scss';
import ButtonGroup, { ButtonGroupAlignment } from '../../../components/ButtonGroup/ButtonGroup';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
}

/**
 * Form for creating users.
 * @returns {ReactElement}
 */
const CreateSite: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
    defaultCustomer,
}: IProps): ReactElement => {
    const navigate = useNavigate();

    // State
    const [name, setName] = useState<string>('');
    const [miyAddOn, setMIYAddOn] = useState<0 | 4 | 5>(0);
    const [loadingText, setLoadingText] = useState('');

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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleClear = useCallback(() => {
        // Only clear selected Service Provider if no default exist.
        if (defaultServiceProvider === null) {
            setSelectedServiceProvider(null);

            // Reset Customer options only if user can choose a Service Provider thus generate new options.
            setCustomerOptions([]);
        }

        // Only clear Customer if no default exist.
        if (defaultCustomer === null) {
            setSelectedCustomer(null);
        }

        setName('');
    }, []);

    const onSuccess = useCallback(() => {
        handleClear();

        toast.success(`Site: ${name}, successfully added.`);
    }, [name, selectedCustomer?.value]);

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

    const createSiteMutation = useMutation({
        mutationFn: createSite,
    });

    const sosMutation = useMutation({ mutationFn: updateSOSorProMonitoring });

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoadingText('Creating site...');

        const customerId: string | undefined = selectedCustomer?.value;
        let createSiteData: ICreateSite;

        try {
            validateSiteSubmission({
                name,
                customerId,
                accountType,
            });

            createSiteData = {
                name,
                account_reference_id:
                    accountType !== AccountType.Customer
                        ? Number(customerId)
                        : undefined,
            };
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));

            setLoadingText('');
            // Exit early if error.
            return;
        }

        try {
            const result = await createSiteMutation.mutateAsync({
                user: activeUser,
                createSiteData,
            });

            if (miyAddOn === 4 || miyAddOn === 5) {
                const accountId = result.site_id;
                await sosMutation.mutateAsync({
                    user: activeUser,
                    site_id: accountId,
                    subscription_id: miyAddOn,
                });
            }

            onSuccess();
        } catch (err) {
            console.log(err);
            handleHttpRequestError(err, setActiveUser, navigate);
        }

        setLoadingText('');
    };

    const siteMIYStatus = useMemo(() => {
        if (selectedCustomer && customersQuery.data) {
            const matchedCustomer = customersQuery.data.find(
                (customer) =>
                    customer.account_id.toString() === selectedCustomer.value
            );

            return matchedCustomer?.stages_subscription || '';
        }

        return '';
    }, [selectedCustomer, customersQuery]);

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
        // Always reset selected Customer and Customer options when selected Service Provider changes.
        if (defaultCustomer === null) {
            setSelectedCustomer(null);
        }
    }, [selectedServiceProvider?.value]);

    useEffect(() => {
        // Reset error message whenever user updates form.
        setErrorMessage(null);
    }, [name, selectedServiceProvider?.value, selectedCustomer?.value]);

    return (
        <motion.form
            id="CreateSite"
            key="CreateSite"
            className="create-site"
            onSubmit={onSubmit}
            autoComplete="off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <h3 id="title">
                <span>Create Site</span>
            </h3>
            {errorMessage && <p className="error">{errorMessage}</p>}
            {accountType === AccountType.Evolon && (
                <div className="select-container field">
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
                        disabled={defaultServiceProvider !== null}
                    />
                </div>
            )}
            {accountType !== AccountType.Customer && (
                <div className="select-container field">
                    <label htmlFor="customers">
                        <span>Under Customer Account</span>
                    </label>
                    <Select
                        id="customers"
                        value={selectedCustomer}
                        onChange={(option) => {
                            setSelectedCustomer(
                                option as SingleValue<SelectOption>
                            );
                        }}
                        placeholder="None"
                        options={customerOptions}
                        isClearable={defaultCustomer === null}
                        disabled={defaultCustomer !== null}
                        noOptionsMessage="A Service Provider with registered Customers must be selected first."
                    />
                </div>
            )}
            <Input
                id="new-site-name"
                name="new-site-name"
                label="Site Name"
                className="input field"
                type="text"
                value={name}
                autoComplete="false"
                onChange={setName}
                required
            />
            {siteMIYStatus && (
                <div className="miy-subscription-container">
                    <p>MIY Add Ons</p>
                    <button
                        className={`${
                            miyAddOn === 0
                                ? 'btn primary'
                                : 'btn outline neutral'
                        }`}
                        onClick={() => {
                            setMIYAddOn(0);
                        }}
                        type="button"
                    >
                        None
                    </button>
                    <button
                        className={`${
                            miyAddOn === 4
                                ? 'btn primary'
                                : 'btn outline neutral'
                        }`}
                        onClick={() => {
                            setMIYAddOn(4);
                        }}
                        type="button"
                    >
                        SOS
                    </button>
                    <button
                        className={`${
                            miyAddOn === 5
                                ? 'btn primary'
                                : 'btn outline neutral'
                        }`}
                        onClick={() => {
                            setMIYAddOn(5);
                        }}
                        type="button"
                    >
                        Pro Monitoring
                    </button>
                </div>
            )}
            <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                <Button
                    id="clear"
                    className="btn danger cancel"
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
            {loadingText && <LoadingModal modalText={loadingText} />}
        </motion.form>
    );
};

export default CreateSite;
