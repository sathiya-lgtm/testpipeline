// React
import React, { FC, useEffect, useState } from 'react';

// Third party
import { toast } from 'react-toastify';
import { SingleValue, MultiValue } from 'react-select';
import { motion } from 'framer-motion';

// Custom
import NetworkDeviceTypeRoute, {
    INetworkDeviceType,
    INetworkDeviceTypeField,
    INetworkDeviceTypeProperties,
    IGetProps as IGetNetworkDeviceTypeProps,
} from '../../../api_calls/NetworkDeviceType';
import NetworkDeviceRoute, {
    ICreateProps,
    INetworkDeviceProperites,
} from '../../../api_calls/NetworkDevice';

// Custom types
import { AccountType } from '../../../types/enums';
import { IUser, SelectOption } from '../../../types/interfaces';

// Components
import Select from '../../../components/Inputs/Select';
import Button from '../../../components/Button';
import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../../components/ButtonGroup/ButtonGroup';
import FormInput from '../../../components/Inputs/FormInput';
import FormPasswordInput from '../../../components/Inputs/FormPasswordInput';
import ServiceProviderSelect from '../../../components/Inputs/ServiceProviderSelect';
import CustomerSelect from '../../../components/Inputs/CustomerSelect';
import SiteSelect from '../../../components/Inputs/SiteSelect';
import { IServiceProviderAccount } from '../../../api_calls/ServiceProviderAccounts';
import { ICustomer } from '../../../api_calls/Customers';
import { ISiteData } from '../../../api_calls/Sites';

interface IProps {
    activeUser: IUser;
    accountType: AccountType;
}

interface IPropertyField extends INetworkDeviceTypeField {
    value: string;
    matched: boolean;
}

const RegisterNetworkDevice: FC<IProps> = ({ activeUser, accountType }) => {
    const [serviceProviderAccountId, setServiceProviderAccountId] = useState<
        number | null
    >(null);
    const [accountId, setAccountId] = useState<number | null>(null);
    const [siteId, setSiteId] = useState<number | null>(null);
    const [networkDeviceName, setNetworkDeviceName] = useState('');
    const [selectedNetworkDeviceType, setSelectedNetworkDeviceType] =
        useState<SingleValue<SelectOption> | null>(null);

    const [networkDeviceTypeProperties, setNetworkDeviceTypeProperties] =
        useState<INetworkDeviceTypeProperties | null>(null);

    const [fieldData, setFieldData] = useState<IPropertyField[] | null>(null);

    const resetForm = () => {
        if (accountType === AccountType.Evolon) {
            setServiceProviderAccountId(null);
        } else {
            const spaId = Number(activeUser.service_provider_account);
            setServiceProviderAccountId(spaId);
        }
        setAccountId(null);
        setSiteId(null);
        setSelectedNetworkDeviceType(null);
        setNetworkDeviceName('');
        setFieldData(null);
        setNetworkDeviceTypeProperties(null);
    };

    const createNetworkDevice = async (props: ICreateProps) => {
        try {
            const route = NetworkDeviceRoute(activeUser);
            const data = await route.insert(props);
            toast.success(
                `Successfully created the ${data.network_device_name} network device.`
            );
            resetForm();
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.warning(reason);
            } else {
                toast.error('Failed to update the network device.');
            }
        }
    };

    const [networkDeviceTypes, setNetworkDeviceTypes] = useState<
        INetworkDeviceType[] | null
    >([]);

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

    const getNetworkDeviceTypeOptions = (): SelectOption[] => {
        if (networkDeviceTypes) {
            const options = networkDeviceTypes.map(
                (item: INetworkDeviceType) => {
                    const option = {
                        value: Number(item.network_device_type_id),
                        label: `${item.network_device_type_name} (${item.model})`,
                    };
                    return option;
                }
            );
            return options;
        }
        return [];
    };

    const getNetworkDeviceTypeProperties = (
        networkDeviceTypeId: number
    ): INetworkDeviceTypeProperties => {
        let properties: INetworkDeviceTypeProperties = { fields: [] };
        if (networkDeviceTypes) {
            networkDeviceTypes.map((networkDeviceType) => {
                if (
                    networkDeviceType.network_device_type_id ===
                    networkDeviceTypeId
                ) {
                    properties = networkDeviceType.properties;
                }
                return networkDeviceType;
            });
        }
        return properties;
    };

    const getNetworkDeviceProperties = () => {
        const networkDeviceProperties: INetworkDeviceProperites = {};
        if (fieldData) {
            fieldData.map((field: IPropertyField) => {
                const fieldValue = field.value ?? field.defaultValue ?? '';
                if (field.datatype === 'String') {
                    networkDeviceProperties[field.name] = fieldValue;
                } else if (field.datatype === 'Integer') {
                    const integerValue = parseInt(fieldValue, 10) || 0;
                    networkDeviceProperties[field.name] = integerValue;
                } else if (field.datatype === 'Float') {
                    const floatValue = parseFloat(fieldValue as string) || 0.0;
                    networkDeviceProperties[field.name] = floatValue;
                } else if (field.datatype === 'Boolean') {
                    let boolValue = false;
                    if ((fieldValue as string).toLowerCase() === 'yes') {
                        boolValue = true;
                    } else if (
                        (fieldValue as string).toLowerCase() === 'true'
                    ) {
                        boolValue = true;
                    }
                    networkDeviceProperties[field.name] = boolValue;
                }
                return field;
            });
        }
        return networkDeviceProperties;
    };

    const isNetworkDeviceReady = (): boolean => {
        if (accountType === AccountType.Evolon) {
            if (!serviceProviderAccountId) return false;
        }
        if (!accountId) return false;
        if (!siteId) return false;
        if (!networkDeviceName) return false;
        if (!selectedNetworkDeviceType?.value) return false;
        if (!networkDeviceTypeProperties) return false;
        if (fieldData) {
            let isFieldsReady = true;
            fieldData.map((field) => {
                if (field.value === null || field.value === undefined) {
                    isFieldsReady = false;
                }
                if (field.control === 'Password') {
                    if (!field.matched) {
                        isFieldsReady = false;
                    }
                }
                return field;
            });
            if (!isFieldsReady) return false;
        }

        return true;
    };

    const handleSubmit = async (): Promise<void> => {
        createNetworkDevice({
            network_device_name: networkDeviceName,
            network_device_type_id: Number(selectedNetworkDeviceType?.value),
            account_id: Number(accountId),
            site_id: Number(siteId),
            properties: getNetworkDeviceProperties(),
        });
    };

    const handleNetworkDeviceTypeSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        // Then set network device type.
        const option = selectOption as SingleValue<SelectOption>;
        setSelectedNetworkDeviceType(option);
        if (option) {
            const properties = getNetworkDeviceTypeProperties(
                Number(option.value)
            );
            if (properties) {
                setNetworkDeviceTypeProperties(properties);
            }
        }
    };

    const onInputFieldChanged = (e: any) => {
        if (e.columnMap === 'network_device_name') {
            setNetworkDeviceName(e.value);
        } else {
            const newFieldData = fieldData?.map((field) => {
                if (field.name === e.columnMap) {
                    return { ...field, value: e.value };
                }
                return field;
            });
            setFieldData(newFieldData ?? fieldData);
        }
    };

    const onPasswordsMatched = (matched: boolean, property: any) => {
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

    const onChangeServiceProviderAccount = (data: IServiceProviderAccount) => {
        if (data) {
            setServiceProviderAccountId(data.service_provider_account_id);
        } else {
            setServiceProviderAccountId(null);
            setAccountId(null);
            setSiteId(null);
        }
    };

    const onChangeAccount = (data: ICustomer) => {
        if (data) {
            setAccountId(data.account_id);
        } else {
            setAccountId(null);
            setSiteId(null);
        }
    };

    const onChangeSite = (data: ISiteData) => {
        if (data) {
            setSiteId(data.site_id);
        } else {
            setSiteId(null);
        }
    };

    const renderNetworkDeviceTypeSection = () => {
        if (fieldData) {
            const networkTypeFields: any[] = [];
            fieldData.map((field) => {
                if (field.control === 'Input') {
                    networkTypeFields.push(
                        <div
                            key={`network-device-${field.name}`}
                            className="input-container form-item"
                        >
                            <FormInput
                                id={`network-device-${field.name}`}
                                columnMap={field.name}
                                tooltip={field.tooltip}
                                placeholder={`Enter the ${field.label}`}
                                label={field.label}
                                value={
                                    (field.value ??
                                        field.defaultValue) as string
                                }
                                onChange={onInputFieldChanged}
                                required
                            />
                        </div>
                    );
                } else if (field.control === 'Password') {
                    networkTypeFields.push(
                        <div
                            key={`network-device-${field.name}`}
                            className="input-container form-item"
                        >
                            <FormPasswordInput
                                columnMap={field.name}
                                tooltip={field.tooltip}
                                placeholder={`Enter the ${field.label}`}
                                label={field.label}
                                value={
                                    (field.value ??
                                        field.defaultValue) as string
                                }
                                initialValue={
                                    field.value ?? field.defaultValue ?? null
                                }
                                showConfirm
                                onPasswordsMatched={onPasswordsMatched}
                                onChange={onInputFieldChanged}
                                required
                            />
                        </div>
                    );
                }
                return field;
            });
            return networkTypeFields;
        }
        return null;
    };

    useEffect(() => {
        if (accountType === AccountType.Customer) {
            setServiceProviderAccountId(
                Number(activeUser.service_provider_account)
            );
        }
    }, [activeUser]);

    useEffect(() => {
        setAccountId(null);
        setSiteId(null);
    }, [activeUser, serviceProviderAccountId]);

    useEffect(() => {
        setSiteId(null);
    }, [activeUser, accountId]);

    useEffect(() => {
        getNetworkDeviceTypes({ is_active: true });
    }, []);

    useEffect(() => {
        if (networkDeviceTypeProperties) {
            const { fields } = networkDeviceTypeProperties;
            const newFieldData: IPropertyField[] = [];
            if (fields) {
                fields.map((field) => {
                    newFieldData.push({
                        ...field,
                        value: field.defaultValue as string,
                        matched: false,
                    });
                    return field;
                });
            }
            setFieldData(newFieldData);
        }
    }, [networkDeviceTypeProperties]);

    return (
        <motion.div
            id="NetworkDevice"
            key="NetworkDevice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <ServiceProviderSelect
                    activeUser={activeUser}
                    serviceProviderAccountId={serviceProviderAccountId}
                    onChange={onChangeServiceProviderAccount}
                />

                <CustomerSelect
                    activeUser={activeUser}
                    serviceProviderAccountId={serviceProviderAccountId}
                    accountId={accountId}
                    onChange={onChangeAccount}
                />
                <SiteSelect
                    activeUser={activeUser}
                    serviceProviderAccountId={serviceProviderAccountId}
                    accountId={accountId}
                    onChange={onChangeSite}
                />
                <div className="input-container form-item">
                    <FormInput
                        id="network-device-name"
                        columnMap="network_device_name"
                        tooltip="Enter the network device name"
                        placeholder="Enter Network Device Name"
                        label="Network Device Name"
                        value={networkDeviceName}
                        onChange={onInputFieldChanged}
                        required
                    />
                </div>
                <div className="select-container form-item">
                    <span>Network Device Types</span>
                    <span className="asterisk">*</span>
                    <Select
                        id="network-device-types-select"
                        placeholder="Select Network Device Type"
                        value={selectedNetworkDeviceType}
                        onChange={handleNetworkDeviceTypeSelect}
                        options={getNetworkDeviceTypeOptions()}
                        isClearable={false}
                        required
                    />
                </div>
                {renderNetworkDeviceTypeSection()}
                <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                    <Button
                        id="btn-network-device-clear"
                        className="btn danger"
                        label="Clear"
                        type="reset"
                        width="auto"
                        onClick={resetForm}
                    />
                    <Button
                        id="submit"
                        className="btn primary register-network-device-btn"
                        label="Save"
                        type="submit"
                        width="auto"
                    />
                </ButtonGroup>
            </form>
        </motion.div>
    );
};

export default RegisterNetworkDevice;
