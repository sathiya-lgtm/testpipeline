/* eslint-disable no-underscore-dangle */
// React
import React, {
    useState,
    FC,
    useContext,
    useMemo,
    ReactElement,
    Dispatch,
    SetStateAction,
    useRef,
    useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import Skeleton from 'react-loading-skeleton';
import { FiMoreHorizontal } from 'react-icons/fi';
import { Tooltip } from 'react-tooltip';

// Custom
import { useCameras } from '../../hooks';
import { isCameraActive, isSiteEmpty } from './CameraList.controller';
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import sortByName from '../../utils/sortByName';

// Components
import CameraItem from './CameraItem';

// Context
import { AuthContext } from '../../contexts/AuthProvider';
import { ListTargetContext } from '../../contexts/ListTarget';
import { ListTarget, ISiteTarget } from '../../contexts/ListTarget.controller';

// Custom types
import { ICameraLink } from '../../types/tng-api.interfaces';
import { IUser, IEdgeStatusData } from '../../types/interfaces';
import { IEditSiteData } from './CameraList';
import { JobType, AccountTypeModifier } from '../../types/enums';

// Utils
import truncateString from '../../utils/truncateString';
import { MaxSiteNameLength } from './SiteItem';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';

interface IProps {
    customerId: number;
    customerName: string;
    siteId: number;
    siteName: string;
    active: boolean;
    properties: {
        email?: string;
        job_type?: string;
    };
    jobTypes: (JobType | null)[];
    setEditSitePopupCords: Dispatch<
        SetStateAction<{ x: number; y: number } | null>
    >;
    setEditSiteData: Dispatch<SetStateAction<IEditSiteData>>;
    edgeStatus: IEdgeStatusData[];
}

/** Site dropdown with arrow that displays camera options when open. Will be used only if
 * active user is a Customer (i.e. not Evolon nor a Service Provider).
 */
const RootSiteItem: FC<IProps> = ({
    customerId,
    customerName,
    siteName,
    siteId,
    active,
    properties,
    jobTypes,
    setEditSitePopupCords,
    setEditSiteData,
    edgeStatus,
}): ReactElement => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const { handleListTargetClick, listTarget } = useContext(ListTargetContext);

    const [open, setOpen] = useState(false);

    // Since we are polling, we need to user a ref to get the latest activeUser tokens when the tokens are refreshed
    const activeUserRef = useRef(activeUser);
    useEffect(() => {
        activeUserRef.current = activeUser;
    }, [activeUser]);

    const { data, refetch, isLoading } = useCameras({
        siteId,
        activeUser: activeUserRef.current as IUser,
        enabled: false,
    });

    const itemTitleRef = useRef<HTMLSpanElement>(null);

    const numberOfOfflineEdgeDevices = useMemo(() => {
        return edgeStatus.reduce(
            (count, item) => count + (item.status === 'OFFLINE' ? 1 : 0),
            0
        );
    }, [edgeStatus]);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newListTarget: ISiteTarget = {
            src: 'camera-list',
            type: 'site',
            numberOfParents: 0,
            customerId,
            customerName,
            siteId,
            siteName,
            properties,
        };

        if (!open) {
            const result = await refetch();

            if (result.error) {
                setOpen(false);
                handleHttpRequestError(result.error, setActiveUser, navigate);

                return;
            }

            setOpen(true);
        } else {
            // Then close
            setOpen(false);
        }

        handleListTargetClick(newListTarget, open);
    };

    const handleSiteMenuClick = (
        e: React.MouseEvent,
        siteInfo: IEditSiteData
    ) => {
        if (activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly)) {
            return;
        }

        e.stopPropagation();
        const x = e.clientX + 15;
        const y = e.clientY;
        setEditSitePopupCords({ x, y });
        setEditSiteData(siteInfo);
    };

    useEffect(() => {
        // This polls for edge camera status
        const interval = setInterval(() => {
            if (data && open) {
                refetch();
            }
        }, 20000); // Poll every 20 seconds

        return () => clearInterval(interval);
    }, [open, data, refetch]);

    return (
        <div className={`accordion ${open ? 'open' : ''}`}>
            <div
                id={`site-item-${siteId}`}
                className="accordionHeader"
                onClick={(e) => handleClick(e)}
            >
                <div className="titleContainer">
                    <h4
                        className={`title name ${
                            active ? 'highlight-blue' : ''
                        }`}
                    >
                        <span
                            data-tooltip-id={`${siteId}-${siteName}`}
                            className={`name ${
                                isSiteEmpty(jobTypes) ? 'empty' : ''
                            }`}
                            ref={itemTitleRef}
                        >
                            {truncateString(siteName, MaxSiteNameLength)}
                        </span>

                        {activeUser?.account_type === 'sp' ||
                            (activeUser?.account_type === 'ev' && (
                                <span
                                    onClick={(e) =>
                                        handleSiteMenuClick(e, {
                                            siteName,
                                            siteId,
                                            customerId,
                                            jobTypes,
                                        })
                                    }
                                    className="site-menu-toggle"
                                >
                                    <FiMoreHorizontal size={24} />
                                </span>
                            ))}
                    </h4>

                    {numberOfOfflineEdgeDevices > 0 && (
                        <span className="edgeStatusBadge offline">
                            {numberOfOfflineEdgeDevices}
                        </span>
                    )}
                    <DropDownArrowIcon className="dropdown-arrow icon" />
                </div>
            </div>

            {siteName.length > MaxSiteNameLength && (
                <Tooltip
                    id={`${siteId}-${siteName}`}
                    content={siteName}
                    place="right"
                    style={{
                        backgroundColor: '#000', // solid black background
                        opacity: 1, // remove transparency
                        color: '#fff', // text color
                        zIndex: 10,
                    }}
                />
            )}

            <ul className="accordionContent">
                {isLoading && (
                    <Skeleton
                        borderRadius={0}
                        baseColor="#ebebeb3b"
                        highlightColor="#f5f5f59b"
                    />
                )}
                {data && data.length === 0 && (
                    <p className="data-not-available">
                        No cameras have been registered to this Site.
                    </p>
                )}
                {data && data.length > 0 && <div className="treeLineStart" />}
                {data &&
                    data.sort(sortByName).map((item: ICameraLink) => {
                        return (
                            <CameraItem
                                key={`${item.camera_uuid}`}
                                customerId={customerId}
                                siteId={siteId}
                                customerName={item.account_name}
                                siteName={item.site_name}
                                cameraName={item.camera_name}
                                cameraId={item.camera_id}
                                active={isCameraActive(
                                    listTarget as ListTarget,
                                    item.camera_id
                                )}
                                camera_properties={item.camera_properties}
                                numberOfParents={1}
                                edgeStatus={item._edge_status}
                            />
                        );
                    })}
            </ul>
        </div>
    );
};

export default RootSiteItem;
