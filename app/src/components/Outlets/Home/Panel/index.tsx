/* eslint-disable jsx-a11y/control-has-associated-label */
// React
import { ReactElement, useContext, useState, useMemo } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';

// Third party
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

// Custom
import handleHttpRequestError from '../../../../utils/handleHttpRequestError';

// API Calls
import getCameraData from '../../../../api_calls/getCameraData';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

// Controller
import { setAlertMenuClassName } from '../Camera/Camera.controller';

// Components

import LoadingModal from '../../../Modals/LoadingModal';
import AlertModal from '../../../Modals/AlertModal/AlertModal';

// Icons
import AlertIcon from '../../../../images/icons/EV_ENT_Alerts.7.6.22.svg?react';

// Types
import { IUser } from '../../../../types/interfaces';
import { AccountTypeModifier } from '../../../../types/enums';

// Styles
import '../../../../styles/components/Outlets/Home/Camera.scss';
import '../../../../styles/components/Slider.scss';

// TODO a lot of the logic in this component should be moved into a controller + add automated tests.
const Panel = (): ReactElement => {
    const params = useParams();
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const readOnlyUser = useMemo(() => {
        return (
            activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly) ||
            false
        );
    }, [activeUser]);

    // Alert Modal
    const [showAlertModal, setShowAlertModal] = useState(false);

    // React Query.
    const { data, isLoading } = useQuery({
        queryKey: ['camera-data', params.id],
        queryFn: () => getCameraData(activeUser as IUser, params.id as string),
        cacheTime: 30_000,
        staleTime: 30_000,
        enabled: true,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    // We decided customers should not view this page
    if (activeUser && activeUser.account_type === 'cl') {
        return <Navigate to="/home" />;
    }

    return (
        <div className="cameraView">
            {isLoading && params?.id !== '0' && (
                <LoadingModal
                    modalText={
                        isLoading
                            ? 'Loading camera information...'
                            : 'Starting automatic playback...'
                    }
                    zIndex={96}
                />
            )}
            <section className="cameraOverviewSection">
                <figure style={{ position: 'relative' }}>
                    {data?.camera_name && (
                        <h2 id="camera-name" className="camera-name">
                            {data?.camera_name}
                        </h2>
                    )}

                    <div className="panel-info-container">
                        <div>
                            <div className="panel-info-item">
                                <p>
                                    <span className="label">Email: </span>{' '}
                                    {data?.camera_properties?.email}
                                </p>
                                <button
                                    type="button"
                                    className="btn primary copyEmailBtn"
                                    data-toggle="tooltip"
                                    data-placement="bottom"
                                    title="Copy to clipboard"
                                    onClick={() => {
                                        if (!data) {
                                            return;
                                        }

                                        navigator.clipboard.writeText(
                                            data.camera_properties?.email || ''
                                        );
                                        toast.success('Email address copied!');
                                    }}
                                >
                                    <svg
                                        className="icon"
                                        xmlns="http://www.w3.org/2000/svg"
                                        xmlnsXlink="http://www.w3.org/1999/xlink"
                                        version="1.1"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="panel-info-item">
                                <p>
                                    <span className="label">Device ID:</span>{' '}
                                    {data?.camera_properties?.device_id}
                                </p>
                            </div>
                        </div>
                    </div>
                </figure>
                <ul className="side-items">
                    <h2>Panel</h2>

                    <div className="settingsButtonContainer">
                        <div
                            className={setAlertMenuClassName(
                                data,
                                readOnlyUser
                            )}
                        >
                            <div>
                                <button
                                    type="button"
                                    className="btn primary fluid"
                                    onClick={() => setShowAlertModal(true)}
                                    disabled={readOnlyUser}
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

            {showAlertModal && (
                <AlertModal
                    selectedAlert={null}
                    handleClose={() => setShowAlertModal(false)}
                />
            )}
        </div>
    );
};

export default Panel;
