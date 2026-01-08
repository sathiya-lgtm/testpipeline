/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, { FC, useState, useEffect } from 'react';

// Third party
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { SingleValue, MultiValue } from 'react-select';
import { useQuery } from '@tanstack/react-query';

// Api Calls
import NetworkDeviceTypeRoute, {
    INetworkDeviceType,
    IGetProps as IGetNetworkDeviceTypeProps,
} from '../../../api_calls/NetworkDeviceType';
import NetworkDeviceRoute, {
    INetworkDevice,
    IGetProps,
    IUpdateProps,
    IDeleteProps,
} from '../../../api_calls/NetworkDevice';
import ServiceProviderAccountsRoute from '../../../api_calls/ServiceProviderAccounts';
import CustomersRoute from '../../../api_calls/Customers';
import SitesRoute from '../../../api_calls/Sites';

// Components
import DeleteRowModal from '../../../components/Modals/Delete/DeleteRow';
import ConfigureDialog from '../../../components/Modals/NetworkDevice/Configure';
import SearchBar from '../../../components/SearchBar/SearchBar';
import Grid, {
    Header,
    Column,
    ConfigureColumn,
    DeleteColumn,
    Body,
    Row,
    Cell,
    ConfigureCell,
    DeleteCell,
    StatusCell,
    CellAlignment,
} from '../../../components/Grid/Grid';
import Select from '../../../components/Inputs/Select';

// Types
import { SelectOption, IUser } from '../../../types/interfaces';
import { AccountType } from '../../../types/enums';

// Interfaces
interface IPropertyField {
    name: string;
    label: string;
    control: string;
    datatype: string;
    value: string | null | undefined;
}
interface INetworkDevicesProps {
    activeUser: IUser;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
}

const NetworkDevices: FC<INetworkDevicesProps> = ({
    activeUser,
    accountType,
    defaultServiceProvider,
}: INetworkDevicesProps) => {
    // Service Provider state
    const [serviceProviderOptions, setServiceProviderOptions] = useState<
        SelectOption[]
    >(defaultServiceProvider !== null ? [defaultServiceProvider] : []);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);

    // Customer state
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>([]);
    const [selectedCustomer, setSelectedCustomer] =
        useState<SingleValue<SelectOption> | null>(null);

    // Site State
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [selectedSites, setSelectedSites] = useState<any | null>(null);

    const [networkDeviceTypes, setNetworkDeviceTypes] = useState<
        INetworkDeviceType[] | null
    >(null);
    const [networkDevices, setNetworkDevices] = useState<
        INetworkDevice[] | null
    >(null);
    const [selectedNetworkDevice, setSelectedNetworkDevice] =
        useState<INetworkDevice | null>(null);
    const [fieldData, setFieldData] = useState<IPropertyField[] | null>(null);
    const [showConfigureDialog, toggleConfigureDialog] =
        useState<boolean>(false);
    const [showDeleteDialog, toggleDeleteDialog] = useState<boolean>(false);
    const [filterValue, setFilterValue] = useState<string>('');

    useQuery({
        queryFn: () =>
            ServiceProviderAccountsRoute(activeUser as IUser).get({}),
        queryKey: ['networkDevicesServiceProviderList'],
        enabled: !!activeUser && accountType === AccountType.Evolon,
        onSuccess: (data) => {
            const result = data.map((item) => {
                return {
                    value: item.service_provider_account_id.toString(),
                    label: item.service_provider_account_name,
                };
            });
            setServiceProviderOptions(result);
        },
    });

    useQuery({
        queryFn: () =>
            CustomersRoute(activeUser as IUser).get({
                service_provider_account_id: Number(
                    selectedServiceProvider?.value
                ),
            }),
        queryKey: [
            'networkDevicesCustomerList',
            selectedServiceProvider?.value,
        ],
        onSuccess: (data) => {
            const result = data.map((item) => {
                return {
                    value: item.account_id.toString(),
                    label: item.account_name,
                };
            });
            setCustomerOptions(result);
        },
        enabled: !!activeUser && !!selectedServiceProvider,
    });

    useQuery({
        queryFn: () =>
            SitesRoute(activeUser as IUser).get({
                service_provider_account_id: Number(
                    selectedServiceProvider?.value
                ),
                account_id: Number(selectedCustomer?.value),
            }),
        queryKey: [
            'networkDevicesSiteList',
            selectedServiceProvider?.value,
            selectedCustomer?.value,
        ],
        onSuccess: (data) => {
            const result = data.map((item) => {
                return {
                    value: item.site_id.toString(),
                    label: item.site_name,
                };
            });
            setSiteOptions(result);
        },
        enabled:
            !!activeUser && !!selectedServiceProvider && !!selectedCustomer,
    });

    const isLoading = (): boolean => {
        if (networkDevices === null) return true;
        return false;
    };

    const getNetworkDevices = async (props: IGetProps) => {
        try {
            const route = NetworkDeviceRoute(activeUser);
            const results = await route.get(props);
            setNetworkDevices(results);
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get network devices`);
            }
        }
    };

    const getNetworkDeviceTypes = async ({
        is_active,
    }: IGetNetworkDeviceTypeProps) => {
        try {
            const route = NetworkDeviceTypeRoute(activeUser);
            const results = await route.get({
                is_active,
            });
            setNetworkDeviceTypes(results);
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get network device types`);
            }
        }
    };

    const getNetworkDeviceTypeProperties = (networkDeviceTypeId: number) => {
        const networkDeviceTypeProperties: any[] = [];
        if (networkDeviceTypes) {
            networkDeviceTypes?.map((networkDeviceType) => {
                if (
                    networkDeviceType.network_device_type_id ===
                    networkDeviceTypeId
                ) {
                    networkDeviceType.properties.fields.map((field) => {
                        networkDeviceTypeProperties.push(field);
                        return field;
                    });
                }
                return networkDeviceTypes;
            });
        }
        return networkDeviceTypeProperties;
    };

    const getCSVHeaders = () => {
        return [
            { key: 'account_name', header: 'CUSTOMER' },
            { key: 'site_name', header: 'SITE' },
            {
                key: 'network_device_name',
                header: 'DEVICE NAME',
            },
            {
                key: 'network_device_type_name',
                header: 'DEVICE TYPE',
            },
            {
                key: 'properties.ip_address',
                header: 'IP ADDRESS',
            },
            {
                key: 'properties.user_name',
                header: 'USER NAME',
            },
            {
                key: 'properties.user_password',
                header: 'PASSWORD',
            },
            {
                key: 'is_active',
                header: 'ACTIVE',
            },
            { key: 'created_at', header: 'CREATED' },
            { key: 'updated_at', header: 'UPDATED' },
        ];
    };

    const updateNetworkDevice = async ({
        network_device_id,
        network_device_name,
        network_device_type_id,
        account_id,
        site_id,
        is_active,
        properties,
    }: IUpdateProps) => {
        try {
            const route = NetworkDeviceRoute(activeUser);
            const data = await route.update({
                network_device_id,
                network_device_name,
                network_device_type_id,
                account_id,
                site_id,
                is_active,
                properties,
            });
            if (data) {
                const updatedNetworkDevices: INetworkDevice[] = [];
                networkDevices?.map((networkDevice) => {
                    if (
                        Number(networkDevice.network_device_id) ===
                        Number(network_device_id)
                    ) {
                        updatedNetworkDevices.push(data);
                    } else {
                        updatedNetworkDevices.push(networkDevice);
                    }
                    return networkDevice;
                });
                setNetworkDevices(updatedNetworkDevices);
                toast.success(
                    `Succssfully updated the ${data?.network_device_name} network device.`
                );
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.warning(reason);
            } else {
                toast.error(
                    `Failed to update the ${selectedNetworkDevice?.network_device_name} network device`
                );
            }
        }
    };

    const deleteNetworkDevice = async ({ network_device_id }: IDeleteProps) => {
        try {
            const route = NetworkDeviceRoute(activeUser);
            const success = await route.delete({ network_device_id });
            if (success) {
                const newNetworkDevices: INetworkDevice[] = [];
                networkDevices?.map((networkDevice) => {
                    if (
                        Number(networkDevice.network_device_id) !==
                        network_device_id
                    ) {
                        newNetworkDevices.push(networkDevice);
                    }
                    return networkDevice;
                });
                setNetworkDevices(newNetworkDevices);
                toast.success(
                    `Succssfully deleted the ${selectedNetworkDevice?.network_device_name} network device.`
                );
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.warning(reason);
            } else {
                toast.error('Failed to delete the network device.');
            }
        }
    };

    // Events
    const onSearch = (searchValue: string) => {
        if (searchValue) {
            setFilterValue(searchValue);
        }
    };

    const onClear = () => {
        setFilterValue('');
    };

    const onCloseConfigureDialog = () => {
        setSelectedNetworkDevice(null);
        toggleConfigureDialog(false);
    };

    const onConfigureDialog = (row: INetworkDevice) => {
        const properties = getNetworkDeviceTypeProperties(
            row.network_device_type_id
        );
        setFieldData(properties);
        setSelectedNetworkDevice(row);
        toggleConfigureDialog(true);
    };

    const onUpdate = (row: INetworkDevice, updated: INetworkDevice) => {
        if (row && updated) {
            if (row.network_device_id === updated.network_device_id) {
                const props: IUpdateProps = {
                    ...updated,
                };
                // Update the network device
                updateNetworkDevice(props);
                toggleConfigureDialog(false);
                setSelectedNetworkDevice(null);
            }
        }
    };

    const onDeleteDialog = (row: INetworkDevice) => {
        setSelectedNetworkDevice(row);
        toggleDeleteDialog(true);
    };

    const onCloseDeletDialog = () => {
        toggleDeleteDialog(false);
        setSelectedNetworkDevice(null);
    };

    const onDelete = (data: INetworkDevice) => {
        const networkDeviceId = Number(data?.network_device_id);
        deleteNetworkDevice({
            network_device_id: networkDeviceId,
        });
        toggleDeleteDialog(false);
    };

    const handleCustomerSelect = async (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ) => {
        // Always reset following fields if user changes customers.
        setSelectedSites(null);
        setSiteOptions([]);

        // Then set selected customer.
        setSelectedCustomer(selectOption as SingleValue<SelectOption>);
    };

    const handleSiteSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Then set site.
        setSelectedSites(selectOption);
    };

    useEffect(() => {
        const fetchData = () => {
            let props: IGetProps = {};
            if (
                accountType === AccountType.Evolon &&
                selectedServiceProvider &&
                selectedCustomer &&
                selectedSites
            ) {
                props = {
                    service_provider_account_id: Number(
                        selectedServiceProvider.value
                    ),
                    account_id: Number(selectedCustomer.value),
                    site_id: Number(selectedSites.value),
                };
                getNetworkDevices(props);
            } else if (selectedCustomer && selectedSites) {
                props = {
                    service_provider_account_id: Number(
                        activeUser.service_provider_account
                    ),
                    account_id: Number(selectedCustomer.value),
                    site_id: Number(selectedSites.value),
                };
                getNetworkDevices(props);
            }
        };

        fetchData();

        const intervalId = setInterval(fetchData, 30000);

        return () => clearInterval(intervalId);
    }, [selectedCustomer, selectedServiceProvider, selectedSites, activeUser]);

    useEffect(() => {
        getNetworkDeviceTypes({
            is_active: true,
        });
    }, []);

    const renderNetworkDevices = () => {
        if (networkDevices) {
            if (networkDevices.length > 0) {
                const gridRows = networkDevices.map(
                    (networkDevice: INetworkDevice) => {
                        const gridRowKey = `grid-row-${networkDevice.network_device_id.toString()}`;
                        return (
                            <Row
                                key={gridRowKey}
                                filter={filterValue}
                                data={networkDevice}
                            >
                                <StatusCell
                                    device_status={Number(
                                        networkDevice.device_status
                                    )}
                                />
                                <Cell
                                    caption={
                                        networkDevice.account_name ??
                                        'No Account Name'
                                    }
                                />
                                <Cell
                                    caption={
                                        networkDevice?.site_name ??
                                        'No Site Name'
                                    }
                                />
                                <Cell
                                    caption={networkDevice.network_device_name}
                                />
                                <Cell
                                    caption={
                                        networkDevice.network_device_type_name
                                    }
                                />
                                <Cell
                                    caption={
                                        networkDevice.properties.ip_address
                                    }
                                />
                                {/* <ToggleCell
                                    active={networkDevice.is_active ?? false}
                                /> */}
                                <ConfigureCell
                                    data={networkDevice}
                                    // tooltip={`Configure ${networkDevice.network_device_name} network device`}
                                    onConfigure={onConfigureDialog}
                                />
                                <DeleteCell
                                    data={networkDevice}
                                    // tooltip={`Delete ${networkDevice.network_device_name} network device`}
                                    onDelete={onDeleteDialog}
                                />
                            </Row>
                        );
                    }
                );
                return gridRows;
            }
        }
        return null;
    };

    return (
        <motion.div
            id="NetworkDevices"
            key="NetworkDevices"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <form>
                <h3>Network Devices</h3>
                {accountType === AccountType.Evolon && (
                    <p style={{ fontWeight: 'bold' }}>
                        Select the Service Provider, Customer, and Site to
                        review the registered Network Devices
                    </p>
                )}
                {accountType === AccountType.ServiceProvider && (
                    <p>
                        Select the Customer and Site to review the registered
                        Network Devices
                    </p>
                )}

                {accountType === AccountType.Evolon && (
                    <div className="select-container field">
                        <label htmlFor="service-providers">
                            <span>Service Provider</span>
                            <span className="asterisk">*</span>
                        </label>
                        <Select
                            id="service-providers"
                            value={selectedServiceProvider}
                            onChange={(option) => {
                                setSelectedServiceProvider(
                                    option as SingleValue<SelectOption>
                                );
                                setSelectedCustomer(null);
                                setCustomerOptions([]);
                                setSelectedSites(null);
                                setSiteOptions([]);
                            }}
                            options={serviceProviderOptions}
                            isClearable={false}
                            disabled={defaultServiceProvider !== null}
                            required
                        />
                    </div>
                )}

                <div className="select-container field">
                    <label htmlFor="customers">
                        <span>Customer</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="customers"
                        value={selectedCustomer}
                        onChange={handleCustomerSelect}
                        placeholder="None"
                        options={customerOptions}
                        noOptionsMessage="A Service Provider with registered Customers must be selected first."
                        required
                    />
                </div>

                <div className="select-container field">
                    <label htmlFor="customers">
                        <span>Site</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="site-select"
                        value={selectedSites}
                        onChange={handleSiteSelect}
                        options={siteOptions}
                        required
                    />
                </div>

                {selectedCustomer && selectedSites && (
                    <>
                        <SearchBar
                            placeHolder="Enter Search Text"
                            object_name="network devices"
                            filename="network_devices.csv"
                            onSearch={onSearch}
                            onClear={onClear}
                            headers={getCSVHeaders()}
                            data={networkDevices}
                        />
                        <div style={{ overflowX: 'auto' }}>
                            <Grid>
                                <Header>
                                    <Column
                                        caption="Status"
                                        alignment={CellAlignment.center}
                                        width="110px"
                                        // tooltip="The staus of the network device"
                                    />
                                    <Column
                                        caption="Customer"
                                        alignment={CellAlignment.left}
                                        // tooltip="The customer acccount associated with network device"
                                    />
                                    <Column
                                        caption="Site"
                                        // tooltip="The customer site associated with network device"
                                    />
                                    <Column
                                        caption="Device Name"
                                        // tooltip="The name of the network device"
                                    />
                                    <Column
                                        caption="Device Type"
                                        // tooltip="The type of network device"
                                    />
                                    <Column
                                        caption="IP Address"
                                        // tooltip="The physical ip address network device"
                                    />
                                    {/* <Column
                        caption="Active"
                        tooltip="The network device is active (yes/no)"
                    /> */}
                                    <ConfigureColumn visible={false} />
                                    <DeleteColumn visible={false} />
                                </Header>
                                <Body
                                    loading={isLoading()}
                                    noData={networkDevices?.length === 0}
                                    noDataMessage="Navigate to Register Device section to add a new Network Device"
                                >
                                    {renderNetworkDevices()}
                                </Body>
                            </Grid>
                        </div>

                        <ConfigureDialog
                            show={showConfigureDialog}
                            networkDeviceFields={fieldData}
                            data={selectedNetworkDevice}
                            onSave={onUpdate}
                            onClose={onCloseConfigureDialog}
                        />
                        <DeleteRowModal
                            what={`${selectedNetworkDevice?.network_device_name}`}
                            show={showDeleteDialog}
                            data={selectedNetworkDevice}
                            onDelete={onDelete}
                            onClose={onCloseDeletDialog}
                        />
                    </>
                )}
            </form>
        </motion.div>
    );
};

export default NetworkDevices;
