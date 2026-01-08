/* eslint-disable no-underscore-dangle */
// React
import { FC, ReactElement, useContext, useState, useEffect } from 'react';

// Third party
import { motion } from 'framer-motion';

// Custom
import sortByName from '../../utils/sortByName';

// Controller
import {
    isServiceProviderActive,
    isCustomerActive,
    isSiteActive,
} from './CameraList.controller';

// Components
import RootServiceProviderItem from './RootServiceProviderItem';
import RootCustomerItem from './RootCustomerItem';
import RootSiteItem from './RootSiteItem';
import EditSitePopup from './EditSitePopup';

// Context
import { ListTargetContext } from '../../contexts/ListTarget';
import { ListTarget } from '../../contexts/ListTarget.controller';

// Custom Types
import {
    ICustomer,
    IServiceProvider,
    ISite,
} from '../../types/tng-api.interfaces';
import { AccountType, JobType } from '../../types/enums';
import { IUser } from '../../types/interfaces';

// Styles
import '../../styles/components/CameraList/CameraList.scss';
import '../../styles/components/CameraList/GroupList.scss';
import '../../styles/components/Accordion.scss';

interface IProps {
    activeUser: IUser;
    rootData: IServiceProvider[] | ICustomer[] | ISite[];
    accountType: AccountType;
    refetchData: any;
}

export interface IEditSiteData {
    siteName: string;
    siteId: number;
    customerId: number;
    jobTypes: (JobType | null)[];
}

/**
 * Renders Camera List that displays nested items/options for Service Providers > Customers > Sites > Cameras.
 * The beginning of the tree / list varies depending of the user's account level (i.e. Evolon, Service Provider, or Customer).
 */
const CameraList: FC<IProps> = ({
    activeUser,
    rootData,
    accountType,
    refetchData,
}): ReactElement => {
    const { listTarget } = useContext(ListTargetContext);

    const [editSitePopupCords, setEditSitePopupCords] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [editSiteData, setEditSiteData] = useState<IEditSiteData>({
        siteName: '',
        siteId: 0,
        customerId: 0,
        jobTypes: [],
    });
    const [siteRefreshId, setSiteRefreshId] = useState(0);

    useEffect(() => {
        const refreshSites = async () => {
            await refetchData();
            setSiteRefreshId(0);
        };

        if (siteRefreshId !== 0 && accountType === AccountType.Customer) {
            refreshSites();
        }
    }, [accountType, siteRefreshId]);

    useEffect(() => {
        if (editSitePopupCords) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [editSitePopupCords]);

    return (
        <>
            <motion.div
                id="CameraList-container"
                className="cameraTreeContainer"
                key="CameraList-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                    opacity: 0,
                    transition: { duration: 0.8 },
                }}
                transition={{ duration: 0.7 }}
            >
                <ul id="CameraList" className="cameraTree">
                    {/* Is it presumed that the rootData value will be of type IServiceProvider if the user is Evolon. */}
                    {accountType === AccountType.Evolon &&
                        (rootData as IServiceProvider[]).map(
                            (item: IServiceProvider) => {
                                return (
                                    <li
                                        key={String(
                                            item.service_provider_account_id
                                        )}
                                    >
                                        <RootServiceProviderItem
                                            serviceProviderName={item.name}
                                            serviceProviderId={
                                                item.service_provider_account_id
                                            }
                                            active={isServiceProviderActive(
                                                listTarget as ListTarget,
                                                item.service_provider_account_id
                                            )}
                                            setEditSitePopupCords={
                                                setEditSitePopupCords
                                            }
                                            setEditSiteData={setEditSiteData}
                                            siteRefreshId={siteRefreshId}
                                            setSiteRefreshId={setSiteRefreshId}
                                        />
                                    </li>
                                );
                            }
                        )}
                    {/* Is it presumed that the rootData value will be of type ICustomer if the user is a Service Provider. */}
                    {accountType === AccountType.ServiceProvider &&
                        (rootData as ICustomer[]).map((item: ICustomer) => {
                            return (
                                <li key={String(item.account_id)}>
                                    <RootCustomerItem
                                        active={isCustomerActive(
                                            listTarget as ListTarget,
                                            item.account_id
                                        )}
                                        serviceProviderId={
                                            activeUser.service_provider_account as number
                                        }
                                        serviceProviderName={
                                            activeUser.account_name as string
                                        }
                                        customerName={item.account_name}
                                        customerId={item.account_id}
                                        siteCount={item.site_count}
                                        setEditSitePopupCords={
                                            setEditSitePopupCords
                                        }
                                        setEditSiteData={setEditSiteData}
                                        siteRefreshId={siteRefreshId}
                                        setSiteRefreshId={setSiteRefreshId}
                                        edgeStatus={item._edge_status}
                                    />
                                </li>
                            );
                        })}
                    {/* Is it presumed that the rootData value will be of type ISite if the user is a Customer. */}
                    {accountType === AccountType.Customer &&
                        (rootData as ISite[])
                            .sort(sortByName)
                            .map((item: ISite) => {
                                return (
                                    <li key={String(item.site_id)}>
                                        <RootSiteItem
                                            customerId={
                                                activeUser.client_account as number
                                            }
                                            customerName={item.account_name}
                                            siteName={item.site_name}
                                            siteId={item.site_id}
                                            active={isSiteActive(
                                                listTarget as ListTarget,
                                                item.site_id
                                            )}
                                            properties={item.properties}
                                            jobTypes={item.job_types}
                                            setEditSitePopupCords={
                                                setEditSitePopupCords
                                            }
                                            setEditSiteData={setEditSiteData}
                                            edgeStatus={item._edge_status}
                                        />
                                    </li>
                                );
                            })}
                </ul>
            </motion.div>
            <EditSitePopup
                editSitePopupCords={editSitePopupCords}
                setEditSitePopupCords={setEditSitePopupCords}
                editSiteData={editSiteData}
                setSiteRefreshId={setSiteRefreshId}
            />
        </>
    );
};

export default CameraList;
