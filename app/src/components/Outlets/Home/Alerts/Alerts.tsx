// React
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';

// components
import AlertTable from '../../../Tables/AlertTable';
import AlertModal from '../../../Modals/AlertModal/AlertModal';
import DeleteAlertModal from '../../../Modals/AlertModal/DeleteAlertModal';
import NVRAlertsModal from '../../../Modals/AlertModal/NVRAlertsModal';
import LoadingModal from '../../../Modals/LoadingModal';
import Input from '../../../Inputs/Input';

// hooks
import { useAlerts } from '../../../../hooks';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';
import { ListTargetContext } from '../../../../contexts/ListTarget';

// types
import { IAlert } from '../../../../types/tng-api.interfaces';
import { IUser } from '../../../../types/interfaces';
import { AccountType, AccountTypeModifier } from '../../../../types/enums';

// utils
import handleHttpRequestError from '../../../../utils/handleHttpRequestError';

// styles
import '../../../../styles/components/Outlets/Home/Alerts.scss';
import getAccountType from '../../../../utils/getAccountType';

const convertAlertType = (alertType?: string) => {
    if (alertType === 'email') {
        return 'email';
    }

    if (alertType === 'immix') {
        return 'immix event';
    }

    if (alertType === 'device-io') {
        return 'immix input alarm';
    }

    return alertType;
};

const Alerts = () => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const { listTarget } = useContext(ListTargetContext);

    const [showAlertModal, setShowAlertModal] = useState(false);
    const [showNVRAlertsModal, setShowNVRAlertsModal] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<IAlert | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [alertTableData, setAlertTableData] = useState<IAlert[]>([]);
    const [alertSearch, setAlertSearch] = useState('');

    const { data, refetch, isLoading } = useAlerts({
        activeUser: activeUser as IUser,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const onEditClick = (alertData: IAlert) => {
        if (activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly)) {
            return;
        }

        setSelectedAlert(alertData);
        setShowAlertModal(true);
    };

    const onDeleteClick = (alertData: IAlert) => {
        if (activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly)) {
            return;
        }

        setSelectedAlert(alertData);
        setShowDeleteModal(true);
    };

    const handleAddAlertClick = () => {
        setSelectedAlert(null);
        setShowAlertModal(true);
    };

    const handleAddNVRAlertsClick = () => {
        setSelectedAlert(null);
        setShowNVRAlertsModal(true);
    };

    useEffect(() => {
        if (!data) return;

        let newAlertData: IAlert[] = [];
        if (!listTarget) {
            newAlertData = [...data];
        } else if (listTarget.type === 'camera') {
            newAlertData = data.filter(
                (alert) => alert.camera_id === listTarget.cameraId
            );
        } else if (listTarget.type === 'site') {
            newAlertData = data.filter(
                (alert) => alert.site_id === listTarget.siteId
            );
        } else if (listTarget.type === 'account') {
            newAlertData = data.filter(
                (alert) => alert.account_id === listTarget.customerId
            );
        } else if (listTarget.type === 'service-provider') {
            // Will Need to do this later
            newAlertData = [...data];
        }

        if (alertSearch) {
            newAlertData = data.filter((alert) => {
                const alertName = alert?.alert_name?.toLowerCase();
                const customer = alert?.account_name?.toLowerCase();
                const site = alert?.site_name?.toLowerCase();
                const camera = alert?.camera_name?.toLowerCase();
                const sendTo = alert?.alert_properties?.to_email?.toLowerCase();
                const alertType = convertAlertType(alert?.alert_type);
                const search = alertSearch.toLowerCase();
                if (getAccountType(activeUser) === AccountType.Evolon) {
                    const serviceProvider =
                        alert?.service_provider_name?.toLowerCase();
                    if (serviceProvider && serviceProvider.includes(search)) {
                        return true;
                    }
                }

                if (alertName && alertName.includes(search)) {
                    return true;
                }

                if (customer && customer.includes(search)) {
                    return true;
                }

                if (site && site.includes(search)) {
                    return true;
                }

                if (camera && camera.includes(search)) {
                    return true;
                }

                if (sendTo && sendTo.includes(search)) {
                    return true;
                }

                if (alertType && alertType.includes(search)) {
                    return true;
                }

                return false;
            });
        }

        setAlertTableData(newAlertData);
    }, [data, listTarget, alertSearch]);

    // We decided customers should not view this page
    if (activeUser && activeUser.account_type === 'cl') {
        return <Navigate to="/home" />;
    }
    /* {getAccountType(activeUser) === AccountType.Evolon && (
                        <li className="service-provider-toggle-container">
                            <p id="hide-service-provider">Show SP</p>
                            <Toggle
                                id="hide-service-provider"
                                value={apply_sharpening}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'apply_sharpening',
                                        !apply_sharpening
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                    )} */
    return (
        <div className="Alerts">
            <h1>Alert View</h1>
            <section className="alerts-section">
                <div className="alerts-section-actions">
                    <Input
                        className="input"
                        label="Search"
                        name="alertSearchInput"
                        id="alertSearchInput"
                        value={alertSearch}
                        onChange={setAlertSearch}
                        type="text"
                    />
                    <div className="alert-btns">
                        <button
                            className="btn primary"
                            type="button"
                            onClick={handleAddNVRAlertsClick}
                            disabled={activeUser?.modifier?.includes(
                                AccountTypeModifier.ReadOnly
                            )}
                        >
                            Create NVR Alerts
                        </button>
                        <button
                            className="btn primary"
                            type="button"
                            onClick={handleAddAlertClick}
                            disabled={activeUser?.modifier?.includes(
                                AccountTypeModifier.ReadOnly
                            )}
                        >
                            Create Alert
                        </button>
                    </div>
                </div>

                {data && (
                    <AlertTable
                        onEditClick={onEditClick}
                        data={alertTableData}
                        onDeleteClick={onDeleteClick}
                    />
                )}

                {showAlertModal && (
                    <AlertModal
                        handleClose={() => setShowAlertModal(false)}
                        selectedAlert={selectedAlert}
                        refetchAlerts={refetch}
                    />
                )}
                {showDeleteModal && (
                    <DeleteAlertModal
                        handleClose={() => setShowDeleteModal(false)}
                        selectedAlert={selectedAlert}
                        refetchAlerts={refetch}
                    />
                )}
                {showNVRAlertsModal && (
                    <NVRAlertsModal
                        handleClose={() => setShowNVRAlertsModal(false)}
                        refetchAlerts={refetch}
                    />
                )}
                {isLoading && (
                    <LoadingModal modalText="Getting Alert data" zIndex={96} />
                )}
            </section>
        </div>
    );
};

export default Alerts;
