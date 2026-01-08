import { toast } from 'react-toastify';
import { FC, useEffect, useState } from 'react';
import FormSelect, { IFormSelectOption } from './FormSelect';
import { IUser } from '../../types/interfaces';

// Custom
import getAccountType from '../../utils/getAccountType';

// Custom types
import { AccountType } from '../../types/enums';

// Input Styles
import '../../styles/tooltip.scss';

// Import the API Calls
import SitesRoute, { ISiteData } from '../../api_calls/Sites';

interface CustomerSelectProps {
    tabIndex?: number | undefined;
    activeUser: IUser;
    serviceProviderAccountId?: number | null;
    accountId?: number | null;
    onChange?: (data: any) => void;
}

const CustomerSelect: FC<CustomerSelectProps> = ({
    tabIndex,
    activeUser,
    serviceProviderAccountId,
    accountId,
    onChange,
}) => {
    const [sites, setSites] = useState<ISiteData[]>([]);
    const [selectedSite, setSite] = useState<ISiteData | null>(null);

    const accountType = getAccountType(activeUser);

    const onItemClick = (data: IFormSelectOption) => {
        sites.forEach((site) => {
            if (site.site_id === Number(data.value)) {
                setSite(site);
                if (onChange) {
                    onChange(site);
                }
            }
        });
    };

    const handleClear = () => {
        setSite(null);
        if (onChange) {
            onChange(null);
        }
    };

    const getSites = async () => {
        try {
            const route = SitesRoute(activeUser);
            if (accountType === AccountType.Evolon) {
                const parameters = {
                    service_provider_account_id: serviceProviderAccountId,
                    account_id: accountId,
                };
                const results = await route.get(parameters);
                setSites(results);
            } else {
                const results = await route.get({
                    account_id: accountId,
                });
                setSites(results);
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get sites`);
            }
        }
    };

    const getOptions = () => {
        const options: IFormSelectOption[] = [];
        if (sites) {
            sites.forEach((site) => {
                options.push({
                    value: site.site_id.toString(),
                    label: site.site_name,
                });
            });
            return options;
        }
        return [];
    };

    useEffect(() => {
        if (!serviceProviderAccountId) {
            setSite(null);
            setSites([]);
        }
        if (accountId) {
            getSites();
        } else {
            setSite(null);
            setSites([]);
        }
    }, [activeUser, serviceProviderAccountId, accountId]);

    if (
        accountType === AccountType.Evolon ||
        accountType === AccountType.ServiceProvider
    ) {
        const value = selectedSite?.site_name;
        return (
            <FormSelect
                id="site-select"
                placeholder="Select the Site"
                label="Site"
                tooltip="Select the Site"
                nodatamessage="No Sites Available"
                value={value}
                tabIndex={tabIndex}
                options={getOptions()}
                onItemClick={onItemClick}
                onItemClear={handleClear}
            />
        );
    }
    return null;
};

export default CustomerSelect;
