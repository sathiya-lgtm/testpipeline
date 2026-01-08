import { FC, useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';

// SASS
import '../../../styles/components/Modals/NetworkDeviceActionAvailable.scss';

// Components
import { toast } from 'react-toastify';
import DownloadCSV from '../../DownloadCSV/DownloadCSV';
import ModalBase from '../../ModalBase';
import Input from '../../Inputs/Input';
import TabPanel, { TabPage } from '../../TabPanel/TabPanel';
import { SaveButton, DeleteButton, CancelButton } from '../../Button';
import Grid, {
    CellSize,
    Header,
    Column,
    EmptyColumn,
    CheckboxColumn,
    Body,
    Row,
    NewRow,
    Cell,
    SelectCell,
    InputCell,
    IconCell,
    CheckboxCell,
    EmptyCell,
    CellAlignment,
} from '../../Grid/Grid';
import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../ButtonGroup/ButtonGroup';

import {
    INetworkDeviceActionAvailable,
    INetworkDeviceActionAvailableField,
    INetworkDeviceActionAvailableProperties,
} from '../../../api_calls/NetworkDeviceActionsAvailable';
import Toolbar, { ToolbarAlignment } from '../../Toolbar/Toolbar';

interface IPropertyField {
    isnew: boolean;
    selected: boolean;
    changed: boolean;
    name: string;
    label: string;
    control: string;
    datatype: string;
    defaultValue: string;
    tooltip: string;
}

const NewField: IPropertyField = {
    isnew: true,
    selected: false,
    changed: true,
    name: '',
    label: '',
    control: 'Input',
    datatype: 'String',
    defaultValue: '',
    tooltip: '',
};

export interface IConfigureModalProps {
    show: boolean;
    is_new?: boolean;
    data?: INetworkDeviceActionAvailable | null;
    onInsert: (data: INetworkDeviceActionAvailable) => void;
    onUpdate: (data: INetworkDeviceActionAvailable) => void;
    onClose?: () => void;
}

const NewNetworkDeviceActionAvailable: INetworkDeviceActionAvailable = {
    network_device_action_available_id: 0,
    network_device_action_available_name: '',
    properties: { fields: [] },
};

const ConfigureRowModal: FC<IConfigureModalProps> = ({
    show,
    is_new,
    data,
    onInsert,
    onUpdate,
    onClose,
}: IConfigureModalProps) => {
    // State
    const [networkDeviceActionAvailable, setNetworkDeviceActionAvailable] =
        useState<INetworkDeviceActionAvailable | null>(
            data as INetworkDeviceActionAvailable
        );
    const [rowsSelected, setRowSelected] = useState<boolean>(false);
    const [fieldData, setFieldData] = useState<IPropertyField[] | null>(null);
    const [newField, setNewField] = useState<IPropertyField>(NewField);

    // Functions
    const getControlOptions = () => {
        return [
            { id: 'input', value: 'Input', label: 'Input' },
            { id: 'password', value: 'Password', label: 'Password' },
        ];
    };

    const getDataTypeOptions = () => {
        return [
            {
                id: 'string',
                value: 'String',
                label: 'String',
            },
            {
                id: 'integer',
                value: 'Integer',
                label: 'Integer',
            },
            {
                id: 'float',
                value: 'Float',
                label: 'Float',
            },
        ];
    };

    const isChanged = (): boolean => {
        let isFieldChanged: boolean = false;
        if (fieldData) {
            fieldData.forEach((field) => {
                if (field.changed) {
                    isFieldChanged = true;
                }
                if (field.isnew) {
                    isFieldChanged = true;
                }
                return field;
            });
            if (
                fieldData.length !==
                networkDeviceActionAvailable?.properties.fields.length
            ) {
                isFieldChanged = true;
            }
        }
        if (
            data?.network_device_action_available_name !==
            networkDeviceActionAvailable?.network_device_action_available_name
        ) {
            isFieldChanged = true;
        }
        return isFieldChanged;
    };

    const isRowSelected = () => {
        let isFieldSelected = false;
        if (fieldData) {
            fieldData.map((field) => {
                if (field.selected) {
                    isFieldSelected = true;
                }
                return fieldData;
            });
        }
        return isFieldSelected;
    };

    const getCSVHeaders = () => {
        return [
            {
                key: 'network_device_action_available_name',
                header: 'NETWORK DEVICE ACTION AVAILABLE NAME',
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
                key: 'defaultValue',
                header: 'FIELD DEFAULT VALUE',
            },
            {
                key: 'tooltip',
                header: 'FIELD TOOLTIP',
            },
        ];
    };

    const getCSVData = () => {
        const csvData: any[] = [];
        if (data && fieldData) {
            fieldData.map((field) => {
                csvData.push({
                    network_device_action_available_name:
                        networkDeviceActionAvailable?.network_device_action_available_name,
                    name: field.name,
                    label: field.label,
                    control: field.control,
                    datatype: field.datatype,
                    defaultValue: field.defaultValue,
                    tooltip: field.tooltip,
                });
                return field;
            });
        }
        return csvData;
    };

    // Events
    const handleSave = () => {
        // validate the properties
        if (
            !networkDeviceActionAvailable?.network_device_action_available_name
        ) {
            toast.warning(
                'The network device action available must be provided.'
            );
            return;
        }
        /// build the field properties
        const configureFields: INetworkDeviceActionAvailableField[] = [];
        if (fieldData) {
            fieldData.map((field) => {
                configureFields.push({
                    name: field.name,
                    label: field.label,
                    control: field.control,
                    datatype: field.datatype,
                    defaultValue: field.defaultValue,
                    tooltip: field.tooltip,
                });
                return field;
            });
        }
        const configureProperties: INetworkDeviceActionAvailableProperties = {
            fields: configureFields,
        };
        const configureData: INetworkDeviceActionAvailable = {
            network_device_action_available_id:
                networkDeviceActionAvailable?.network_device_action_available_id ??
                0,
            network_device_action_available_name:
                networkDeviceActionAvailable?.network_device_action_available_name ??
                '',
            properties: configureProperties,
        };
        setFieldData(null);
        setNewField(NewField);
        if (is_new) {
            if (onInsert) {
                onInsert(configureData);
            }
        }

        if (!is_new) {
            if (onUpdate) {
                onUpdate(configureData);
            }
        }
    };

    const handleDeleteSelected = () => {
        if (fieldData) {
            const updatedFieldData: IPropertyField[] = [];
            fieldData.map((field: IPropertyField) => {
                if (!field.selected) {
                    updatedFieldData.push(field);
                }
                return field;
            });
            setFieldData(updatedFieldData);
        }
    };

    const handleClose = () => {
        setFieldData(null);
        setNewField(NewField);
        if (onClose) {
            onClose();
        }
    };

    const onNetworkDeviceActionAvailableNameChanged = (value: string) => {
        if (networkDeviceActionAvailable) {
            setNetworkDeviceActionAvailable({
                ...networkDeviceActionAvailable,
                network_device_action_available_name: value,
            });
        }
    };

    const onSelectAllProperties = (checked: boolean) => {
        if (fieldData) {
            const updatedFields = fieldData.map((field) => ({
                ...field,
                selected: checked,
            }));
            setFieldData(updatedFields);
        }
        setRowSelected(checked);
    };

    const onInsertField = (propertyField: IPropertyField) => {
        if (fieldData) {
            let isDuplicateName = false;
            let isDuplicateLabel = false;
            fieldData.forEach((field) => {
                if (field.name === propertyField.name) {
                    isDuplicateName = true;
                }
                if (field.label === propertyField.label) {
                    isDuplicateLabel = true;
                }
                return field;
            });
            if (isDuplicateName) {
                toast.warning(
                    `You already have a name field set to ${propertyField.name} (Name must be unique)`
                );
            } else if (isDuplicateLabel) {
                toast.warning(
                    `You already have a label field set to ${propertyField.label}. (Label must be unique)`
                );
            } else if (!propertyField.name) {
                toast.warning(`The Name field cannot be empty.`);
            } else if (!propertyField.label) {
                toast.warning(`The Label field cannot be empty.`);
            } else {
                setFieldData([...fieldData, propertyField]);
                setNewField(NewField);
            }
        }
    };

    const onSelectProperty = (
        checked: boolean,
        updatedField: IPropertyField
    ) => {
        if (fieldData) {
            const updatedFields = fieldData.map((field) => {
                if (field.name === updatedField.name) {
                    return {
                        ...field,
                        selected: checked,
                    };
                }
                return field;
            });
            setFieldData(updatedFields);
        }
    };

    const onNewFieldNameChanged = (name: any) => {
        setNewField({
            ...newField,
            name,
        });
    };

    const onLabelChanged = (label: any) => {
        setNewField({
            ...newField,
            label,
        });
    };

    const onControlChanged = (control: any) => {
        setNewField({
            ...newField,
            control,
        });
    };

    const onDataTypeChanged = (datatype: any) => {
        setNewField({
            ...newField,
            datatype,
        });
    };

    const onDefaultValueChange = (defaultValue: any) => {
        setNewField({
            ...newField,
            defaultValue,
        });
    };

    const onTooltipChange = (tooltip: any) => {
        setNewField({
            ...newField,
            tooltip,
        });
    };

    const onEditChange = (
        field: IPropertyField,
        columnMap: string,
        changedValue: string
    ) => {
        // Set the fields values
        const label = columnMap === 'label' ? changedValue : field.label;
        const control = columnMap === 'control' ? changedValue : field.control;
        const datatype =
            columnMap === 'datatype' ? changedValue : field.datatype;
        const defaultValue =
            columnMap === 'defaultValue' ? changedValue : field.defaultValue;
        const tooltip = columnMap === 'tooltip' ? changedValue : field.tooltip;

        // Create new updated field data
        const updatedField: IPropertyField = {
            isnew: field.isnew,
            selected: field.selected,
            changed: true,
            name: field.name,
            label,
            control,
            datatype,
            defaultValue,
            tooltip,
        };
        setFieldData((prevFieldData) => {
            if (!prevFieldData) return null;
            return prevFieldData.map((prevField) =>
                prevField.name === field.name ? updatedField : prevField
            );
        });
    };

    // Renders
    const onRenderFieldRows = () => {
        if (fieldData) {
            const gridRows: any[] = fieldData.map((field: IPropertyField) => {
                return (
                    <Row key={field.name} data={field}>
                        <CheckboxCell
                            onClick={onSelectProperty}
                            data={field}
                            checked={field.selected}
                        />
                        <Cell size={CellSize.medium} caption={field.name} />
                        <Cell
                            size={CellSize.large}
                            caption={field.label}
                            canEdit
                            data={field}
                            columnMap="label"
                            onEditChange={onEditChange}
                        />
                        <Cell
                            size={CellSize.medium}
                            caption={field.control}
                            canEdit
                            data={field}
                            columnMap="control"
                            columnType="select"
                            columnOptions={[
                                { label: 'Input', value: 'Input' },
                                { label: 'Password', value: 'Password' },
                            ]}
                            onEditChange={onEditChange}
                        />
                        <Cell
                            size={CellSize.normal}
                            caption={field.datatype}
                            canEdit
                            data={field}
                            columnMap="datatype"
                            columnType="select"
                            columnOptions={[
                                { label: 'String', value: 'String' },
                                { label: 'Integer', value: 'Integer' },
                                { label: 'Float', value: 'Float' },
                            ]}
                            onEditChange={onEditChange}
                        />
                        <Cell
                            size={CellSize.normal}
                            alignment={CellAlignment.center}
                            caption={field.defaultValue}
                            canEdit
                            data={field}
                            columnMap="defaultValue"
                            onEditChange={onEditChange}
                        />
                        <Cell
                            size={CellSize.xlarge}
                            caption={field.tooltip}
                            canEdit
                            columnMap="tooltip"
                            data={field}
                            onEditChange={onEditChange}
                        />
                        <EmptyCell />
                    </Row>
                );
            });

            gridRows.push(
                <NewRow key="grid-new-row" visible>
                    <IconCell
                        Icon={FaSave}
                        onClick={onInsertField}
                        data={newField}
                    />
                    <InputCell
                        placeholder="Enter Name"
                        value={newField.name}
                        onChange={onNewFieldNameChanged}
                    />
                    <InputCell
                        placeholder="Enter Label"
                        value={newField.label}
                        onChange={onLabelChanged}
                    />
                    <SelectCell
                        id="configure-control-dropdown"
                        value={newField.control}
                        placeholder="Select Control"
                        options={getControlOptions()}
                        onSelectCellChanged={onControlChanged}
                    />
                    <SelectCell
                        id="configure-datatype"
                        placeholder="Select DataType"
                        value={newField.datatype}
                        options={getDataTypeOptions()}
                        onSelectCellChanged={onDataTypeChanged}
                    />
                    <InputCell
                        placeholder="Enter Default"
                        value={newField.defaultValue}
                        onChange={onDefaultValueChange}
                    />
                    <InputCell
                        placeholder="Enter Label"
                        value={newField.tooltip}
                        onChange={onTooltipChange}
                    />
                    <EmptyCell />
                </NewRow>
            );

            return gridRows;
        }
        return [];
    };

    useEffect(() => {
        if (is_new) {
            // TODO: Create a new
            setNetworkDeviceActionAvailable(NewNetworkDeviceActionAvailable);
        }

        if (!is_new && data) {
            setNetworkDeviceActionAvailable(data);
        }
    }, [data, is_new]);

    useEffect(() => {
        if (!show) {
            setNetworkDeviceActionAvailable(null);
        }
        const newFieldData: IPropertyField[] = [];
        if (networkDeviceActionAvailable?.properties) {
            const { fields } = networkDeviceActionAvailable.properties;
            if (fields) {
                fields.map((field) => {
                    newFieldData.push({
                        isnew: false,
                        selected: false,
                        changed: false,
                        name: field.name,
                        label: field.label,
                        control: field.control,
                        datatype: field.datatype,
                        defaultValue: field.defaultValue,
                        tooltip: field.tooltip,
                    });
                    return field;
                });
            }
        }
        setFieldData(newFieldData);
    }, [networkDeviceActionAvailable?.properties, show]);

    const title =
        is_new === true
            ? 'Add New Network Device Action Available'
            : 'Configure Network Device Action Available';
    if (show) {
        return (
            <div className="network-device-action-available-modal">
                <ModalBase
                    closeOnBackdropClick={false}
                    title={title}
                    handleClose={handleClose}
                >
                    <TabPanel>
                        <TabPage label="Settings">
                            <Input
                                id="network-device-action-available-name"
                                name="network-device-action-available-name"
                                className="input field"
                                label="Network Device Action Name"
                                type="text"
                                tooltip="The action available name for the network device type"
                                value={
                                    networkDeviceActionAvailable?.network_device_action_available_name ??
                                    ''
                                }
                                onChange={
                                    onNetworkDeviceActionAvailableNameChanged
                                }
                            />
                        </TabPage>
                        <TabPage label="Fields">
                            <Toolbar alignment={ToolbarAlignment.right}>
                                <DownloadCSV
                                    object_name="Network Device Action Available Field"
                                    filename="network_device_actions_available_fields.csv"
                                    headers={getCSVHeaders()}
                                    data={getCSVData()}
                                />
                            </Toolbar>
                            <div style={{ overflow: 'auto' }}>
                                <Grid>
                                    <Header>
                                        <CheckboxColumn
                                            checked={rowsSelected}
                                            onClick={onSelectAllProperties}
                                        />
                                        <Column
                                            caption="Name"
                                            tooltip="The name of the field"
                                            width="150px"
                                        />
                                        <Column
                                            caption="Label"
                                            tooltip="The label of the field"
                                        />
                                        <Column
                                            caption="Control"
                                            tooltip="The control of the field "
                                        />
                                        <Column
                                            caption="Data Type"
                                            tooltip="The data type of the field"
                                        />

                                        <Column
                                            caption="Default"
                                            tooltip="The default value of the field"
                                        />

                                        <Column
                                            caption="Tooltip"
                                            tooltip="The description of the field"
                                        />
                                        <EmptyColumn width="5px" />
                                    </Header>
                                    <Body>{onRenderFieldRows()}</Body>
                                </Grid>
                            </div>
                        </TabPage>
                    </TabPanel>
                    <ButtonGroup alignment={ButtonGroupAlignment.middleright}>
                        <SaveButton
                            id="save-configure-button"
                            onClick={handleSave}
                            visible={isChanged()}
                        />
                        <DeleteButton
                            id="delete-configure-button"
                            onClick={handleDeleteSelected}
                            visible={isRowSelected()}
                        />
                        <CancelButton
                            data-testid="cancel-configure-button"
                            onClick={handleClose}
                        />
                    </ButtonGroup>
                </ModalBase>
            </div>
        );
    }
    return null;
};

export default ConfigureRowModal;
