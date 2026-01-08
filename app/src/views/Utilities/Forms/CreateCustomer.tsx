/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SingleValue } from 'react-select';

// Custom
import { useServiceProviders } from '../../../hooks';
import createCustomer from '../../../api_calls/createCustomer';
// import updateMIYStatus from '../../../api_calls/updateMIYStatus';
// import updateRetentionPolicy from '../../../api_calls/updateRetentionPolicy';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import sortByName from '../../../utils/sortByName';
import OptionsConverter from '../../../classes/OptionsConverter';
import extractErrorMessage from '../../../utils/extractErrorMessage';
import { validateCustomerSubmission } from '../Utilities.controller';

// Components
import Select from '../../../components/Inputs/Select';
import Input from '../../../components/Inputs/Input';
import Button from '../../../components/Button';
import LoadingModal from '../../../components/Modals/LoadingModal';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../types/enums';
import { IServiceProvider } from '../../../types/tng-api.interfaces';

// Styles
import '../../../styles/views/Utilities/CreateCustomer.scss';
import ButtonGroup, { ButtonGroupAlignment } from '../../../components/ButtonGroup/ButtonGroup';

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
const CreateCustomer: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
}: IProps): ReactElement => {
    // Hooks
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // State
    const [name, setName] = useState<string>('');
    const [serviceProviderOptions, setServiceProviderOptions] = useState<
        SelectOption[]
    >(defaultServiceProvider !== null ? [defaultServiceProvider] : []);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // const [selectedMIYSub, setSelectedMIYSub] = useState<0 | 2 | 3>(0);
    const [loadingText, setLoadingText] = useState('');

    // React Query
    const { data } = useServiceProviders({
        activeUser: activeUser as IUser,
        enabled: defaultServiceProvider === null,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const handleClear = useCallback(() => {
        if (defaultServiceProvider === null) {
            setSelectedServiceProvider(null);
        }

        setName('');
    }, [defaultServiceProvider]);

    // const updateMIYStatusMutation = useMutation({
    //     mutationFn: updateMIYStatus,
    // });

    // const updateRetentionPolicyMutation = useMutation({
    //     mutationFn: updateRetentionPolicy,
    // });

    const onSuccess = useCallback(async () => {
        if (
            accountType === AccountType.Evolon &&
            selectedServiceProvider?.value
        ) {
            queryClient.invalidateQueries({
                queryKey: ['customers', Number(selectedServiceProvider?.value)],
            });
        } else if (
            accountType === AccountType.ServiceProvider &&
            activeUser.service_provider_account
        ) {
            queryClient.invalidateQueries({
                queryKey: ['customers', activeUser.service_provider_account],
            });
        }

        handleClear();

        toast.success(`Customer: ${name}, successfully added.`);
    }, [name]);

    const createCustomerMutation = useMutation({
        mutationFn: createCustomer,
    });

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoadingText('Creating Account...');

        const serviceProviderId: number | undefined =
            selectedServiceProvider?.value
                ? Number(selectedServiceProvider?.value)
                : undefined;

        try {
            validateCustomerSubmission(accountType, name, serviceProviderId);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
            setLoadingText('');

            // End function prematurely if validation fails.
            return;
        }

        try {
            await createCustomerMutation.mutateAsync({
                user: activeUser,
                createCustomerData: {
                    service_provider_account_reference_id:
                        accountType === AccountType.Evolon
                            ? serviceProviderId
                            : undefined,
                    name,
                    properties: {},
                    form: 'Create-Account',
                },
            });

            // if (selectedMIYSub === 2 || selectedMIYSub === 3) {
            //     const accountId = result.response.account_id;
            //     await updateMIYStatusMutation.mutateAsync({
            //         user: activeUser,
            //         account: accountId,
            //         subscription_id: selectedMIYSub,
            //     });

            //     if (selectedMIYSub === 2) {
            //         await updateRetentionPolicyMutation.mutateAsync({
            //             user: activeUser,
            //             account_id: accountId,
            //             retention_days: 2,
            //         });
            //     }
            // }

            onSuccess();
        } catch (err) {
            console.log(err);
            handleHttpRequestError(err, setActiveUser, navigate);
        }

        setLoadingText('');
    };

    useEffect(() => {
        if (data) {
            const sortedServiceProviders: IServiceProvider[] =
                data.sort(sortByName);
            const options: SelectOption[] =
                OptionsConverter.convertServiceProvidersToOptions(
                    sortedServiceProviders
                );

            setServiceProviderOptions(options);
        }
    }, [data]);

    useEffect(() => {
        // Reset error message whenever user updates form.
        setErrorMessage(null);
    }, [name, selectedServiceProvider?.value]);

    return (
        <motion.form
            id="CreateCustomer"
            key="CreateCustomer"
            onSubmit={onSubmit}
            className="create-customer"
            autoComplete="off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <h3 id="title">
                <span>Create Customer</span>
            </h3>
            {errorMessage && <p className="error">{errorMessage}</p>}
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
            <Input
                id="customer-account-name"
                name="customer-account-name"
                label="Customer Account Name"
                className="input field"
                type="text"
                value={name}
                onChange={setName}
                autoComplete="false"
                required
            />
            {/* <div className="miy-subscription-container">
                <p>MIY Subscription</p>
                <button
                    className={`${
                        selectedMIYSub === 0
                            ? 'btn primary'
                            : 'btn outline neutral'
                    }`}
                    onClick={() => {
                        setSelectedMIYSub(0);
                    }}
                    type="button"
                >
                    None
                </button>
                <button
                    className={`${
                        selectedMIYSub === 2
                            ? 'btn primary'
                            : 'btn outline neutral'
                    }`}
                    onClick={() => {
                        setSelectedMIYSub(2);
                    }}
                    type="button"
                >
                    MIY
                </button>
                <button
                    className={`${
                        selectedMIYSub === 3
                            ? 'btn primary'
                            : 'btn outline neutral'
                    }`}
                    onClick={() => {
                        setSelectedMIYSub(3);
                    }}
                    type="button"
                >
                    MIY+
                </button>
            </div> */}
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
            {loadingText && <LoadingModal modalText={loadingText} />}
        </motion.form>
    );
};

export default CreateCustomer;
