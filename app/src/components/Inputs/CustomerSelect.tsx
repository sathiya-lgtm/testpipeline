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
import CustomersRoute, { ICustomer } from '../../api_calls/Customers';

interface CustomerSelectProps {
    tabIndex?: number | undefined;
    activeUser: IUser;
    serviceProviderAccountId?: number | null;
    accountId?: number | null;
    onChange: (data: any) => void;
}

const CustomerSelect: FC<CustomerSelectProps> = ({
    tabIndex,
    activeUser,
    serviceProviderAccountId,
    accountId,
    onChange,
}) => {
    const [customers, setCustomers] = useState<ICustomer[]>([]);
    const [selectedCustomer, setCustomer] = useState<ICustomer | null>(null);
    const accountType = getAccountType(activeUser);
    const onItemClick = (data: IFormSelectOption) => {
        customers.forEach((customer) => {
            if (customer.account_id === Number(data.value)) {
                setCustomer(customer);
                if (onChange) {
                    onChange(customer);
                }
            }
        });
    };

    const handleClear = () => {
        setCustomer(null);
        if (onChange) {
            onChange(null);
        }
    };

    const getCustomers = async () => {
        try {
            const route = CustomersRoute(activeUser);
            let results;
            if (accountType === AccountType.Evolon) {
                results = await route.get({
                    service_provider_account_id: serviceProviderAccountId,
                });
            } else {
                results = await route.get({});
            }
            setCustomers(results);
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get service provider accounts`);
            }
        }
    };

    const getOptions = () => {
        const options: IFormSelectOption[] = [];
        if (customers) {
            customers.forEach((customer) => {
                options.push({
                    value: customer.account_id.toString(),
                    label: customer.account_name,
                });
            });
            return options;
        }
        return [];
    };

    useEffect(() => {
        if (!accountId) {
            setCustomer(null);
        }
        if (
            serviceProviderAccountId ||
            accountType === AccountType.ServiceProvider
        ) {
            getCustomers();
        } else {
            setCustomers([]);
        }
    }, [activeUser, serviceProviderAccountId, accountId, selectedCustomer]);

    if (
        accountType === AccountType.Evolon ||
        accountType === AccountType.ServiceProvider
    ) {
        const value = selectedCustomer?.account_name;
        return (
            <FormSelect
                id="customer-select"
                placeholder="Select the Customer"
                label="Customer"
                tooltip="Select the Customer"
                nodatamessage="No Customers Available"
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
