/* eslint-disable no-underscore-dangle */
// React
import {
    useState,
    FC,
    useContext,
    ReactElement,
    useRef,
    useMemo,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import Skeleton from 'react-loading-skeleton';
import { Tooltip } from 'react-tooltip';

// Custom
import { useSites } from '../../hooks';
import { isSiteActive } from './CameraList.controller';
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import sortByName from '../../utils/sortByName';

// Components
import SiteItem from './SiteItem';

// Context
import { AuthContext } from '../../contexts/AuthProvider';
import { ListTargetContext } from '../../contexts/ListTarget';
import {
    ListTarget,
    ICustomerTarget,
} from '../../contexts/ListTarget.controller';

// Custom types
import { ISite } from '../../types/tng-api.interfaces';
import { IUser, IEdgeStatusData } from '../../types/interfaces';
import { IEditSiteData } from './CameraList';

// Icons
import StandardUserIcon from '../../images/icons/EV_ENT_User.7.6.22.svg?react';
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';

// Utils
import truncateString from '../../utils/truncateString';

interface IProps {
    serviceProviderId: number;
    serviceProviderName: string;
    customerName: string;
    customerId: number;
    siteCount: number;
    active: boolean;
    setEditSitePopupCords: Dispatch<
        SetStateAction<{ x: number; y: number } | null>
    >;
    setEditSiteData: Dispatch<SetStateAction<IEditSiteData>>;
    siteRefreshId: number;
    setSiteRefreshId: Dispatch<SetStateAction<number>>;
    edgeStatus: IEdgeStatusData[];
}

/** Customer dropdown with arrow that displays sites options when open. Will be used only if
 * active user is a Service Provider (i.e. not Evolon nor a Customer).
 */
const RootCustomerItem: FC<IProps> = ({
    serviceProviderId,
    serviceProviderName,
    customerId,
    customerName,
    siteCount,
    active,
    setEditSitePopupCords,
    setEditSiteData,
    siteRefreshId,
    setSiteRefreshId,
    edgeStatus,
}): ReactElement => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const { handleListTargetClick, listTarget } = useContext(ListTargetContext);

    /** Value determines whether query can be refetched using the QueryClient hook. */
    const canRefetchRef = useRef<boolean>(false);

    // Since we are polling, we need to user a ref to get the latest activeUser tokens when the tokens are refreshed
    const activeUserRef = useRef(activeUser);
    useEffect(() => {
        activeUserRef.current = activeUser;
    }, [activeUser]);

    const { data, refetch, isLoading } = useSites({
        customerId,
        activeUser: activeUserRef.current as IUser,
        enabled: canRefetchRef.current,
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
            numberOfParents: 0,
            serviceProviderId,
            serviceProviderName,
            customerId,
            customerName,
        };

        if (!open) {
            const result = await refetch();

            /**
             * Toggling this to true once the dropdown is lazy loaded
             * allows this data to be refreshed via QueryClient hook in any other
             * component that mutates this data. For example, if a user adds a site
             * the QueryClient hook can be called to refresh this dropdown immediately after
             * said data is added.
             */
            canRefetchRef.current = true;

            if (result.error) {
                setOpen(false);
                handleHttpRequestError(result.error, setActiveUser, navigate);

                return;
            }

            // Then open dropdown
            setOpen(true);
        } else {
            // If dropdown is being closed...

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
        <div className={`accordion ${open ? 'open' : ''}`}>
            <div
                id={`customer-item-${customerId}`}
                className="accordionHeader"
                onClick={(e) => handleClick(e)}
            >
                <div className="titleContainer">
                    <StandardUserIcon className="icon" />
                    <h4
                        data-tooltip-id={`${customerId}-${customerName}`}
                        className={`title name ${
                            active ? 'highlight-blue' : ''
                        } ${siteCount === 0 ? 'empty' : ''}`}
                    >
                        {truncateString(customerName, 20)}
                    </h4>

                    {numberOfOfflineEdgeDevices > 0 && (
                        <span className="edgeStatusBadge offline">
                            {numberOfOfflineEdgeDevices}
                        </span>
                    )}
                    <DropDownArrowIcon className="dropdown-arrow icon" />
                </div>
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
                        Nothing has been registered to this account.
                    </p>
                )}
                {data && data.length > 0 && <div className="treeLineStart" />}
                {data &&
                    data.sort(sortByName).map((item: ISite) => {
                        return (
                            <SiteItem
                                key={`${item.site_uuid}`}
                                serviceProviderId={serviceProviderId}
                                serviceProviderName={serviceProviderName}
                                siteName={item.site_name}
                                siteId={item.site_id}
                                customerId={customerId}
                                customerName={item.account_name}
                                active={isSiteActive(
                                    listTarget as ListTarget,
                                    item.site_id
                                )}
                                numberOfParents={1}
                                jobTypes={item.job_types}
                                properties={item.properties}
                                setEditSitePopupCords={setEditSitePopupCords}
                                setEditSiteData={setEditSiteData}
                                edgeStatus={item._edge_status}
                            />
                        );
                    })}
            </ul>
        </div>
    );
};

export default RootCustomerItem;
