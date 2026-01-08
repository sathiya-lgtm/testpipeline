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
import deleteSite from '../../../api_calls/deleteSite';

// Components
import LoadingModal from '../LoadingModal';
import ModalBase from '../../ModalBase';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';

// styles
import '../../../styles/components/Modals/EditSiteModal.scss';

interface IProps {
    handleClose: () => void;
    editSiteData: { siteName: string; siteId: number };
    setSiteRefreshId: Dispatch<SetStateAction<number>>;
}

const EditSiteModal: FC<IProps> = ({
    handleClose,
    editSiteData,
    setSiteRefreshId,
}) => {
    const { activeUser } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(false);

    const editSiteMutation = useMutation({
        mutationFn: deleteSite,
    });

    const handleSiteUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeUser) return;

        setIsLoading(true);

        try {
            const result = await editSiteMutation.mutateAsync({
                user: activeUser,
                site_id: editSiteData.siteId,
            });

            if (result.account_id) {
                setSiteRefreshId(result.account_id);
            }

            toast.success('Site Deleted!');
            handleClose();
        } catch (err) {
            console.error(extractErrorMessage(err));
            toast.error('Failed to delete site.');
        }

        setIsLoading(false);
    };

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

export default EditSiteModal;
