// Imports
import { FC, useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Sass
import '../../../styles/components/Modals/NetworkDeviceTypes.scss';

// Components
import ModalBase from '../../ModalBase';
import Input from '../../Inputs/Input';
import { CancelButton, DeleteButton, SaveButton } from '../../Button';
import Toggle from '../../Inputs/Toggle';
import Toolbar, { ToolbarAlignment } from '../../Toolbar/Toolbar';
import TabPanel, { TabPage } from '../../TabPanel/TabPanel';
import Grid, {
    CellSize,
    CellAlignment,
    Header,
    Column,
    CheckboxColumn,
    EmptyColumn,
    Body,
    Row,
    NewRow,
    Cell,
    CheckboxCell,
    EmptyCell,
    IconCell,
    InputCell,
    SelectCell,
} from '../../Grid/Grid';

import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../ButtonGroup/ButtonGroup';
import DownloadCSV from '../../DownloadCSV/DownloadCSV';
import {
    INetworkDeviceType,
    INetworkDeviceTypeField,
} from '../../../api_calls/NetworkDeviceType';

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

export interface IConfigureModalProps {
    show: boolean;
    is_new?: boolean;
    data?: INetworkDeviceType | null;
    onInsert?: (data: INetworkDeviceType) => void;
    onUpdate?: (data: INetworkDeviceType) => void;
    onClose?: () => void;
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

const ConfigureRowModal: FC<IConfigureModalProps> = ({
    show,
    is_new,
    data,
    onInsert,
    onUpdate,
    onClose,
}: IConfigureModalProps) => {
    // State
    const [rowsSelected, setRowsSelected] = useState<boolean>(false);
    const [fieldData, setFieldData] = useState<IPropertyField[] | null>(null);
    const [newField, setNewField] = useState<IPropertyField>(NewField);
    const [networkDeviceTypeName, setNetworkDeviceTypeName] =
        useState<string>('');
    const [networkDeviceTypeModel, setNetworkDeviceTypeModel] =
        useState<string>('');
    const [networkDeviceTypeDescription, setNetworkDeviceTypeDescription] =
        useState<string>('');
    const [networkDeviceTypeIsActive, setNetworkDeviceTypeIsActive] =
        useState<boolean>(false);
    const [networkDeviceTypeProperties, setNetworkDeviceTypeProperties] =
        useState<any | null>(null);

    // Functions
    const isLoading = (): boolean => {
        if (!fieldData) return true;
        return false;
    };

    const isChanged = (): boolean => {
        let isFieldChanged = false;
        if (is_new) return true;
        if (fieldData && networkDeviceTypeProperties) {
            fieldData?.forEach((field) => {
                if (field.isnew || field.changed) {
                    isFieldChanged = true;
                }
                return field;
            });
            if (networkDeviceTypeName !== data?.network_device_type_name) {
                isFieldChanged = true;
            }

            if (networkDeviceTypeModel !== data?.model) {
                isFieldChanged = true;
            }

            if (networkDeviceTypeDescription !== data?.description) {
                isFieldChanged = true;
            }

            if (networkDeviceTypeIsActive !== data?.is_active) {
                isFieldChanged = true;
            }

            if (
                networkDeviceTypeProperties.fields.length !== fieldData.length
            ) {
                isFieldChanged = true;
            }
        }

        return isFieldChanged;
    };

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

    const hasSelectedRows = (): boolean => {
        let rowSelected = false;
        if (fieldData) {
            fieldData.map((field: IPropertyField) => {
                if (field.selected) {
                    rowSelected = true;
                }
                return field;
            });
            return rowSelected;
        }
        return false;
    };

    const getCSVFields = () => {
        const CSVData: any = [];
        if (fieldData) {
            fieldData.map((field) => {
                CSVData.push({
                    network_device_type_name: data?.network_device_type_name,
                    model: data?.model,
                    description: data?.description,
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
        return CSVData;
    };

    const getCSVHeaders = () => {
        return [
            { key: 'network_device_type_name', header: 'NETWORK DEVICE TYPE' },
            { key: 'model', header: 'MODEL' },
            { key: 'description', header: 'DESCRIPTION' },
            { key: 'name', header: 'FIELD NAME' },
            { key: 'label', header: 'FIELD LABEL' },
            { key: 'control', header: 'FIELD CONTROL' },
            { key: 'datatype', header: 'FIELD DATATYPE' },
            { key: 'defaultValue', header: 'FIELD DEFAULT VALUE' },
            { key: 'tooltip', header: 'FIELD TOOLTIP' },
        ];
    };

    // Events
    const handleSave = () => {
        // Get the properties field data
        const updatedProperties: INetworkDeviceTypeField[] = [];

        if (fieldData) {
            fieldData.map((field) => {
                updatedProperties.push({
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
        const updatedData: INetworkDeviceType = {
            network_device_type_id: data?.network_device_type_id ?? 0,
            network_device_type_name: networkDeviceTypeName,
            model: networkDeviceTypeModel,
            description: networkDeviceTypeDescription,
            is_active: networkDeviceTypeIsActive,
            properties: { fields: updatedProperties },
        };

        setNetworkDeviceTypeName('');
        setNetworkDeviceTypeModel('');
        setNetworkDeviceTypeDescription('');
        setNetworkDeviceTypeIsActive(true);
        setNetworkDeviceTypeProperties({ fields: [] });
        setNewField(NewField);

        // Save the new network device type
        if (is_new) {
            if (onInsert) {
                onInsert(updatedData);
            }
        }

        // Update existing network device type
        if (!is_new) {
            if (onUpdate) {
                onUpdate(updatedData);
            }
        }
    };

    const handleClose = () => {
        setNetworkDeviceTypeName('');
        setNetworkDeviceTypeModel('');
        setNetworkDeviceTypeDescription('');
        setNetworkDeviceTypeIsActive(true);
        setNetworkDeviceTypeProperties({ fields: [] });
        setNewField(NewField);
        setFieldData(null);
        if (onClose) {
            onClose();
        }
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

    const onNewFieldNameChanged = (name: any) => {
        setNewField({ ...newField, name });
    };

    const onLabelChanged = (label: any) => {
        setNewField({ ...newField, label });
    };

    const onControlChanged = (control: any) => {
        setNewField({ ...newField, control });
    };

    const onDataTypeChanged = (datatype: any) => {
        setNewField({ ...newField, datatype });
    };

    const onDefaultValueChange = (defaultValue: any) => {
        setNewField({ ...newField, defaultValue });
    };

    const onTooltipChange = (tooltip: any) => {
        setNewField({ ...newField, tooltip });
    };

    const onSelectAllProperties = (checked: boolean) => {
        if (fieldData) {
            const updatedFields = fieldData.map((field) => ({
                ...field,
                selected: checked,
            }));
            setFieldData(updatedFields);
            setRowsSelected(checked);
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

    const onDeleteAllSelected = () => {
        setFieldData((prev) => {
            const updatedFieldData: IPropertyField[] = [];
            if (prev) {
                (prev as IPropertyField[]).map((field: IPropertyField) => {
                    if (!field.selected) {
                        updatedFieldData.push(field);
                    }
                    return field;
                });
            }
            return updatedFieldData;
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

    const onRenderPropertyRows = () => {
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
                        placeholder="Enter Default Value"
                        value={newField.defaultValue}
                        onChange={onDefaultValueChange}
                    />
                    <InputCell
                        placeholder="Enter the tooltip"
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
        if (!is_new) {
            if (data) {
                setNetworkDeviceTypeName(data?.network_device_type_name);
                setNetworkDeviceTypeModel(data?.model);
                setNetworkDeviceTypeDescription(data?.description);
                setNetworkDeviceTypeIsActive(data?.is_active);
                setNetworkDeviceTypeProperties(data?.properties);
            }
        } else {
            setNetworkDeviceTypeName('');
            setNetworkDeviceTypeModel('');
            setNetworkDeviceTypeDescription('');
            setNetworkDeviceTypeIsActive(true);
            setNetworkDeviceTypeProperties({});
            setFieldData([]);
        }
    }, [data]);

    useEffect(() => {
        setRowsSelected(hasSelectedRows());
    }, [fieldData]);

    useEffect(() => {
        const newFieldData: IPropertyField[] = [];
        if (networkDeviceTypeProperties) {
            const { fields } = networkDeviceTypeProperties;
            if (fields) {
                fields.forEach((field: IPropertyField) => {
                    newFieldData.push({
                        isnew: false,
                        changed: false,
                        selected: false,
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
    }, [networkDeviceTypeProperties, show]);

    const title =
        is_new === true
            ? 'Add New Network Device Type'
            : 'Configure Network Device Type';
    if (show) {
        return (
            <div className="network-device-type-modal">
                <ModalBase
                    closeOnBackdropClick={false}
                    title={title}
                    handleClose={handleClose}
                >
                    <TabPanel>
                        <TabPage label="Info">
                            <Input
                                id="network-device-name"
                                name="network-device-name"
                                className="input field"
                                label="Network Device Name"
                                type="text"
                                tooltip="The name of the network device type"
                                value={networkDeviceTypeName}
                                onChange={(newvalue) =>
                                    setNetworkDeviceTypeName(newvalue)
                                }
                            />
                            <Input
                                id="network-device-type-model"
                                name="network-device-type-model"
                                className="input field"
                                label="Model"
                                type="text"
                                tooltip="The model for the network device type"
                                value={networkDeviceTypeModel}
                                onChange={(newvalue) =>
                                    setNetworkDeviceTypeModel(newvalue)
                                }
                            />
                            <Input
                                id="network-device-type-description"
                                name="network-device-type-description"
                                className="input field"
                                label="Description"
                                type="text"
                                tooltip="The description of the network device type"
                                value={networkDeviceTypeDescription}
                                onChange={(newvalue) =>
                                    setNetworkDeviceTypeDescription(newvalue)
                                }
                            />
                            {!is_new && (
                                <div className="select-container form-item">
                                    <div style={{ marginRight: '20px' }}>
                                        Active
                                    </div>
                                    <Toggle
                                        id="network-device-type-is-active"
                                        toggleOnText="YES"
                                        toggleOffText="NO"
                                        value={networkDeviceTypeIsActive}
                                        onToggleChange={() =>
                                            setNetworkDeviceTypeIsActive(
                                                !networkDeviceTypeIsActive
                                            )
                                        }
                                        disabled={is_new}
                                    />
                                </div>
                            )}
                        </TabPage>
                        <TabPage label="Fields">
                            <Toolbar alignment={ToolbarAlignment.right}>
                                <DownloadCSV
                                    object_name="Network Device Type Fields"
                                    filename="network_device_type_fields.csv"
                                    data={getCSVFields()}
                                    headers={getCSVHeaders()}
                                />
                            </Toolbar>
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
                                        width="150px"
                                    />
                                    <Column
                                        caption="Control"
                                        tooltip="The type of input"
                                        width="150px"
                                    />
                                    <Column
                                        caption="Data Type"
                                        tooltip="The data type for the field"
                                        width="150px"
                                    />
                                    <Column
                                        caption="Default"
                                        tooltip="The default value of the field"
                                        width="180px"
                                    />
                                    <Column
                                        caption="Tooltip"
                                        tooltip="The description of the field"
                                        width="225px"
                                    />
                                    <EmptyColumn width="5px" />
                                </Header>
                                <Body loading={isLoading()}>
                                    {onRenderPropertyRows()}
                                </Body>
                            </Grid>
                        </TabPage>
                    </TabPanel>
                    <ButtonGroup alignment={ButtonGroupAlignment.middleright}>
                        <SaveButton
                            id="save-configure-button"
                            data-testid="save-configure-button"
                            data={data}
                            onClick={handleSave}
                            visible={isChanged()}
                        />
                        <DeleteButton
                            id="delete-configure-button"
                            data-testid="cancel-configure-button"
                            onClick={onDeleteAllSelected}
                            visible={hasSelectedRows()}
                        />
                        <CancelButton
                            id="cancel-configure-button"
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
