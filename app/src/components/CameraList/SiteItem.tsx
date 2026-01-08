/* eslint-disable no-underscore-dangle */
// React
import React, {
    useState,
    useRef,
    FC,
    useContext,
    useMemo,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { useQuery } from '@tanstack/react-query';
import Skeleton from 'react-loading-skeleton';
import { FiMoreHorizontal } from 'react-icons/fi';
import { Tooltip } from 'react-tooltip';

// Custom
import { useCameras } from '../../hooks';
import getCameras from '../../api_calls/getCameras';
import { isCameraActive, isSiteEmpty } from './CameraList.controller';
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import sortByName from '../../utils/sortByName';

// Components
import CameraItem from './CameraItem';

// Context
import { AuthContext } from '../../contexts/AuthProvider';
import { ListTargetContext } from '../../contexts/ListTarget';
import { ListTarget, ISiteTarget } from '../../contexts/ListTarget.controller';

// Utils
import truncateString from '../../utils/truncateString';

// Types
import { ICameraLink } from '../../types/tng-api.interfaces';
import { IUser, IEdgeStatusData } from '../../types/interfaces';
import { IEditSiteData } from './CameraList';
import { AccountTypeModifier, JobType } from '../../types/enums';

interface IProps {
    serviceProviderId?: number;
    serviceProviderName?: string;
    customerId: number;
    customerName: string;
    siteId: number;
    siteName: string;
    active: boolean;
    numberOfParents: number;
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

export const MaxSiteNameLength = 25;

const SiteItem: FC<IProps> = ({
    serviceProviderName,
    serviceProviderId,
    customerName,
    customerId,
    siteName,
    siteId,
    active,
    numberOfParents,
    properties,
    jobTypes,
    setEditSitePopupCords,
    setEditSiteData,
    edgeStatus,
}) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const { handleListTargetClick, listTarget } = useContext(ListTargetContext);

    const itemTitleRef = useRef<HTMLSpanElement>(null);

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

    const sortedData = useMemo(() => {
        if (data) {
            const panels = data
                .filter((item) => item.camera_properties.job_type === 'panel')
                .sort(sortByName);
            const cameras = data
                .filter((item) => item.camera_properties.job_type !== 'panel')
                .sort(sortByName);

            return [...panels, ...cameras];
        }

        return undefined;
    }, [data]);

    const [open, setOpen] = useState(false);

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
            numberOfParents,
            serviceProviderId,
            serviceProviderName,
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
        <li className={`groupList ${open ? 'open' : 'closed'}`}>
            <div
                id={`site-item-${siteId}`}
                className="groupListHeader"
                onClick={(e) => handleClick(e)}
            >
                <div className="title">
                    <div
                        className={`name ${active ? 'highlight-blue' : ''} ${
                            isSiteEmpty(jobTypes) ? 'empty' : ''
                        }`}
                    >
                        <span
                            ref={itemTitleRef}
                            data-tooltip-id={`${siteId}-${siteName}`}
                        >
                            {truncateString(siteName, MaxSiteNameLength)}
                        </span>

                        {numberOfOfflineEdgeDevices > 0 && (
                            <span className="edgeStatusBadge offline">
                                {numberOfOfflineEdgeDevices}
                            </span>
                        )}
                        <div
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
                        </div>
                    </div>

                    <span className={open ? 'minus-sign' : 'plus-sign'}>
                        {open ? '-' : '+'}
                    </span>
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

            <ul className="groupListContent">
                {isLoading && (
                    <Skeleton
                        borderRadius={0}
                        baseColor="#ebebeb3b"
                        highlightColor="#f5f5f59b"
                    />
                )}
                {data && data.length === 0 && (
                    <li className="data-not-available">
                        No cameras have been registered to this Site.
                    </li>
                )}
                {data && data.length > 0 && (
                    <div className="cameraLinkTreeLineStart" />
                )}
                {sortedData &&
                    sortedData.map((item: ICameraLink) => {
                        return (
                            <CameraItem
                                key={`${item.camera_uuid}-${
                                    item.camera_name
                                }-${JSON.stringify(item.camera_properties)}`}
                                serviceProviderName={serviceProviderName}
                                serviceProviderId={serviceProviderId}
                                customerId={customerId}
                                cameraId={item.camera_id}
                                cameraName={item.camera_name}
                                siteName={item.site_name}
                                siteId={siteId}
                                customerName={item.account_name}
                                camera_properties={item.camera_properties}
                                active={isCameraActive(
                                    listTarget as ListTarget,
                                    item.camera_id
                                )}
                                numberOfParents={numberOfParents + 1}
                                edgeStatus={edgeStatus}
                            />
                        );
                    })}
            </ul>
        </li>
    );
};

export default SiteItem;
