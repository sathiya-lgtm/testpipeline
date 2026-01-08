/* eslint-disable jsx-a11y/control-has-associated-label */
// React
import { ReactElement, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

// Controller
import { setAlertMenuClassName } from '../Camera/Camera.controller';


// Third Party
import { toast } from 'react-toastify';

// Components
import LoadingModal from '../../../Modals/LoadingModal';
import AlertModal from '../../../Modals/AlertModal/AlertModal';

// Icons
import AlertIcon from '../../../../images/icons/EV_ENT_Alerts.7.6.22.svg?react';
import DMPIcon from '../../../../images/icons/dmpLogo.svg?react';

// Types
import { AlarmVisionUserAccess, AlarmVisionUserInfo, DefaultAlarmVisionUserAccess, DefaultAlarmVisionUserInfo } from './types';

// Styles
import '../../../../styles/components/Outlets/Home/Camera.scss';
import '../../../../styles/components/Slider.scss';
import Button from '../../../Button';
import ButtonGroup, { ButtonGroupAlignment } from '../../../ButtonGroup/ButtonGroup';
import PasswordConfirm from '../../../PasswordConfirm/PasswordConfirm';
import FormInput from '../../../Inputs/FormInput';
import { IFormInputElement } from '../../../Inputs/FormPasswordInput';

// Controller.ts
import { useDMPPanelController } from './controller';
import { IAVPanelSyncResponse } from '../../../../api_calls/AlarmVisionPanel';


const DMPPanel = (): ReactElement => {
    const ctx = useDMPPanelController();

    // We decided customers should not view this page
    if (ctx.activeUser && ctx.activeUser.account_type === 'cl') {
        return <Navigate to="/home" />;
    }

    const onRetrieveFromPanel = ( ) => {
        ctx.checkSystemAccess().then(() => {
            if( ctx.userAccess.is_jwt_expired ) {
                ctx.setShowLogin(true);
                return;
            } else {
                if( ctx.panelInfo ) {
                    ctx.retrieveFromPanel().then( response => {
                        const { success, changed, mac_address, serial_number } = (response) as IAVPanelSyncResponse;
                        if( success ) {
                            if( changed ) {
                                toast.success('Changes panel MAC address or serial number');
                                
                            } else {
                                toast.success('The panel is up-to-date no changes made.');
                            }
                        } else {
                            toast.error('Failed to retreive panel MAC address and serrial number');    
                        }
                        ctx.clearLogin()
                    }).catch( e => {
                        toast.error(e.details.description ?? 'Unhandled Error');
                        ctx.clearLogin()
                    });
                }
            }
        }).catch(e => {
            toast.error(e);            
        });
    }

    const onUserIdChanged = ( e: IFormInputElement ) => {
        ctx.updateUserId( e.value ?? '');
    }

    const onPasswordChanged = ( matched: boolean, password: string) => {
        ctx.updateUserPassword( matched, password );
    }

    const onCancelLogin = () => {
        ctx.clearLogin();
    } 

    const onValidateLogin = () => {
        ctx.validateUser();
    }

    return (
        <div className="cameraView">
            {ctx.isLoading && ctx.params?.id !== '0' && (
                <LoadingModal
                    modalText={
                        ctx.isLoading
                            ? 'Loading camera information...'
                            : 'Starting automatic playback...'
                    }
                    zIndex={96}
                />
            )}
            <section className="cameraOverviewSection">
                <figure>
                    <div className="panel-info-container">
                        <DMPIcon
                            height={50}
                            width={500}
                            style={{ margin: 10 }}
                        />
                    </div>
                    {ctx.panelInfo?.system_name && (
                        <h2 id="camera-name" className="camera-name">
                            {ctx.panelInfo?.system_name}
                        </h2>
                    )}
                    <div className="panel-info-container">
                        <div>
                            <div className="panel-info-item">
                                <p>
                                    <span className="label">Model </span>{' '}
                                    {ctx.panelInfo?.model}
                                </p>
                            </div>
                            <div className="panel-info-item">
                                <p>
                                    <span className="label">MAC Address:</span>{' '}
                                    {ctx.panelInfo?.mac_address}
                                </p>
                            </div>
                            <div className="panel-info-item">
                                <p>
                                    <span className="label">
                                        Serial Number:
                                    </span>{' '}
                                    {ctx.panelInfo?.serial_number}
                                </p>
                            </div>
                            <div className="panel-info-item">
                                <p>
                                    <span className="label">
                                        AlarmVision Status:
                                    </span>{' '}
                                    {ctx.panelInfo?.subscribed === true ? (
                                        <span>Subscribed</span>
                                    ) : (
                                        <span>Unsubscribed </span>
                                    )}
                                </p>
                            </div>
                            {ctx.showLogin && (
                                <div className="panel-info-authorize">
                                    <span className="panel-info-authorize-label">Please enter DMP authorized user</span>
                                    <FormInput id="dmp-user-id" columnMap="dmpUserId" label="DMP Username" value={ctx.userInfo.user_id} onChange={onUserIdChanged} />
                                    <PasswordConfirm passwordValue={ctx.userInfo.password} onChanged={onPasswordChanged} />    
                                    <ButtonGroup  alignment={ButtonGroupAlignment.middleright}>
                                        <Button className="btn danger" label="Cancel" onClick={onCancelLogin} />        
                                        <Button className="btn primary" label="Validate" onClick={onValidateLogin} visible={ctx.userInfo.validated && !ctx.userAccess.validated} />        
                                        <Button className="btn primary" label="Retrieve from Panel" onClick={onRetrieveFromPanel} visible={ctx.userInfo.validated && ctx.userAccess.validated} />
                                    </ButtonGroup>        
                                </div>
                            )}
                            {ctx.panelInfo?.subscribed && (
                                <ButtonGroup  alignment={ButtonGroupAlignment.middleright}>
                                    <Button className="btn primary" label="Retrieve from Panel" onClick={onRetrieveFromPanel} visible={!ctx.showLogin} />
                                </ButtonGroup>
                            )}
                        </div>
                    </div>
                </figure>
                <ul className="side-items">
                    <h2>Panel</h2>

                    <div className="settingsButtonContainer">
                        <div
                            className={setAlertMenuClassName(
                                ctx.panelInfo,
                                ctx.readOnlyUser
                            )}
                        >
                            <div>
                                <button
                                    type="button"
                                    className="btn primary fluid"
                                    onClick={() => ctx.setShowAlertModal(true)}
                                    disabled={ctx.readOnlyUser}
                                >
                                    <div className="iconButtonInner">
                                        <span>Create Alert</span>
                                        <AlertIcon className="buttonIcon" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </ul>
            </section>
            {ctx.showAlertModal && (
                <AlertModal
                    selectedAlert={null}
                    handleClose={() => ctx.setShowAlertModal(false)}
                />
            )}
        </div>
    );
};

export default DMPPanel;
