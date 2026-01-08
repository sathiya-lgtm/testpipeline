// React
import React, {
    FC,
    useState,
    useContext,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Third Party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Custom
import { useCameraData } from '../../../hooks';
import extractErrorMessage from '../../../utils/extractErrorMessage';

// Api Calls
import deleteSiteWithCamera from '../../../api_calls/deleteSiteWithCamera';

// Components
import LoadingModal from '../LoadingModal';
import ModalBase from '../../ModalBase';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';

// Types
import { IUser } from '../../../types/interfaces';

// styles
import '../../../styles/components/Modals/EditSiteModal.scss';

interface IProps {
    handleClose: () => void;
    closeEditSiteModal: () => void;
    editSiteData: { siteName: string; siteId: number; customerId: number };
    setSiteRefreshId: Dispatch<SetStateAction<number>>;
}

const DeactivateSiteCamerasModal: FC<IProps> = ({
    handleClose,
    closeEditSiteModal,
    editSiteData,
    setSiteRefreshId,
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { activeUser } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(false);
    const [cameraConfigSiteId, setCameraConfigSiteId] = useState(0);
    const [cameraConfigCameraId, setCameraConfigCameraId] = useState(0);
    const [deleteSiteId, setDeleteSiteId] = useState<Number>(
        editSiteData.siteId ? editSiteData.siteId : 0
    );

    const cameraDataQuery = useCameraData({
        cameraId: cameraConfigCameraId,
        activeUser: activeUser as IUser,
        enabled: false,
    });

    const deactivateSiteCamerasMutation = useMutation({
        mutationFn: deleteSiteWithCamera,
    });

    const handleSiteUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeUser) return;

        setIsLoading(true);

        try {
            const result = await deactivateSiteCamerasMutation.mutateAsync({
                user: activeUser,
                account_id: editSiteData.customerId,
                site_id: editSiteData.siteId,
            });

            if (result.account_id) {
                setSiteRefreshId(result.account_id);
            }

            toast.success('Site Deleted!');

            if (deleteSiteId !== 0) {
                if (
                    cameraConfigSiteId !== 0 &&
                    cameraConfigSiteId === deleteSiteId
                ) {
                    navigate('/home/camera/0');
                }
            }

            handleClose();
            closeEditSiteModal();
        } catch (err) {
            console.error(extractErrorMessage(err));
            toast.error('Failed to delete site.');
        }

        setIsLoading(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            await cameraDataQuery.refetch();

            if (cameraDataQuery.data) {
                setCameraConfigSiteId(cameraDataQuery.data.site_id);
            }
        };
        if (cameraConfigCameraId !== 0) fetchData();
    }, [cameraConfigCameraId]);

    useEffect(() => {
        const pathParts = location.pathname.split('/').reverse();

        if (
            location.pathname.includes('/home/camera') &&
            Number(pathParts[0]) !== 0
        ) {
            setCameraConfigCameraId(Number(pathParts[0]));
        }
    }, []);

    return (
        <ModalBase title="Delete Site" handleClose={handleClose} className="sm">
            <form onSubmit={handleSiteUpdate} className="edit-site-modal">
                <p className="confirm-message">
                    Are you sure you want to the delete the site called{' '}
                    <span className="bold">{editSiteData.siteName}</span>?
                </p>
                <div className="btn-container">
                    <button className="btn danger" type="submit">
                        Delete
                    </button>
                    <button
                        className="btn neutral"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>

                {isLoading && <LoadingModal modalText="Deleting Site..." />}
            </form>
        </ModalBase>
    );
};

export default DeactivateSiteCamerasModal;
