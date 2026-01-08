// React
import { useState, useContext, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthProvider';

// Custom
import handleHttpRequestError from '../../../../utils/handleHttpRequestError';

// API Calls
import getAVPanelInfo from '../../../../api_calls/getAVPanelInfo';
import SCAPIRoute, { ISCAPILoginRequest, ISCAPILoginResponse } from '../../../../api_calls/SCAPI';
import AlarmVisionPanelRoute, { IAVPanelSyncRequest, IAVPanelSyncResponse } from '../../../../api_calls/AlarmVisionPanel';
import IntegrationsSystemRoute, { ISystemAccessRequest, ISystemAccessResponse } from '../../../../api_calls/IntegrationsSystem'

// Third Party 
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Enums
import { AccountTypeModifier } from '../../../../types/enums';

// Types
import { IUser } from '../../../../types/interfaces';
import { AlarmVisionUserAccess, AlarmVisionUserInfo, DefaultAlarmVisionUserAccess, DefaultAlarmVisionUserInfo } from './types';

export const useDMPPanelController = () => {
    const params = useParams();
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [userAccess, setUserAccess] = useState<AlarmVisionUserAccess>(DefaultAlarmVisionUserAccess);
    const [userInfo, setUserInfo] = useState<AlarmVisionUserInfo>(DefaultAlarmVisionUserInfo)
    const [showLogin, setShowLogin] = useState<boolean>(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    


    const readOnlyUser = useMemo(() => {
        return (
            activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly) ||
            false
        );
    }, [activeUser]);

    // React Query.
    const { data, refetch } = useQuery({
        queryFn: () =>
            getAVPanelInfo({
                user: activeUser as IUser,
                camera_id: params.id as string,
            }),
        cacheTime: 30_000,
        staleTime: 30_000,
        enabled: !!activeUser && !!params.id,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        queryKey: ['camera_id', params.id],
    });
    const panelInfo = data?.panel;

    const getSystemAccess = async ( request: ISystemAccessRequest ) => {
        try {
            if(activeUser) {
                const route = IntegrationsSystemRoute( activeUser );
                const { success, is_jwt_expired, access_token, refresh_token } = (await route.access(request)) as ISystemAccessResponse;
                if( success ) {
                    const updatedUserAccess: AlarmVisionUserAccess = {
                        is_jwt_expired,
                        access_token,
                        refresh_token,
                        validated: !is_jwt_expired 
                    }
                    setUserAccess( updatedUserAccess );
                    return;
                }
                setUserAccess( DefaultAlarmVisionUserAccess ); 
            }
        } catch (e: any ) {
            toast.error(e?.details?.description ?? 'Unhandled Error');
        }
    }

    const checkSystemAccess = async () => {
        if( panelInfo?.system_id ) {
            const request: ISystemAccessRequest = {
                system_id: panelInfo?.system_id
            }
            await getSystemAccess( request );
        }
    }

    useEffect(() => {
        if( activeUser?.email ) {
            const updatedUserInfo: AlarmVisionUserInfo = {
                ...userInfo,
                user_id: activeUser.email
            }
            setUserInfo(updatedUserInfo)
        }        
    }, [activeUser])

    useEffect(()  => {
        checkSystemAccess()
    }, [panelInfo])


    const validateDMPUser = async( request: ISCAPILoginRequest ) => {
        try {
            const route = SCAPIRoute();
            const results = (await route.login(request)) as ISCAPILoginResponse;
            if( results.success ) {
                const updatedUserAccess: AlarmVisionUserAccess = {
                    is_jwt_expired: false,
                    access_token: results.access_token,
                    refresh_token: results.refresh_token,
                    validated: true
                }
                setUserAccess(updatedUserAccess);
            } else {
                setUserAccess(DefaultAlarmVisionUserAccess);                
                toast.error(`Failed to validate ${userInfo.user_id} user`);
            }
        } catch (error: any) {
            toast.error(error.details?.description);
        }
    }


    const retrieveFromPanel = async () => {
        try {
            if( activeUser ) {
                if( panelInfo ) {
                    const route = AlarmVisionPanelRoute( activeUser );
                    const request: IAVPanelSyncRequest = {
                        system_id: Number(panelInfo?.system_id),
                        mac_address: panelInfo?.mac_address,
                        serial_number: panelInfo?.serial_number,
                        access_token: userAccess?.access_token,
                        refresh_token: userAccess?.refresh_token
                    }
                    const results = await (route.sync( request )) as IAVPanelSyncResponse;
                    await refetch();
                    return results;
                } else {
                    toast.error('Panel Information was not available');
                }
            } else {
                toast.error('User is not authorized');
            }
        } catch( e: any) {
            toast.error(e?.details?.description ?? 'Unhandled Error');
        }
    }
   

    const updateUserId = ( userId: string ) => {
        const updatedUserInfo: AlarmVisionUserInfo = {
            ...userInfo,
            user_id: userId
        }
        setUserInfo(updatedUserInfo);
    }

    const updateUserPassword = ( matched: boolean, password: string ) => {
        const updatedUserInfo: AlarmVisionUserInfo = {
            ...userInfo,
            password: password ?? '',
            validated: matched
        }
        setUserInfo(updatedUserInfo);
    }

    const validateUser = () => {
        const request: ISCAPILoginRequest = {
            username: userInfo.user_id, 
            password: userInfo.password
        }
        validateDMPUser( request );   
    }

    const clearLogin = () => {
        setShowLogin(false);
        setUserInfo(DefaultAlarmVisionUserInfo);
    }

    return {
        isLoading,
        setIsLoading,
        params,
        navigate,
        activeUser,
        setActiveUser,
        readOnlyUser,
        panelInfo,
        userAccess,
        setUserAccess,
        userInfo,
        updateUserId,
        updateUserPassword,
        validateUser,
        showLogin,
        setShowLogin,
        clearLogin,
        showAlertModal,
        setShowAlertModal,
        checkSystemAccess,
        validateDMPUser,
        retrieveFromPanel
    }
};
