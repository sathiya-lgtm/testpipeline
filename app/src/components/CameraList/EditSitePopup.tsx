/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
// React
import React, {
    Dispatch,
    SetStateAction,
    FC,
    useState,
    useMemo,
    useContext,
} from 'react';

// Custom
import { useCameras } from '../../hooks';

// Components
import EditSiteModal from '../Modals/Site/EditSiteModal';
import EditCameraBySiteModal from '../Modals/Camera/EditCameraBySiteModal';
import DeleteSiteModal from '../Modals/Site/DeleteSiteModal';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Custom Types
import { IUser } from '../../types/interfaces';
import { IEditSiteData } from './CameraList';

// Styles
import '../../styles/components/CameraList/EditSitePopup.scss';

interface IProps {
    setEditSitePopupCords: Dispatch<
        SetStateAction<{ x: number; y: number } | null>
    >;
    editSitePopupCords: { x: number; y: number } | null;
    editSiteData: IEditSiteData;
    setSiteRefreshId: Dispatch<SetStateAction<number>>;
}

const EditSitePopup: FC<IProps> = ({
    setEditSitePopupCords,
    editSitePopupCords,
    editSiteData,
    setSiteRefreshId,
}) => {
    const { activeUser } = useContext(AuthContext);

    const [showEditSiteModal, setShowEditSiteModal] = useState(false);
    const [showDeleteSiteModal, setShowDeleteSiteModal] = useState(false);
    const [showEditCameraModal, setShowEditCameraModal] = useState(false);

    const handleItemClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const { data, isLoading } = useCameras({
        siteId: editSiteData.siteId,
        activeUser: activeUser as IUser,
        enabled: !!editSitePopupCords,
    });

    const editIsDisabled = useMemo(() => {
        // Typescript was getting made at this line so I changed it to the 5 lines below. There might be a better way to do this
        // return editSiteData.jobTypes.includes('milestone');
        for (let i = 0; i < editSiteData.jobTypes.length; i += 1) {
            if (editSiteData.jobTypes[i] === 'milestone') {
                return true;
            }
        }

        return false;
    }, [editSiteData]);

    const deleteIsDisabled = useMemo(() => {
        return isLoading || !data || data.length > 0;
    }, [isLoading, data]);

    const editCameraIsDisabled = useMemo(() => {
        return isLoading || !data || data.length === 0;
    }, [isLoading, data]);

    if (!editSitePopupCords) {
        return null;
    }

    return (
        <>
            <div
                className="editSitePopupBackground"
                onClick={() => setEditSitePopupCords(null)}
            >
                <ul
                    onClick={handleItemClick}
                    className="editSitePopup"
                    style={{
                        position: 'absolute',
                        top: editSitePopupCords.y,
                        left: editSitePopupCords.x,
                    }}
                >
                    <li
                        onClick={() => {
                            if (!editIsDisabled) {
                                setShowEditSiteModal(true);
                            }
                        }}
                        className={`${editIsDisabled ? 'disabled edit' : ''}`}
                    >
                        Edit Site
                    </li>
                    <li
                        onClick={() => {
                            if (!editCameraIsDisabled) {
                                setShowEditCameraModal(true);
                            }
                        }}
                        className={`${
                            editCameraIsDisabled ? 'disabled edit-camera' : ''
                        }`}
                    >
                        Edit Camera
                    </li>
                    <li
                        onClick={() => {
                            if (!deleteIsDisabled) {
                                setShowDeleteSiteModal(true);
                            }
                        }}
                        className={`${
                            deleteIsDisabled ? 'disabled delete' : ''
                        }`}
                    >
                        Delete
                    </li>
                </ul>
            </div>
            {showEditSiteModal && (
                <EditSiteModal
                    handleClose={() => {
                        setShowEditSiteModal(false);
                        setEditSitePopupCords(null);
                    }}
                    editSiteData={editSiteData}
                    setSiteRefreshId={setSiteRefreshId}
                />
            )}
            {showEditCameraModal && (
                <EditCameraBySiteModal
                    handleClose={() => {
                        setShowEditCameraModal(false);
                        setEditSitePopupCords(null);
                    }}
                    siteId={editSiteData.siteId}
                />
            )}
            {showDeleteSiteModal && (
                <DeleteSiteModal
                    handleClose={() => {
                        setShowDeleteSiteModal(false);
                        setEditSitePopupCords(null);
                    }}
                    editSiteData={editSiteData}
                    setSiteRefreshId={setSiteRefreshId}
                />
            )}
        </>
    );
};

export default EditSitePopup;
