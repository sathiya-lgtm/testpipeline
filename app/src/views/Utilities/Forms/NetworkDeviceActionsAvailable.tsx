import { FC, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { IUser } from '../../../types/interfaces';

// Components
import ConfigureRowModal from '../../../components/Modals/NetworkDeviceActionsAvailable/Configure';
import DeleteRowModal from '../../../components/Modals/Delete/DeleteRow';
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
} from '../../../components/Grid/Grid';

import NetworkDeviceActionsAvailableRoute, {
    INetworkDeviceActionAvailable,
    IGetProps,
    ICreateProps,
    IUpdateProps,
    IDeleteProps,
} from '../../../api_calls/NetworkDeviceActionsAvailable';

interface INetworkDeviceActionAvailableProps {
    activeUser: IUser;
}

const NetworkDeviceActionsAvailable: FC<INetworkDeviceActionAvailableProps> = ({
    activeUser,
}: INetworkDeviceActionAvailableProps) => {
    // State
    const [filterValue, setFilterValue] = useState<string>('');

    const [networkDeviceActionsAvailable, setNetworkDeviceActionsAvailable] =
        useState<INetworkDeviceActionAvailable[] | null>(null);

    const [
        selectedNetworkDeviceActionAvailable,
        selectNetworkDeviceActionAvailable,
    ] = useState<INetworkDeviceActionAvailable | null>(null);

    const [showConfigureRowModal, setShowConfigureRowModal] =
        useState<boolean>(false);

    const [showDeleteRowModal, setShowDeleteRowModal] =
        useState<boolean>(false);

    const [
        isNewNetworkDeviceActionAvailable,
        setIsNewNetworkDeviceActionAvailable,
    ] = useState<boolean>(false);

    const isLoading = (): boolean => {
        if (!networkDeviceActionsAvailable) return true;
        return false;
    };

    const getCSVHeaders = () => {
        return [
            {
                key: 'network_device_action_available_name',
                header: 'NETWORK DEVICE ACTION AVAILABLE',
            },
            {
                key: 'name',
                header: 'FIELD NAME',
            },
            {
                key: 'label',
                header: 'FIELD LABEL',
            },
            {
                key: 'control',
                header: 'FIELD CONTROL',
            },
            {
                key: 'datatype',
                header: 'FIELD DATA TYPE',
            },
            {
                key: 'created_at',
                header: 'CREATED',
            },
            {
                key: 'updated_at',
                header: 'UPDATED',
            },
        ];
    };

    const getCSVData = () => {
        const CSVData: any[] = [];
        if (networkDeviceActionsAvailable) {
            networkDeviceActionsAvailable.map((ndaa) => {
                if (ndaa.properties.fields) {
                    ndaa.properties.fields.map((ndaaf) => {
                        CSVData.push({
                            network_device_action_available_name:
                                ndaa.network_device_action_available_name,
                            name: ndaaf.name,
                            label: ndaaf.label,
                            control: ndaaf.control,
                            datatype: ndaaf.datatype,
                            created_at: ndaa.created_at,
                            updated_at: ndaa.updated_at,
                        });
                        return ndaaf;
                    });
                } else {
                    CSVData.push({
                        network_device_action_available_name:
                            ndaa.network_device_action_available_name,
                        name: '(no field name)',
                        label: '(no field label)',
                        control: '(no field control)',
                        datatype: '(no field datatype)',
                        created_at: ndaa.created_at,
                        updated_at: ndaa.updated_at,
                    });
                }
                return ndaa;
            });
        }
        return CSVData;
    };

    const getNetworkDeviceActionsAvailable = async (props: IGetProps) => {
        try {
            const route = NetworkDeviceActionsAvailableRoute(activeUser);
            const results = await route.get(props);
            setNetworkDeviceActionsAvailable(results);
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get network device actions available.`);
            }
        }
    };

    const createNetworkDeviceActionsAvailable = async ({
        network_device_action_available_name,
        properties,
    }: ICreateProps) => {
        try {
            const route = NetworkDeviceActionsAvailableRoute(activeUser);
            const results = await route.insert({
                network_device_action_available_name,
                properties,
            });
            if (networkDeviceActionsAvailable) {
                const updatedNetworkDeviceActionsAvailable: INetworkDeviceActionAvailable[] =
                    [...networkDeviceActionsAvailable, results];
                setNetworkDeviceActionsAvailable(
                    updatedNetworkDeviceActionsAvailable
                );
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.warning(reason);
            } else {
                toast.error(`Failed to get network device actions available.`);
            }
        }
    };

    const updateNetworkDeviceActionsAvailable = async ({
        network_device_action_available_id,
        network_device_action_available_name,
        properties,
    }: IUpdateProps) => {
        try {
            const route = NetworkDeviceActionsAvailableRoute(activeUser);
            const results: INetworkDeviceActionAvailable = await route.update({
                network_device_action_available_id,
                network_device_action_available_name,
                properties,
            });
            if (networkDeviceActionsAvailable) {
                const updatedNetworkDeviceActionsAvailable: INetworkDeviceActionAvailable[] =
                    networkDeviceActionsAvailable.map(
                        (networkDeviceActionAvailable) => {
                            if (
                                networkDeviceActionAvailable.network_device_action_available_id ===
                                results.network_device_action_available_id
                            ) {
                                return results;
                            }
                            return networkDeviceActionAvailable;
                        }
                    );
                setNetworkDeviceActionsAvailable(
                    updatedNetworkDeviceActionsAvailable
                );
                toast.success(
                    `Successfully updated the ${network_device_action_available_name} network device action available.`
                );
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.warning(reason);
            } else {
                toast.error(`Failed to get network device actions available.`);
            }
        }
    };

    const deleteDeviceActionsAvailable = async ({
        network_device_action_available_id,
        network_device_action_available_name,
    }: IDeleteProps) => {
        try {
            const route = NetworkDeviceActionsAvailableRoute(activeUser);
            const success = await route.delete({
                network_device_action_available_id,
                network_device_action_available_name,
            });
            if (success) {
                setNetworkDeviceActionsAvailable((prevActions) => {
                    return (
                        prevActions as INetworkDeviceActionAvailable[]
                    )?.filter(
                        (action: INetworkDeviceActionAvailable) =>
                            action.network_device_action_available_id !==
                            network_device_action_available_id
                    );
                });
                toast.success(
                    `Successfully deleted the ${network_device_action_available_name} network device action available.`
                );
            } else {
                toast.error(
                    'Failed to delete network device actions available.'
                );
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.warning(reason);
            } else {
                toast.error(
                    'Failed to delete network device actions available.'
                );
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

    const onShowConfigureRowModal = (data: INetworkDeviceActionAvailable) => {
        selectNetworkDeviceActionAvailable(data);
        setIsNewNetworkDeviceActionAvailable(false);
        setShowConfigureRowModal(true);
    };

    const onCloseConfigureModal = () => {
        setIsNewNetworkDeviceActionAvailable(false);
        selectNetworkDeviceActionAvailable(null);
        setShowConfigureRowModal(false);
    };

    const onShowDeleteRowModal = (data: INetworkDeviceActionAvailable) => {
        setIsNewNetworkDeviceActionAvailable(false);
        selectNetworkDeviceActionAvailable(data);
        setShowDeleteRowModal(true);
    };

    const onCloseDeleteModal = () => {
        setIsNewNetworkDeviceActionAvailable(false);
        selectNetworkDeviceActionAvailable(null);
        setShowDeleteRowModal(false);
    };

    const onInsertNetworkDeviceActionAvailable = ({
        network_device_action_available_name,
        properties,
    }: INetworkDeviceActionAvailable) => {
        const props: ICreateProps = {
            network_device_action_available_name,
            properties,
        };
        createNetworkDeviceActionsAvailable(props);
        setIsNewNetworkDeviceActionAvailable(false);
        setShowConfigureRowModal(false);
        selectNetworkDeviceActionAvailable(null);
    };

    const onUpdateNetworkDeviceActionAvailable = ({
        network_device_action_available_id,
        network_device_action_available_name,
        properties,
    }: INetworkDeviceActionAvailable) => {
        updateNetworkDeviceActionsAvailable({
            network_device_action_available_id,
            network_device_action_available_name,
            properties,
        });
        setIsNewNetworkDeviceActionAvailable(false);
        selectNetworkDeviceActionAvailable(null);
        setShowConfigureRowModal(false);
    };

    const onShowAddNew = () => {
        setIsNewNetworkDeviceActionAvailable(true);
        selectNetworkDeviceActionAvailable(null);
        setShowConfigureRowModal(true);
    };

    const onDelete = ({
        network_device_action_available_id,
        network_device_action_available_name,
    }: INetworkDeviceActionAvailable) => {
        if (network_device_action_available_id) {
            deleteDeviceActionsAvailable({
                network_device_action_available_id,
                network_device_action_available_name,
            });
            setShowDeleteRowModal(false);
            selectNetworkDeviceActionAvailable(null);
        }
    };

    const renderRows = () => {
        if (networkDeviceActionsAvailable) {
            if (networkDeviceActionsAvailable.length > 0) {
                const rows = networkDeviceActionsAvailable.map(
                    (row: INetworkDeviceActionAvailable) => {
                        const gridRowKey = `grid-row-${row.network_device_action_available_id}`;
                        return (
                            <Row
                                key={gridRowKey}
                                filter={filterValue}
                                data={row}
                            >
                                <Cell
                                    caption={
                                        row.network_device_action_available_name ??
                                        'Action'
                                    }
                                />
                                <ConfigureCell
                                    tooltip={`Configure ${row.network_device_action_available_name}`}
                                    data={row}
                                    onConfigure={onShowConfigureRowModal}
                                />
                                <DeleteCell
                                    tooltip={`Delete ${row.network_device_action_available_name}`}
                                    data={row}
                                    onDelete={onShowDeleteRowModal}
                                />
                            </Row>
                        );
                    }
                );
                return rows;
            }
        }
        return null;
    };

    useEffect(() => {
        getNetworkDeviceActionsAvailable({});
    }, []);

    return (
        <motion.div
            id="NetworkDeviceActionsAvailable"
            key="NetworkDeviceActionsAvailable"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <form>
                <SearchBar
                    caption="Network Device Actions Available"
                    placeHolder="Enter Search Text"
                    object_name="network device action available"
                    filename="network_device_actions_available.csv"
                    onSearch={onSearch}
                    onClear={onClear}
                    onAddNew={onShowAddNew}
                    headers={getCSVHeaders()}
                    data={getCSVData()}
                />
                <Grid>
                    <Header>
                        <Column
                            caption="Network Device Action Name"
                            tooltip="The network device action name"
                        />
                        <ConfigureColumn visible={false} />
                        <DeleteColumn visible={false} />
                    </Header>
                    <Body
                        loading={isLoading()}
                        noData={networkDeviceActionsAvailable?.length === 0}
                        noDataMessage="Click + to add network device action available."
                    >
                        {renderRows()}
                    </Body>
                </Grid>
                <ConfigureRowModal
                    is_new={isNewNetworkDeviceActionAvailable}
                    show={showConfigureRowModal}
                    data={selectedNetworkDeviceActionAvailable}
                    onInsert={onInsertNetworkDeviceActionAvailable}
                    onUpdate={onUpdateNetworkDeviceActionAvailable}
                    onClose={onCloseConfigureModal}
                />
                <DeleteRowModal
                    what={
                        <strong>
                            {
                                selectedNetworkDeviceActionAvailable?.network_device_action_available_name
                            }
                        </strong>
                    }
                    show={showDeleteRowModal}
                    data={selectedNetworkDeviceActionAvailable}
                    onClose={onCloseDeleteModal}
                    onDelete={onDelete}
                />
            </form>
        </motion.div>
    );
};

export default NetworkDeviceActionsAvailable;
