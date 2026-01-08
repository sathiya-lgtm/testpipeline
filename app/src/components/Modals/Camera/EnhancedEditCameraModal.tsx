// React
import { FC, useState, useMemo, useContext, useEffect, FormEvent } from 'react';

// react Query
import { UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';

// react-select
import { SingleValue, MultiValue } from 'react-select';

// react-toastify
import { toast } from 'react-toastify';

// Api Calls
import updateCamera, {
    IUpdateCameraConfig,
} from '../../../api_calls/updateCamera';

// Components
import ModalBase from '../../ModalBase';
import SingleSelect from '../../Inputs/Select';
import Input from '../../Inputs/Input';
import Button from '../../Button';
import DeleteCameraModal from './DeleteCameraModal';
import LoadingModal from '../LoadingModal';

// Custom
import { useCustomers, useSites, useCameras } from '../../../hooks';
import getAccountType from '../../../utils/getAccountType';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';
import { ListTargetContext } from '../../../contexts/ListTarget';

// Types
import { SelectOption, IUser } from '../../../types/interfaces';
import {
    ICameraData,
    ICustomer,
    ISite,
} from '../../../types/tng-api.interfaces';
import { AccountType } from '../../../types/enums';

// Styles
import '../../../styles/components/Modals/EditCameraModal.scss';
import getCameraTypes from '../../../api_calls/getCameraTypes';

const sceneOptions = [
    { label: 'Indoor', value: 'indoor' },
    { label: 'Outdoor', value: 'outdoor' },
];

interface IProps {
    cameraData: ICameraData;
    refetchCameraData: (options?: {
        throwOnError: boolean;
        cancelRefetch: boolean;
    }) => Promise<UseQueryResult>;
    handleClose: () => void;
}

const EditCameraModal: FC<IProps> = ({
    handleClose,
    cameraData,
    refetchCameraData,
}) => {
    const { listTarget, setListTarget } = useContext(ListTargetContext);
    const { activeUser } = useContext(AuthContext);

    const accountType: AccountType = useMemo(
        () => getAccountType(activeUser),
        [activeUser]
    );

    const defaultCustomer = useMemo(() => {
        if (
            accountType === AccountType.Customer &&
            activeUser?.account_name &&
            activeUser?.client_account
        )
            return {
                label: activeUser.account_name,
                value: String(activeUser.client_account),
            };
        return null;
    }, [activeUser]);

    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer !== null ? [defaultCustomer] : []
    );
    const [selectedCustomers, setSelectedCustomers] = useState<any | null>(
        defaultCustomer
    );

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [selectedSites, setSelectedSite] = useState<any | null>(null);
    const [selectedScene, setSelectedScene] = useState<any | null>({
        label: 'Outdoor',
        value: 'outdoor',
    });
    const [showDeleteCameraModal, setShowDeleteCameraModal] = useState(false);
    const [cameraType, setCameraType] = useState<SelectOption | null>(null);
    const cameraTypesData = useQuery({
        queryKey: ['camera-types'],
        queryFn: () => getCameraTypes(activeUser as IUser),
    });
    const cameraTypeOptions = useMemo(() => {
        return cameraTypesData.data;
    }, [cameraTypesData.data]);

    const customersQuery = useCustomers({
        serviceProviderId: (activeUser as IUser).id,
        activeUser: activeUser as IUser,
        enabled: accountType !== AccountType.Customer,
    });

    const sitesQuery = useSites({
        customerId: Number(selectedCustomers?.value),
        activeUser: activeUser as IUser,
        enabled:
            accountType === AccountType.Customer || !!selectedCustomers?.value,
    });

    const { refetch } = useCameras({
        siteId: cameraData.site_id,
        activeUser: activeUser as IUser,
        enabled: false,
    });

    const editCameraMutation = useMutation({
        mutationFn: updateCamera,
    });

    const handleCustomerSelect = async (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ) => {
        setSelectedCustomers(selectOption);
    };

    const handleSiteSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        setSelectedSite(selectOption);
    };

    const handleSceneSelect = (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ): void => {
        setSelectedScene(selectOption);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!activeUser || !cameraType) return;

        const hasChangedSites =
            Number(selectedSites?.value) !== cameraData.site_id;

        const cameraConfig: IUpdateCameraConfig = {
            camera_name: name,
            camera_id: cameraData.camera_id,
            camera_properties: {
                camera_type: cameraType.value,
                camera_scene: selectedScene.value,
            },
        };

        if (hasChangedSites) {
            cameraConfig.site_id = Number(selectedSites.value);
        }

        try {
            await editCameraMutation.mutateAsync({
                user: activeUser,
                cameraConfig,
            });
            refetch();
        } catch (error) {
            toast.error('Unable to update camera properties.');
            console.log(error);
        }

        if (hasChangedSites && listTarget) {
            const newListTarget = { ...listTarget };
            if (newListTarget.type === 'camera') {
                newListTarget.siteId = Number(selectedSites.value);
                newListTarget.siteName = selectedSites.label;
                setListTarget(newListTarget);
            }
        }

        await refetchCameraData();

        setIsLoading(false);

        handleClose();
        toast.success('Camera Updated!');
    };

    useEffect(() => {
        if (!cameraData) return;

        setName(cameraData.camera_name);
        const { camera_scene, camera_type } = cameraData.camera_properties;

        setSelectedScene(
            sceneOptions.find((o) => o.value === camera_scene) || null
        );

        if (cameraTypeOptions) {
            setCameraType(
                cameraTypeOptions.find((o) => o.value === camera_type) || null
            );
        }
    }, [cameraData, cameraTypeOptions]);

    useEffect(() => {
        const customersData: ICustomer[] | undefined = customersQuery.data;

        if (customersData && customersData.length > 0) {
            const sortedCustomersData = customersData.sort(sortByName);
            const options =
                OptionsConverter.convertCustomersToOptions(sortedCustomersData);

            setCustomerOptions(options);
            const customer = options.find(
                (option) => option.value === cameraData.account_id.toString()
            );
            setSelectedCustomers(customer);
        }
    }, [customersQuery.data]);

    useEffect(() => {
        const sitesData: ISite[] | undefined = sitesQuery.data;

        if (sitesData && sitesData.length > 0) {
            const sortedSitesData = sitesData.sort(sortByName);
            const options =
                OptionsConverter.convertSitesToOptions(sortedSitesData);

            setSiteOptions(options);
            const site = options.find(
                (option) => option.value === cameraData.site_id.toString()
            );
            setSelectedSite(site);
        }
    }, [sitesQuery.data]);
    return (
        <ModalBase
            title="Edit Camera"
            handleClose={handleClose}
            className="edit-camera-modal"
            closeOnBackdropClick={false}
        >
            <div className="edit-camera-modal-body">
                <form className="edit-camera-form" onSubmit={handleSubmit}>
                    <ul>
                        {cameraData.camera_properties.mac_address && (
                            <li>
                                <div className="field">
                                    <span className="label">CAMERA ID:</span>
                                    <span
                                        className="label"
                                        style={{ marginLeft: 10 }}
                                    >
                                        {
                                            cameraData.camera_properties
                                                .mac_address
                                        }
                                    </span>
                                </div>
                            </li>
                        )}
                        <li>
                            <div className="field">
                                <Input
                                    name="cameraNameInput"
                                    id="camera-name-input"
                                    className="input"
                                    label="Camera Name"
                                    type="text"
                                    value={name}
                                    onChange={setName}
                                    required
                                />
                            </div>
                        </li>
                        <li>
                            {activeUser?.account_type === 'sp' && (
                                <div className="field">
                                    <span className="label">Customer</span>
                                    <SingleSelect
                                        id="customer-select"
                                        value={selectedCustomers}
                                        onChange={handleCustomerSelect}
                                        options={customerOptions}
                                        disabled
                                    />
                                </div>
                            )}
                        </li>
                        <li>
                            <div className="field">
                                <span className="label">Site</span>
                                <SingleSelect
                                    id="site-select"
                                    value={selectedSites}
                                    disabled={
                                        cameraData.camera_properties
                                            .is_alarm_vision
                                    }
                                    onChange={handleSiteSelect}
                                    options={siteOptions}
                                    required
                                />
                            </div>
                        </li>
                        <li>
                            <div className="field">
                                <span className="label">Camera Type</span>
                                <div className="selectWrapper">
                                    <SingleSelect
                                        id="color-model-select"
                                        value={cameraType}
                                        options={cameraTypeOptions || []}
                                        onChange={(newValue) => {
                                            const result =
                                                newValue as SelectOption;
                                            setCameraType(result);
                                        }}
                                        isClearable={false}
                                    />
                                </div>
                            </div>
                        </li>
                        <li>
                            <div className="field">
                                <span className="label">Scene</span>
                                <SingleSelect
                                    id="scene-select"
                                    value={selectedScene}
                                    onChange={handleSceneSelect}
                                    options={sceneOptions}
                                    required
                                />
                            </div>
                        </li>
                    </ul>
                    <div className="edit-camera-btns-container">
                        <div className="top-row">
                            <Button
                                id="save-edit-camera-button"
                                type="submit"
                                label="Save"
                                className="btn primary"
                                onClick={() => handleSubmit}
                            />
                            <Button
                                id="cancel-edit-camera-button"
                                type="button"
                                label="Cancel"
                                className="btn neutral"
                                onClick={() => handleClose()}
                            />
                        </div>

                        <Button
                            id="delete-edit-camera-button"
                            type="button"
                            label="Delete Camera"
                            className="btn danger"
                            onClick={() => setShowDeleteCameraModal(true)}
                        />
                    </div>
                </form>
                {showDeleteCameraModal && (
                    <DeleteCameraModal
                        handleClose={() => setShowDeleteCameraModal(false)}
                        closeEditModal={handleClose}
                        cameraData={cameraData}
                        refetchCameraTreeData={refetch}
                    />
                )}
                {isLoading && <LoadingModal modalText="Updating camera..." />}
            </div>
        </ModalBase>
    );
};

export default EditCameraModal;
