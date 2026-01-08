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
import { useNavigate, useSearchParams } from 'react-router-dom';

// Third party
import { toast } from 'react-toastify';
import { SingleValue, MultiValue } from 'react-select';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Custom
import { useCustomers, useSites, useServiceProviders } from '../../../hooks';
import submitRegisterEdgeDevice from '../../../api_calls/registerEdgeDevice';
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
    EdgeLicenseTypes,
} from '../../../types/tng-api.interfaces';

// Components
import Select from '../../../components/Inputs/Select';
import Button from '../../../components/Button';
import Input from '../../../components/Inputs/Input';
import LoadingModal from '../../../components/Modals/LoadingModal';
import FormPasswordInput from '../../../components/Inputs/FormPasswordInput';
import FormInput, { IFormInputElement } from '../../../components/Inputs/FormInput';
import IntegrationsSystemSubscribedRoute, { ISystemSubscribedRequest,  ISystemSubscribedResponse } from '../../../api_calls/IntegrationSystemSubscribed';
import ButtonGroup, { ButtonGroupAlignment } from '../../../components/ButtonGroup/ButtonGroup';
import { FaCheck, FaTimes } from 'react-icons/fa';
import IntegrationsSystemSessionRoute, {ISystemSessionRequest, ISystemSessionResponse} from '../../../api_calls/IntegrationsSystemSession';
import { update } from 'lodash';
import ScaleLine from '../../../components/Outlets/Home/Edge/ScaleLine';

const licenseTypeOptions = [
    { label: 'CS - Fixed Camera Only (default)', value: 'CS-EDGE' },
    { label: 'CP – Fixed and PTZ Camera', value: 'CP-EDGE' },
];

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
}

const RegisterEdgeDevice: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
    defaultCustomer,
}) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Service Provider state
    const [serviceProviderOptions, setServiceProviderOptions] = useState<
        SelectOption[]
    >(defaultServiceProvider !== null ? [defaultServiceProvider] : []);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);

    const [cameraName, setCameraName] = useState('');
    const [macAddress, setMacAddress] = useState('');
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

    const [licenseType, setLicenseType] =
        useState<SingleValue<SelectOption> | null>(licenseTypeOptions[0]);

    const [SCAPISession, setSCAPISession] = useState<ISystemSessionResponse|null>(null);
    const [isAlarmVisionSystemSubscribed, setIsAlarmVisionSystemSubscribed] = useState<boolean>(false);
    const [isAlarmVisionSystemAuthorized, setIsAlarmVisionSystemAuthorized] = useState<boolean>(false)
    const [dmpUsername, setDmpUsername] = useState<string | undefined | null>(null);        
    const [dmpPassword, setDmpPassword] = useState<string | undefined | null>(null);
    const [dmpConfirm, setDmpConfirm] = useState<string | undefined | null>(null);
    const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
    const [canSubmit, setCanSubmit] = useState<boolean>(false);

    const resetForm = () => {
        setMacAddress('');
        setCameraName('');
        setSelectedServiceProvider(defaultServiceProvider);
        setSelectedCustomer(defaultCustomer);
        setSelectedSites(null);
        setNewSiteName('');
        setLicenseType(licenseTypeOptions[0]);

        // remove mac from url
        searchParams.delete('mac');
        searchParams.delete('name');
        setSearchParams(searchParams);
    };

    const onSiteCreated = useCallback((): void => {
        toast.success('New Site Created.');
    }, []);

    const onSuccess = useCallback((): void => {
        toast.success('Device successfully registered.');
        resetForm();
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
        mutationFn: submitRegisterEdgeDevice,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const getIntegrationSystemSession = async (props: ISystemSessionRequest) => {
        try {
            const route = IntegrationsSystemSessionRoute(activeUser);
            const response = await route.get(props) as ISystemSessionResponse;
            setSCAPISession(response);
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get network device types.`);
            }
        }
    };

    const updateIntegrationSystemSession = async (props: ISystemSessionRequest) => {
        try {
            const route = IntegrationsSystemSessionRoute(activeUser);
            const response = await route.update(props) as ISystemSessionResponse;
            console.log(response);
            setSCAPISession(response);
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get network device types.`);
            }
        } finally {
            setIsAuthorizing(false);
        }
    };

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

        if (!licenseType?.value) {
            toast.warn('License Type must be selected.');
            return;
        }

        if (selectedSites?.value === 'create-new-site') {
            const customerId: string | number | undefined =
                selectedCustomer?.value;
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
                registerMutation.mutate({
                    user: activeUser,
                    registrationData: {
                        account_id: Number(selectedCustomer.value),
                        site_id: result.site_id,
                        'mac-address': macAddress,
                        camera_name: cameraName,
                        license_type: licenseType.value as EdgeLicenseTypes,
                    },
                });
            }
            return;
        }

        if(!isAlarmVisionSystemSubscribed) {
            registerMutation.mutate({
                        user: activeUser,
                        registrationData: {
                        account_id: Number(selectedCustomer.value),
                        site_id: Number(selectedSites.value),
                        'mac-address': macAddress,
                        camera_name: cameraName,
                        license_type: licenseType.value as EdgeLicenseTypes,
                    },
            });
        } else {
            registerMutation.mutate({
                        user: activeUser,
                        registrationData: {
                        account_id: Number(selectedCustomer.value),
                        site_id: Number(selectedSites.value),
                        'mac-address': macAddress,
                        camera_name: cameraName,
                        license_type: licenseType.value as EdgeLicenseTypes,
                        dmp_username: dmpUsername,
                        dmp_password: dmpPassword
                    },
            });
        }
        
    };

    const handleSiteSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Then set site.
        setSelectedSites(selectOption as SingleValue<SelectOption>);
    };

    const handleLicenseTypeSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Then set site.
        setLicenseType(selectOption as SingleValue<SelectOption>);
    };

    const onChangeDmpUsername = (e: IFormInputElement) => {
        setDmpUsername(e.value)
    }

    const onChangeDmpPassword = (e: IFormInputElement) => {
        setDmpPassword(e.value)
    }

    const onAuthorizeSCAPIUser = ( ) => {
        if(!selectedServiceProvider) return;
        if(!selectedCustomer) return;
        if(!selectedSites) return;
        if(!dmpUsername) return;
        if(!dmpPassword) return;
        updateIntegrationSystemSession({
            account_id: Number(selectedCustomer?.value) ?? null,
            site_id: Number(selectedSites.value),
            dmp_username: dmpUsername,
            dmp_password: dmpPassword
        });
        setIsAuthorizing(true);
    }

    const onChangeDmpConfirm = (e: IFormInputElement) => {
        setDmpConfirm(e.value)
    }

    const clearInputs = () =>  {
        setSelectedCustomer(null);
        setSelectedSites(null);
        setCameraName('');
        setMacAddress('');
        setLicenseType(licenseTypeOptions[0]);
        setDmpUsername('');
        setDmpPassword('');
        setDmpConfirm('');
        setIsAlarmVisionSystemSubscribed(false);
        setIsAlarmVisionSystemAuthorized(false);
    }

    const validPasswords = ( ): boolean => {
        if(dmpPassword === null) return false;
        if(dmpPassword === undefined) return false;
        if(dmpPassword === '') return false;
        if(dmpConfirm === undefined) return false;
        if(dmpConfirm === null) return false;
        if(dmpConfirm === '') return false;
        if(dmpPassword !== dmpConfirm) return false;
        return true;
    }

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

    useEffect(() => {
        const mac = searchParams.get('mac');
        const name = searchParams.get('name');

        if (mac) {
            setMacAddress(mac);
        }

        if (name) {
            setCameraName(name);
        }
    }, [searchParams]);

    useEffect(() => {
        if(!activeUser) {
            setSCAPISession(null);
            return;
        };
        if(!selectedServiceProvider) {
            setSCAPISession(null);
            return;
        }
        if(!selectedCustomer) {
            setSCAPISession(null);
            return;
        }
        if(!selectedSites)  {
            setSCAPISession(null);
            return;
        }
        getIntegrationSystemSession({
            account_id: Number(selectedCustomer?.value) ?? null,
            site_id: Number(selectedSites?.value) ?? null
        });
    }, [activeUser, selectedServiceProvider?.value, selectedCustomer?.value, selectedSites?.value])

    // Allow submit when all values are set correctly
    useEffect(() => {

        if(Number(selectedServiceProvider?.value ?? 0) <= 0)
        {
            setCanSubmit(false);
            return;
        }

        if(Number(selectedCustomer?.value ?? 0) <= 0) {
            setCanSubmit(false);
            return;
        }

        if(Number(selectedSites?.value ?? 0) <= 0) {
            setCanSubmit(false);
            return;
        }

        if(cameraName === null || cameraName === undefined || cameraName === '') {
            if(cameraName.length < 3) {
                setCanSubmit(false)
                return;
            }
        }

        if(macAddress === null || macAddress === undefined || macAddress === '') {
            if( macAddress.length !== 12) {
                setCanSubmit(false)
                return;
            }
        }


        if(isAlarmVisionSystemSubscribed && !isAlarmVisionSystemAuthorized) {

            if(dmpUsername === null || dmpUsername === undefined || dmpUsername === '') {
                setCanSubmit(false);
                return;
            }
            
            if(!dmpPassword){
                setCanSubmit(false);
                return;
            }

            if(!dmpConfirm){
                setCanSubmit(false);
                return;
            }

            if(dmpPassword !== dmpConfirm){
                setCanSubmit(false);
                return;
            }
        }

        setCanSubmit(true);

    }, [selectedServiceProvider?.value, selectedCustomer?.value, selectedSites?.value, cameraName, macAddress, dmpUsername, dmpPassword, dmpConfirm])
    
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
                    id="camera-name"
                    name="camera-name"
                    className="input field"
                    label="Camera Name (Optional)"
                    type="text"
                    value={cameraName}
                    onChange={setCameraName}
                    placeholder={
                        macAddress ? `Camera ${macAddress}` : undefined
                    }
                />

                <Input
                    id="mac-address"
                    name="mac-address"
                    label="Mac Address"
                    className="input field"
                    type="text"
                    value={macAddress}
                    onChange={setMacAddress}
                    disabled={!!searchParams.get('mac')}
                    required
                />

                <div className="select-container form-item">
                    <label htmlFor="site">
                        <span>Edge Subscription</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="license-type-select"
                        value={licenseType}
                        onChange={handleLicenseTypeSelect}
                        options={licenseTypeOptions}
                        required
                    />
                </div>
                {isAlarmVisionSystemSubscribed && isAlarmVisionSystemAuthorized && canSubmit && (
                    <div className="select-container form-item">
                        <br/>
                        <label>
                            This new camera will be added to an AlarmVision authorized system
                        </label>
                    </div>
                )}
                {SCAPISession?.is_alarm_vision && SCAPISession.is_expired && (
                    <div className="select-container form-item">
                        <br/>
                        <br/>
                        <label>Link DMP Account to Insites</label><br/>
                        <br/>
                        <FormInput id="dmp_username" columnMap="dmp_username" label="DMP Username" value={dmpUsername} onChange={e => onChangeDmpUsername(e)}/><br/>
                        <FormPasswordInput columnMap="dmp_password" label="Password" value={dmpPassword} onChange={e => onChangeDmpPassword(e)} /><br/>
                        <FormPasswordInput columnMap="dmp_confirm" label="Confirm" value={dmpConfirm} onChange={e => onChangeDmpConfirm(e)} /><br/>
                    </div>
                )}
                {SCAPISession?.is_alarm_vision && SCAPISession.is_expired && validPasswords() && !isAuthorizing && (
                    <>
                        <div className="select-container passwords-matched">
                            <FaCheck /> 
                            <span>Passwords Match</span>
                        </div>
                        <ButtonGroup alignment={ButtonGroupAlignment.topleft}>
                            <Button className="btn primary" label="Authorize" onClick={onAuthorizeSCAPIUser} />
                        </ButtonGroup>
                    </>
                )}
                {SCAPISession?.is_alarm_vision && SCAPISession.is_expired && validPasswords() && isAuthorizing && (
                    <div className="select-container passwords-matched">
                        <span>Please wait while authorizing DMP user...</span>
                    </div>
                )}
                {SCAPISession?.is_alarm_vision && SCAPISession.is_expired && !validPasswords() && (
                    <div className="select-container passwords-not-matched">
                        <FaTimes /> 
                        <span>Passwords DO NOT Match</span>
                    </div>
                )}
                <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                    <Button
                        id="clear-button"
                        className="btn danger cancel"
                        label="Clear"
                        type="button"
                        onClick={() => clearInputs()}
                        disabled={activeUser?.modifier?.includes(
                            AccountTypeModifier.ReadOnly
                        )}
                    />
                    <Button
                        id="submit"
                        className="btn primary register"
                        label="Save"
                        type="submit"
                        visible={canSubmit}
                        disabled={activeUser?.modifier?.includes(
                            AccountTypeModifier.ReadOnly
                        )}
                    />
                </ButtonGroup>                        
            </form>
        </motion.div>
    );
};

export default RegisterEdgeDevice;
