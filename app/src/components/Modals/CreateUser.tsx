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
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { SingleValue } from 'react-select';

// Custom
import createUser, {
    ICustomerUser,
    IServiceProviderUser,
} from '../../api_calls/createUser';
import { useCustomers, useServiceProviders } from '../../hooks';
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import OptionsConverter from '../../classes/OptionsConverter';
import sortByName from '../../utils/sortByName';
import {
    constructNewCustomerUser,
    constructNewServiceProviderUser,
    validateUserSubmission,
} from '../../views/Utilities/Utilities.controller';
import extractErrorMessage from '../../utils/extractErrorMessage';

// Components
import Select from '../Inputs/Select';
import Input from '../Inputs/Input';
import Button from '../Button';
import ModalBase from '../ModalBase';

// Custom types
import { IUser, SelectOption } from '../../types/interfaces';
import { AccountType } from '../../types/enums';
import { ICustomer, IServiceProvider } from '../../types/tng-api.interfaces';
import ButtonGroup, { ButtonGroupAlignment } from '../ButtonGroup/ButtonGroup';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
    handleClose: () => void;
    refetch: () => void;
}

enum UserType {
    ServiceProvider = 'Service Provider',
    Customer = 'Customer',
}

const userTypeOptions: SelectOption[] = [
    {
        label: UserType.ServiceProvider,
        value: UserType.ServiceProvider,
    },
    {
        label: UserType.Customer,
        value: UserType.Customer,
    },
];
/**
 * Form for creating users.
 * @returns {ReactElement}
 */
const CreateUserModal: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
    defaultCustomer,
    handleClose,
    refetch,
}: IProps): ReactElement => {
    const navigate = useNavigate();

    // State
    const [userType, setUserType] = useState<UserType | null>(
        accountType === AccountType.Customer ? null : UserType.ServiceProvider
    );
    const [name, setName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [email, setEmail] = useState<string>('');

    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] =
        useState<boolean>(false);

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

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };

    const onSuccess = useCallback(() => {
        const accountTypeToBeAdded: AccountType = selectedCustomer?.value
            ? AccountType.Customer
            : AccountType.ServiceProvider;
        const label: string = accountTypeToBeAdded.includes(
            AccountType.ServiceProvider
        )
            ? 'Service Provider'
            : 'Customer';

        toast.success(`${label}: ${name}, successfully added.`);

        refetch();
        handleClose();
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

    const mutation = useMutation({
        mutationFn: createUser,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess,
    });

    const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();

        const serviceProviderId: string | undefined =
            selectedServiceProvider?.value;
        const customerId: string | undefined = selectedCustomer?.value;
        let userData: IServiceProviderUser | ICustomerUser;

        try {
            if (userType === UserType.Customer && selectedCustomer === null) {
                throw new Error('A Customer must be selected.');
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            validateUserSubmission({
                name,
                password,
                email,
                accountType,
                serviceProviderId,
            });

            userData = customerId
                ? constructNewCustomerUser({
                      name,
                      password,
                      email,
                      accountType,
                      selectedCustomer,
                  })
                : constructNewServiceProviderUser({
                      name,
                      password,
                      email,
                      accountType,
                      selectedServiceProvider,
                  });
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));

            // Exit early if error.
            return;
        }

        mutation.mutate({
            user: activeUser,
            userData,
        });
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
        // Always reset selected Customer and Customer options when selected Service Provider changes.
        if (defaultCustomer === null) {
            setSelectedCustomer(null);
        }
    }, [selectedServiceProvider?.value]);

    useEffect(() => {
        // Reset error message whenever user updates form.
        setErrorMessage(null);
    }, [
        name,
        selectedServiceProvider?.value,
        selectedCustomer?.value,
        password,
        email,
    ]);

    useEffect(() => {
        if (userType === UserType.ServiceProvider && selectedCustomer) {
            setSelectedCustomer(null);
        }
    }, [userType]);

    return (
        <ModalBase
            title="Create User"
            handleClose={handleClose}
            className="sm"
            closeOnBackdropClick={false}
        >
            <motion.form
                id="CreateUser"
                key="CreateUser"
                className="modal-content"
                onSubmit={onSubmit}
                autoComplete="off"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={{ duration: 0.3 }}
            >
                {errorMessage && (
                    <p data-testid="create-user-error" className="error">
                        {errorMessage}
                    </p>
                )}
                {accountType !== AccountType.Customer && userType !== null && (
                    <div className="field">
                        <label htmlFor="user-type-select">
                            <span>Type of User</span>
                        </label>
                        <Select
                            id="user-type-select"
                            value={
                                userTypeOptions.find(
                                    (option) =>
                                        (option.value as UserType) === userType
                                ) as SelectOption
                            }
                            options={userTypeOptions}
                            onChange={(newValue) => {
                                const result = newValue as SelectOption;

                                setUserType(result.value as UserType);
                            }}
                            isClearable={false}
                        />
                    </div>
                )}
                <AnimatePresence mode="wait">
                    {accountType === AccountType.Evolon && (
                        <motion.div className="select-container field">
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
                        </motion.div>
                    )}
                    {accountType !== AccountType.Customer &&
                        userType === UserType.Customer && (
                            <motion.div
                                id="customer-select-container"
                                key="customer-select-container"
                                className="CreateUser select-container field"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{
                                    opacity: 0,
                                    transition: { duration: 0.5 },
                                }}
                                transition={{ duration: 0.5 }}
                            >
                                <label htmlFor="customers">
                                    <span>Under Customer Account</span>
                                    <span className="asterisk">*</span>
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
                            </motion.div>
                        )}
                </AnimatePresence>
                <Input
                    id="create-display-name"
                    name="create-display-name"
                    label="Display Name"
                    className="input field"
                    type="text"
                    value={name}
                    autoComplete="false"
                    onChange={setName}
                    required
                />
                <Input
                    id="create-password"
                    name="create-password"
                    label="Password"
                    className="input field password-input"
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d])(?=.{8,})[A-Za-z\d\W]{8,}$"
                    title="Must contain at least one uppercase and lowercase letter, one special character, and be at least 8 characters long."
                    required
                    isPassword
                    onClick={togglePasswordVisibility}
                    isPasswordVisible={passwordVisible}
                />
                <Input
                    id="create-confirm-password"
                    name="create-confirm-password"
                    label="Confirm Password"
                    className="input field password-input"
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d])(?=.{8,})[A-Za-z\d\W]{8,}$"
                    title="Must contain at least one uppercase and lowercase letter, one special character, and be at least 8 characters long."
                    required
                    isPassword
                    onClick={toggleConfirmPasswordVisibility}
                    isPasswordVisible={confirmPasswordVisible}
                />
                <Input
                    id="create-email"
                    name="create-email"
                    label="Email"
                    className="input field"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="false"
                    required
                />
                <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                    <Button
                        id="cancel-create-user-button"
                        className="btn danger"
                        label="Cancel"
                        onClick={() => handleClose()}
                    />
                    <Button
                        id="confirm-create-user-button"
                        className="btn primary"
                        label="Save"
                        type="submit"
                    />
                </ButtonGroup>
            </motion.form>
        </ModalBase>
    );
};

export default CreateUserModal;
