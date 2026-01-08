// React
import React, { FC, ReactElement, useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Components
import SessionEndingModal from './Modals/SessionEnding';
import LoadingModal from './Modals/LoadingModal';

// Context
import { AuthContext } from '../contexts/AuthProvider';

/**
 * Wrapper that conditionally routes to either "protected routes"
 * or the "/" route based on whether or not there is an active user in state.
 * @returns {ReactElement} Returns either an Outlet or Navigate element which in
 * turn renders the children component corresponding to the route the user attempted
 * to visit or reroutes to the Login page, respectively.
 */
const PrivateRoute: FC = (): ReactElement => {
    const {
        activeUser,
        userLoggedIn,
        shouldShowSessionWarning,
        setShouldShowSessionWarning,
        setActiveUser,
        setUserLoggedIn,
    } = useContext(AuthContext);
    const location = useLocation();

    if (activeUser === null && userLoggedIn === null) {
        return <LoadingModal modalText="Loading..." />;
    }

    return activeUser && userLoggedIn ? (
        <>
            {shouldShowSessionWarning && (
                <SessionEndingModal
                    activeUser={activeUser}
                    setActiveUser={setActiveUser}
                    setUserLoggedIn={setUserLoggedIn}
                    setShowModal={setShouldShowSessionWarning}
                />
            )}
            <Outlet />
        </>
    ) : (
        <Navigate to="/" state={{ from: location }} />
    );
};

export default PrivateRoute;
