// React
import {useState, useEffect, useRef} from 'react';


// React Router
import { useLocation, useNavigate } from 'react-router-dom';


// Icons
import { FaCheck, FaCog, FaTimes, FaUserCog, FaDownload } from "react-icons/fa";

// Components
import FormInput, { IFormInputElement } from '../../components/Inputs/FormInput';
import Button from '../../components/Button';

// Sass Styles
import '../../styles/views/AlarmVision.scss';

// API Calls
import IntegrationsRoute, {IGetProps as IValidTokenProps, IValidToken as IValidTokenResponse} from '../../api_calls/IntegrationRoute';
import LoadingModal from '../../components/Modals/LoadingModal';

import IntegrationsDealerSubscribeRoute, { 
    IDealerSubscribedResponse, 
    IDealerSubscribeRequest
} from '../../api_calls/IntegrationDealerSubscribe';

import IntegrationsDealerUnsubscribeRoute, { 
    IDealerUnsubscribeRequest, 
    IDealerUnsubscribedResponse 
} from '../../api_calls/IntegrationDealerUnsubscribe';

import IntegrationsSubscriptionStatusRoute, { 
    IIntegrationDealer, 
    IIntegrationCustomer,
    IIntegrationSystem,
    IIntegrationPanel,
    IIntegrationsSubscriptionStatusRequest,
    IIntegrationSubscriptionStatusResponse,
    IIntegrationUser
} from '../../api_calls/IntegrationsSubscriptionCheck';

import EULAViewer from '../../components/EULAViewer/EULAViewer';
import ButtonGroup, { ButtonGroupAlignment } from '../../components/ButtonGroup/ButtonGroup';
import FormPasswordInput from '../../components/Inputs/FormPasswordInput';
import WizardPanel, {WizardStep} from '../../components/WizardPanel/WizardPanel';
import PasswordConfirm from '../../components/PasswordConfirm/PasswordConfirm';
import SCAPIRoute, { ISCAPILoginRequest, ISCAPILoginResponse } from '../../api_calls/SCAPI';

const ValidActions: Array<string> = ["subscribe", "unsubscribe"];

interface QueryParams {
    action: string | undefined;
    request: string | undefined;
};

const useQuery = (): QueryParams => {
  const query = new URLSearchParams(useLocation().search);
  return {
    action: query.get("action") ?? undefined,
    request: query.get("request") ?? undefined,
  };
};

/* Constants */
const DEFAULT_RETENTION_DAYS: number = 30;
const atLeastOneLowerCaseRegex: RegExp = /(?=.*[a-z])/;
const atLeastOneUpperCaseRegex: RegExp = /(?=.*[A-Z])/;
const atLeastOneDigitRegex: RegExp = /(?=.*\d)/;
const atLeastOneSpecialCharRegex: RegExp = /(?=.*[\W_])/;
const minimumEightCharRegex: RegExp = /.{8,}/;
const passwordRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

/* enums */
enum AlarmVisionStates {
    Error = -1,
    Loading = 0,
    Subscribe = 1,
    Subscribed = 2,
    Unsubscribe = 3,
    Unsubscribed = 4
};

enum WizardSteps {
    SubscribePanel = 1,
    LinkDMPAccount = 2,
    EULA = 3
};

enum UnsubscribeSteps {
    UnsubscribePanel = 1,
    LinkDMPAccount = 2
};


/* Interfaces */
interface AlarmVisionBadRequestProps {
    title: string | undefined,
    message: string | undefined
};

interface AlarmVisionDealerSubscribeProps {
    integrationToken: string,
    dealer?: IIntegrationDealer | undefined | null,
    user?: IIntegrationUser | undefined | null,
    customer?: IIntegrationCustomer | undefined | null,
    system?: IIntegrationSystem | undefined | null,
    panel?: IIntegrationPanel | undefined | null
};

interface AlarmVisionDealerUnsubscribeProps {
    integrationToken: string,
    dealer?: IIntegrationDealer | undefined | null,
    user?: IIntegrationUser | undefined | null,
    customer?: IIntegrationCustomer | undefined | null,
    system?: IIntegrationSystem | undefined | null,
    panel?: IIntegrationPanel | undefined | null
};

interface IAuthRequest {
    email?: string,
    password?: string
}

const AlarmVision  = () => {
    const navigate = useNavigate();    
    const containerRef = useRef<HTMLDivElement>(null);
    const [loadingText, setLoadingText] = useState<string>('Please wait while validating....');
    const [alarmVisionState, setAlarmVisionState] = useState<AlarmVisionStates>(AlarmVisionStates.Loading);
    const {action, request} = useQuery();
    const [isValidIntegrationToken, setValidIntegrationToken] = useState<boolean | undefined | null>(null);
    const [isValidAction, setValidAction] = useState<boolean | undefined | null>(null);
    const [isValidRequest, setValidRequest] = useState<boolean | undefined | null>(null);
    const [integrationToken, setIntegrationToken] = useState<string | undefined | null>(null);
    const [dealer, setDealer] = useState<IIntegrationDealer>();
    const [user, setUser] = useState<IIntegrationUser>();
    const [customer, setCustomer] = useState<IIntegrationCustomer>();
    const [system, setSystem] = useState<IIntegrationSystem>();
    const [panel, setPanel] = useState<IIntegrationPanel>();
    const[insitesPasswordReady, setInsitesPasswordReady] = useState<boolean>(false);
    const [insitesPassword, setInsitesPassword] = useState<string>('');
    const [dmpUsername, setDmpUsername] = useState<string>(user?.email ?? '');
    const [dmpPasswordReady, setDMPPasswordReady] = useState<boolean>(false);
    const [dmpPassword, setDMPPassword] = useState<string>('');
    const [accessToken, setAccessToken] = useState<string | undefined | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | undefined | null>(null);
    const [dmpUserVerified, setDmpUserVerified] = useState<boolean>(false);
    const [dmpUserVerifyError, setDmpUserVerifyError] = useState<string | undefined | null>(null);
    const [acceptedEULA, setAcceptedEULA] = useState<boolean>(false);
    const [readEULA, setReadEULA] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined | null>(null);
    const [transactionId, setTransactionId] = useState<string | undefined | null>(null);

    const validateIntegrationToken = async ( { integration_token }: IValidTokenProps) => {
        try {
            const route = IntegrationsRoute();
            const results = await route.get({integration_token});
            if( results.success ) {
                setIntegrationToken(integration_token);
                setValidIntegrationToken(true);
            } else {
                setError("Invalid integraiton token was supplied.");
                setAlarmVisionState(AlarmVisionStates.Error);
            }
        } catch (error: any) {
            setValidIntegrationToken(false);
            setError("Invalid integraiton token was supplied.");
            setAlarmVisionState(AlarmVisionStates.Error);
        }
    };

    const validateRequest = ( decodedRequest: any ) => {

        setIntegrationToken(decodedRequest.integration_token ?? '');
        if(decodedRequest.integration_token !== undefined || decodedRequest.integration_token !== null) {
            validateIntegrationToken({integration_token: decodedRequest.integration_token});
        }

        // Get the dealer object
        const dealerRequest = decodedRequest.dealer;
        const dealerInfo: IIntegrationDealer = {
            exists: false,
            id: dealerRequest.id,
            name: dealerRequest.name,
            subscribed: false
        }

        // Validate the dealer.id
        if(dealerInfo.id === undefined || dealerInfo.id === null ) {
            setValidRequest(false);
            setError('Invalid dealer id was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Validate the dealer.name
        if(dealerInfo.name === undefined || dealerInfo.name === null ) {
            setValidRequest(false);
            setError('Invalid dealer name was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Set the dealer info
        setDealer(dealerInfo);

        // Get the user object
        const userRequest = decodedRequest.user;
        const userInfo: IIntegrationUser = {
            exists: false,
            email: userRequest.email,
            username: userRequest.username,
            accepted_eula: userRequest.accepted_eula ?? false,
            subscribed: userRequest.subscribed ?? false
        }

        // Valdate the dealer.email
        if(userInfo.email === undefined || userInfo.email === null ) {
            setValidRequest(false);
            setError('Invalid email was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Valdate the dealer.email
        if(userInfo.username === undefined || userInfo.username === null ) {
            setValidRequest(false);
            setError('Invalid username was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }
        setUser(userInfo);


        // Get the customer object
        const customerRequest = decodedRequest.customer;
        const customerInfo: IIntegrationCustomer = {
            exists: false,
            id: customerRequest.id,
            name: customerRequest.name,
            subscribed: false
        };

        // Validate the customer.id 
        if( customerInfo.id === undefined || customerInfo.id === null) {
            setValidRequest(false);
            setError('Invalid customer id was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Validate the customer.name
        if( customerInfo.name === undefined || customerInfo.name === null ) {
            setValidRequest(false);
            setError('Invalid customer name was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Set the customer info
        setCustomer(customerInfo);

        // Get the system object
        const systemRequest = decodedRequest.system;
        const systemInfo: IIntegrationSystem = {
            exists: false,
            id: systemRequest.id,
            name: systemRequest.name,
            retention_days: systemRequest.retention_days,
            subscribed: false
        }

        // Validate the system.id        
        if( systemInfo.id === undefined || systemInfo.id === null) {
            setValidRequest(false);
            setError('Invalid system id was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Validate the system.name
        if( systemInfo.name === undefined || systemInfo.name === null ) {
            setValidRequest(false);
            setError('Invalid system name was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Set the system info
        setSystem(system);

        // Get the panel object
        const panelRequest = decodedRequest.panel;
        const panelInfo: IIntegrationPanel = {
            exists: false,
            id: panelRequest.id,
            type: panelRequest.type,
            mac_address: panelRequest.mac_address,
            ip_address: panelRequest.ip_address,
            serial_number: panelRequest.serial_number ?? '',
            subscribed: false
        };

        // Validate the panel.id        
        if( panelInfo.id === undefined || panelInfo.id === null) {
            setValidRequest(false);
            setError('Invalid panel id was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Validate the panel.type
        if( panelInfo.type === undefined || panelInfo.type === null) {
            setValidRequest(false);
            setError('Invalid panel type was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Validate the panel.macAddress        
        if( panelInfo.mac_address === undefined || panelInfo.mac_address === null) {
            setValidRequest(false);
            setError('Invalid mac address was supplied.');
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }

        // Set the panel info
        setPanel(panelInfo);

        const request: IIntegrationsSubscriptionStatusRequest = {
            integration_token: decodedRequest.integration_token ?? '',
            dealer_id: dealerInfo.id,
            dealer_name: dealerInfo.name,
            email: userInfo.email,
            username: userInfo.username,
            customer_id: customerInfo.id,
            customer_name: customerInfo.name,
            system_id: systemInfo.id,
            system_name: systemInfo.name,
            retention_days: systemInfo?.retention_days,
            device_id: panelInfo.id,
            device_type: panelInfo.type,
            device_mac_address: panelInfo.mac_address,
            device_ip_address: panelInfo?.ip_address ?? '',
            device_serial_number: panelInfo?.serial_number ?? ''
        }

        checkSubscriptionStatus( request );
    }

    const checkSubscriptionStatus = async(request: IIntegrationsSubscriptionStatusRequest) => {
        try {
            const route = IntegrationsSubscriptionStatusRoute();
            const results: IIntegrationSubscriptionStatusResponse = await route.check(request);
            if( results.success ) {
                const data = results.data;
                setDealer(data?.dealer);
                setUser(data?.user);
                setCustomer(data?.customer);
                setSystem(data?.system);
                setPanel(data?.panel);

                if( action === 'subscribe' && data?.dealer.subscribed && data?.customer.subscribed && data?.system.subscribed && data?.panel.subscribed ) {
                    setAlarmVisionState(AlarmVisionStates.Subscribed);
                    return;
                }
                
                if( action === 'subscribe' ) {
                    setAlarmVisionState(AlarmVisionStates.Subscribe);
                    return;
                }

                if( action === 'unsubscribe' ) {
                    setAlarmVisionState(AlarmVisionStates.Unsubscribe);
                    return;
                }

                setError(`The action "${action}" supplied was invalid`);
                setAlarmVisionState(AlarmVisionStates.Error);

            } else {
                setValidRequest(false)
                setError(results.details?.description);
                setAlarmVisionState(AlarmVisionStates.Error);
            }
        } catch (error: any) {
            setValidRequest(false)
            setError(error.details?.description);
            setAlarmVisionState(AlarmVisionStates.Error);
        }
    }
    
    const validateDMPUser = async( request: ISCAPILoginRequest ) => {
        try {
            const route = SCAPIRoute();
            const results = (await route.login(request)) as ISCAPILoginResponse;
            if( results.success ) {
                if( results.access_token && results.refresh_token) {
                    setAccessToken(results.access_token);
                    setRefreshToken(results.refresh_token);
                    setDmpUserVerified(true);
                    return;
                }
            }

            setDmpUserVerifyError(results?.details?.description ?? 'The user/password was invalid')

        } catch (error: any) {
            setValidRequest(false)
            setError(error.details?.description);
            setAlarmVisionState(AlarmVisionStates.Error);
        }
    }

    const subscribeDealer = async (request: IDealerSubscribeRequest) => {
        try {
            const route = IntegrationsDealerSubscribeRoute();
            const results: IDealerSubscribedResponse = await route.subscribe(request);
            if(results.success) {
                
                const { data } = results;
                const dealer = data?.dealer;
                const user = data?.user;
                const customer = data?.dealer;
                const system = data?.system;
                const panel = data?.panel;
                
                if( user) setUser( user );
                if( dealer ) setDealer( dealer );
                if( customer ) setCustomer( customer );
                if( system ) setSystem( system );
                if( panel ) setPanel( panel );

                setTransactionId(results?.transaction_id ?? '');
                setAlarmVisionState(AlarmVisionStates.Subscribed)

            } else {
                setError(results.details?.description ?? 'Error');
                setAlarmVisionState(AlarmVisionStates.Error)
            }

        } catch (error: any) {
            setError(error);            
            setAlarmVisionState(AlarmVisionStates.Error)
        }
    };

    const unsubscribeDealer = async (request: IDealerUnsubscribeRequest) => {
        try {
            const route = IntegrationsDealerUnsubscribeRoute();
            const results: IDealerUnsubscribedResponse = await route.unsubscribe(request);
            if( results.success ) {
                setTransactionId(results?.transaction_id ?? '');
                setAlarmVisionState( AlarmVisionStates.Unsubscribed );
            } else {
                setTransactionId(results?.transaction_id ?? '');
                setError(results.details?.description);
                setAlarmVisionState( AlarmVisionStates.Error );
            }
        } catch (error: any) {
            setError(JSON.stringify(error));            
            setAlarmVisionState( AlarmVisionStates.Error );
        }
    };

    const onUnsubscribe = () => {
        navigate(`/alarmvision?action=unsubscribe&request=${request}`)
    }

    const onForgotPassword = () => {
        navigate(`/password-reset-request?email=${user?.email}`);
    }

    const onLogin = () => {

        if( user?.email ) {
            const auth: IAuthRequest = {
                email: user?.email,
                password: user?.password ?? ''
            }
            const authRequestString = JSON.stringify(auth);
            const encodedString = btoa(authRequestString);
            navigate(`/?auth=${encodedString}`);
            return;
        }
        navigate('/');
    }

    const onDownload = () => {
        const downloadItems:Array<string> = [];
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        // Build the download subscription
        downloadItems.push(`Subscribed: ${year}-${month}-${day} ${hours}:${minutes}`)
        downloadItems.push(`Dealer: ${dealer?.name}`)
        downloadItems.push(`Customer: ${customer?.name}`)
        downloadItems.push(`System: ${system?.name}`)
        downloadItems.push(`Display Name: ${user?.username}`)
        downloadItems.push(`E-Mail: ${user?.email}`)
        downloadItems.push(`Panel MAC Address: ${panel?.mac_address}`)
        if(panel?.serial_number) {
            downloadItems.push(`Panel Serial #: ${panel?.ip_address}`)
        }
        downloadItems.push(`Transaction #: ${transactionId}`);
        
        // Save the file
        const textContent = downloadItems.join("\n");
        const blob = new Blob([textContent], {type: "text/plain"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `subscribe_dealer_${transactionId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }   


    const onBeforeBack = (stepFrom: number, stepTo: Number) => {
        if(stepFrom === WizardSteps.EULA ) {
            setAcceptedEULA(false);
            setReadEULA(false);
        }

        if( stepFrom === WizardSteps.LinkDMPAccount ) {
            setAccessToken(null);
            setRefreshToken(null);
            setDmpUserVerified(false);
        }
    }

    const onValidateDmpUser = () => {
        const request: ISCAPILoginRequest = {
            username: dmpUsername,
            password: dmpPassword
        };
        validateDMPUser( request );
    }

    const onCleareDmpUserError = () => {
        setDmpUserVerifyError(null);
    }

    const onHandleInsitesPasswordChange = ( passed: boolean, password: string ) => {
        setInsitesPasswordReady( passed );
        setInsitesPassword( password );
    }

    const onDmpUsernameChange = ( e: IFormInputElement ) => {
        setDmpUsername( e?.value ?? '');
        setDmpUserVerified(false);
        setDmpUserVerifyError(null);
    }
    const onHandleDmpPasswordChange = ( passed: boolean, password: string ) => {
        setDMPPasswordReady( passed );
        setDMPPassword( password );
        setDmpUserVerified(false);
        setDmpUserVerifyError(null);
    }

    const onCompleteSubscribe = () => {

        setAcceptedEULA(true);
        setLoadingText('Subscribing Panel');
        setAlarmVisionState( AlarmVisionStates.Loading );
       
        const request: IDealerSubscribeRequest = {
            integration_token: integrationToken ?? '',
            dealer_id: dealer?.id,
            dealer_name: dealer?.name,
            email: user?.email,
            username: user?.username,
            password: insitesPassword ?? '',
            access_token: accessToken ?? '',
            refresh_token: refreshToken ?? '',
            customer_id: customer?.id,
            customer_name: customer?.name,
            system_id: system?.id,
            system_name: system?.name,
            retention_days: system?.retention_days ?? DEFAULT_RETENTION_DAYS,
            panel_id: panel?.id,
            panel_type: panel?.type,
            panel_ip_address: panel?.ip_address,
            panel_mac_address: panel?.mac_address,
            panel_serial_number: panel?.serial_number ?? '',
            accepted_eula: true
        }

        subscribeDealer( request );
    }

    const onCompleteUnsubscribe = () => {
        setLoadingText('Unsubscribing Panel');
        setAlarmVisionState( AlarmVisionStates.Loading );
        const unsubscribeRequest: IDealerUnsubscribeRequest = {
            integration_token: integrationToken ?? '',
            dealer_id: dealer?.id ?? 0,
            customer_id: customer?.id ?? 0,
            system_id: system?.id ?? 0,
            access_token: accessToken,
            refresh_token: refreshToken
        };
        unsubscribeDealer( unsubscribeRequest );
    }

    useEffect(() => {
        // Validate the action in query string is valid
        if( action !== undefined  && action !== null  ) {
            if(!ValidActions.includes( action )) {
                setValidAction(false);
                setError('Invalid action was supplied.')
                setAlarmVisionState(AlarmVisionStates.Error);
                return;
            }
        }  else {
            setValidAction(false);
            setError('Invalid action was supplied.')
            setAlarmVisionState(AlarmVisionStates.Error);
            return;
        }
        setValidAction( true);

        if( request !== undefined || request !== null ) {
            let decodedRequest: any;
            try {
                decodedRequest = JSON.parse(atob(request ?? ''));
            } catch(e) {
                setValidRequest(false);
                setError('Invalid request was supplied.')
                setAlarmVisionState(AlarmVisionStates.Error);
                return;
            }

            validateRequest( decodedRequest );

        } else {
            setValidAction(false);
            setError('Invalid request was supplied.')
            setAlarmVisionState(AlarmVisionStates.Error);
        }
        

    }, [action, request])

    useEffect(() => {
        if(user) {
            if(user?.accepted_eula ?? false) {
                setAcceptedEULA(true);
                return;
            }
            setAcceptedEULA(false);
            if(user?.email) {
                setDmpUsername(user.email);
            }
            if(user?.exists) {
                setInsitesPasswordReady(true);
            }
        }
    }, [user]);

    useEffect(() => {
        if( action === 'unsubscribe' ) {
            setAlarmVisionState(AlarmVisionStates.Unsubscribe);
        }

    }, [dealer, customer, system, panel])


    if( alarmVisionState === AlarmVisionStates.Subscribe ) {
        return (
            <WizardPanel onComplete={onCompleteSubscribe} onBeforeBack={onBeforeBack}>
                <WizardStep step={WizardSteps.SubscribePanel} title="Step 1 of 2 - Subscribe Panel" nextButtonText="Accept" isStepComplete={insitesPasswordReady}>
                    <div className="alarm-vision-form">
                        <div className="form-label">
                            <label>System</label>
                            <span>{system?.name}</span>
                        </div>
                        <div className="form-label">
                            <label>Panel MAC Address</label>
                            <span>{panel?.mac_address ?? '<not set>'}</span>
                        </div>     
                        {panel?.ip_address && (
                            <div className="form-label">
                                <label>Panel IP Address</label>
                                <span>{panel?.ip_address ?? '<not set>'}</span>
                            </div>     
                        )}                       
                        {panel?.serial_number && (
                            <div className="form-label">
                                <label>Panel Serial Number</label>
                                <span>{panel?.serial_number}</span>
                            </div>                                 
                        )}
                        {!user?.exists && (
                            <div className="form-label">
                                <label>Insites Username</label>
                                <span>{user?.email}</span>
                            </div>                                 
                        )}
                    </div>
                    <div className="alarm-vision-form">
                        <span className="section-title">
                            {`Enter password for ${user?.exists === true ? 'existing' : 'new'} Evolon Insites user`}
                        </span>
                        {user?.exists && (
                            <PasswordConfirm
                                passwordValue={insitesPassword} 
                                confirmValue={insitesPassword}
                                passwordLabelText="Insites Password"
                                confirmLabelText="Insites Password Confirm"
                                onChanged={onHandleInsitesPasswordChange}
                            />

                        )}
                        {!user?.exists && (
                            <PasswordConfirm
                                passwordValue={insitesPassword} 
                                confirmValue={insitesPassword}
                                passwordLabelText="Insites Password"
                                confirmLabelText="Insites Password Confirm"
                                rules={[
                                    {label: "At Least One Lower Case", expression: atLeastOneLowerCaseRegex},
                                    {label: "At Least One Upper Case", expression: atLeastOneUpperCaseRegex},
                                    {label: "At Least One Digit", expression: atLeastOneDigitRegex},
                                    {label: "At Least One Special Character", expression: atLeastOneSpecialCharRegex},
                                    {label: "Minimum 8 Characters", expression: minimumEightCharRegex}
                                ]}
                                onChanged={onHandleInsitesPasswordChange}
                            />
                        )}
                    </div>
                </WizardStep>
                <WizardStep step={WizardSteps.LinkDMPAccount} title="Step 2 of 2 - Link DMP Account" nextButtonText="Link" isStepComplete={dmpPasswordReady && dmpUserVerified}>
                    <div className="alarm-vision-form">
                        <span className="section-title">
                            {`Enter password to link your DMP user account`}
                        </span>
                        <FormInput id="dmp-username" columnMap="dmp-username" label="DMP Username" value={dmpUsername} onChange={onDmpUsernameChange}/>
                        <PasswordConfirm
                            passwordValue={dmpPassword}
                            confirmValue={dmpPassword} 
                            passwordLabelText="DMP Password"
                            confirmLabelText="DMP Password Confirm"
                            onChanged={onHandleDmpPasswordChange}
                        />

                        {dmpPasswordReady && !dmpUserVerified && !dmpUserVerifyError && (
                            <Button label="Validate" className="btn primary fade-in" onClick={onValidateDmpUser} />
                        )}
                        {dmpPasswordReady && !dmpUserVerified && dmpUserVerifyError && (
                            <>
                                <span className="error">{dmpUserVerifyError}</span>
                                <Button label="Clear" className="btn danger fade-in" onClick={onCleareDmpUserError} />
                            </>
                        )}
                        {dmpPasswordReady && dmpUserVerified  && (
                            <div className="alarm-vision-form">
                                <span className="form-check fade-in">
                                    <span className="form-check-icon">
                                        <FaCheck />
                                    </span>
                                    <span className="form-check-label">
                                        Verified DMP User Credentials
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>
                </WizardStep>
            </WizardPanel>
        )
    }

    if( alarmVisionState === AlarmVisionStates.Subscribed ) {
        return (
            <div className="alarm-vision">
                <div className="alarm-vision-dialog slide-down">
                    <div className="alarm-vision-header">
                        AlarmVision Subscribed
                    </div>
                    <div className="alarm-vision-body">
                        <div className="alarm-vision-form">
                                <div className="form-label">
                                    <label>System</label>
                                    <span>{system?.name}</span>
                                </div>
                                <div className="form-label">
                                    <label>Panel MAC Address</label>
                                    <span>{panel?.mac_address ?? '<not set>'}</span>
                                </div>     
                                {panel?.ip_address && (
                                    <div className="form-label">
                                        <label>Panel IP Address</label>
                                        <span>{panel?.ip_address ?? '<not set>'}</span>
                                    </div>     
                                )}                       
                                {panel?.serial_number && (
                                    <div className="form-label">
                                        <label>Panel Serial Number</label>
                                        <span>{panel?.serial_number}</span>
                                    </div>                                 
                                )}
                        </div>
                        <div className="alarm-vision-form">
                            <div className="form-check">
                                <span className="form-check-icon">
                                    <FaCheck />
                                </span>
                                <span className="form-check-label">
                                    Successfully subscribed the system
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="alarm-vision-footer">
                        <Button className="btn danger" label="Unsubscribe" onClick={onUnsubscribe} />                            
                        <Button className="btn danger" label="Forgot Password" onClick={onForgotPassword} />
                        <Button className="btn primary" label="Login" onClick={onLogin} />                            
                    </div>
                </div>
            </div>                                
        );
    }

    if( alarmVisionState === AlarmVisionStates.Unsubscribe ) {
        if( dealer?.is_access_token_expired ) {
            return (
                <WizardPanel onComplete={onCompleteUnsubscribe} onBeforeBack={onBeforeBack}>
                    <WizardStep step={UnsubscribeSteps.UnsubscribePanel} title="Step 1 of 2 - AlarmVision Unsubscribe Panel" nextButtonText="Accept" isStepComplete={true}>
                        <div className="alarm-vision-form">
                            <div className="form-label">
                                <label>System</label>
                                <span>{system?.name}</span>
                            </div>
                            <div className="form-label">
                                <label>Panel MAC Address</label>
                                <span>{panel?.mac_address ?? '<not set>'}</span>
                            </div>     
                            {panel?.ip_address && (
                                <div className="form-label">
                                    <label>Panel IP Address</label>
                                    <span>{panel?.ip_address ?? '<not set>'}</span>
                                </div>     
                            )}                       
                            {panel?.serial_number && (
                                <div className="form-label">
                                    <label>Panel Serial Number</label>
                                    <span>{panel?.serial_number}</span>
                                </div>                                 
                            )}
                        </div>
                    </WizardStep>    
                    <WizardStep step={UnsubscribeSteps.LinkDMPAccount} title="Step 2 of 2 - DMP Authorized User" nextButtonText="Save" isStepComplete={dmpPasswordReady}>
                        <div className="alarm-vision-form">
                            <span className="section-title">
                                {`Enter password to link your DMP user account`}
                            </span>
                            <FormInput id="dmp-username" columnMap="dmp-username" label="DMP Username" value={dmpUsername} onChange={onDmpUsernameChange}/>
                            <PasswordConfirm
                                passwordValue={dmpPassword}
                                confirmValue={dmpPassword} 
                                passwordLabelText="DMP Password"
                                confirmLabelText="DMP Password Confirm"
                                onChanged={onHandleDmpPasswordChange}
                            />

                            {dmpPasswordReady && !dmpUserVerified && !dmpUserVerifyError && (
                                <Button label="Validate" className="btn primary fade-in" onClick={onValidateDmpUser} />
                            )}
                            {dmpPasswordReady && !dmpUserVerified && dmpUserVerifyError && (
                                <>
                                    <span className="error">{dmpUserVerifyError}</span>
                                    <Button label="Clear" className="btn danger fade-in" onClick={onCleareDmpUserError} />
                                </>
                            )}
                            {dmpPasswordReady && dmpUserVerified  && (
                                <div className="alarm-vision-form">
                                    <span className="form-check fade-in">
                                        <span className="form-check-icon">
                                            <FaCheck />
                                        </span>
                                        <span className="form-check-label">
                                            Verified DMP User Credentials
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </WizardStep>    
                </WizardPanel>
            );
        } else {
            return (
                <WizardPanel onComplete={onCompleteUnsubscribe} onBeforeBack={onBeforeBack}>
                    <WizardStep step={UnsubscribeSteps.UnsubscribePanel} title="Step 1 of 1 - AlarmVision Unsubscribe Panel" nextButtonText="Accept" isStepComplete={true}>
                        <div className="alarm-vision-form">
                            <div className="form-label">
                                <label>System</label>
                                <span>{system?.name}</span>
                            </div>
                            <div className="form-label">
                                <label>Panel MAC Address</label>
                                <span>{panel?.mac_address ?? '<not set>'}</span>
                            </div>     
                            {panel?.ip_address && (
                                <div className="form-label">
                                    <label>Panel IP Address</label>
                                    <span>{panel?.ip_address ?? '<not set>'}</span>
                                </div>     
                            )}                       
                            {panel?.serial_number && (
                                <div className="form-label">
                                    <label>Panel Serial Number</label>
                                    <span>{panel?.serial_number}</span>
                                </div>                                 
                            )}
                        </div>
                    </WizardStep>
                </WizardPanel>
            );
        }
    }

    if( alarmVisionState === AlarmVisionStates.Unsubscribed) {
        return (
            <div className="alarm-vision">
                <div className="alarm-vision-dialog slide-down">
                    <div className="alarm-vision-header">
                        AlarmVision Unsubscribed
                    </div>
                    <div className="alarm-vision-body">
                        <div className="alarm-vision-form">
                                <div className="form-label">
                                    <label>System</label>
                                    <span>{system?.name}</span>
                                </div>
                                <div className="form-label">
                                    <label>Panel MAC Address</label>
                                    <span>{panel?.mac_address ?? '<not set>'}</span>
                                </div>     
                                {panel?.ip_address && (
                                    <div className="form-label">
                                        <label>Panel IP Address</label>
                                        <span>{panel?.ip_address ?? '<not set>'}</span>
                                    </div>     
                                )}                       
                                {panel?.serial_number && (
                                    <div className="form-label">
                                        <label>Panel Serial Number</label>
                                        <span>{panel?.serial_number}</span>
                                    </div>                                 
                                )}
                        </div>
                        <div className="alarm-vision-form">
                            <div className="form-check">
                                <span className="form-check-icon">
                                    <FaCheck />
                                </span>
                                <span className="form-check-label">
                                    Successfully unsubscribed the system
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="alarm-vision-footer">
                        <Button className="btn danger" label="Forgot Password" onClick={onForgotPassword} />
                        <Button className="btn primary" label="Login" onClick={onLogin} />                            
                    </div>
                </div>
            </div>                                
        );
    }

    if( alarmVisionState === AlarmVisionStates.Error ) {
        return (
            <div className="alarm-vision">
                <div className="alarm-vision-dialog">
                    <div className="alarm-vision-header">
                        Error Subscribing
                    </div>
                    <div className="alarm-vision-body">
                        <div className="error">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    return <LoadingModal modalText={loadingText} />
}

export default AlarmVision;
