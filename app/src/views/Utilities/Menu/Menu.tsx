/* eslint-disable jsx-a11y/label-has-associated-control */
/// <reference types="vite-plugin-svgr/client" />

// React
import React, { ReactElement, FC, Dispatch, SetStateAction } from 'react';

// Third party
import { motion } from 'framer-motion';
import { IUser } from '../../../types/interfaces';

// Custom
import getAccountType from '../../../utils/getAccountType';

// Custom types
import { AccountType } from '../../../types/enums';
import { UtilitiesMenuItem } from '../Utilities.controller';

// Images
import SettingsIcon from '../../../images/icons/EV.settings.svg?react';
import CameraIcon from '../../../images/icons/EV.cctv.svg?react';
import ReportsIcon from '../../../images/icons/reports.svg?react';

interface IProps {
    activeUser: IUser;
    selectedMenuItem: UtilitiesMenuItem;
    setSelectedMenuItem: Dispatch<SetStateAction<UtilitiesMenuItem>>;
}

/**
 * Component for rendering the page for entering registration code.
 * @returns {ReactElement} Registration Code view.
 */
const UtilitiesMenu: FC<IProps> = ({
    activeUser,
    selectedMenuItem,
    setSelectedMenuItem,
}: IProps): ReactElement => {
    const accountType: AccountType = getAccountType(activeUser);

    return (
        <motion.ul
            id="UtilitiesMenu"
            key="UtilitiesMenu"
            className="UtilitiesMenu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <h3>
                <span>
                    <SettingsIcon className="icon" />
                </span>
                Account Management
            </h3>
            {accountType !== AccountType.Customer && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(UtilitiesMenuItem.DealerChecklist)
                    }
                    className={`${
                        selectedMenuItem === UtilitiesMenuItem.DealerChecklist
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.DealerChecklist}
                </li>
            )}
            {accountType === AccountType.Evolon && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(
                            UtilitiesMenuItem.CreateServiceProvider
                        )
                    }
                    className={`${
                        selectedMenuItem ===
                        UtilitiesMenuItem.CreateServiceProvider
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.CreateServiceProvider}
                </li>
            )}
            {accountType !== AccountType.Customer && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(UtilitiesMenuItem.CreateCustomer)
                    }
                    className={`${
                        selectedMenuItem === UtilitiesMenuItem.CreateCustomer
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.CreateCustomer}
                </li>
            )}
            <li
                role="presentation"
                onClick={() =>
                    setSelectedMenuItem(UtilitiesMenuItem.CreateSite)
                }
                className={`${
                    selectedMenuItem === UtilitiesMenuItem.CreateSite
                        ? 'selected'
                        : ''
                }`}
            >
                {UtilitiesMenuItem.CreateSite}
            </li>
            <li
                role="presentation"
                onClick={() =>
                    setSelectedMenuItem(UtilitiesMenuItem.UserManagement)
                }
                data-testid="user-management-button"
                className={`${
                    selectedMenuItem === UtilitiesMenuItem.UserManagement
                        ? 'selected'
                        : ''
                }`}
            >
                {UtilitiesMenuItem.UserManagement}
            </li>
            {(accountType === AccountType.Evolon ||
                accountType === AccountType.ServiceProvider) && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(UtilitiesMenuItem.RegisterDevice)
                    }
                    className={`${
                        selectedMenuItem === UtilitiesMenuItem.RegisterDevice
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.RegisterDevice}
                </li>
            )}
            {(accountType === AccountType.Evolon ||
                accountType === AccountType.ServiceProvider) && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(UtilitiesMenuItem.NetworkDevices)
                    }
                    className={`${
                        selectedMenuItem === UtilitiesMenuItem.NetworkDevices
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.NetworkDevices}
                </li>
            )}
            {(accountType === AccountType.Evolon ||
                accountType === AccountType.ServiceProvider) && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(UtilitiesMenuItem.CameraActions)
                    }
                    className={`${
                        selectedMenuItem === UtilitiesMenuItem.CameraActions
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.CameraActions}
                </li>
            )}
            {/* {accountType !== AccountType.Customer && (
                <>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.DataRetentionPolicy
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.DataRetentionPolicy
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.DataRetentionPolicy}
                    </li>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.NaturalLanguageSearch
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.NaturalLanguageSearch
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.NaturalLanguageSearch}
                    </li>
                </>
            )} */}
            {(accountType === AccountType.Evolon ||
                accountType === AccountType.ServiceProvider) && (
                <>
                    <h3>
                        <span>
                            <CameraIcon className="icon" />
                        </span>
                        SMTP Creation
                    </h3>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(UtilitiesMenuItem.CreateNVRSite)
                        }
                        className={`${
                            selectedMenuItem === UtilitiesMenuItem.CreateNVRSite
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.CreateNVRSite}
                    </li>

                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.CreateSMTPCamera
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.CreateSMTPCamera
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.CreateSMTPCamera}
                    </li>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.BulkSMTPCameraCreate
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.BulkSMTPCameraCreate
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.BulkSMTPCameraCreate}
                    </li>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.BulkImmixCreate
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.BulkImmixCreate
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.BulkImmixCreate}
                    </li>

                    <h3>
                        <span>
                            <ReportsIcon className="icon" />
                        </span>
                        Reports
                    </h3>
                </>
            )}

            {accountType !== AccountType.Customer && (
                <>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.CameraConfigReport
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.CameraConfigReport
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.CameraConfigReport}
                    </li>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.CameraPerformanceReport
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.CameraPerformanceReport
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.CameraPerformanceReport}
                    </li>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.CameraAlertsReport
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.CameraAlertsReport
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.CameraAlertsReport}
                    </li>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(UtilitiesMenuItem.SPAuditReport)
                        }
                        className={`${
                            selectedMenuItem === UtilitiesMenuItem.SPAuditReport
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.SPAuditReport}
                    </li>
                    {accountType === AccountType.Evolon && (
                        <li
                            role="presentation"
                            onClick={() =>
                                setSelectedMenuItem(
                                    UtilitiesMenuItem.AIClassificationErrorReport
                                )
                            }
                            className={`${
                                selectedMenuItem ===
                                UtilitiesMenuItem.AIClassificationErrorReport
                                    ? 'selected'
                                    : ''
                            }`}
                        >
                            {UtilitiesMenuItem.AIClassificationErrorReport}
                        </li>
                    )}
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.ProMonitoringReport
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.ProMonitoringReport
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.ProMonitoringReport}
                    </li>
                    <li
                        role="presentation"
                        onClick={() =>
                            setSelectedMenuItem(
                                UtilitiesMenuItem.ScheduleAuditReport
                            )
                        }
                        className={`${
                            selectedMenuItem ===
                            UtilitiesMenuItem.ScheduleAuditReport
                                ? 'selected'
                                : ''
                        }`}
                    >
                        {UtilitiesMenuItem.ScheduleAuditReport}
                    </li>
                </>
            )}

            {accountType !== AccountType.Customer && (
                <h3>
                    <span>
                        <ReportsIcon className="icon" />
                    </span>
                    Video Monitoring Services
                </h3>
            )}
            {accountType === AccountType.Evolon && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(
                            UtilitiesMenuItem.DispatchServiceConfiguration
                        )
                    }
                    className={`${
                        selectedMenuItem ===
                        UtilitiesMenuItem.DispatchServiceConfiguration
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.DispatchServiceConfiguration}
                </li>
            )}
            {accountType !== AccountType.Customer && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(UtilitiesMenuItem.Subscriptions)
                    }
                    className={`${
                        selectedMenuItem === UtilitiesMenuItem.Subscriptions
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.Subscriptions}
                </li>
            )}

            <li
                role="presentation"
                onClick={() =>
                    setSelectedMenuItem(UtilitiesMenuItem.Scheduling)
                }
                className={`${
                    selectedMenuItem === UtilitiesMenuItem.Scheduling
                        ? 'selected'
                        : ''
                }`}
            >
                {UtilitiesMenuItem.Scheduling}
            </li>
            {accountType === AccountType.Evolon && (
                <h3>
                    <span>
                        <ReportsIcon className="icon" />
                    </span>
                    Evolon Admin
                </h3>
            )}
            {accountType === AccountType.Evolon && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(
                            UtilitiesMenuItem.NetworkDeviceTypes
                        )
                    }
                    className={`${
                        selectedMenuItem ===
                        UtilitiesMenuItem.NetworkDeviceTypes
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.NetworkDeviceTypes}
                </li>
            )}
            {accountType === AccountType.Evolon && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(
                            UtilitiesMenuItem.NetworkDeviceActionsAvailable
                        )
                    }
                    className={`${
                        selectedMenuItem ===
                        UtilitiesMenuItem.NetworkDeviceActionsAvailable
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.NetworkDeviceActionsAvailable}
                </li>
            )}

            {accountType === AccountType.Evolon && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(UtilitiesMenuItem.BridgeControls)
                    }
                    className={`${
                        selectedMenuItem === UtilitiesMenuItem.BridgeControls
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.BridgeControls}
                </li>
            )}

            {accountType === AccountType.Evolon && (
                <li
                    role="presentation"
                    onClick={() =>
                        setSelectedMenuItem(UtilitiesMenuItem.TestClips)
                    }
                    className={`${
                        selectedMenuItem === UtilitiesMenuItem.TestClips
                            ? 'selected'
                            : ''
                    }`}
                >
                    {UtilitiesMenuItem.TestClips}
                </li>
            )}
        </motion.ul>
    );
};

export default UtilitiesMenu;
