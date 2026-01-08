/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import { FC, useState, useEffect, useMemo } from 'react';

// Third Party Components
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
    FaFileAudio,
    FaCog,
    FaCopy,
    FaPlus,
    FaTrash,
    FaRegPlayCircle,
    FaBullhorn,
} from 'react-icons/fa';
import { PiSecurityCameraBold } from 'react-icons/pi';
import { MdModeEdit } from 'react-icons/md';
import { SingleValue, MultiValue } from 'react-select';

// Components
import LoadingModal from '../../../components/Modals/LoadingModal';
import ConfigureModal from '../../../components/Modals/NetworkDeviceActions/Configure';
import CopyModal from '../../../components/Modals/NetworkDeviceActions/Copy';
import SearchBar from '../../../components/SearchBar/SearchBar';
import Tree, {
    TreeNode,
    TreeToolbarButton,
    TreeToolbarMultiSelectButton,
    TreeToolbarChildren,
    MultiSelectOption,
} from '../../../components/Tree/Tree';
import Select from '../../../components/Inputs/Select';

// Routes
import ServiceProviderAccountsRoute from '../../../api_calls/ServiceProviderAccounts';
import CustomersRoute from '../../../api_calls/Customers';
import SitesRoute from '../../../api_calls/Sites';
import getControllerURLBySpId from '../../../api_calls/getControllerURLBySpId';
import CameraActionAlertRoute, {
    ICameraActionAlertRequest,
    ICameraActionAlertRespone,
} from '../../../api_calls/CameraActionAlert';
import CameraRoute, {
    ICamera,
    IGetProps as IGetEliigibleCamera,
} from '../../../api_calls/Camera';
import CameraActionsRoute, {
    ICameraAction,
    IGetProps as IGetCameraActionsProps,
    ICreateProps as ICreateCameraActionsProps,
    IUpdateProps as IUpdateCameraActionProps,
    IDeleteProps as IDeleteCameraActionProps,
} from '../../../api_calls/CameraActions';

import NetworkDeviceRoute, {
    INetworkDevice,
    IGetProps as IGetNetworkDeviceProps,
} from '../../../api_calls/NetworkDevice';

import NetworkDeviceActionsRoute, {
    INetworkDeviceAction,
    IGetProps as IGetNetworkDeviceActionProps,
    ICopyProps as ICopyNetworkDeviceActionsProps,
    ICreateProps as ICreateNetworkDeviceActionProps,
    IDeleteProps as IDeleteNetworkDeviceActionProps,
} from '../../../api_calls/NetworkDeviceActions';

import NetworkDeviceActionsAvailableRoute, {
    INetworkDeviceActionAvailable,
} from '../../../api_calls/NetworkDeviceActionsAvailable';

import { AccountType } from '../../../types/enums';
import {
    CancelButton,
    DeleteButton,
    SaveButton,
} from '../../../components/Button';

// Types
import { IUser, SelectOption } from '../../../types/interfaces';

// Hooks
import useControllerConnection from '../../../hooks/useControllerConnection';

// Utils
import {
    setAppParam,
    getValue,
} from '../../../components/Outlets/Home/Edge/dataFetching';

// Sass
import '../../../styles/views/Utilities/CameraActions.scss';

interface ICameraActionsProps {
    activeUser: IUser;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
}

interface ICameraRow extends ICamera {
    expanded: boolean;
}

interface ICameraActionRow extends ICameraAction {
    network_device_actions?: INetworkDeviceAction[] | null | undefined;
    expanded: boolean;
}

interface ICameraActionAlertData {
    camera_id: number;
    camera_action_id: number;
}

const CameraActions: FC<ICameraActionsProps> = ({
    activeUser,
    accountType,
    defaultServiceProvider,
}: ICameraActionsProps) => {
    // State
    const [expandAll, setExpandAll] = useState<boolean>(false);

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
    const [eligibleCameras, setEligibleCameras] = useState<ICameraRow[] | null>(
        null
    );
    const [networkDevices, setNetworkDevices] = useState<
        INetworkDevice[] | null
    >(null);

    const [cameraActions, setCameraActions] = useState<
        ICameraActionRow[] | null
    >(null);

    const [networkDeviceActions, setNetworkDeviceActions] = useState<
        INetworkDeviceAction[] | null
    >(null);
    const [networkDeviceActionsAvailable, setNetworkDeviceActionsAvailable] =
        useState<INetworkDeviceActionAvailable[] | null>(null);
    const [filterValue, setFilterValue] = useState<string>('');
    const [hoverTooltip, setHoverTooltip] = useState<string>('');
    const [showAddCameraAction, setShowAddCameraAction] =
        useState<boolean>(false);
    const [showDeleteCameraAction, setShowDeletCameraAction] =
        useState<boolean>(false);
    const [showEditCameraAction, setShowEditCameraAction] =
        useState<boolean>(false);
    const [cameraActionName, setCameraActionName] = useState<string>('');
    const [
        cameraActionNetworkDeviceActionAvailableId,
        setCameraActionNetworkDeviceActionAvailableId,
    ] = useState<string>('');
    const [updatedCameraActionName, setUpdatedCameraActionName] =
        useState<string>('');
    const [showConfigureRowModal, setShowConfigureRowModal] =
        useState<boolean>(false);
    const [showCopyModal, setShowCopyModal] = useState<boolean>(false);
    const [selectedCamera, setSelectedCamera] = useState<ICameraRow | null>(
        null
    );
    const [testMessagePlaying, setTestMessagePlaying] = useState(false);
    const [selectedCameraAction, setSelectedCameraAction] =
        useState<ICameraActionRow | null>(null);

    const [cameraActionAlertData, setCameraActionAlertData] =
        useState<ICameraActionAlertData | null>(null);
    const [cameraActionAlert, setCameraActionAlert] = useState<boolean>(false);

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

    const liveViewQuery = useQuery({
        queryKey: ['live-view', selectedServiceProvider?.value],
        queryFn: () =>
            getControllerURLBySpId({
                user: activeUser as IUser,
                sp_id: selectedServiceProvider?.value as string,
            }),
        enabled: activeUser?.id === 1 && !!selectedServiceProvider?.value,
    });

    const liveViewControllerURL = useMemo(() => {
        if (activeUser && activeUser.id === 1 && liveViewQuery.data) {
            return liveViewQuery.data;
        }

        if (activeUser && activeUser.id !== 1) {
            return activeUser.live_view_controller_url;
        }

        return '';
    }, [liveViewQuery.data, activeUser]);

    const { socket, sourceList, getSequence } = useControllerConnection({
        activeUser,
        liveViewControllerURL,
    });

    const getCSVHeaders = () => {
        return [
            {
                key: 'service_provider_account_name',
                header: 'SERVICE PROVIDER',
            },
            { key: 'account_name', header: 'CUSTOMER' },
            { key: 'site_name', header: 'SITE' },
            { key: 'camera_name', header: 'CAMERA' },
            {
                key: 'network_device_name',
                header: 'NETWORK_DEVICE',
            },
            {
                key: 'camera_action_name',
                header: 'ACTION',
            },
            { key: 'audio_clip_index', header: 'AUDIO CLIP INDEX' },
            { key: 'test_volume', header: 'TEST VOLUME' },
            { key: 'alert_volume', header: 'ALERT VOLUME' },
        ];
    };

    const getCSVData = () => {
        const CSVData: any[] = [];
        if (networkDeviceActions) {
            networkDeviceActions.forEach((CSVRow: INetworkDeviceAction) => {
                CSVData.push({
                    service_provider_account_name:
                        CSVRow.service_provider_account_name,
                    account_name: CSVRow.account_name,
                    site_name: CSVRow.site_name,
                    camera_name: CSVRow.camera_name,
                    network_device_name: CSVRow.network_device_name,
                    camera_action_name: CSVRow.camera_action_name,
                    audio_clip_index: CSVRow.camera_action_properties.clip,
                    test_volume: CSVRow.camera_action_properties.test_volume,
                    alert_volume: CSVRow.camera_action_properties.alert_volume,
                });
            });
        }
        return CSVData;
    };

    const getEligibleCameras = async ({
        service_provider_account_id,
        account_id,
        site_id,
        camera_id,
    }: IGetEliigibleCamera) => {
        try {
            const route = CameraRoute(activeUser);
            const data = await route.get({
                service_provider_account_id,
                account_id,
                site_id,
                camera_id,
            });
            if (data) {
                const cameras: ICameraRow[] = [];
                data.forEach((camera: ICamera) => {
                    if (camera) {
                        cameras.push({
                            ...camera,
                            expanded: true,
                        });
                    }
                });
                setEligibleCameras(cameras);
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get cameras`);
            }
        }
    };

    const getUniqueCameraAction = (): Array<string> => {
        if (cameraActions) {
            return [
                ...new Set(
                    cameraActions.map((item) => item.camera_action_name)
                ),
            ];
        }
        return [];
    };

    const getNetworkDeviceActionId = (
        networkDeviceId: number,
        cameraActionId: number
    ): number => {
        let networkDeviceActionId = 0;
        if (networkDeviceActions) {
            networkDeviceActions.forEach((networkDeviceAction) => {
                const isMatch =
                    networkDeviceAction.network_device_id === networkDeviceId &&
                    networkDeviceAction.camera_action_id === cameraActionId;
                if (isMatch) {
                    networkDeviceActionId =
                        networkDeviceAction.network_device_action_id;
                }
            });
        }
        return networkDeviceActionId;
    };

    const getNetworkDeviceActionsAvailable = async () => {
        try {
            const route = NetworkDeviceActionsAvailableRoute(activeUser);
            const data = await route.get({});
            if (data) {
                setNetworkDeviceActionsAvailable(data);
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get cameras`);
            }
        }
    };

    const getCameraActions = async ({
        service_provider_account_id,
        account_id,
        site_id,
        camera_id,
        network_device_action_available_id,
    }: IGetCameraActionsProps) => {
        try {
            const route = CameraActionsRoute(activeUser);
            const data = await route.get({
                service_provider_account_id,
                account_id,
                site_id,
                camera_id,
                network_device_action_available_id,
            });
            if (data) {
                const cameraActionsRows: ICameraActionRow[] = [];
                data.forEach((cameraAction) => {
                    cameraActionsRows.push({
                        ...cameraAction,
                        expanded: true,
                    });
                });
                setCameraActions(cameraActionsRows);
            } else {
                setCameraActions(null);
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get cameras`);
            }
        }
    };

    const getNetworkDevices = async ({
        service_provider_account_id,
        account_id,
        site_id,
        network_device_id,
    }: IGetNetworkDeviceProps) => {
        try {
            const route = NetworkDeviceRoute(activeUser);
            const data = await route.get({
                service_provider_account_id,
                account_id,
                site_id,
                network_device_id,
            });
            if (data) {
                setNetworkDevices(data);
            } else {
                setNetworkDevices(null);
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get network devices`);
            }
        }
    };

    const createCameraAction = async ({
        camera_action_name,
        camera_id,
        network_device_action_available_id,
        properties,
    }: ICreateCameraActionsProps): Promise<ICameraAction> => {
        return new Promise<ICameraAction>((resolve, reject) => {
            const route = CameraActionsRoute(activeUser);
            route
                .insert({
                    camera_action_name,
                    camera_id,
                    network_device_action_available_id,
                    properties,
                })
                .then((data) => {
                    resolve(data);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    };

    const updateCameraAction = async ({
        camera_action_id,
        camera_action_name,
        camera_id,
        network_device_action_available_id,
        properties,
    }: IUpdateCameraActionProps): Promise<ICameraAction> => {
        return new Promise<ICameraAction>((resolve, reject) => {
            const route = CameraActionsRoute(activeUser);
            route
                .update({
                    camera_action_id,
                    camera_action_name,
                    camera_id,
                    network_device_action_available_id,
                    properties,
                })
                .then((data) => {
                    resolve(data);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    };

    const deleteCameraAction = ({
        camera_action_id,
    }: IDeleteCameraActionProps): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            const route = CameraActionsRoute(activeUser);
            route
                .delete({ camera_action_id })
                .then((data) => {
                    resolve(data);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    };

    const getNetworkDeviceActions = async ({
        service_provider_account_id,
        account_id,
        site_id,
        camera_id,
    }: IGetNetworkDeviceActionProps) => {
        try {
            const route = NetworkDeviceActionsRoute(activeUser);
            const data = await route.get({
                service_provider_account_id,
                account_id,
                site_id,
                camera_id,
            });
            if (data) {
                setNetworkDeviceActions(data);
            } else {
                setNetworkDeviceActions(null);
            }
        } catch (error: any) {
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to get network devices`);
            }
        }
    };

    const createNetworkDeviceAction = async ({
        network_device_id,
        camera_action_id,
    }: ICreateNetworkDeviceActionProps) => {
        return new Promise<INetworkDeviceAction>((resolve, reject) => {
            const route = NetworkDeviceActionsRoute(activeUser);
            route
                .insert({
                    network_device_id,
                    camera_action_id,
                })
                .then((data) => {
                    resolve(data);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    };

    const deleteNetworkDeviceAction = ({
        network_device_action_id,
    }: IDeleteNetworkDeviceActionProps): Promise<Boolean> => {
        return new Promise<Boolean>((resolve, reject) => {
            const route = NetworkDeviceActionsRoute(activeUser);
            route
                .delete({ network_device_action_id })
                .then((success: any) => {
                    resolve(success);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    };

    const copyNetworkDeviceActions = async ({
        camera_from_id,
        camera_to_ids,
    }: ICopyNetworkDeviceActionsProps) => {
        try {
            const route = NetworkDeviceActionsRoute(activeUser);
            const success = await route.copy({
                camera_from_id,
                camera_to_ids,
            });
            if (success) {
                getNetworkDeviceActions({
                    service_provider_account_id: Number(
                        selectedServiceProvider?.value
                    ),
                    account_id: Number(selectedCustomer?.value),
                    site_id: Number(selectedSites?.value),
                });
                toast.success(
                    `Successfully copied camera actions from ${selectedCamera?.camera_name}`
                );
            } else {
                toast.warning(
                    `Failed to copy camera actions from ${selectedCamera?.camera_name}`
                );
            }
            setSelectedCamera(null);
        } catch (error: any) {
            setSelectedCamera(null);
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else {
                toast.error(`Failed to create network device action`);
            }
        }
    };

    const createCameraActionAlert = async ({
        camera_id,
        camera_action_id,
    }: ICameraActionAlertRequest) => {
        try {
            const route = CameraActionAlertRoute(activeUser);
            const results = await route.insert({ camera_id, camera_action_id });
            if (!results.success) {
                toast.error('Failed to post the camera action alert!');
            }
        } catch (e) {
            toast.error('Failed to post the camera action alert!');
        } finally {
            setCameraActionAlertData(null);
            setCameraActionAlert(false);
        }
    };

    const isCameraActionsReady = (): boolean => {
        if (!selectedServiceProvider) return false;
        if (!selectedCustomer) return false;
        if (!selectedSites) return false;
        return true;
    };

    const executeAction = async (
        action: any,
        cameraId: number
    ): Promise<string> => {
        if (testMessagePlaying) {
            throw new Error('Execution of a test already in progress!');
        }

        if (!socket) {
            throw new Error('Websocket not connected!');
        }

        const activeSource = sourceList.find(
            (source) => source.camera_id === cameraId
        );

        if (!activeSource) {
            throw new Error('Active source is not set');
        }

        const socketMessageBody = { ...action };

        // We use ip_address on the insites side but edge uses ip
        if (socketMessageBody.ip_address) {
            socketMessageBody.ip = action.ip_address;
            delete socketMessageBody.ip_address;
        }

        if (socketMessageBody.clip) {
            socketMessageBody.clip = Number(socketMessageBody.clip);
        }

        console.log({ socketMessageBody, cameraId });

        const result = await setAppParam({
            socket,
            sequence: getSequence(),
            source_id: activeSource.source_id,
            param: 'DeviceIO',
            value: JSON.stringify(socketMessageBody),
        });

        console.log({ result });

        return getValue(result);
    };

    const playHorn = async (data: ICameraActionRow) => {
        // Set loading flag
        setTestMessagePlaying(true);

        const cameraNetworkDeviceActions:
            | INetworkDeviceAction[]
            | null
            | undefined = data.network_device_actions;
        // Validate the networkd device actions
        if (cameraNetworkDeviceActions) {
            // Map actions to promises
            const promises = cameraNetworkDeviceActions.map(
                (cameraNetworkDeviceAction: INetworkDeviceAction) => {
                    // build the camera action request
                    const {
                        camera_action_properties,
                        network_device_properties,
                    } = cameraNetworkDeviceAction;

                    const deviceAction = {
                        ...camera_action_properties,
                        ...network_device_properties,
                    };
                    // Execute the camera action promise
                    return executeAction(deviceAction, data.camera_id);
                }
            );
            // Execute all actions concurrently
            await Promise.all(promises)
                .then((results) => {
                    results.forEach((result) => {
                        if (result === '200 OK') {
                            toast.success(
                                'Successfully executed camera action'
                            );
                            setCameraActionAlertData({
                                camera_id: data.camera_id,
                                camera_action_id: data.camera_action_id,
                            });
                            setCameraActionAlert(true);
                        } else {
                            toast.error(result);
                            toast.error('Failed to execute camera action');
                        }
                    });
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

    // Events
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

    const onTreeExpandChanged = (expanded: boolean) => {
        setExpandAll(expanded);
    };

    const onSearch = (searchValue: string) => {
        setFilterValue(searchValue);
    };

    const onClear = () => {
        setFilterValue('');
    };

    const onAddCameraActionClicked = () => {
        setShowAddCameraAction(true);
    };

    const onAddCameraActionHover = (description: string) => {
        setHoverTooltip(description);
    };

    const onEditCameraActionClicked = () => {
        setShowEditCameraAction(true);
    };

    const onEditCameraActionHover = (description: string) => {
        setHoverTooltip(description);
    };

    const saveCameraActionClicked = () => {
        // Make sure the length of the cameraActionName is valid
        console.log({
            cameraActionNetworkDeviceActionAvailable:
                cameraActionNetworkDeviceActionAvailableId,
            cameraActions,
            networkDeviceActions,
            networkDeviceActionsAvailable,
        });

        if (cameraActionNetworkDeviceActionAvailableId.length <= 0) {
            toast.warning(
                'You must set the camera action available before saving.'
            );
            return;
        }

        // Make sure the length of the cameraActionName is valid
        if (cameraActionName.length <= 0) {
            toast.warning('You must set the camera action name before saving.');
            return;
        }

        // Validate there is no duplicate action name
        if (cameraActions) {
            let isDuplicate = false;
            cameraActions.forEach((cameraAction) => {
                if (cameraAction.camera_action_name === cameraActionName) {
                    isDuplicate = true;
                }
            });
            if (isDuplicate) {
                toast.warning('You cannot have a duplicate camera action name');
            }
        }
        let ndaaId = 0;
        let ndaaProps: any = {};
        networkDeviceActionsAvailable?.map((networkDeviceActionAvailable) => {
            if (
                networkDeviceActionAvailable.network_device_action_available_id ===
                Number(cameraActionNetworkDeviceActionAvailableId)
            ) {
                ndaaId =
                    networkDeviceActionAvailable.network_device_action_available_id;
                ndaaProps = networkDeviceActionAvailable.properties;
            }
            return networkDeviceActionAvailable;
        });
        if (!ndaaId || !ndaaProps) {
            toast.warning(
                'Could not find data for the network device action available'
            );
            return;
        }
        const cameraActionProperties: any = {};
        const { fields } = ndaaProps;
        fields.map((field: any) => {
            if (field.datatype === 'Integer') {
                cameraActionProperties[field.name] = Number(field.defaultValue);
            } else {
                cameraActionProperties[field.name] = field.defaultValue;
            }

            return field;
        });

        const cameraActionList: ICreateCameraActionsProps[] = [];
        eligibleCameras?.map((eligibleCamera) => {
            cameraActionList.push({
                camera_action_name: cameraActionName,
                camera_id: Number(eligibleCamera.camera_id),
                network_device_action_available_id: Number(ndaaId),
                properties: cameraActionProperties,
            });
            return eligibleCamera;
        });
        const promiseAllList: Promise<ICreateCameraActionsProps>[] = [];
        cameraActionList.map((cameraActionItem: ICreateCameraActionsProps) => {
            promiseAllList.push(createCameraAction(cameraActionItem));
            return cameraActionItem;
        });
        Promise.all(promiseAllList)
            .then(() => {
                toast.success(
                    `Successfully created the ${cameraActionName} camera action.`
                );
                getCameraActions({
                    service_provider_account_id: Number(
                        selectedServiceProvider?.value
                    ),
                    account_id: Number(selectedCustomer?.value),
                    site_id: Number(selectedSites?.value),
                });
                setHoverTooltip('');
                setShowAddCameraAction(false);
            })
            .catch((error) => {
                const { reason } = error.response.data.details;
                if (reason) {
                    toast.warning(reason);
                } else {
                    toast.error(
                        `Failed to save the ${cameraActionName} camera action.`
                    );
                }
            });
    };

    const cancelSaveCamearActionClicked = () => {
        setHoverTooltip('');
        setShowAddCameraAction(false);
    };

    const updateCameraActionClicked = () => {
        // Make sure the length of the cameraActionName is valid
        if (updatedCameraActionName.length <= 0) {
            toast.warning('You must set the camera action name before saving.');
            return;
        }

        // Make sure the updated camera action name is different from the current caemra action
        if (cameraActionName === updatedCameraActionName) {
            toast.warning(
                'You must make updated camera action named different than the currently selected camera action'
            );
            return;
        }

        // Validate there is no duplicate action name
        if (cameraActions) {
            let isDuplicate = false;
            cameraActions.forEach((cameraAction) => {
                if (
                    cameraAction.camera_action_name === updatedCameraActionName
                ) {
                    isDuplicate = true;
                }
            });
            if (isDuplicate) {
                toast.warning('You cannot have a duplicate camera action name');
            }
        }
        const cameraActionList: IUpdateCameraActionProps[] = [];
        cameraActions?.map((cameraAction) => {
            if (cameraAction.camera_action_name === cameraActionName) {
                cameraActionList.push({
                    camera_action_id: cameraAction.camera_action_id,
                    camera_action_name: updatedCameraActionName,
                    camera_id: cameraAction.camera_id,
                    network_device_action_available_id:
                        cameraAction.network_device_action_available_id,
                    properties: cameraAction.properties,
                });
            }
            return cameraAction;
        });
        const promiseAllList: Promise<IUpdateCameraActionProps>[] = [];
        cameraActionList.map((cameraActionItem: IUpdateCameraActionProps) => {
            promiseAllList.push(updateCameraAction(cameraActionItem));
            return cameraActionItem;
        });
        Promise.all(promiseAllList)
            .then(() => {
                toast.success(
                    `Successfully updated the ${cameraActionName} camera action to ${updatedCameraActionName}`
                );
                getNetworkDeviceActions({
                    service_provider_account_id: Number(
                        selectedServiceProvider?.value
                    ),
                    account_id: Number(selectedCustomer?.value),
                    site_id: Number(selectedSites?.value),
                });
                getCameraActions({
                    service_provider_account_id: Number(
                        selectedServiceProvider?.value
                    ),
                    account_id: Number(selectedCustomer?.value),
                    site_id: Number(selectedSites?.value),
                });
                setHoverTooltip('');
                setShowEditCameraAction(false);
            })
            .catch((error) => {
                const { reason } = error.response.data.details;
                if (reason) {
                    toast.warning(reason);
                } else {
                    toast.error(
                        `Failed to update the ${cameraActionName} camera action to ${updatedCameraActionName}`
                    );
                }
            });
    };

    const cancelUpdateCamearActionClicked = () => {
        setHoverTooltip('');
        setUpdatedCameraActionName('');
        setShowEditCameraAction(false);
    };

    const cancelDeleteCamearActionClicked = () => {
        setHoverTooltip('');
        setShowDeletCameraAction(false);
    };

    const deleteCameraActionClicked = () => {
        const cameraActionRows: ICameraActionRow[] = [];
        if (cameraActions) {
            cameraActions.forEach((cameraAction) => {
                if (cameraAction.camera_action_name === cameraActionName) {
                    cameraActionRows.push(cameraAction);
                }
            });
        }
        if (cameraActionRows.length > 0) {
            const promiseAllList: Promise<boolean>[] = [];
            cameraActionRows.forEach((cameraActionRow) => {
                promiseAllList.push(deleteCameraAction(cameraActionRow));
            });
            Promise.all(promiseAllList)
                .then(() => {
                    toast.success(
                        `Successfully deleted the ${cameraActionName} camera action`
                    );
                    getCameraActions({
                        service_provider_account_id: Number(
                            selectedServiceProvider?.value
                        ),
                        account_id: Number(selectedCustomer?.value),
                        site_id: Number(selectedSites?.value),
                    });
                    setHoverTooltip('');
                    setShowDeletCameraAction(false);
                })
                .catch((error) => {
                    const { reason } = error.response.data.details;
                    if (reason) {
                        toast.warning(reason);
                    } else {
                        toast.error(
                            `Failed to delete the ${cameraActionName} camera action.`
                        );
                    }
                });
        }
    };

    const onCopyCameraActionsClicked = (cameraRow: ICameraRow) => {
        setSelectedCamera(cameraRow);
        setShowCopyModal(true);
    };

    const onCopyCameraActionsHover = (description: string) => {
        setHoverTooltip(description);
    };

    // This code was causing a bug in the configure camera action modal (AKA ConfigureModal component found below).
    // Basically, the network_device_actions were not being updated correctly when saved.  The cuplerate was the network_device_actions
    // Being updated in the first if statement.  I don't think we need all this extra logic, just to update the selected camera actions
    // const onConfigureCameraActionClicked = (data: ICameraActionRow) => {
    //     if (networkDeviceActions) {
    //         const selectedNetworkDeviceActions: INetworkDeviceAction[] = [];
    //         networkDeviceActions.forEach((networkDeviceAction) => {
    //             if (networkDeviceAction.camera_id === data.camera_id) {
    //                 selectedNetworkDeviceActions.push(networkDeviceAction);
    //             }
    //         });
    //         const updatedCameraAction: ICameraActionRow = {
    //             ...data,
    //             // network_device_actions: selectedNetworkDeviceActions,
    //         };
    //         console.log({ updatedCameraAction });
    //         setSelectedCameraAction(updatedCameraAction);
    //         setShowConfigureRowModal(true);
    //     } else {
    //         console.log({ data });
    //         setSelectedCameraAction(data);
    //     }
    // };

    // Here is the simplifed version that I think will work
    const onConfigureCameraActionClicked = (data: ICameraActionRow) => {
        setSelectedCameraAction(data);
        setShowConfigureRowModal(true);
    };

    const onConfigureCameraActionHover = (description: string) => {
        setHoverTooltip(description);
    };

    const onExecuteCameraActionClicked = async (data: ICameraActionRow) => {
        if (
            !data.network_device_actions ||
            data.network_device_actions.length === 0
        ) {
            toast.warning(
                `There are no network devices associated to the ${data.camera_action_name}`
            );
            return;
        }
        await playHorn(data);
    };

    const onNetworkDeviceActionsSelectionChanged = async (
        active: boolean,
        data: any
    ) => {
        if (!selectedServiceProvider || !selectedCustomer || !selectedSites) {
            return;
        }

        if (active) {
            try {
                const result = await createNetworkDeviceAction({
                    network_device_id: data.network_device_id,
                    camera_action_id: data.camera_action_id,
                });

                toast.success(
                    `Successfully created the link between ${result.camera_action_name} and ${result.network_device_name}`
                );
            } catch (error: any) {
                const { reason } = error.response.data.details;
                if (reason) {
                    toast.warning(reason);
                } else {
                    toast.error(
                        `Failed to create link between ${data.network_device_name} and ${data.network_device_name}`
                    );
                }
                return;
            }
        } else {
            try {
                await deleteNetworkDeviceAction({
                    network_device_action_id: data.network_device_action_id,
                });

                toast.success(
                    `Successfully deleted the link between ${data.camera_action_name} and ${data.network_device_name}`
                );
            } catch (error: any) {
                const { reason } = error.response.data.details;
                if (reason) {
                    toast.warning(reason);
                } else {
                    toast.error(
                        `Failed to delete link between ${data.network_device_name} and ${data.network_device_name}`
                    );
                }

                return;
            }
        }

        getNetworkDeviceActions({
            service_provider_account_id: Number(selectedServiceProvider?.value),
            account_id: Number(selectedCustomer?.value),
            site_id: Number(selectedSites?.value),
        });

        getEligibleCameras({
            service_provider_account_id: Number(selectedServiceProvider?.value),
            account_id: Number(selectedCustomer?.value),
            site_id: Number(selectedSites?.value),
            camera_id: null,
        });
    };

    const onExecuteCameraActionHover = (description: string) => {
        setHoverTooltip(description);
    };

    const onNetworkDevicesHover = (description: string) => {
        setHoverTooltip(description);
    };

    const onMouseLeave = () => {
        setHoverTooltip('');
    };

    const onDeleteCameraActionClicked = () => {
        setShowDeletCameraAction(true);
    };

    const onDeleteCameraActionHover = (description: string) => {
        setHoverTooltip(description);
    };

    const onCopyCameraActions = (
        cameraFromId: number,
        cameraToIds: number[]
    ) => {
        copyNetworkDeviceActions({
            camera_from_id: cameraFromId,
            camera_to_ids: cameraToIds,
        });
        setShowCopyModal(false);
    };

    const onConfigureSave = (data: ICameraActionRow) => {
        updateCameraAction({
            camera_action_id: data.camera_action_id,
            camera_action_name: data.camera_action_name,
            camera_id: data.camera_id,
            network_device_action_available_id:
                data.network_device_action_available_id,
            properties: data.properties,
        })
            .then((result) => {
                toast.success(
                    `Successfully updated the ${result.camera_action_name} camera action`
                );
                getCameraActions({
                    service_provider_account_id: Number(
                        selectedServiceProvider?.value
                    ),
                    account_id: Number(selectedCustomer?.value),
                    site_id: Number(selectedSites?.value),
                    camera_id: null,
                    network_device_action_available_id: null,
                });
                setSelectedCameraAction(null);
                setShowConfigureRowModal(false);
            })
            .catch((error) => {
                const { reason } = error.response.data.details;
                if (reason) {
                    toast.warning(reason);
                } else {
                    toast.error(
                        `Failed to update the ${cameraActionName} camera action to ${updatedCameraActionName}`
                    );
                }
            });
    };

    const onRenderCameraActionsNodes = (row: ICameraRow) => {
        const nodes: any[] = [];
        if (row && cameraActions) {
            const cameraName = row.camera_name;
            cameraActions.forEach((cameraAction: ICameraActionRow, index) => {
                if (cameraAction.camera_id === row.camera_id) {
                    const cameraActionKey = `camera-action-${cameraAction.camera_id.toString()}-${index}`;
                    const cameraActionToolbarButtons: TreeToolbarChildren[] =
                        [];
                    cameraActionToolbarButtons.unshift(
                        <TreeToolbarButton
                            key="camera-action-configure-button"
                            Icon={FaCog}
                            data={cameraAction}
                            tooltip={`Configure the ${cameraAction.camera_action_name} settings for ${cameraAction.camera_name}`}
                            onClick={onConfigureCameraActionClicked}
                            onMouseHover={onConfigureCameraActionHover}
                            onMouseLeave={onMouseLeave}
                        />
                    );
                    cameraActionToolbarButtons.unshift(
                        <TreeToolbarButton
                            key="camera-action-execute-button"
                            Icon={FaRegPlayCircle}
                            data={cameraAction}
                            tooltip={`Execute the ${cameraAction.camera_action_name} action for ${cameraAction.camera_name}`}
                            onClick={onExecuteCameraActionClicked}
                            onMouseHover={onExecuteCameraActionHover}
                            onMouseLeave={onMouseLeave}
                        />
                    );
                    cameraActionToolbarButtons.unshift(
                        <TreeToolbarMultiSelectButton
                            tooltip={`Link a network device to the ${cameraName} camera`}
                            key="camera-action--selected-network-device"
                            onMouseHover={onNetworkDevicesHover}
                            onMouseLeave={onMouseLeave}
                        >
                            {networkDevices?.map(
                                (networkDevice: INetworkDevice) => {
                                    const multiSelectOptionkey = `camera-action-multi-select-option-${networkDevice.network_device_id}-${cameraAction.camera_action_id}`;
                                    const networkDeviceId =
                                        networkDevice.network_device_id;
                                    const cameraActionId =
                                        cameraAction.camera_action_id;
                                    const networkDeviceActionId =
                                        getNetworkDeviceActionId(
                                            networkDeviceId,
                                            cameraActionId
                                        );
                                    const label =
                                        networkDevice.network_device_name;
                                    const value = {
                                        network_device_action_id:
                                            networkDeviceActionId,
                                        network_device_id: networkDeviceId,
                                        network_device_name:
                                            networkDevice.network_device_name,
                                        camera_action_id: cameraActionId,
                                        camera_action_name:
                                            cameraAction.camera_action_name,
                                    };
                                    const active = networkDeviceActionId !== 0;
                                    return (
                                        <MultiSelectOption
                                            key={multiSelectOptionkey}
                                            Icon={FaBullhorn}
                                            value={value}
                                            active={active}
                                            label={label}
                                            onClick={
                                                onNetworkDeviceActionsSelectionChanged
                                            }
                                        />
                                    );
                                }
                            )}
                        </TreeToolbarMultiSelectButton>
                    );
                    const caption = `${cameraAction.camera_action_name}`;
                    nodes.push(
                        <TreeNode
                            key={cameraActionKey}
                            Icon={FaFileAudio}
                            onRenderToolbar={() => cameraActionToolbarButtons}
                            caption={caption}
                        />
                    );
                }
            });
            return nodes;
        }
        return null;
    };

    const onRenderCameraNodes = () => {
        const nodes: any[] = [];
        if (eligibleCameras) {
            if (eligibleCameras.length === 0) {
                return (
                    <span style={{ padding: '10px' }}>
                        There site has no eligible cameras that have any
                        available registered network devices
                    </span>
                );
            }
            eligibleCameras.forEach((eligibleCamera: ICameraRow, index) => {
                const eligibleCameraKey = `eligible-camera-${index}`;
                const cameraToolbarButtons: TreeToolbarChildren[] = [];
                if (eligibleCamera.network_device_actions_count > 0) {
                    cameraToolbarButtons.push(
                        <TreeToolbarButton
                            key="copy-camera-actions-button"
                            Icon={FaCopy}
                            data={eligibleCamera}
                            tooltip={`Copy the camera actions for ${eligibleCamera.camera_name} to one or more cameras for this site`}
                            onClick={onCopyCameraActionsClicked}
                            onMouseHover={onCopyCameraActionsHover}
                            onMouseLeave={onMouseLeave}
                        />
                    );
                }
                nodes.push(
                    <TreeNode
                        key={eligibleCameraKey}
                        Icon={PiSecurityCameraBold}
                        caption={eligibleCamera.camera_name}
                        onRenderToolbar={() => cameraToolbarButtons}
                        isExpanded={expandAll}
                    >
                        {onRenderCameraActionsNodes(eligibleCamera)}
                    </TreeNode>
                );
            });
        }
        return nodes;
    };

    const onRenderToolbarHeader = () => {
        const toolbarHeader: any[] = [];
        if (
            hoverTooltip &&
            !showAddCameraAction &&
            !showEditCameraAction &&
            !showDeleteCameraAction
        ) {
            toolbarHeader.push(<span>{hoverTooltip}</span>);
        }

        if (showAddCameraAction) {
            toolbarHeader.push(<span>Action</span>);
            const options: any[] = [];
            if (networkDeviceActionsAvailable) {
                networkDeviceActionsAvailable.forEach(
                    (action: INetworkDeviceActionAvailable) => {
                        const optionKey = `network-device-action-available-${action.network_device_action_available_id}`;
                        options.push(
                            <option
                                key={optionKey}
                                value={
                                    action.network_device_action_available_id
                                }
                            >
                                {action.network_device_action_available_name}
                            </option>
                        );
                    }
                );
            }
            toolbarHeader.push(
                <select
                    value={cameraActionNetworkDeviceActionAvailableId}
                    onChange={(e) =>
                        setCameraActionNetworkDeviceActionAvailableId(
                            e.target.value
                        )
                    }
                >
                    {options}
                </select>
            );
            toolbarHeader.push(<span>Name</span>);
            toolbarHeader.push(
                <input
                    placeholder="Enter the camera action name"
                    value={cameraActionName}
                    onChange={(e) => setCameraActionName(e.target.value)}
                />
            );
            toolbarHeader.push(
                <>
                    <SaveButton onClick={saveCameraActionClicked} />
                    <CancelButton onClick={cancelSaveCamearActionClicked} />
                </>
            );
        }

        if (showEditCameraAction) {
            if (networkDeviceActionsAvailable) {
                toolbarHeader.push(
                    <span className="actions-label">Actions</span>
                );
                const options: any[] = [];
                const uniqueCameraActions = getUniqueCameraAction();
                if (uniqueCameraActions) {
                    uniqueCameraActions.forEach((uniqueCameraAction, index) => {
                        const uniqueCameraActionKey = `delete-camera-action-option-${index}`;
                        options.push(
                            <option
                                key={uniqueCameraActionKey}
                                value={uniqueCameraAction}
                            >
                                {uniqueCameraAction}
                            </option>
                        );
                    });
                }
                toolbarHeader.push(
                    <select
                        id="camera-action-available-select"
                        onChange={(e) => setCameraActionName(e.target.value)}
                    >
                        {options}
                    </select>
                );

                toolbarHeader.push(
                    <input
                        id="camera-action-available-input"
                        value={updatedCameraActionName}
                        onChange={(e) =>
                            setUpdatedCameraActionName(e.target.value)
                        }
                    />
                );
            }
            toolbarHeader.push(
                <>
                    <SaveButton onClick={updateCameraActionClicked} />
                    <CancelButton onClick={cancelUpdateCamearActionClicked} />
                </>
            );
        }

        if (showDeleteCameraAction) {
            if (networkDeviceActionsAvailable) {
                toolbarHeader.push(
                    <span className="actions-label">Actions</span>
                );
                const options: any[] = [];
                const uniqueCameraActions = getUniqueCameraAction();
                if (uniqueCameraActions) {
                    uniqueCameraActions.forEach((uniqueCameraAction, index) => {
                        const uniqueCameraActionKey = `delete-camera-action-option-${index}`;
                        options.push(
                            <option
                                key={uniqueCameraActionKey}
                                value={uniqueCameraAction}
                            >
                                {uniqueCameraAction}
                            </option>
                        );
                    });
                }
                toolbarHeader.push(
                    <select
                        id="camera-action-available-select"
                        onChange={(e) => setCameraActionName(e.target.value)}
                    >
                        {options}
                    </select>
                );
            }
            toolbarHeader.push(
                <>
                    <DeleteButton onClick={deleteCameraActionClicked} />
                    <CancelButton onClick={cancelDeleteCamearActionClicked} />
                </>
            );
        }

        return <div className="camera-actions-header">{toolbarHeader}</div>;
    };

    const onRenderHeaderToolbar = (): any | any[] | undefined | null => {
        if (
            !showAddCameraAction &&
            !showEditCameraAction &&
            !showDeleteCameraAction
        ) {
            const cameraActionsCount = cameraActions?.length ?? 0;
            return (
                <>
                    <TreeToolbarButton
                        Icon={FaPlus}
                        tooltip="Add camera action"
                        onClick={onAddCameraActionClicked}
                        onMouseHover={onAddCameraActionHover}
                        onMouseLeave={onMouseLeave}
                    />
                    {cameraActionsCount > 0 && (
                        <>
                            <TreeToolbarButton
                                Icon={MdModeEdit}
                                tooltip="Edit camera action"
                                onClick={onEditCameraActionClicked}
                                onMouseHover={onEditCameraActionHover}
                                onMouseLeave={onMouseLeave}
                            />

                            <TreeToolbarButton
                                Icon={FaTrash}
                                tooltip="Delete camera action"
                                onClick={onDeleteCameraActionClicked}
                                onMouseHover={onDeleteCameraActionHover}
                                onMouseLeave={onMouseLeave}
                            />
                        </>
                    )}
                </>
            );
        }
        return null;
    };

    // Get Eligible Cameras
    useEffect(() => {
        if (selectedServiceProvider && selectedCustomer && selectedSites) {
            getEligibleCameras({
                service_provider_account_id: Number(
                    selectedServiceProvider.value
                ),
                account_id: Number(selectedCustomer.value),
                site_id: Number(selectedSites.value),
                camera_id: null,
            });
        } else {
            setEligibleCameras(null);
        }
    }, [selectedServiceProvider, selectedCustomer, selectedSites]);

    // Get all the camera actions for the eligible cameras
    useEffect(() => {
        if (eligibleCameras) {
            getNetworkDeviceActionsAvailable();
            getCameraActions({
                service_provider_account_id: Number(
                    selectedServiceProvider?.value
                ),
                account_id: Number(selectedCustomer?.value),
                site_id: Number(selectedSites?.value),
                camera_id: null,
                network_device_action_available_id: null,
            });
        }
    }, [eligibleCameras]);

    // Get the network devices
    useEffect(() => {
        if (selectedServiceProvider && selectedCustomer && selectedSites) {
            getNetworkDevices({
                service_provider_account_id: Number(
                    selectedServiceProvider.value
                ),
                account_id: Number(selectedCustomer.value),
                site_id: Number(selectedSites.value),
            });
        } else {
            setNetworkDevices(null);
        }
    }, [selectedServiceProvider, selectedCustomer, selectedSites]);

    // Get the newtork device actions
    useEffect(() => {
        if (selectedServiceProvider && selectedCustomer && selectedSites) {
            getNetworkDeviceActions({
                service_provider_account_id: Number(
                    selectedServiceProvider.value
                ),
                account_id: Number(selectedCustomer.value),
                site_id: Number(selectedSites.value),
            });
        } else {
            setNetworkDeviceActions(null);
        }
    }, [selectedServiceProvider, selectedCustomer, selectedSites]);

    // Update the cameraActions
    useEffect(() => {}, [cameraActions]);

    // Set the default value for the network device action available dropdown
    // when adding a new camera action
    useEffect(() => {
        if (networkDeviceActionsAvailable && showAddCameraAction) {
            if (networkDeviceActionsAvailable.length > 0) {
                const networkDeviceActionAvailableId =
                    networkDeviceActionsAvailable[0].network_device_action_available_id.toString();
                setCameraActionNetworkDeviceActionAvailableId(
                    networkDeviceActionAvailableId
                );
            }
        } else {
            setCameraActionNetworkDeviceActionAvailableId('');
            setCameraActionName('');
        }
    }, [showAddCameraAction]);

    // Set the default value for the camera actions
    // when editing an existing camera action
    useEffect(() => {
        if (cameraActions && showEditCameraAction) {
            if (cameraActions.length > 0) {
                const selectedCameraActionName: string =
                    cameraActions[0].camera_action_name;
                setCameraActionName(selectedCameraActionName);
            }
        } else {
            setCameraActionName('');
            setUpdatedCameraActionName('');
        }
    }, [showEditCameraAction]);

    // Set the default value for the camera actions
    // when deleting an existing camera action
    useEffect(() => {
        if (cameraActions && showDeleteCameraAction) {
            if (cameraActions.length > 0) {
                const selectedCameraActionName: string =
                    cameraActions[0].camera_action_name;
                setCameraActionName(selectedCameraActionName);
            }
        } else {
            setCameraActionName('');
        }
    }, [showDeleteCameraAction]);

    // Send the camera action alert to the Portal API
    useEffect(() => {
        if (cameraActionAlert && cameraActionAlertData) {
            createCameraActionAlert({
                camera_id: cameraActionAlertData.camera_id,
                camera_action_id: cameraActionAlertData.camera_action_id,
            });
        }
    }, [cameraActionAlert]);

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
                <h2>Camera Actions</h2>
                {accountType === AccountType.Evolon && (
                    <p>
                        Select the Service Provider, Customer, and Site to
                        review the Camera Actions associated to a network device
                    </p>
                )}
                {accountType === AccountType.ServiceProvider && (
                    <p>
                        Select the Customer and Site to review the Camera
                        Actions associated to a network device
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

                {isCameraActionsReady() && (
                    <>
                        <SearchBar
                            caption="Camera Action Setup"
                            placeHolder="Enter Search Text"
                            object_name="camera actions"
                            filename="camera_actions.csv"
                            onSearch={onSearch}
                            onClear={onClear}
                            headers={getCSVHeaders()}
                            data={getCSVData()}
                        />
                        <Tree
                            filter={filterValue}
                            onRenderHeader={onRenderToolbarHeader}
                            onRenderHeaderToolbar={onRenderHeaderToolbar}
                            onExpandChanged={onTreeExpandChanged}
                        >
                            {onRenderCameraNodes()}
                        </Tree>
                        <ConfigureModal
                            show={showConfigureRowModal}
                            data={selectedCameraAction}
                            onSave={onConfigureSave}
                            onClose={() => setShowConfigureRowModal(false)}
                        />
                        {selectedServiceProvider &&
                            selectedCustomer &&
                            selectedSites && (
                                <CopyModal
                                    user={activeUser}
                                    show={showCopyModal}
                                    serviceProviderAccountId={Number(
                                        selectedServiceProvider.value
                                    )}
                                    accountId={Number(selectedCustomer.value)}
                                    siteId={Number(selectedSites.value)}
                                    cameraFromId={Number(
                                        selectedCamera?.camera_id
                                    )}
                                    onClose={() => setShowCopyModal(false)}
                                    onCopy={onCopyCameraActions}
                                />
                            )}

                        {testMessagePlaying && (
                            <LoadingModal modalText="Sending message to device..." />
                        )}
                    </>
                )}
            </form>
        </motion.div>
    );
};

export default CameraActions;
