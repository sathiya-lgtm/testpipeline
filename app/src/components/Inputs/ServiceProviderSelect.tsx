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
import ServiceProviderAccountsRoute, {
    IServiceProviderAccount,
} from '../../api_calls/ServiceProviderAccounts';

interface ServiceProviderSelectProps {
    activeUser: IUser;
    serviceProviderAccountId: number | null;
    tabIndex?: number;
    onChange: (data: any) => void;
}

const ServiceProviderSelect: FC<ServiceProviderSelectProps> = ({
    activeUser,
    serviceProviderAccountId,
    tabIndex,
    onChange,
}) => {
    const [serviceProviderAccounts, setServiceProviderAccounts] = useState<
        IServiceProviderAccount[]
    >([]);
    const [selectedServiceProviderAccount, setServiceProviderAccount] =
        useState<IServiceProviderAccount | null>(null);
    const activeType = getAccountType(activeUser);

    const onItemClick = (data: IFormSelectOption) => {
        if (serviceProviderAccounts) {
            serviceProviderAccounts.forEach((serviceProviderAccount) => {
                if (
                    serviceProviderAccount.service_provider_account_id ===
                    Number(data.value)
                ) {
                    setServiceProviderAccount(serviceProviderAccount);
                    if (onChange) {
                        onChange(serviceProviderAccount);
                    }
                }
            });
        }
    };

    const onItemClear = () => {
        setServiceProviderAccount(null);
        if (onChange) {
            onChange(null);
        }
    };

    const getServiceProviderAccounts = async () => {
        try {
            const route = ServiceProviderAccountsRoute(activeUser);
            const results = await route.get({});
            setServiceProviderAccounts(results);
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get service provider accounts`);
            }
        }
    };

    const getOptions = (): IFormSelectOption[] => {
        const options: IFormSelectOption[] = [];
        if (serviceProviderAccounts) {
            serviceProviderAccounts.map((spa) => {
                options.push({
                    label: spa.service_provider_account_name,
                    value: spa.service_provider_account_id.toString(),
                });
                return spa;
            });
        }
        return options;
    };

    useEffect(() => {
        if (!serviceProviderAccountId) {
            setServiceProviderAccount(null);
        }
    }, [serviceProviderAccountId]);

    useEffect(() => {
        getServiceProviderAccounts();
    }, [activeUser]);

    if (activeType === AccountType.Evolon) {
        const value =
            selectedServiceProviderAccount?.service_provider_account_name;
        return (
            <FormSelect
                id="service-provider-select"
                tabIndex={tabIndex}
                placeholder="Select the Service Provider"
                label="Service Provider"
                tooltip="Select the Service Provider"
                nodatamessage="No Service Providers Avaiable"
                value={value}
                options={getOptions()}
                onItemClick={onItemClick}
                onItemClear={onItemClear}
            />
        );
    }
    return null;
};

export default ServiceProviderSelect;
