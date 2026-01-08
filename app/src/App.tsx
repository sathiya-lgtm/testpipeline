// React
import React, { FC, ReactElement } from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';

// Toast
import { ToastContainer } from 'react-toastify';

// Components
import Navbar from './components/Navbar/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Views
import Login from './views/Login/Login';
import Home from './views/Home/Home';
import ChangePassword from './views/ChangePassword/ChangePassword';
import AlarmVision from './views/AlarmVision/AlarmVision';
import Utilities from './views/Utilities/Utilities';
import Alerts from './components/Outlets/Home/Alerts/Alerts';
import UserRegistration from './views/UserRegistration/UserRegistration';
import UserProfile from './views/UserProfile/UserProfile';
import LiveViewLinks from './views/LiveViewLinks/LiveViewLinks';
import ResetPasswordRequest from './views/ResetPassword/ResetPasswordRequest';
import ResetPassword from './views/ResetPassword/ResetPassword';
import TraditionalEULA from './views/TraditionalEULA/TraditionalEULA';
import DealerContact from './views/DealerContact/DealerContact';

// Outlets
import Dashboard from './components/Outlets/Home/Dashboard/Dashboard';
import ForensicSearch from './components/Outlets/Home/ForensicSearch';
import CameraConfig from './components/Outlets/Home/CameraConfig';

// React loading skeleton CSS
import 'react-loading-skeleton/dist/skeleton.css';

// Toast CSS
import 'react-toastify/dist/ReactToastify.css';

// React Tooltip
import 'react-tooltip/dist/react-tooltip.css';

// Styles
import './styles/normalize.scss';
import './styles/tooltip.scss';
import './styles/global.scss';
import './styles/components/Accordion.scss';
import './styles/components/Input.scss';
import './styles/components/RadioButtons.scss';

const App: FC = (): ReactElement => {
    return (
        <div className="App">
            <ToastContainer />
            {/* The v7_startTransition and v7_relatedSplatPath to remove error for a future feature that we do not use */}
            <BrowserRouter
                future={{
                    v7_startTransition: false,
                    v7_relativeSplatPath: false,
                }}
            >
                <Navbar />
                <Routes>
                    <Route
                        path="/"
                        element={<Login navigatePathAfterLogin="/home" />}
                    />
                    <Route
                        path="register-device"
                        element={
                            <Login navigatePathAfterLogin="/utilities?menu=register" />
                        }
                    />
                    <Route
                        path="/registration/complete/:hash"
                        element={<UserRegistration />}
                    />
                    <Route
                        path="/live-view-links"
                        element={<LiveViewLinks />}
                    />

                    <Route
                        path="/password-reset-request"
                        element={<ResetPasswordRequest />}
                    />

                    <Route
                        path="/password-reset/:tokenhash"
                        element={<ResetPassword />}
                    />
                    <Route path="/alarmvision" element={<AlarmVision />} />
                    <Route
                        path="/traditionaleula"
                        element={<TraditionalEULA />}
                    />
                    {/* Wraps "protected routes" (i.e. routes that require an user authentication to visit) */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/home" element={<Home />}>
                            <Route index element={<Dashboard />} />
                            <Route path="alerts" element={<Alerts />} />
                            <Route
                                path="forensic-search"
                                element={<ForensicSearch />}
                            />
                            <Route
                                path="camera/:id"
                                element={<CameraConfig />}
                            />
                            <Route path="edge/:id" element={<CameraConfig />} />
                            <Route
                                path="device-io/:id"
                                element={<CameraConfig />}
                            />
                            <Route
                                path="panel/:id"
                                element={<CameraConfig />}
                            />
                            <Route
                                path="dmp-panel/:id"
                                element={<CameraConfig />}
                            />
                        </Route>
                        <Route
                            path="/change-password"
                            element={<ChangePassword />}
                        />
                        <Route path="/utilities" element={<Utilities />} />
                        <Route path="/user-profile" element={<UserProfile />} />
                    </Route>

                    {/* Attempts to redirect to root if user visits unassigned path */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                    <Route path="/dealercontact" element={<DealerContact />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
};

export default App;
