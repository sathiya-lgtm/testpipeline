// React
import { FC, useState, useMemo, useContext, useEffect, FormEvent } from 'react';

// react Query
import { useMutation } from '@tanstack/react-query';

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
import {
    useCustomers,
    useSites,
    useCameras,
    useCameraData,
} from '../../../hooks';
import getAccountType from '../../../utils/getAccountType';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';

// Types
import { SelectOption, IUser } from '../../../types/interfaces';
import { ICustomer, ISite } from '../../../types/tng-api.interfaces';
import { AccountType } from '../../../types/enums';

// Styles
import '../../../styles/components/Modals/EditCameraModal.scss';

interface IProps {
    handleClose: () => void;
    siteId: number;
}

const EditCameraBySiteModal: FC<IProps> = ({ handleClose, siteId }) => {
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
    const [loadingText, setLoadingText] = useState('Updating camera...');
    const [name, setName] = useState('');
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer !== null ? [defaultCustomer] : []
    );
    const [selectedCustomers, setSelectedCustomers] = useState<any | null>(
        defaultCustomer
    );

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [selectedSites, setSelectedSite] = useState<any | null>(null);
    const [showDeleteCameraModal, setShowDeleteCameraModal] = useState(false);

    const [selectedCameraData, setSelectedCameraData] = useState<any | null>();

    const defaultCamera = useMemo(() => {
        if (selectedCameraData)
            return {
                label: selectedCameraData.camera_name,
                value: String(selectedCameraData.camera_id),
            };
        return null;
    }, [selectedCameraData]);

    const [cameraOptions, setCameraOptions] = useState<SelectOption[]>(
        defaultCamera !== null ? [defaultCamera] : []
    );
    const [selectedCamera, setSelectedCamera] = useState<any | null>(
        defaultCamera
    );
    const [showEditCameraDetails, setShowEditCameraDetails] = useState(false);

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

    const camerasQuery = useCameras({
        siteId: siteId,
        activeUser: activeUser as IUser,
        enabled: false,
    });

    const cameraDataQuery = useCameraData({
        cameraId: Number(selectedCamera?.value),
        activeUser: activeUser as IUser,
        enabled: false,
    });

    const editCameraMutation = useMutation({
        mutationFn: updateCamera,
    });

    const handleCameraSelect = async (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ) => {
        setSelectedCamera(selectOption);
    };

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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingText('Updating camera...');
        setIsLoading(true);

        if (!activeUser) return;

        const hasChangedSites = Number(selectedSites?.value) !== siteId;
        const hasChangedName = name !== selectedCameraData.camera_name;

        if (!hasChangedName && !hasChangedSites) {
            setIsLoading(false);
            handleClose();
            return;
        }

        const cameraConfig: IUpdateCameraConfig = {
            camera_name: name,
            camera_id: selectedCameraData.camera_id,
        };

        if (hasChangedSites) {
            cameraConfig.site_id = Number(selectedSites.value);
        }

        try {
            await editCameraMutation.mutateAsync({
                user: activeUser,
                cameraConfig,
            });

            await camerasQuery.refetch();

            const pathParts = location.pathname.split('/').reverse();
            if (
                location.pathname.includes('/home/camera') &&
                pathParts[0] === selectedCameraData.camera_id.toString() &&
                Number(pathParts[0]) !== 0
            ) {
                await cameraDataQuery.refetch();
            }
        } catch (error) {
            toast.error('Unable to update camera properties.');
            console.log(error);
        }

        setIsLoading(false);

        handleClose();
        toast.success('Camera Updated!');
    };

    useEffect(() => {
        if (selectedCameraData) {
            setName(selectedCameraData.camera_name);
        }
    }, [selectedCameraData]);

    useEffect(() => {
        const customersData: ICustomer[] | undefined = customersQuery.data;

        if (customersData && customersData.length > 0) {
            const sortedCustomersData = customersData.sort(sortByName);
            const options =
                OptionsConverter.convertCustomersToOptions(sortedCustomersData);

            setCustomerOptions(options);
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
                (option) => option.value === siteId.toString()
            );
            setSelectedSite(site);
        }
    }, [sitesQuery.data]);

    useEffect(() => {
        const camerasData = camerasQuery.data;

        if (camerasData && camerasData.length > 0) {
            const sortedCamerasData = camerasData.sort(sortByName);
            const options =
                OptionsConverter.convertCamerasToOptions(sortedCamerasData);

            setCameraOptions(options);
        }
    }, [camerasQuery.data]);

    useEffect(() => {
        if (cameraDataQuery.data) {
            setLoadingText('Loading...');
            setIsLoading(true);

            const customer = customerOptions.find(
                (option) =>
                    option.value === cameraDataQuery.data.account_id.toString()
            );
            setSelectedCustomers(customer);

            setSelectedCameraData(cameraDataQuery.data);
            setShowEditCameraDetails(true);
            setIsLoading(false);
        } else {
            setSelectedCameraData(null);
            setShowEditCameraDetails(false);
        }
    }, [cameraDataQuery.data]);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingText('Loading...');
            setIsLoading(true);
            await cameraDataQuery.refetch();
            setIsLoading(false);
        };
        if (selectedCamera) fetchData();
    }, [selectedCamera]);

    useEffect(() => {
        const fetchData = async () => {
            await camerasQuery.refetch();
        };
        fetchData();
    }, []);

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
                        <li>
                            <div className="field">
                                <span className="label">Select Camera</span>
                                <SingleSelect
                                    id="camera-select"
                                    classNamePrefix={`${
                                        showEditCameraDetails
                                            ? ''
                                            : 'camDetailsShowing'
                                    }`}
                                    value={selectedCamera}
                                    onChange={handleCameraSelect}
                                    options={cameraOptions}
                                />
                            </div>
                        </li>
                        {showEditCameraDetails && (
                            <>
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
                                            <span className="label">
                                                Customer
                                            </span>
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
                                            onChange={handleSiteSelect}
                                            options={siteOptions}
                                            required
                                        />
                                    </div>
                                </li>
                            </>
                        )}
                    </ul>
                    {showEditCameraDetails && (
                        <div className="edit-camera-btns-container">
                            <div className="top-row">
                                <Button
                                    id="save-edit-camera-button"
                                    type="submit"
                                    label="Save"
                                    className="btn primary"
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
                    )}
                </form>
                {showDeleteCameraModal && (
                    <DeleteCameraModal
                        handleClose={() => setShowDeleteCameraModal(false)}
                        closeEditModal={handleClose}
                        cameraData={selectedCameraData}
                        refetchCameraTreeData={camerasQuery.refetch}
                    />
                )}
                {isLoading && <LoadingModal modalText={loadingText} />}
            </div>
        </ModalBase>
    );
};

export default EditCameraBySiteModal;
