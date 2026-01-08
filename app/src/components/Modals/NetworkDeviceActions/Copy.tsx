import { FC, useEffect, useState } from 'react';
import '../../../styles/components/Modals/CameraActionCopy.scss';

// Third Party
import { toast } from 'react-toastify';

// API Route
import { IUser } from '../../../types/interfaces';
import CameraRoute, {
    ICamera,
    IGetProps as IGetCameraProps,
} from '../../../api_calls/Camera';

// Components
import ModalBase from '../../ModalBase';
import SearchBar from '../../SearchBar/SearchBar';

import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../ButtonGroup/ButtonGroup';
import Grid, {
    Header,
    Column,
    Body,
    Row,
    Cell,
    CheckboxColumn,
    CheckboxCell,
} from '../../Grid/Grid';

interface ICameraRow {
    camera: ICamera;
    checked: boolean;
}
interface ICameraRows {
    [camera_id: string]: ICameraRow;
}

export interface ICopyModalProps {
    user: IUser;
    show: boolean;
    data?: any | undefined | null;
    serviceProviderAccountId?: number | null | undefined;
    accountId?: number | null | undefined;
    siteId?: number | null | undefined;
    cameraFromId: number;
    onClose?: () => void;
    onCopy?: (camera_from_id: number, camera_to_id: number[]) => void;
}

const CopyModal: FC<ICopyModalProps> = ({
    user,
    data,
    show,
    serviceProviderAccountId,
    accountId,
    siteId,
    cameraFromId,
    onClose,
    onCopy,
}: ICopyModalProps) => {
    // State
    const [cameraFromName, setCameraFromName] = useState<string>('');
    const [cameras, setCameras] = useState<ICamera[] | null>(null);
    const [cameraRows, setCameraRows] = useState<ICameraRows | null>(null);
    const [rowsSelected, setRowsSelected] = useState<boolean>(false);
    const [filterValue, setFilterValue] = useState<string>('');

    // API
    const getCameras = async (props: IGetCameraProps) => {
        try {
            const route = CameraRoute(user);
            const rows = await route.get(props);
            if (rows) {
                setCameras(rows);
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

    // Functions
    const isRowSelected = () => {
        if (rowsSelected) return true;
        let checkRowSelected = false;
        if (cameraRows) {
            const camaraRowKeys = Object.keys(cameraRows);
            camaraRowKeys.forEach((cameraRowKey: string) => {
                const cameraRow = cameraRows[cameraRowKey];
                if (cameraRow) {
                    if (cameraRow.checked) {
                        checkRowSelected = true;
                    }
                }
            });
        }
        return checkRowSelected;
    };

    // Events
    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const handleCopy = () => {
        if (onCopy && cameraRows) {
            const cameraToIds: number[] = [];
            const rowKeys = Object.keys(cameraRows);
            rowKeys.map((camera_name: any) => {
                const cameraRow = cameraRows[camera_name];
                if (
                    cameraRow.checked &&
                    cameraRow.camera.camera_id !== cameraFromId
                ) {
                    cameraToIds.push(cameraRow.camera.camera_id);
                }
                return camera_name;
            });
            if (cameraToIds.length > 0) {
                onCopy(cameraFromId, cameraToIds);
            } else {
                toast.warning(
                    `You must select at least one camera to copy actions from ${cameraName} camera.`
                );
            }
        }
    };

    const onSearch = (searchValue: string) => {
        if (cameraRows) {
            setCameraRows((prevUpdatedCameraRows) => {
                const updatedCameraRows = { ...prevUpdatedCameraRows };
                const rowKeys = Object.keys(updatedCameraRows);
                rowKeys.map((camera_name: string) => {
                    if (updatedCameraRows) {
                        if (updatedCameraRows[camera_name]) {
                            updatedCameraRows[camera_name] = {
                                ...updatedCameraRows[camera_name],
                                checked: false,
                            };
                        }
                    }
                    return camera_name;
                });
                return updatedCameraRows;
            });
        }
        setFilterValue(searchValue);
    };

    const onClear = () => {
        setFilterValue('');
    };

    const onSelectAllCameras = (checked: boolean) => {
        if (cameraRows) {
            setRowsSelected(checked);
            setCameraRows((prevUpdatedCameraRows) => {
                const updatedCameraRows = { ...prevUpdatedCameraRows };
                const rowKeys = Object.keys(updatedCameraRows);
                rowKeys.map((camera_name: string) => {
                    if (updatedCameraRows) {
                        if (updatedCameraRows[camera_name]) {
                            updatedCameraRows[camera_name] = {
                                ...updatedCameraRows[camera_name],
                                checked,
                            };
                        }
                    }
                    return camera_name;
                });
                return updatedCameraRows;
            });
        }
    };

    const onSelectCamera = (checked: boolean, camera: ICamera) => {
        if (cameraRows && camera) {
            setCameraRows((prevUpdatedCameraRows) => {
                const updatedCameraRows = { ...prevUpdatedCameraRows };
                if (updatedCameraRows) {
                    if (updatedCameraRows[camera.camera_name]) {
                        updatedCameraRows[camera.camera_name] = {
                            ...updatedCameraRows[camera.camera_name],
                            checked,
                        };
                    }
                }
                return updatedCameraRows;
            });
        }
    };

    const onRenderRows: any = () => {
        if (cameraRows && cameraFromId) {
            const gridRows: any[] = [];
            const rowKeys = Object.keys(cameraRows);
            rowKeys.forEach((rowKey: any) => {
                const cameraRow = cameraRows[rowKey];
                if (cameraRow.camera.camera_id !== cameraFromId) {
                    gridRows.push(
                        <Row
                            data={cameraRow.camera}
                            filter={filterValue}
                            key={`camera-row-${rowKey}`}
                        >
                            <CheckboxCell
                                data={cameraRow.camera}
                                checked={cameraRow.checked}
                                onClick={onSelectCamera}
                            />
                            <Cell caption={cameraRow.camera.camera_name} />
                        </Row>
                    );
                }
                return cameraRow;
            });
            return gridRows;
        }
        return null;
    };

    useEffect(() => {
        if (serviceProviderAccountId && accountId && siteId) {
            const props: IGetCameraProps = {
                service_provider_account_id: serviceProviderAccountId,
                account_id: accountId,
                site_id: siteId,
            };
            getCameras(props);
        }
    }, [show]);

    useEffect(() => {
        if (cameras) {
            const newCameraRows: ICameraRows = {};
            cameras.map((camera: ICamera) => {
                if (Number(camera.camera_id) === cameraFromId) {
                    setCameraFromName(camera.camera_name);
                }
                newCameraRows[camera.camera_name] = {
                    camera,
                    checked: false,
                };
                return camera;
            });
            setCameraRows(newCameraRows);
        }
    }, [cameras]);

    if (show) {
        return (
            <div className="camera-action-copy-modal">
                <ModalBase
                    closeOnBackdropClick={false}
                    title={`Copy Actions from the ${cameraFromName} camera`}
                    handleClose={handleClose}
                >
                    <div className="inner-body">
                        <SearchBar onSearch={onSearch} onClear={onClear} />
                        <Grid>
                            <Header>
                                <CheckboxColumn
                                    checked={isRowSelected()}
                                    data={cameraRows}
                                    onClick={onSelectAllCameras}
                                />
                                <Column caption="Camera To" />
                            </Header>
                            <Body>{onRenderRows()}</Body>
                        </Grid>
                        <ButtonGroup
                            alignment={ButtonGroupAlignment.middleright}
                        >
                            <button
                                data-testid="copy-configure-button"
                                className="btn primary"
                                type="button"
                                onClick={handleCopy}
                            >
                                Copy
                            </button>
                            <button
                                data-testid="cancel-configure-button"
                                className="btn neutral"
                                type="button"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                        </ButtonGroup>
                    </div>
                </ModalBase>
            </div>
        );
    }
    return null;
};

export default CopyModal;
