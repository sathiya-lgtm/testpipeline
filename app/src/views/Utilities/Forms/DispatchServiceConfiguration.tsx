/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
    ReactElement,
    FC,
    useState,
    Dispatch,
    SetStateAction,
    useCallback,
    FormEvent,
    useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { toast } from 'react-toastify';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SingleValue } from 'react-select';
import { isAxiosError } from 'axios';

// Api Calls
import stagesLogin from '../../../api_calls/stagesLogin';
import stagesLogout from '../../../api_calls/stagesLogout';
import linkStagesAccount from '../../../api_calls/linkStagesAccount';
import getStagesDealerAccount from '../../../api_calls/getStagesDealerAccount';
import getStagesDealerCredentials from '../../../api_calls/getStagesDealerCredentials';

// Custom
import { useServiceProviders, useCustomers, useSites } from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import useGetServiceProviderOptions from '../../../hooks/useGetServiceProviderOptions';
import useGetCustomerOptions from '../../../hooks/useGetCustomerOptions';
import useGetSiteOptions from '../../../hooks/useGetSiteOptions';

// Components
import Select from '../../../components/Inputs/Select';
import Input from '../../../components/Inputs/Input';
import Button from '../../../components/Button';
import LoadingModal from '../../../components/Modals/LoadingModal';
import StagesDealersTable from '../../../components/Tables/StagesDealersTable';
import UnlinkStagesAccountModal from '../../../components/Modals/UnlinkStagesAccountModal';
import StagesAlertsTests from '../../../components/Stages/StagesAlertsTests';
import StagesDealersCredsTable from '../../../components/Tables/StagesDealersCredsTable';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountTypeModifier } from '../../../types/enums';
import { IStagesDealerAccount } from '../../../types/tng-api.interfaces';

const handleAxiosError = (err: any) => {
    if (isAxiosError(err)) {
        const errorMessage = err.response?.data.details.description;

        if (errorMessage) {
            toast.error(errorMessage);
        }

        toast.error('Error with no description occurred');
    } else {
        toast.error('An Unknown error occurred.');
    }
};

export type AlertTestResult = 'not tested' | 'passed' | 'failed';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    defaultServiceProvider: SelectOption | null;
}

/**
 * Form for creating Customers.
 * @returns {ReactElement}
 */
const DispatchServiceConfiguration: FC<IProps> = ({
    activeUser,
    setActiveUser,
    defaultServiceProvider,
}: IProps): ReactElement => {
    // Hooks
    const navigate = useNavigate();
    // const queryClient = useQueryClient();

    // State
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);
    const [selectedCustomer, setSelectedCustomer] =
        useState<SingleValue<SelectOption> | null>(null);
    const [selectedSite, setSelectedSite] =
        useState<SingleValue<SelectOption> | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [dealerId, setDealerId] = useState<number | null>(null);
    const [dealerName, setDealerName] = useState('');
    const [stagesAccountOptions, setStagesAccountOptions] = useState<
        SelectOption[]
    >([]);
    const [selectedStagesAccount, setSelectedStagesAccount] =
        useState<SingleValue<SelectOption> | null>(null);
    const [configurationStep, setConfigurationStep] = useState<1 | 2 | 3>(1);
    const [selectedAccount, setSelectedAccount] =
        useState<IStagesDealerAccount | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tableTab, setTableTab] = useState<
        'linkedSites' | 'dealerCredentials'
    >('linkedSites');

    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const submitButtonLabel = useMemo(() => {
        if (configurationStep === 1) {
            return 'Login';
        }

        if (configurationStep === 2) {
            return 'Link';
        }

        if (configurationStep === 3) {
            return 'Finish';
        }

        return 'Login';
    }, [configurationStep]);

    const onDeleteClick = (accountData: IStagesDealerAccount) => {
        if (activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly)) {
            return;
        }

        setSelectedAccount(accountData);
        setShowDeleteModal(true);
    };

    // React Query
    const { data } = useServiceProviders({
        activeUser: activeUser as IUser,
        enabled: defaultServiceProvider === null,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const stagesDealersQuery = useQuery(
        ['stages-dealers-accounts'],
        () => getStagesDealerAccount({ user: activeUser }),
        {
            enabled: !!activeUser,
        }
    );

    const stagesDealersCredsQuery = useQuery(
        ['stages-dealers-credentials'],
        () => getStagesDealerCredentials({ user: activeUser })
    );

    const serviceProviderId = useMemo(() => {
        if (selectedServiceProvider?.value) {
            return Number(selectedServiceProvider?.value);
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
        enabled: !!selectedCustomer,
    });

    const handleClear = useCallback(() => {
        if (defaultServiceProvider === null) {
            setSelectedServiceProvider(null);
        }

        customersQuery.remove();
        sitesQuery.remove();
        setUsername('');
        setPassword('');
        setDealerId(null);
        setSelectedAccount(null);
        setSelectedCustomer(null);
        setSelectedSite(null);
        setDealerName('');
        setConfigurationStep(1);
        setSelectedCustomer(null);
    }, [defaultServiceProvider]);

    const stagesLoginMutation = useMutation({
        mutationFn: stagesLogin,
    });

    const stagesLogoutMutation = useMutation({
        mutationFn: stagesLogout,
    });

    const linkStagesMutation = useMutation({
        mutationFn: linkStagesAccount,
    });

    const loginIntoStages = async (
        account_id: number,
        account_name: string,
        site_id: number,
        site_name: string,
        user_name: string,
        user_password: string
    ) => {
        const result = await stagesLoginMutation.mutateAsync({
            user: activeUser,
            stagesAccountInfo: {
                account_id,
                account_name,
                site_id,
                site_name,
                user_name,
                user_password,
            },
        });

        if (result.response.success) {
            const {
                stages_site_group_id,
                stages_site_group_name,
                stages_accounts,
            } = result.response;

            setDealerId(stages_site_group_id);
            setDealerName(stages_site_group_name);

            const accountOptions = stages_accounts.map((account) => {
                return {
                    label: `${account.stages_account_name} (Stages Site: ${account.stages_site_name})`,
                    value: account.stages_account_id.toString(),
                };
            });

            setStagesAccountOptions(accountOptions);

            if (accountOptions.length === 0) {
                toast.error(
                    'No stages accounts found for these credentials and account.'
                );
            }
        }
    };

    const linkAccountToStages = async ({
        account_id,
        site_id,
        user_name,
        user_password,
        stages_account_id,
        stages_account_name,
        stages_site_group_id,
        stages_site_group_name,
        stages_site_id,
        stages_site_name,
    }: {
        account_id: number;
        site_id: number;
        user_name: string;
        user_password: string;
        stages_account_id: number;
        stages_account_name: string;
        stages_site_group_id: number;
        stages_site_group_name: string;
        stages_site_name: string;
        stages_site_id: number;
    }) => {
        const result = await linkStagesMutation.mutateAsync({
            user: activeUser,
            stagesAccountInfo: {
                account_id,
                site_id,
                user_name,
                user_password,
                stages_account_id,
                stages_account_name,
                stages_site_group_id,
                stages_site_group_name,
                stages_site_id,
                stages_site_name,
            },
        });

        if (result.response.success) {
            toast.success('Stages Account Linked');
        }
    };

    const handleStagesLogout = async () => {
        if (!selectedCustomer || !selectedSite) {
            handleClear();
            return;
        }

        const result = await stagesLogoutMutation.mutateAsync({
            user: activeUser,
            stagesAccountInfo: {
                account_id: Number(selectedCustomer.value),
                account_name: selectedCustomer.label,
                site_id: Number(selectedSite.value),
                site_name: selectedSite.label,
            },
        });

        if (result.response.success) {
            handleClear();
            toast.success('Logged out of stages');
        }
    };

    const selectedStagesSite = useMemo(() => {
        if (selectedStagesAccount && stagesLoginMutation.data) {
            const matchedAccount =
                stagesLoginMutation.data.response.stages_accounts.find(
                    (account) =>
                        account.stages_account_id.toString() ===
                        selectedStagesAccount.value
                );

            if (matchedAccount) {
                return matchedAccount;
            }

            return null;
        }

        return null;
    }, [selectedStagesAccount, stagesLoginMutation.data]);

    const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (
            !activeUser ||
            !selectedServiceProvider?.value ||
            !selectedCustomer?.value ||
            !selectedSite?.value
        ) {
            return;
        }

        if (configurationStep === 1 && selectedCustomer) {
            try {
                await loginIntoStages(
                    Number(selectedCustomer.value),
                    selectedCustomer.label,
                    Number(selectedSite.value),
                    selectedSite.label,
                    username,
                    password
                );
                setConfigurationStep(2);
                return;
            } catch (err) {
                handleAxiosError(err);
                return;
            }
        }

        if (
            configurationStep === 2 &&
            dealerId &&
            dealerName &&
            selectedStagesAccount &&
            selectedCustomer &&
            selectedSite &&
            selectedStagesSite
        ) {
            try {
                await linkAccountToStages({
                    account_id: Number(selectedCustomer.value),
                    site_id: Number(selectedSite.value),
                    user_name: username,
                    user_password: password,
                    stages_account_id: selectedStagesSite.stages_account_id,
                    stages_account_name: selectedStagesSite.stages_account_name,
                    stages_site_group_id: dealerId,
                    stages_site_group_name: dealerName,
                    stages_site_name: selectedStagesSite.stages_site_name,
                    stages_site_id: selectedStagesSite.stages_site_id,
                });
                stagesDealersQuery.refetch();
                setConfigurationStep(3);
            } catch (err) {
                handleAxiosError(err);
                return;
            }
        }

        if (configurationStep === 3) {
            handleStagesLogout();
        }
    };

    const loadingText = useMemo(() => {
        if (stagesLoginMutation.isLoading) {
            return 'Logging into stages...';
        }

        if (stagesLogoutMutation.isLoading) {
            return 'Logging out of stages...';
        }

        if (linkStagesMutation.isLoading) {
            return 'Linking stages account...';
        }

        return '';
    }, [stagesLoginMutation, stagesLogoutMutation, linkStagesMutation]);

    const serviceProviderOptions = useGetServiceProviderOptions(
        data,
        defaultServiceProvider
    );

    const customerOptions = useGetCustomerOptions(customersQuery.data);
    const siteOptions = useGetSiteOptions(sitesQuery.data);

    return (
        <>
            <motion.form
                className="dispatchServiceConfiguration"
                id="CreateCustomer"
                key="CreateCustomer"
                onSubmit={onSubmit}
                autoComplete="off"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={{ duration: 0.3 }}
            >
                <h3 id="title">
                    <span>Dispatch Service Configuration</span>
                </h3>

                {!dealerId && (
                    <>
                        <div className="select-container field">
                            <label htmlFor="service-providers">
                                <span>SP Account</span>
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
                        <div className="select-container field">
                            <label htmlFor="customers">
                                <span>Customer</span>
                                <span className="asterisk">*</span>
                            </label>
                            <Select
                                id="customers"
                                value={selectedCustomer}
                                onChange={(option) => {
                                    if (
                                        option?.value ===
                                        selectedCustomer?.value
                                    ) {
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

                                    setSelectedSite(
                                        option as SingleValue<SelectOption>
                                    );
                                }}
                                options={siteOptions}
                                required
                            />
                        </div>
                        <Input
                            id="username"
                            name="username"
                            label="Username"
                            className="input field"
                            type="text"
                            value={username}
                            onChange={setUsername}
                            required
                        />
                        <Input
                            id="password"
                            name="password"
                            label="Password"
                            className="input field password-input"
                            type="password"
                            value={password}
                            onChange={setPassword}
                            autoComplete="false"
                            required
                            isPassword={true}
                            onClick={togglePasswordVisibility}
                            isPasswordVisible={passwordVisible}
                        />
                    </>
                )}

                {dealerId && dealerName && (
                    <div className="accountInfoContainer">
                        <p>
                            <span className="label">Insites SP Account:</span>{' '}
                            {selectedServiceProvider?.label}
                        </p>
                        <p>
                            <span className="label">
                                Insites Customer Account:
                            </span>{' '}
                            {selectedCustomer?.label}
                        </p>
                        <p>
                            <span className="label">Insites Site:</span>{' '}
                            {selectedSite?.label}
                        </p>
                        <p>
                            <span className="label">Stages Dealer ID:</span>{' '}
                            {dealerId}
                        </p>
                        <p>
                            <span className="label">Stages Dealer Name:</span>{' '}
                            {dealerName}
                        </p>
                        <p>
                            <span className="label">Stages Account Name:</span>{' '}
                            {selectedStagesSite?.stages_account_name ||
                                'Please select below'}
                        </p>
                        <p>
                            <span className="label">Stages Account Id:</span>{' '}
                            {selectedStagesSite?.stages_account_id ||
                                'Please select below'}
                        </p>

                        <p>
                            <span className="label">Stages Site Name:</span>{' '}
                            {selectedStagesSite?.stages_site_name ||
                                'Please select below'}
                        </p>
                        <p>
                            <span className="label">Stages Site Id:</span>{' '}
                            {selectedStagesSite?.stages_site_id ||
                                'Please select below'}
                        </p>
                        <div className="select-container field">
                            <label htmlFor="customers">
                                <span>Stages Account</span>
                                <span className="asterisk">*</span>
                            </label>
                            <Select
                                id="stagesAccount"
                                value={selectedStagesAccount}
                                onChange={(option) => {
                                    if (
                                        option?.value ===
                                        selectedStagesAccount?.value
                                    ) {
                                        return;
                                    }

                                    setSelectedStagesAccount(
                                        option as SingleValue<SelectOption>
                                    );
                                }}
                                options={stagesAccountOptions}
                                isClearable={false}
                                required
                            />
                        </div>
                    </div>
                )}

                {configurationStep === 3 && (
                    <div className="stagesAlertsTestWrapper">
                        <StagesAlertsTests
                            customerAccountId={Number(
                                selectedCustomer?.value || 0
                            )}
                            siteId={Number(selectedSite?.value || 0)}
                        />
                    </div>
                )}

                <div className="button-container">
                    <Button
                        id="create"
                        className="btn primary"
                        label={submitButtonLabel}
                        type="submit"
                        disabled={activeUser?.modifier?.includes(
                            AccountTypeModifier.ReadOnly
                        )}
                    />
                    <button
                        id="clear"
                        type="button"
                        className="btn danger"
                        onClick={(e) => {
                            e.preventDefault();
                            handleStagesLogout();
                        }}
                        disabled={activeUser?.modifier?.includes(
                            AccountTypeModifier.ReadOnly
                        )}
                    >
                        {dealerId ? 'Cancel' : 'Clear'}
                    </button>
                </div>
                {loadingText && <LoadingModal modalText={loadingText} />}
            </motion.form>

            <ul className="table-tab-list">
                <li
                    role="presentation"
                    className={`dashboard-tab ${
                        tableTab === 'linkedSites' ? 'selected' : ''
                    }`}
                    data-testid="dashboard-tab-events"
                    onClick={() => setTableTab('linkedSites')}
                >
                    Linked Sites
                </li>
                <li
                    role="presentation"
                    className={`dashboard-tab ${
                        tableTab === 'dealerCredentials' ? 'selected' : ''
                    }`}
                    data-testid="dashboard-tab-events"
                    onClick={() => setTableTab('dealerCredentials')}
                >
                    Dealer Credentials
                </li>
            </ul>

            {stagesDealersQuery.data && tableTab === 'linkedSites' && (
                <div
                    style={{
                        overflow: 'auto',
                        width: '100%',
                        paddingLeft: 2,
                        paddingRight: 2,
                        paddingBottom: '7rem',
                    }}
                >
                    <StagesDealersTable
                        data={stagesDealersQuery.data.response.stages_accounts}
                        onDeleteClick={onDeleteClick}
                        activeUser={activeUser}
                        refetch={stagesDealersQuery.refetch}
                    />
                </div>
            )}

            {stagesDealersCredsQuery.data &&
                tableTab === 'dealerCredentials' && (
                    <div
                        style={{
                            overflow: 'auto',
                            width: '100%',
                            paddingLeft: 2,
                            paddingRight: 2,
                            paddingBottom: '7rem',
                        }}
                    >
                        <StagesDealersCredsTable
                            data={
                                stagesDealersCredsQuery.data.response
                                    .stages_dealers
                            }
                            activeUser={activeUser}
                            refetch={stagesDealersCredsQuery.refetch}
                        />
                    </div>
                )}
            {showDeleteModal && (
                <UnlinkStagesAccountModal
                    handleClose={() => setShowDeleteModal(false)}
                    refetchAccounts={stagesDealersQuery.refetch}
                    selectedAccount={selectedAccount}
                />
            )}
        </>
    );
};

export default DispatchServiceConfiguration;
