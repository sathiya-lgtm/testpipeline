// React
import { ReactElement, FC, useContext, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';

// Custom
import getAccountType from '../../utils/getAccountType';

// Contexts
import { AuthContext } from '../../contexts/AuthProvider';

// Controller
import { UtilitiesMenuItem } from './Utilities.controller';

// Components
import UtilitiesMenu from './Menu/Menu';
import CreateServiceProvider from './Forms/CreateServiceProvider';
import CreateCustomer from './Forms/CreateCustomer';
import CreateSite from './Forms/CreateSite';
import RegisterDevice from './Forms/RegisterDevice';
import NetworkDevices from './Forms/NetworkDevices';
import CameraActions from './Forms/CameraActions';
import DataRetentionPolicy from './Forms/DataRetentionPolicy';
import MultiModalModel from './Forms/NaturalLanguageSearch';
import CreateSMTPCamera from './Forms/CreateSMTPCamera';
import BulkSMTPCreate from './Forms/BulkSMTPCreate';
import BulkImmixCreate from './Forms/BulkImmixCreate';
import CreateNVRSite from './Forms/CreateNVRSite';
import CameraConfigReport from './Forms/CameraConfigReport';
import CameraPerformanceReport from './Forms/CameraPerformanceReport';
import CameraAlertReport from './Forms/CameraAlertReport';
import SPAuditReport from './Forms/SPAuditReport';
import ProMonitoringReport from './Forms/ProMonitoringReport';
import ScheduleAuditReport from './Forms/ScheduleAuditReport';
import UserManagement from './Forms/UserManagement';
import DispatchServiceConfiguration from './Forms/DispatchServiceConfiguration';
import Subscriptions from './Forms/Subscriptions';
import Scheduling from './Forms/Scheduling';
import NetworkDeviceTypes from './Forms/NetworkDeviceTypes';
import NetworkDeviceActionsAvailable from './Forms/NetworkDeviceActionsAvailable';
import BridgeControls from './Forms/BridgeControls';
import TestClips from './Forms/TestClips';

// Custom types
import { AccountType } from '../../types/enums';

// Styles
import '../../styles/views/Utilities.scss';
import AIClassificationErrorReport from './Forms/AIClassificationErrorReport';
import DealerChecklist from './Forms/DealerChecklist';

/**
 * Displays Utility page(s) wherein user can perform various operations depending on their
 * account type (e.g. creating Service Provider, Customer, and/or User).
 * @returns {ReactElement} Registration Code view.
 */
const Utilities: FC = (): ReactElement => {
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const location = useLocation();

    const accountType: AccountType = useMemo(
        () => getAccountType(activeUser),
        [activeUser]
    );

    const defaultMenuItem: UtilitiesMenuItem = useMemo(() => {
        if (location.search.includes('?menu=register')) {
            return UtilitiesMenuItem.RegisterDevice;
        }

        if (location.search === '?menu=create-site') {
            return UtilitiesMenuItem.CreateSite;
        }

        switch (accountType) {
            case AccountType.Evolon:
                // return UtilitiesMenuItem.CreateServiceProvider;
                return UtilitiesMenuItem.DealerChecklist;
            case AccountType.ServiceProvider:
                // return UtilitiesMenuItem.CreateCustomer;
                return UtilitiesMenuItem.DealerChecklist;
            default:
                return UtilitiesMenuItem.CreateSite;
        }
    }, [activeUser, location]);

    /** Default Service Provider option if active user is Service Provider and necessary data is available. */
    const defaultServiceProvider = useMemo(() => {
        if (
            accountType === AccountType.ServiceProvider &&
            activeUser?.account_name &&
            activeUser?.service_provider_account
        )
            return {
                label: activeUser.account_name,
                value: String(activeUser.service_provider_account),
            };

        return null;
    }, [activeUser]);

    /** Default Customer option if active user is Customer and necessary data is available. */
    const defaultCustomer = useMemo(() => {
        if (
            accountType === AccountType.Customer &&
            activeUser?.account_name &&
            activeUser?.client_account
        )
            return {
                label: activeUser.account_name,
                value: String(activeUser.client_account),
            };

        return null;
    }, [activeUser]);

    const [selectedMenuItem, setSelectedMenuItem] =
        useState<UtilitiesMenuItem>(defaultMenuItem);

    // TODO lift reused React Queries and dropdown option from children into this component.
    return (
        <motion.div
            id="Utilities"
            key="Utilities"
            className="Utilities"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            {activeUser && (
                <div className="utilitiesContainer">
                    <UtilitiesMenu
                        activeUser={activeUser}
                        selectedMenuItem={selectedMenuItem}
                        setSelectedMenuItem={setSelectedMenuItem}
                    />
                    <div className="utilitiesFormWrapper">
                        {selectedMenuItem ===
                            UtilitiesMenuItem.DealerChecklist && (
                            <DealerChecklist
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.CreateServiceProvider && (
                            <CreateServiceProvider
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.CreateCustomer && (
                            <CreateCustomer
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                        {selectedMenuItem === UtilitiesMenuItem.CreateSite && (
                            <CreateSite
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.UserManagement && (
                            <UserManagement
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.RegisterDevice && (
                            <RegisterDevice
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.NetworkDevices && (
                            <NetworkDevices
                                activeUser={activeUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.CameraActions && (
                            <CameraActions
                                activeUser={activeUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.NaturalLanguageSearch && (
                            <MultiModalModel activeUser={activeUser} />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.DataRetentionPolicy && (
                            <DataRetentionPolicy
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.CreateSMTPCamera && (
                            <CreateSMTPCamera
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.BulkSMTPCameraCreate && (
                            <BulkSMTPCreate
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.BulkImmixCreate && (
                            <BulkImmixCreate
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.CreateNVRSite && (
                            <CreateNVRSite
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}

                        {selectedMenuItem ===
                            UtilitiesMenuItem.CameraConfigReport && (
                            <CameraConfigReport
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.CameraPerformanceReport && (
                            <CameraPerformanceReport
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.CameraAlertsReport && (
                            <CameraAlertReport
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.SPAuditReport && (
                            <SPAuditReport
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.AIClassificationErrorReport && (
                            <AIClassificationErrorReport
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.ProMonitoringReport && (
                            <ProMonitoringReport
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.ScheduleAuditReport && (
                            <ScheduleAuditReport
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.DispatchServiceConfiguration && (
                            <DispatchServiceConfiguration
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.Subscriptions && (
                            <Subscriptions
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                                defaultCustomer={defaultCustomer}
                            />
                        )}

                        {selectedMenuItem === UtilitiesMenuItem.Scheduling && (
                            <Scheduling
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultCustomer={defaultCustomer}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}

                        {selectedMenuItem ===
                            UtilitiesMenuItem.NetworkDeviceTypes && (
                            <NetworkDeviceTypes activeUser={activeUser} />
                        )}
                        {selectedMenuItem ===
                            UtilitiesMenuItem.NetworkDeviceActionsAvailable && (
                            <NetworkDeviceActionsAvailable
                                activeUser={activeUser}
                            />
                        )}

                        {selectedMenuItem ===
                            UtilitiesMenuItem.BridgeControls && (
                            <BridgeControls
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}

                        {selectedMenuItem === UtilitiesMenuItem.TestClips && (
                            <TestClips
                                activeUser={activeUser}
                                setActiveUser={setActiveUser}
                                accountType={accountType}
                                defaultServiceProvider={defaultServiceProvider}
                            />
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Utilities;
