/* eslint-disable no-underscore-dangle */
// React
import {
    useState,
    FC,
    useContext,
    useMemo,
    Dispatch,
    SetStateAction,
    useEffect,
    useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import Skeleton from 'react-loading-skeleton';
import { Tooltip } from 'react-tooltip';

// Custom
import { useSites } from '../../hooks';
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import sortByName from '../../utils/sortByName';
import { isSiteActive } from './CameraList.controller';

// Icons
import StandardUserIcon from '../../images/icons/EV_ENT_User.7.6.22.svg?react';

// Components
import SiteItem from './SiteItem';

// Context
import { AuthContext } from '../../contexts/AuthProvider';
import { ListTargetContext } from '../../contexts/ListTarget';
import {
    ListTarget,
    ICustomerTarget,
} from '../../contexts/ListTarget.controller';

// Utils
import truncateString from '../../utils/truncateString';

// Types
import { ISite } from '../../types/tng-api.interfaces';
import { IUser, IEdgeStatusData } from '../../types/interfaces';
import { IEditSiteData } from './CameraList';

interface IProps {
    serviceProviderId: number;
    serviceProviderName: string;
    customerId: number;
    customerName: string;
    siteCount: number;
    active: boolean;
    numberOfParents: number;
    setEditSitePopupCords: Dispatch<
        SetStateAction<{ x: number; y: number } | null>
    >;
    setEditSiteData: Dispatch<SetStateAction<IEditSiteData>>;
    siteRefreshId: number;
    setSiteRefreshId: Dispatch<SetStateAction<number>>;
    edgeStatus: IEdgeStatusData[];
}

const CustomerItem: FC<IProps> = ({
    serviceProviderId,
    serviceProviderName,
    customerName,
    customerId,
    active,
    numberOfParents,
    siteCount,
    setEditSitePopupCords,
    setEditSiteData,
    siteRefreshId,
    setSiteRefreshId,
    edgeStatus,
}) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const { handleListTargetClick, listTarget } = useContext(ListTargetContext);

    // Since we are polling, we need to user a ref to get the latest activeUser tokens when the tokens are refreshed
    const activeUserRef = useRef(activeUser);
    useEffect(() => {
        activeUserRef.current = activeUser;
    }, [activeUser]);

    const { data, refetch, isLoading } = useSites({
        customerId,
        activeUser: activeUserRef.current as IUser,
        enabled: false,
    });

    const [open, setOpen] = useState(false);

    const numberOfOfflineEdgeDevices = useMemo(() => {
        return edgeStatus.reduce(
            (count, item) => count + (item.status === 'OFFLINE' ? 1 : 0),
            0
        );
    }, [edgeStatus]);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newListTarget: ICustomerTarget = {
            src: 'camera-list',
            type: 'account',
            numberOfParents,
            serviceProviderId,
            serviceProviderName,
            customerId,
            customerName,
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

    useEffect(() => {
        const refreshSites = async () => {
            await refetch();
            setSiteRefreshId(0);
        };

        if (customerId === siteRefreshId) {
            refreshSites();
        }
    }, [customerId, siteRefreshId]);

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
                id={`customer-item-${customerId}`}
                className="groupListHeader"
                onClick={(e) => handleClick(e)}
            >
                <p className="title">
                    <span
                        className={`${
                            numberOfOfflineEdgeDevices > 0
                                ? 'name'
                                : 'customerItemName'
                        } ${active ? 'highlight-blue' : ''} ${
                            siteCount === 0 ? 'empty' : ''
                        }`}
                    >
                        <span data-tooltip-id={`${customerId}-${customerName}`}>
                            <StandardUserIcon className="icon" />
                            {truncateString(customerName, 20)}
                        </span>

                        {numberOfOfflineEdgeDevices > 0 && (
                            <span className="edgeStatusBadge offline">
                                {numberOfOfflineEdgeDevices}
                            </span>
                        )}
                    </span>
                    <span className={open ? 'minus-sign' : 'plus-sign'}>
                        {open ? '-' : '+'}
                    </span>
                </p>
            </div>

            {customerName.length > 20 && (
                <Tooltip
                    id={`${customerId}-${customerName}`}
                    content={customerName}
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
                        Nothing has been registered to this account.
                    </li>
                )}
                {data && data.length > 0 && (
                    <div className="siteListTreeLineStart" />
                )}
                {data &&
                    data.sort(sortByName).map((item: ISite) => {
                        return (
                            <SiteItem
                                key={`${item.site_uuid}`}
                                serviceProviderId={serviceProviderId}
                                serviceProviderName={serviceProviderName}
                                customerId={customerId}
                                customerName={customerName}
                                siteName={item.site_name}
                                siteId={item.site_id}
                                active={isSiteActive(
                                    listTarget as ListTarget,
                                    item.site_id
                                )}
                                properties={item.properties}
                                jobTypes={item.job_types}
                                numberOfParents={numberOfParents + 1}
                                setEditSitePopupCords={setEditSitePopupCords}
                                setEditSiteData={setEditSiteData}
                                edgeStatus={item._edge_status}
                            />
                        );
                    })}
            </ul>
        </li>
    );
};

export default CustomerItem;
