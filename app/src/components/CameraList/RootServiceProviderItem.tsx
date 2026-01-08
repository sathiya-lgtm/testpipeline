/* eslint-disable no-underscore-dangle */
// React
import React, {
    useState,
    FC,
    useContext,
    ReactElement,
    Dispatch,
    SetStateAction,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import Skeleton from 'react-loading-skeleton';

// Custom
import { useCustomers } from '../../hooks';
import { isCustomerActive } from './CameraList.controller';
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import sortByName from '../../utils/sortByName';

// Components
import CustomerItem from './CustomerItem';

// Context
import { AuthContext } from '../../contexts/AuthProvider';
import { ListTargetContext } from '../../contexts/ListTarget';
import {
    IServiceProviderTarget,
    ListTarget,
} from '../../contexts/ListTarget.controller';

// Custom types
import { ICustomer } from '../../types/tng-api.interfaces';
import { IUser } from '../../types/interfaces';
import { IEditSiteData } from './CameraList';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import AdminUserIcon from '../../images/icons/EV.admin.svg?react';

interface IProps {
    serviceProviderId: number;
    serviceProviderName: string;
    active: boolean;
    setEditSitePopupCords: Dispatch<
        SetStateAction<{ x: number; y: number } | null>
    >;
    setEditSiteData: Dispatch<SetStateAction<IEditSiteData>>;
    siteRefreshId: number;
    setSiteRefreshId: Dispatch<SetStateAction<number>>;
}

/** Service Provider dropdown with arrow that displays Customers when open. Will be used only if
 * active user is a Evolon (i.e. not Customer nor a Service Provider).
 */
const RootServiceProviderItem: FC<IProps> = ({
    serviceProviderName,
    serviceProviderId,
    active,
    setEditSitePopupCords,
    setEditSiteData,
    siteRefreshId,
    setSiteRefreshId,
}): ReactElement => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const { handleListTargetClick, listTarget } = useContext(ListTargetContext);

    const { data, refetch, isLoading } = useCustomers({
        serviceProviderId,
        activeUser: activeUser as IUser,
        enabled: false,
    });

    const [open, setOpen] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const newListTarget: IServiceProviderTarget = {
            src: 'camera-list',
            type: 'service-provider',
            numberOfParents: 0,
            serviceProviderId,
            serviceProviderName,
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

    return (
        <div className={`accordion ${open ? 'open' : ''}`}>
            <div
                id={`service-provider-item-${serviceProviderId}`}
                className="accordionHeader"
                onClick={(e) => handleClick(e)}
            >
                <div className="titleContainer">
                    <AdminUserIcon className="icon" />
                    <h4
                        className={`title name ${
                            active ? 'highlight-blue' : ''
                        }`}
                    >
                        {serviceProviderName}
                    </h4>
                    <DropDownArrowIcon className="dropdown-arrow icon" />
                </div>
            </div>
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
                    data.sort(sortByName).map((item: ICustomer) => {
                        return (
                            <CustomerItem
                                key={`${item.account_name} ${item.account_id}`}
                                serviceProviderId={serviceProviderId}
                                serviceProviderName={serviceProviderName}
                                customerName={item.account_name}
                                customerId={item.account_id}
                                siteCount={item.site_count}
                                active={isCustomerActive(
                                    listTarget as ListTarget,
                                    item.account_id
                                )}
                                numberOfParents={1}
                                setEditSitePopupCords={setEditSitePopupCords}
                                setEditSiteData={setEditSiteData}
                                siteRefreshId={siteRefreshId}
                                setSiteRefreshId={setSiteRefreshId}
                                edgeStatus={item._edge_status}
                            />
                        );
                    })}
            </ul>
        </div>
    );
};

export default RootServiceProviderItem;
