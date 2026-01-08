import { FC, useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { IUser } from '../../../types/interfaces';

// Components
import ConfigureRowModal from '../../../components/Modals/NetworkDeviceType/Configure';
import SearchBar from '../../../components/SearchBar/SearchBar';
import Grid, {
    Header,
    Column,
    ConfigureColumn,
    Body,
    Row,
    Cell,
    ConfigureCell,
    ToggleCell,
    CellAlignment,
    CellSize,
} from '../../../components/Grid/Grid';

import NetworkDeviceTypeRoute, {
    INetworkDeviceType,
    IGetProps as IGetNetworkDeviceTypeProps,
    ICreateProps as ICreateNetworkDeviceTypeProps,
    IUpdateProps as IUpdateNetworkDeviceTypeProps,
} from '../../../api_calls/NetworkDeviceType';

interface INetworkDeviceTypesProps {
    activeUser: IUser;
}

const NetworkDeviceTypes: FC<INetworkDeviceTypesProps> = ({
    activeUser,
}: INetworkDeviceTypesProps) => {
    // State
    const [filterValue, setFilterValue] = useState<string>('');

    const [networkDeviceTypes, setNetworkDeviceTypes] = useState<
        INetworkDeviceType[] | null
    >(null);

    const [selectedNetworkDeviceType, selectNetworkDeviceType] =
        useState<INetworkDeviceType | null>(null);

    const [showConfigureRowModal, setShowConfigureRowModal] =
        useState<boolean>(false);

    const [isNewNetworkDeviceType, setIsNewNetworkDeviceType] =
        useState<boolean>(false);

    const isLoading = (): boolean => {
        if (networkDeviceTypes) return false;
        return true;
    };

    const getNetworkDeviceTypes = async (props: IGetNetworkDeviceTypeProps) => {
        try {
            const route = NetworkDeviceTypeRoute(activeUser);
            const results = await route.get(props);
            setNetworkDeviceTypes(results);
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get network device types.`);
            }
        }
    };

    const createNetworkDeviceType = async ({
        network_device_type_name,
        model,
        description,
        properties,
    }: ICreateNetworkDeviceTypeProps) => {
        try {
            const route = NetworkDeviceTypeRoute(activeUser);
            const results = await route.insert({
                network_device_type_name,
                model,
                description,
                properties,
            });
            setNetworkDeviceTypes((prev) => {
                return [...(prev as INetworkDeviceType[]), results];
            });
            toast.success(
                `Successfully created the network device type ${network_device_type_name}.`
            );
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.warning(reason);
            } else {
                toast.error(`Failed to create network device type.`);
            }
        }
    };

    const updateNetworkDeviceType = async ({
        network_device_type_id,
        network_device_type_name,
        model,
        description,
        is_active,
        properties,
    }: IUpdateNetworkDeviceTypeProps) => {
        try {
            const route = NetworkDeviceTypeRoute(activeUser);
            const results = await route.update({
                network_device_type_id,
                network_device_type_name,
                model,
                description,
                is_active,
                properties,
            });
            setNetworkDeviceTypes((prev) => {
                return (prev as INetworkDeviceType[])?.map(
                    (networkDeviceType: INetworkDeviceType) => {
                        if (
                            networkDeviceType.network_device_type_id ===
                            results.network_device_type_id
                        ) {
                            return results;
                        }
                        return networkDeviceType;
                    }
                );
            });
            toast.success(
                `Successfully updated the ${network_device_type_name} (${model}).`
            );
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.warning(reason);
            } else {
                toast.error(`Failed to get network device types.`);
            }
        }
    };

    // Events
    const onSearch = (searchValue: string) => {
        setFilterValue(searchValue);
    };

    const onClear = () => {
        setFilterValue('');
    };

    const onShowConfigureRowModal = (data: INetworkDeviceType) => {
        selectNetworkDeviceType(data);
        setIsNewNetworkDeviceType(false);
        setShowConfigureRowModal(true);
    };

    const onCloseConfigureModal = () => {
        selectNetworkDeviceType(null);
        setIsNewNetworkDeviceType(false);
        setShowConfigureRowModal(false);
    };

    const onInsert = (data: INetworkDeviceType) => {
        if (data) {
            createNetworkDeviceType(data);
            selectNetworkDeviceType(null);
            setIsNewNetworkDeviceType(false);
            setShowConfigureRowModal(false);
        } else {
            toast.warning(
                'Failed to create a new network device type missing data'
            );
        }
    };

    const onUpdate = (data: INetworkDeviceType) => {
        if (data) {
            updateNetworkDeviceType(data);
            selectNetworkDeviceType(null);
            setIsNewNetworkDeviceType(false);
            setShowConfigureRowModal(false);
        } else {
            toast.warning('Failed to update network device type missing data');
        }
    };

    const onShowAddNew = () => {
        selectNetworkDeviceType(null);
        setIsNewNetworkDeviceType(true);
        setShowConfigureRowModal(true);
    };

    const renderRows = () => {
        if (networkDeviceTypes) {
            const rows = networkDeviceTypes.map(
                (networkDeviceType: INetworkDeviceType) => {
                    const gridRowKey = `grid-row-${networkDeviceType.network_device_type_id.toString()}`;
                    return (
                        <Row
                            key={gridRowKey}
                            filter={filterValue}
                            data={networkDeviceType}
                        >
                            <Cell
                                size={CellSize.xlarge}
                                caption={
                                    networkDeviceType.network_device_type_name
                                }
                            />
                            <Cell
                                size={CellSize.large}
                                caption={networkDeviceType.model}
                            />
                            <Cell
                                size={CellSize.xlarge}
                                caption={networkDeviceType.description ?? ''}
                            />
                            <ToggleCell
                                active={networkDeviceType.is_active ?? false}
                            />
                            <ConfigureCell
                                tooltip={`Configure ${networkDeviceType.network_device_type_name}`}
                                data={networkDeviceType}
                                onConfigure={onShowConfigureRowModal}
                            />
                        </Row>
                    );
                }
            );
            return rows;
        }
        return null;
    };

    useEffect(() => {
        getNetworkDeviceTypes({});
    }, []);

    return (
        <motion.div
            id="NetworkDeviceTypes"
            key="NetworkDeviceTypes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <form>
                <SearchBar
                    caption="Network Devices Types"
                    placeHolder="Enter Search Text"
                    object_name="network device type"
                    filename="network_device_types.csv"
                    onSearch={onSearch}
                    onClear={onClear}
                    onAddNew={onShowAddNew}
                    headers={[
                        {
                            key: 'network_device_type_name',
                            header: 'DEVICE TYPE NAME',
                        },
                        { key: 'model', header: 'MODEL' },
                        { key: 'description', header: 'DESCRIPTION' },
                        { key: 'is_active', header: 'ACTIVE' },
                        { key: 'created_at', header: 'CREATED' },
                        { key: 'updated_at', header: 'UPDATED' },
                    ]}
                    data={networkDeviceTypes}
                />
                <Grid>
                    <Header>
                        <Column
                            caption="Name"
                            tooltip="Name of the network device type"
                        />
                        <Column
                            caption="Model"
                            tooltip="The model of the network device"
                        />
                        <Column
                            caption="Description"
                            tooltip="Description of the network device"
                        />
                        <Column
                            caption="Active"
                            alignment={CellAlignment.center}
                            tooltip="Is network device active"
                        />
                        <ConfigureColumn visible={false} />
                    </Header>
                    <Body
                        loading={isLoading()}
                        noData={networkDeviceTypes?.length === 0}
                        noDataMessage="Click the + to add new network device type"
                    >
                        {renderRows()}
                    </Body>
                </Grid>
                <ConfigureRowModal
                    is_new={isNewNetworkDeviceType}
                    show={showConfigureRowModal}
                    data={selectedNetworkDeviceType}
                    onInsert={onInsert}
                    onUpdate={onUpdate}
                    onClose={onCloseConfigureModal}
                />
            </form>
        </motion.div>
    );
};

export default NetworkDeviceTypes;
