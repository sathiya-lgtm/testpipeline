// React
import React, {
    useContext,
    ReactElement,
    useEffect,
    useState,
    useRef,
} from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

// Third party
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Skeleton from 'react-loading-skeleton';

// Custom
import sortByName from '../../utils/sortByName';
import getAccountType from '../../utils/getAccountType';
import handleHttpRequestError from '../../utils/handleHttpRequestError';

// Context
import { AuthContext } from '../../contexts/AuthProvider';
import { ListTargetContext } from '../../contexts/ListTarget';

// Controller
import {
    createQueryKey,
    createQueryId,
    getCameraTreeRootData,
    RootDataQueryKey,
} from './Home.controller';

// Components
import CameraList from '../../components/CameraList/CameraList';
import ProfileThumbnailModal from '../../components/Modals/ProfileThumbnail/ProfileThumbnailModal';

// Icons
import AdminUserIcon from '../../images/icons/EV.admin.svg?react';

// Types
import { AccountType, AccountTypeModifier } from '../../types/enums';
import { IUser } from '../../types/interfaces';

// Styles
import '../../styles/views/Home.scss';

/**
 * Home view component. Features CameraList on the left side and an Outlet on the right. Said
 * Outlet is used to swap between various visual components on the right while persisting the CameraList
 * on the left (e.g. Dashboard, ForensicSearch, Camera Page, etc).
 * @returns {ReactElement}
 */

const Home = (): ReactElement => {
    const navigate = useNavigate();
    const location = useLocation();
    const { clearListTarget } = useContext(ListTargetContext);
    const { activeUser, setActiveUser } = useContext(AuthContext);

    const [showProfileThumbnailModal, setShowProfileThumbnailModal] =
        useState(false);

    const accountType: AccountType = getAccountType(activeUser);
    const queryKey: RootDataQueryKey = createQueryKey(accountType);
    const queryId = createQueryId(accountType, activeUser);

    // Since we are polling, we need to user a ref to get the latest activeUser tokens when the tokens are refreshed
    const activeUserRef = useRef(activeUser);
    useEffect(() => {
        activeUserRef.current = activeUser;
    }, [activeUser]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: [queryKey, queryId],
        queryFn: () => getCameraTreeRootData(activeUserRef.current as IUser),
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        enabled: queryId !== null,
    });

    useEffect(() => {
        // This polls for edge camera status
        const interval = setInterval(() => {
            if (data) {
                refetch();
            }
        }, 20000); // Poll every 20 seconds

        return () => clearInterval(interval);
    }, [data, refetch]);

    useEffect(() => {
        // Reset listTarget when user leaves Home view.
        return () => {
            clearListTarget();
        };
    }, []);

    return (
        <div id="Home" className="Home">
            <section className="menu">
                <div className="header">
                    <h2 data-testid="welcome-message">
                        Welcome, {activeUser?.username || 'User'}
                    </h2>
                    <div
                        className="user-info-container tooltip bottom"
                        onClick={() => {
                            if (
                                activeUser?.modifier?.includes(
                                    AccountTypeModifier.ReadOnly
                                )
                            ) {
                                return;
                            }

                            setShowProfileThumbnailModal(true);
                        }}
                        data-tooltip="Edit Logo"
                    >
                        {activeUser?.properties?.thumbnail ? (
                            <div className="profile-thumbnail">
                                <img
                                    src={activeUser?.properties?.thumbnail}
                                    alt=""
                                />
                            </div>
                        ) : (
                            <AdminUserIcon className="icon thumbnail-icon" />
                        )}
                        <p>{activeUser?.account_name}</p>
                    </div>
                </div>
                {showProfileThumbnailModal && (
                    <ProfileThumbnailModal
                        handleClose={() => {
                            setShowProfileThumbnailModal(false);
                        }}
                    />
                )}
                {isLoading && (
                    <Skeleton
                        borderRadius={0}
                        baseColor="#ebebeb3b"
                        highlightColor="#f5f5f59b"
                        count={10}
                        style={{
                            opacity: 0.6,
                            padding: '0.15rem',
                            marginBottom: '0.3rem',
                        }}
                    />
                )}
                <div className="content">
                    <AnimatePresence mode="wait">
                        {data && data.length > 0 && (
                            <CameraList
                                activeUser={activeUser as IUser}
                                rootData={data.sort(sortByName)}
                                accountType={accountType}
                                refetchData={refetch}
                            />
                        )}
                        {data && data.length === 0 && (
                            <motion.ul
                                id="no-results-found-container"
                                key="no-results-found-container"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{
                                    opacity: 0,
                                    transition: { duration: 0.8 },
                                }}
                                transition={{ duration: 0.7 }}
                            >
                                <li
                                    id="no-results-found"
                                    key="no-results-found"
                                >
                                    No results found
                                </li>
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </div>
            </section>
            <main
                className={
                    location?.pathname.includes('camera')
                        ? 'no-scroll-gutter'
                        : ''
                }
            >
                <Outlet />
            </main>
        </div>
    );
};

export default Home;
