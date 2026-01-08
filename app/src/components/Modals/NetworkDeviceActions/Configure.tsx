// React
import { FC, useContext, useEffect, useState, useMemo } from 'react';

// Third Party
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Api Calls
import getControllerURLByCameraId from '../../../api_calls/getControllerURLByCameraId';

// Hooks
import useControllerConnection from '../../../hooks/useControllerConnection';

// Components
import ModalBase from '../../ModalBase';
import FormInput, { IFormInputElement } from '../../Inputs/FormInput';
import { SaveButton, CancelButton } from '../../Button';
import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../ButtonGroup/ButtonGroup';
import LoadingModal from '../LoadingModal';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';

// Utils
import { setAppParam, getValue } from '../../Outlets/Home/Edge/dataFetching';

// Types
import { IUser } from '../../../types/interfaces';
import Hash from '../../../types/hash';

// Styles
import '../../../styles/components/Modals/ConfigureModal.scss';
import { INetworkDeviceAction } from '../../../api_calls/NetworkDeviceActions';

interface IPropertyField {
    name: string;
    label: string;
    control: string;
    datatype: string;
    value?: string | undefined | null;
    defaultValue: string;
    tooltip: string;
}

export interface IConfigureModalProps {
    show: boolean;
    data?: any | null | undefined;
    onSave?: (data: any) => void;
    onClose?: () => void;
}

const ConfigureModal: FC<IConfigureModalProps> = ({
    show,
    data,
    onSave,
    onClose,
}: IConfigureModalProps) => {
    const { activeUser } = useContext(AuthContext);

    const [cameraActionMessageContents, setCameraActionMessageContents] =
        useState<any[] | null>(null);

    const liveViewQuery = useQuery({
        queryKey: ['live-view', data?.camera_id],
        queryFn: () =>
            getControllerURLByCameraId({
                user: activeUser as IUser,
                camera_id: data?.camera_id as number,
            }),
        enabled: show && activeUser?.id === 1 && !!data?.camera_id,
    });

    const liveViewControllerURL = useMemo(() => {
        if (activeUser && activeUser.id === 1 && liveViewQuery.data && show) {
            return liveViewQuery.data;
        }

        if (activeUser && show && activeUser.id !== 1) {
            return activeUser.live_view_controller_url;
        }

        return '';
    }, [liveViewQuery.data, activeUser, show]);

    const { socket, sourceList, getSequence } = useControllerConnection({
        activeUser,
        liveViewControllerURL,
    });

    const activeSource = useMemo(() => {
        if (sourceList.length > 0 && data?.camera_id) {
            return sourceList.find(
                (source) => source.camera_id === data.camera_id
            );
        }

        return undefined;
    }, [sourceList, data]);
    const [testMessagePlaying, setTestMessagePlaying] = useState(false);
    const [fieldData, setFieldData] = useState<Hash<IPropertyField> | null>(
        null
    );

    const fieldHasChange = useMemo(() => {
        if (fieldData) {
            const keys = fieldData.keys();

            for (let i = 0; i < keys.length; i += 1) {
                const key = keys[i];
                const field = fieldData.get(key);
                const dataValue = data.properties[key];
                if (field) {
                    if (
                        field.datatype === 'String' &&
                        field.value?.toString() !== dataValue.toString()
                    ) {
                        return true;
                    }

                    if (
                        field.datatype === 'Integer' &&
                        parseInt(field?.value ?? '0', 10) !==
                            parseInt(dataValue, 10)
                    ) {
                        return true;
                    }

                    if (
                        field.datatype === 'Float' &&
                        parseFloat(field?.value ?? '0').toFixed(2) !==
                            parseFloat(dataValue).toFixed(2)
                    ) {
                        return true;
                    }
                }
            }
        }

        return false;
    }, [fieldData]);

    // Events
    const handleSave = () => {
        if (onSave && data && fieldData) {
            const properties: Record<string, any> = {};
            let isValidated = true;
            fieldData.keys().forEach((key: string) => {
                const field = fieldData.get(key);
                if (
                    field?.value === undefined ||
                    field?.value === null ||
                    field.value.toString().trim() === ''
                ) {
                    toast.warning(
                        `You must enter a valid value for the ${key} field.`
                    );
                    isValidated = false;
                    return;
                }
                switch (field.datatype) {
                    case 'String':
                        properties[key] = field.value;
                        break;
                    case 'Integer':
                        properties[key] = parseInt(field.value, 10) || 0;
                        break;
                    case 'Float':
                        properties[key] = parseFloat(field.value) || 0.0;
                        break;
                    default:
                        toast.warning(
                            `Unsupported datatype for the ${key} field.`
                        );
                }
            });

            if (isValidated) {
                onSave({
                    ...data,
                    properties,
                });
            }
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const onInputFieldChanged = (e: IFormInputElement) => {
        if (fieldData) {
            const updatedFieldData = fieldData.clone();
            const updatedField = fieldData.get(e.columnMap);
            if (updatedField) {
                updatedFieldData.set(e.columnMap, {
                    ...updatedField,
                    value: e.value,
                });
            }
            setFieldData(updatedFieldData ?? fieldData);
        }
    };

    const showMessageContent = () => {
        const networkDeviceActions = data.network_device_actions.filter(
            (networkDeviceAction: INetworkDeviceAction) => {
                return (
                    networkDeviceAction.camera_action_id ===
                    data.camera_action_id
                );
            }
        );

        if (networkDeviceActions) {
            // Map actions to promises
            const deviceActions = networkDeviceActions.map(
                (networkDeviceAction: INetworkDeviceAction) => {
                    const {
                        camera_action_properties,
                        network_device_properties,
                    } = networkDeviceAction;

                    const deviceAction = {
                        ...camera_action_properties,
                        ...network_device_properties,
                    };
                    // Execute the camera action promise
                    return deviceAction;
                }
            );

            console.log({ deviceActions });

            setCameraActionMessageContents(deviceActions);
        }
    };

    const executeAction = async (action: any): Promise<string> => {
        if (testMessagePlaying) {
            throw new Error('Execution of a test already in progress!');
        }

        if (!data) {
            throw new Error('Missing camera action data');
        }

        if (!socket) {
            throw new Error('Websocket not connected!');
        }

        if (!activeSource) {
            throw new Error('Active source is not set');
        }

        const socketMessageBody = { ...action };

        // We use ip_address on the insites side but edge uses ip
        if (socketMessageBody.ip_address) {
            socketMessageBody.ip = action.ip_address;
            delete socketMessageBody.ip_address;
        }

        console.log({ socketMessageBody });

        const result = await setAppParam({
            socket,
            sequence: getSequence(),
            source_id: activeSource.source_id,
            param: 'DeviceIO',
            value: JSON.stringify(socketMessageBody),
        });

        return getValue(result);
    };

    const playHorn = async () => {
        // Set loading flag
        setTestMessagePlaying(true);

        // Validate the networkd device actions
        const networkDeviceActions = data.network_device_actions.filter(
            (networkDeviceAction: INetworkDeviceAction) => {
                return (
                    networkDeviceAction.camera_action_id ===
                    data.camera_action_id
                );
            }
        );

        if (networkDeviceActions) {
            // Map actions to promises
            const promises = networkDeviceActions.map(
                (networkDeviceAction: INetworkDeviceAction) => {
                    const {
                        camera_action_properties,
                        network_device_properties,
                    } = networkDeviceAction;

                    const deviceAction = {
                        ...camera_action_properties,
                        ...network_device_properties,
                    };
                    // Execute the camera action promise
                    return executeAction(deviceAction);
                }
            );

            // Execute all actions concurrently
            await Promise.all(promises)
                .then((results) => {
                    let isError = false;
                    results.forEach((result) => {
                        if (result !== '200 OK') {
                            console.log({ result });
                            isError = true;
                        }
                    });
                    if (!isError) {
                        toast.success(
                            'Successfully executed cameras action(s).'
                        );
                    } else {
                        toast.error('Failed to execute cameras action(s)!');
                    }
                })
                .catch((error) => {
                    toast.error(
                        error.message || 'Failed to execute camera action.'
                    );
                })
                .finally(() => {
                    setTestMessagePlaying(false);
                });
        }
    };

    // Renders
    const onRenderFields = (): any => {
        const renderedFields: any[] = [];
        if (fieldData) {
            fieldData.keys().map((key: string) => {
                const field: IPropertyField | undefined = fieldData.get(key);
                if (field) {
                    if (field.control === 'Input') {
                        const fieldValue = field.value as string;
                        let type = 'text';

                        if (field.datatype === 'Integer') {
                            type = 'number';
                        }
                        renderedFields.push(
                            <div
                                key={`network-device-${field.name}`}
                                className="input-container form-item"
                            >
                                <FormInput
                                    id={`form-input-${field.name}`}
                                    columnMap={field.name}
                                    type={type}
                                    tooltip={field.tooltip}
                                    placeholder={`Enter the ${field.label}`}
                                    label={field.label}
                                    value={fieldValue as string}
                                    onChange={onInputFieldChanged}
                                    required
                                />
                            </div>
                        );
                    }
                }
                return field;
            });
        }
        return renderedFields;
    };

    useEffect(() => {
        if (data) {
            const { fields } = data.network_device_action_available_properties;
            const { properties } = data;
            const fieldDataHash = new Hash<IPropertyField>();
            fields.map((field: IPropertyField) => {
                if (field.datatype === 'String') {
                    fieldDataHash.set(field.name, {
                        ...field,
                        value: properties[field.name],
                    });
                }

                if (field.datatype === 'Integer') {
                    fieldDataHash.set(field.name, {
                        ...field,
                        value: properties[field.name],
                    });
                }

                if (field.datatype === 'Float') {
                    fieldDataHash.set(field.name, {
                        ...field,
                        value: properties[field.name],
                    });
                }
                return field;
            });
            setFieldData(fieldDataHash);
        }
    }, [data]);

    if (show) {
        return (
            <div className="configure-camera-actions-modal">
                <ModalBase
                    closeOnBackdropClick={false}
                    className="camera-actions-modal"
                    title="Configure Camera Action"
                    handleClose={handleClose}
                >
                    {onRenderFields()}

                    <ButtonGroup alignment={ButtonGroupAlignment.middleright}>
                        {data.network_device_actions &&
                            data.network_device_actions.length > 0 && (
                                <div>
                                    <button
                                        type="button"
                                        className="btn primary"
                                        onClick={playHorn}
                                    >
                                        Test Alert
                                    </button>

                                    {activeUser?.id === 1 &&
                                        !cameraActionMessageContents && (
                                            <button
                                                type="button"
                                                className="btn primary outline"
                                                onClick={showMessageContent}
                                            >
                                                View Message Contents
                                            </button>
                                        )}

                                    {activeUser?.id === 1 &&
                                        cameraActionMessageContents && (
                                            <button
                                                type="button"
                                                className="btn primary outline"
                                                onClick={() =>
                                                    setCameraActionMessageContents(
                                                        null
                                                    )
                                                }
                                            >
                                                Hide Message Contents
                                            </button>
                                        )}
                                </div>
                            )}

                        <SaveButton
                            id="camera-action-save"
                            onClick={handleSave}
                            visible={fieldHasChange}
                        />
                        <CancelButton
                            id="camera-action-cancel"
                            onClick={handleClose}
                        />
                    </ButtonGroup>

                    {cameraActionMessageContents && (
                        <pre>
                            {JSON.stringify(
                                cameraActionMessageContents,
                                null,
                                2
                            )}
                        </pre>
                    )}
                </ModalBase>
                {testMessagePlaying && (
                    <LoadingModal modalText="Sending message to device..." />
                )}
            </div>
        );
    }
    return null;
};

export default ConfigureModal;
