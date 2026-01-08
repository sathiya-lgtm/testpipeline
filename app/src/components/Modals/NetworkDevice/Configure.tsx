import { FC, useState, useEffect } from 'react';
import {
    INetworkDevice,
    INetworkDeviceProperites,
} from '../../../api_calls/NetworkDevice';

// SASS
import '../../../styles/components/Modals/NetworkDevices.scss';

// Components
import ModalBase from '../../ModalBase';
import FormInput, { IFormInputElement } from '../../Inputs/FormInput';
import FormPasswordInput from '../../Inputs/FormPasswordInput';
import { SaveButton, CancelButton } from '../../Button';
// import Toggle from '../../Inputs/Toggle';

import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../ButtonGroup/ButtonGroup';

interface IPropertyField {
    name: string;
    label: string;
    control: string;
    datatype: string;
    value: string | number | undefined | null;
}

export interface IConfigureModalProps {
    show: boolean;
    networkDeviceFields?: IPropertyField[] | null | undefined;
    data?: INetworkDevice | null | undefined;
    onSave?: (row: INetworkDevice, update: INetworkDevice) => void;
    onClose?: () => void;
}

const ConfigureModal: FC<IConfigureModalProps> = ({
    show,
    networkDeviceFields,
    data,
    onSave,
    onClose,
}: IConfigureModalProps) => {
    // State
    const [networkDevice, setNetworkDevice] = useState<
        INetworkDevice | null | undefined
    >(null);
    const [fieldData, setFieldData] = useState<
        IPropertyField[] | null | undefined
    >(null);
    // Functions
    const isChanged = () => {
        if (data?.network_device_name !== networkDevice?.network_device_name)
            return true;
        if (data?.is_active !== networkDevice?.is_active) return true;
        let isFieldChanged = false;
        if (fieldData && data) {
            const { properties } = data;
            fieldData.map((field) => {
                const oldValue = properties[field.name];
                const newValue = field.value;
                if (oldValue !== newValue) {
                    isFieldChanged = true;
                }
                return field;
            });
        }
        return isFieldChanged;
    };

    // Events
    const handleSave = () => {
        if (onSave && data) {
            const networkDeviceProperties: INetworkDeviceProperites = {};
            if (fieldData) {
                fieldData.map((field) => {
                    networkDeviceProperties[field.name] = field.value;
                    return field;
                });
            }
            const newData: INetworkDevice = {
                network_device_id: Number(networkDevice?.network_device_id),
                network_device_name: networkDevice?.network_device_name ?? '',
                network_device_type_id: Number(
                    networkDevice?.network_device_type_id
                ),
                network_device_type_name:
                    networkDevice?.network_device_type_name ?? '',
                account_id: Number(networkDevice?.account_id),
                account_name: networkDevice?.account_name ?? '',
                site_id: Number(networkDevice?.site_id),
                site_name: networkDevice?.site_name ?? '',
                is_active: networkDevice?.is_active,
                properties: networkDeviceProperties,
            };
            onSave(data, newData);
        }
    };
    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const onInputFieldChanged = (property: IFormInputElement) => {
        if (property.columnMap === 'network_device_name' && networkDevice) {
            setNetworkDevice({
                ...networkDevice,
                network_device_name: property.value as string,
            });
        } else {
            const newFieldData = fieldData?.map((field) => {
                if (field.name === property.columnMap) {
                    return { ...field, value: property.value };
                }
                return field;
            });
            setFieldData(newFieldData);
        }
    };

    const onPasswordsMatched = (
        matched: boolean,
        property: IFormInputElement
    ) => {
        if (fieldData) {
            const updatedFields = fieldData.map((field) => {
                if (field.name === property.columnMap) {
                    return {
                        ...field,
                        matched,
                    };
                }
                return field;
            });
            setFieldData(updatedFields);
        }
    };

    // const onIsActiveChanged = () => {
    //     if (networkDevice) {
    //         const updatedNetworkDevice = {
    //             ...networkDevice,
    //             is_active: !networkDevice?.is_active,
    //         };
    //         setNetworkDevice(updatedNetworkDevice);
    //     }
    // };

    const onRenderNetworkDeviceProperties = () => {
        const renderedFields: any[] = [];
        if (fieldData && data) {
            fieldData.map((networkDeviceField) => {
                if (networkDeviceField.control === 'Input') {
                    renderedFields.push(
                        <div
                            key={`network-device-${networkDeviceField.name}`}
                            className="input-container form-item"
                        >
                            <FormInput
                                id="network-device-name"
                                columnMap={networkDeviceField.name}
                                tooltip={`The ${networkDeviceField.label} for the network device`}
                                placeholder={`Enter the ${networkDeviceField.label}`}
                                label={networkDeviceField.label}
                                value={networkDeviceField.value as string}
                                onChange={onInputFieldChanged}
                                required
                            />
                        </div>
                    );
                }
                if (networkDeviceField.control === 'Password') {
                    const { properties } = data;
                    const initialValue = properties[networkDeviceField.name];
                    renderedFields.push(
                        <div
                            key={`network-device-${networkDeviceField.name}`}
                            className="input-container form-item"
                        >
                            <FormPasswordInput
                                columnMap={networkDeviceField.name}
                                tooltip={`The ${networkDeviceField.label} for the network device`}
                                placeholder={`Enter the ${networkDeviceField.label}`}
                                label={networkDeviceField.label}
                                value={networkDeviceField.value as string}
                                initialValue={initialValue}
                                showConfirm
                                onPasswordsMatched={onPasswordsMatched}
                                onChange={onInputFieldChanged}
                                required
                            />
                        </div>
                    );
                }
                return networkDeviceField;
            });
        }
        return renderedFields;
    };

    useEffect(() => {
        if (data) {
            setNetworkDevice(data);
        }
    }, [data]);

    useEffect(() => {
        if (networkDeviceFields && data) {
            const newFieldData = networkDeviceFields.map(
                (networkDeviceField) => {
                    return {
                        ...networkDeviceField,
                        value: data.properties[networkDeviceField.name],
                    };
                }
            );
            setFieldData(newFieldData);
        }
    }, [networkDeviceFields, data]);

    if (show) {
        return (
            <div className="network-device-configure-modal">
                <ModalBase
                    closeOnBackdropClick={false}
                    title="Configure Network Device"
                    handleClose={handleClose}
                >
                    <div className="inner-body">
                        <FormInput
                            id="network-device-name"
                            columnMap="network_device_name"
                            label="Network Device Name"
                            tooltip="The Network Device Name"
                            value={networkDevice?.network_device_name ?? ''}
                            onChange={onInputFieldChanged}
                        />
                        {onRenderNetworkDeviceProperties()}
                        {/* <div className="select-container form-item">
                            <div style={{ marginRight: '20px' }}>Active</div>
                            <Toggle
                                id="network-device-is-active"
                                toggleOnText="YES"
                                toggleOffText="NO"
                                value={networkDevice?.is_active ?? false}
                                onToggleChange={onIsActiveChanged}
                            />
                        </div> */}
                    </div>
                    <ButtonGroup alignment={ButtonGroupAlignment.middleright}>
                        <SaveButton
                            id="save-configure-button"
                            onClick={handleSave}
                            visible={isChanged()}
                        />
                        <CancelButton
                            id="cancel-configure-button"
                            onClick={handleClose}
                        />
                    </ButtonGroup>
                </ModalBase>
            </div>
        );
    }
    return null;
};

export default ConfigureModal;
