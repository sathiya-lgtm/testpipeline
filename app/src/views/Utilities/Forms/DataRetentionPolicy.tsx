/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, {
    ReactElement,
    FC,
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
    FormEvent,
    useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';
import { SingleValue } from 'react-select';
import { useQuery } from '@tanstack/react-query';

// Api Calls
import getRetentionPolicy from '../../../api_calls/getRetentionPolicy';

// Custom
import { useCustomers, useServiceProviders } from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';

// Components
import Select from '../../../components/Inputs/Select';
import Button from '../../../components/Button';
import LoadingModal from '../../../components/Modals/LoadingModal';
import UpdateRetentionPolicyModal from '../../../components/Modals/RetentionPolicy/UpdateRetentionPolicy';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import { ICustomer, IServiceProvider } from '../../../types/tng-api.interfaces';

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
const DataRetentionPolicy: FC<IProps> = ({
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

    // Retention Plan State
    const [retentionDays, setRetentionDays] = useState<number>(15);
    const [showRetentionPolicyConfirm, setShowRetentionPolicyConfirm] =
        useState(false);

    // React Query
    const serviceProvidersQuery = useServiceProviders({
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Evolon,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const customerId = useMemo(() => {
        if (selectedCustomer?.value) {
            return selectedCustomer.value;
        }

        return '0';
    }, [selectedCustomer]);

    const retentionPolicyQuery = useQuery({
        queryKey: ['retention_policy', customerId],
        queryFn: () => getRetentionPolicy(activeUser, customerId),
        enabled: customerId !== '0',
    });

    const customersQuery = useCustomers({
        serviceProviderId: Number(selectedServiceProvider?.value),
        activeUser: activeUser as IUser,
        enabled:
            accountType !== AccountType.Customer &&
            selectedServiceProvider?.value !== undefined,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        setShowRetentionPolicyConfirm(true);
    };

    useEffect(() => {
        if (retentionPolicyQuery.data) {
            const days = retentionPolicyQuery.data.retention_days;
            setRetentionDays(days);
        }
    }, [retentionPolicyQuery.data]);

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

    return (
        <>
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
                    <span>Data Retention Policy</span>
                </h3>

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
                            <span>Choose Customer Account</span>
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

                {retentionPolicyQuery.isFetching && (
                    <LoadingModal modalText="Getting Retention Policy" />
                )}

                {}

                {selectedCustomer && (
                    <>
                        <ul>
                            <li
                                role="presentation"
                                className={`retention-card ${
                                    retentionDays === 2 ? 'selected' : ''
                                }`}
                                onClick={() => setRetentionDays(2)}
                            >
                                <h3>2 Days</h3>
                                <p>View data clips up to 2 days.</p>
                                <div className="detail" />
                            </li>
                            <li
                                role="presentation"
                                className={`retention-card ${
                                    retentionDays === 30 ? 'selected' : ''
                                }`}
                                onClick={() => setRetentionDays(30)}
                            >
                                <h3>30 Days (Default)</h3>
                                <p>View data clips up to 30 days.</p>
                                <div className="detail" />
                            </li>
                            <li
                                role="presentation"
                                className={`retention-card ${
                                    retentionDays === 60 ? 'selected' : ''
                                }`}
                                onClick={() => setRetentionDays(60)}
                            >
                                <h3>60 Days</h3>
                                <p>View data clips up to 60 days.</p>
                                <div className="detail" />
                            </li>
                            <li
                                role="presentation"
                                className={`retention-card ${
                                    retentionDays === 90 ? 'selected' : ''
                                }`}
                                onClick={() => setRetentionDays(90)}
                            >
                                <h3>90 Days</h3>
                                <p>View data clips up to 90 days.</p>
                                <div className="detail" />
                            </li>
                        </ul>
                        {retentionDays !==
                            retentionPolicyQuery?.data?.retention_days && (
                            <div className="button-container">
                                <Button
                                    id="updateRetentionPolicyBtn"
                                    className="btn primary"
                                    label="Update Retention Policy"
                                    type="submit"
                                    disabled={activeUser?.modifier?.includes(
                                        AccountTypeModifier.ReadOnly
                                    )}
                                />
                            </div>
                        )}
                    </>
                )}
            </motion.form>

            {showRetentionPolicyConfirm && (
                <UpdateRetentionPolicyModal
                    handleClose={() => setShowRetentionPolicyConfirm(false)}
                    currentRetentionDays={
                        retentionPolicyQuery?.data?.retention_days
                    }
                    newRetentionDays={retentionDays}
                    accountName={selectedCustomer?.label}
                    accountId={selectedCustomer?.value}
                />
            )}
        </>
    );
};

export default DataRetentionPolicy;
