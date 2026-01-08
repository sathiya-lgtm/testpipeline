import { FC, ReactElement, useContext, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Controller
import {
    handleLogout,
    generateCSSClassBasedOnHash,
    LinkTo,
} from './Navbar.controller';

// Context
import { AuthContext } from '../../contexts/AuthProvider';
import { ListTargetContext } from '../../contexts/ListTarget';

// Components
import About from '../Modals/About/About';

// Icons
import EvolonLogo from '../../images/logo/evolon_logo.svg?react';
import SettingsIcon from '../../images/icons/EV.settings.svg?react';
import ForensicSearchIcon from '../../images/icons/forensicSearch_icon.svg?react';
import DashboardIcon from '../../images/icons/dashboard3_icon.svg?react';
import AdminUserIcon from '../../images/icons/EV.admin.svg?react';
import StandardUserIcon from '../../images/icons/EV_ENT_User.7.6.22.svg?react';
import InsitesIcon from '../../images/icons/Insites_Logo_white_and_green.svg?react';
import CameraIcon from '../../images/icons/EV.cctv.svg?react';
import HelpIcon from '../../images/icons/Help.svg?react';
import AlertIcon from '../../images/icons/EV_ENT_Alerts.7.6.22.svg?react';

// Utils
import checkEdgeVersionNumber from '../../utils/checkEdgeVersionNumber';

// Styles
import '../../styles/components/NavBar.scss';

const Navbar: FC = (): ReactElement => {
    const navigate = useNavigate();
    const location = useLocation();
    const { listTarget } = useContext(ListTargetContext);
    const { activeUser, setActiveUser, setUserLoggedIn } =
        useContext(AuthContext);

    const [showHelpMenu, setShowHelpMenu] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);

    const cameraLink = useMemo(() => {
        // TODO - fix this type
        const target = listTarget as any;
        const edgeVersion = target?.camera_properties?.version;
        const jobType = target?.camera_properties?.job_type;
        const template = target?.camera_properties?.template;

        if (jobType === 'panel' && template) {
            return `/home/panel/${target.cameraId}`;
        }

        if (jobType === 'panel') {
            return `/home/dmp-panel/${target.cameraId}`;
        }

        if (jobType === 'device-io') {
            return `/home/device-io/${target.cameraId}`;
        }

        if (edgeVersion && checkEdgeVersionNumber(edgeVersion)) {
            return `/home/edge/${target.cameraId}`;
        }

        return `${LinkTo.CameraPage}/${
            listTarget?.type === 'camera' ? listTarget.cameraId : '0'
        }`;
    }, [listTarget]);

    const showCameraConfigOrView = useMemo(() => {
        if (!activeUser) {
            return false;
        }

        // Evolon is classified as a sp so probably don't need the second line of logic
        if (
            activeUser.account_type === 'sp' ||
            activeUser.account_type === 'ev'
        ) {
            return true;
        }

        if (
            activeUser.account_type === 'cl' &&
            activeUser.properties?.customer_camera_view_access
        ) {
            return true;
        }

        return false;
    }, [activeUser]);

    const onCameraConfigPage = useMemo(() => {
        return (
            location.pathname.includes('/home/camera') ||
            location.pathname.includes('/home/edge') ||
            location.pathname.includes('/home/device-io')
        );
    }, [location]);

    return (
        <>
            <nav className="NavBar">
                <ul className="nav-menu left">
                    <Link to={LinkTo.Dashboard} data-testid="evolon-button">
                        <li>
                            <EvolonLogo id="evolon-logo" />{' '}
                        </li>
                    </Link>
                    <li
                        className="insites-wrapper"
                        data-testid="insites-button"
                        onClick={() => setShowAboutModal(true)}
                        role="presentation"
                    >
                        <InsitesIcon id="insites-icon" className="icon" />
                    </li>
                    {activeUser && (
                        <Link
                            to={LinkTo.UtilityPage}
                            className="nav-icon"
                            onClick={() => setShowHelpMenu(false)}
                        >
                            <li
                                className="tooltip bottom settings-icon-container"
                                data-tooltip="Utilities"
                                data-testid="utilities-button"
                            >
                                <SettingsIcon
                                    id="settings-icon"
                                    className={generateCSSClassBasedOnHash({
                                        baseCSSClass: 'icon',
                                        hash: location?.pathname || '',
                                        textPatterns: [
                                            {
                                                text: LinkTo.UtilityPage,
                                            },
                                        ],
                                    })}
                                />
                            </li>
                        </Link>
                    )}
                </ul>

                <ul className="nav-menu right">
                    {activeUser ? (
                        <>
                            <Link
                                to={LinkTo.Dashboard}
                                className="nav-icon tooltip bottom"
                                data-tooltip="Dashboard"
                                onClick={() => setShowHelpMenu(false)}
                            >
                                <li data-testid="dashboard-button">
                                    <DashboardIcon
                                        id="dashboardIcon"
                                        className={generateCSSClassBasedOnHash({
                                            baseCSSClass: 'icon',
                                            hash: location?.pathname || '',
                                            textPatterns: [
                                                {
                                                    text: LinkTo.Dashboard,
                                                    exact: true,
                                                },
                                            ],
                                        })}
                                    />
                                </li>
                            </Link>

                            <Link
                                to={LinkTo.ForensicSearch}
                                className="nav-icon tooltip bottom wide"
                                data-tooltip="Forensic Search"
                                onClick={() => setShowHelpMenu(false)}
                            >
                                <li data-testid="forensic-search-button">
                                    <ForensicSearchIcon
                                        id="globalClipSearchIcon"
                                        className={generateCSSClassBasedOnHash({
                                            baseCSSClass: 'user icon',
                                            hash: location?.pathname || '',
                                            textPatterns: [
                                                {
                                                    text: LinkTo.ForensicSearch,
                                                },
                                            ],
                                        })}
                                    />
                                </li>
                            </Link>

                            {showCameraConfigOrView && onCameraConfigPage && (
                                <li
                                    className="nav-icon tooltip bottom"
                                    data-tooltip={`${
                                        activeUser.account_type === 'cl'
                                            ? 'Device View'
                                            : 'Device Config'
                                    }`}
                                    data-testid="camera-configuration-button"
                                >
                                    <CameraIcon
                                        id="cameraIcon"
                                        className={`icon ${
                                            onCameraConfigPage
                                                ? 'highlight'
                                                : ''
                                        }`}
                                    />
                                </li>
                            )}

                            {showCameraConfigOrView && !onCameraConfigPage && (
                                <Link
                                    to={cameraLink}
                                    className="nav-icon tooltip bottom wide"
                                    data-tooltip={`${
                                        activeUser.account_type === 'cl'
                                            ? 'Device View'
                                            : 'Device Config'
                                    }`}
                                    onClick={() => setShowHelpMenu(false)}
                                >
                                    <li data-testid="camera-configuration-button">
                                        <CameraIcon
                                            id="cameraIcon"
                                            className={generateCSSClassBasedOnHash(
                                                {
                                                    baseCSSClass: 'icon',
                                                    hash:
                                                        location?.pathname ||
                                                        '',
                                                    textPatterns: [
                                                        {
                                                            text: LinkTo.CameraPage,
                                                        },
                                                    ],
                                                }
                                            )}
                                        />
                                    </li>
                                </Link>
                            )}

                            <Link
                                to={LinkTo.ChangePassword}
                                className="nav-icon tooltip bottom wide"
                                data-tooltip="User Settings"
                            >
                                <li
                                    data-testid="user-settings-button"
                                    role="presentation"
                                >
                                    {activeUser.account_type === 'sp' ? (
                                        <AdminUserIcon
                                            id="admin-user-icon"
                                            className={generateCSSClassBasedOnHash(
                                                {
                                                    baseCSSClass: 'user icon',
                                                    hash:
                                                        location?.pathname ||
                                                        '',
                                                    textPatterns: [
                                                        {
                                                            text: LinkTo.ChangePassword,
                                                        },
                                                    ],
                                                }
                                            )}
                                        />
                                    ) : (
                                        <StandardUserIcon
                                            id="standard-user-icon"
                                            className={generateCSSClassBasedOnHash(
                                                {
                                                    baseCSSClass: 'user icon',
                                                    hash:
                                                        location?.pathname ||
                                                        '',
                                                    textPatterns: [
                                                        {
                                                            text: LinkTo.ChangePassword,
                                                        },
                                                    ],
                                                }
                                            )}
                                        />
                                    )}
                                </li>
                            </Link>
                            {activeUser.account_type === 'sp' && (
                                <Link
                                    to={LinkTo.Alerts}
                                    className="nav-icon tooltip bottom"
                                    data-tooltip="Alert Overview"
                                    onClick={() => setShowHelpMenu(false)}
                                >
                                    <li data-testid="alert-overview-button">
                                        <AlertIcon
                                            id="alertIcon"
                                            className={generateCSSClassBasedOnHash(
                                                {
                                                    baseCSSClass: 'user icon',
                                                    hash:
                                                        location?.pathname ||
                                                        '',
                                                    textPatterns: [
                                                        {
                                                            text: LinkTo.Alerts,
                                                        },
                                                    ],
                                                }
                                            )}
                                        />
                                    </li>
                                </Link>
                            )}

                            <li className="nav-icon">
                                <button
                                    type="button"
                                    className="btn danger"
                                    data-testid="logout-button"
                                    onClick={() => {
                                        handleLogout(
                                            setActiveUser,
                                            setUserLoggedIn,
                                            navigate
                                        );
                                    }}
                                >
                                    Log Out
                                </button>
                            </li>
                        </>
                    ) : null}
                    <li
                        data-tooltip="Help/Support"
                        data-testid="help-button"
                        className={`nav-icon navDropdown tooltip left ${
                            showHelpMenu ? 'highlight' : ''
                        }`}
                        role="presentation"
                        onClick={() => setShowHelpMenu(!showHelpMenu)}
                    >
                        <HelpIcon id="help-icon" className="icon" />

                        {showHelpMenu && (
                            <ul className="dropdownMenu">
                                <a
                                    href="https://evolontech.com/contact/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <li>Contact Us</li>
                                </a>
                                <Link to="/DealerContact">
                                    <li>Dealer Contact</li>
                                </Link>
                                <a
                                    href="https://evolontech.freshdesk.com/support/tickets/new"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <li>Get Support</li>
                                </a>
                            </ul>
                        )}
                    </li>
                </ul>
            </nav>
            {showAboutModal && (
                <About handleClose={() => setShowAboutModal(false)} />
            )}
        </>
    );
};

export default Navbar;
