// React
import React, {
    FC,
    useState,
    useContext,
    Dispatch,
    SetStateAction,
} from 'react';

// Third Party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Custom
import extractErrorMessage from '../../../utils/extractErrorMessage';

// Api Calls
import updateSite from '../../../api_calls/updateSite';

// Components
import DeactivateSiteCamerasModal from './DeactivateSiteCamerasModal';
import LoadingModal from '../LoadingModal';
import ModalBase from '../../ModalBase';
import Input from '../../Inputs/Input';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';

// styles
import '../../../styles/components/Modals/EditSiteModal.scss';

interface IProps {
    handleClose: () => void;
    editSiteData: { siteName: string; siteId: number; customerId: number };
    setSiteRefreshId: Dispatch<SetStateAction<number>>;
}

const EditSiteModal: FC<IProps> = ({
    handleClose,
    editSiteData,
    setSiteRefreshId,
}) => {
    const { activeUser } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(false);
    const [siteName, setSiteName] = useState(editSiteData.siteName);

    const [showDeleteSiteModal, setShowDeleteSiteModal] = useState(false);

    const editSiteMutation = useMutation({
        mutationFn: updateSite,
    });

    const handleSiteUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeUser) return;

        setIsLoading(true);

        try {
            const result = await editSiteMutation.mutateAsync({
                user: activeUser,
                siteUpdateData: {
                    new_site_name: siteName,
                    site_id: editSiteData.siteId,
                },
            });

            if (result.account_id) {
                setSiteRefreshId(result.account_id);
            }

            toast.success('Site Name Updated!');
            handleClose();
        } catch (err) {
            console.error(extractErrorMessage(err));

            toast.error('Failed to update site name');
        }

        setIsLoading(false);
    };

    return (
        <ModalBase
            title="Update Site Name"
            handleClose={handleClose}
            className="sm"
        >
            <div className="edit-site-modal-body">
                <form onSubmit={handleSiteUpdate} className="edit-site-modal">
                    <Input
                        name="siteNameInput"
                        id="siteNameInput"
                        className="input"
                        label="Site Name"
                        type="text"
                        value={siteName}
                        onChange={setSiteName}
                    />
                    <div className="btn-container">
                        <div className="top-row">
                            <button className="btn primary" type="submit">
                                Update
                            </button>
                            <button
                                className="btn danger"
                                type="button"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                        </div>
                        <button
                            className="btn danger"
                            type="button"
                            onClick={() => setShowDeleteSiteModal(true)}
                        >
                            Delete Site
                        </button>
                    </div>
                </form>
                {showDeleteSiteModal && (
                    <DeactivateSiteCamerasModal
                        handleClose={() => {
                            setShowDeleteSiteModal(false);
                        }}
                        closeEditSiteModal={handleClose}
                        editSiteData={editSiteData}
                        setSiteRefreshId={setSiteRefreshId}
                    />
                )}

                {isLoading && (
                    <LoadingModal modalText="Updating Site Information..." />
                )}
            </div>
        </ModalBase>
    );
};

export default EditSiteModal;
