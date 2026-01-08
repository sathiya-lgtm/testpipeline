// React
import { FC, FormEvent, useContext } from 'react';

// Third party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Components
import ModalBase from '../ModalBase';
import LoadingModal from '../Modals/LoadingModal';

// Api Calls
import { deleteScheduleOverride } from '../../api_calls/ScheduleOverides';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Styles
import '../../styles/components/Scheduling/ConfirmDeleteScheduleModal.scss';

interface IProps {
    handleClose: () => void;
    scheduleId: number;
    overrideId: number;
    accountId: string;
    siteId: string;
}

const ConfirmRemoveOverrideModal: FC<IProps> = ({
    handleClose,
    scheduleId,
    overrideId,
    accountId,
    siteId,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const onSuccess = async () => {
        queryClient.invalidateQueries([
            'get-schedule-overrides',
            accountId,
            siteId,
            scheduleId,
        ]);
        queryClient.invalidateQueries(['get-site-status', accountId, siteId]);
        toast.success('Override Removed.');
        handleClose();
    };

    const deleteScheduleOverrideMutation = useMutation({
        mutationFn: deleteScheduleOverride,
        onError: () => toast.error('Unable to remove override.'),
        onSuccess: () => onSuccess(),
    });

    const handleDeleteOverride = (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser) {
            return;
        }

        deleteScheduleOverrideMutation.mutate({
            user: activeUser,
            params: {
                schedule_site_override_id: overrideId,
            },
        });
    };

    return (
        <ModalBase
            className="ConfirmDeleteScheduleModalBase"
            title="Remove Override"
            handleClose={handleClose}
        >
            <form
                onSubmit={handleDeleteOverride}
                className="ConfirmDeleteScheduleModal"
            >
                <p>
                    Are you sure you want to remove the schedule override for
                    this site? Doing so will cause the system to go back to the
                    default schedule.
                </p>

                <div className="confirmButtonsContainer">
                    <button className="btn danger" type="submit">
                        Remove
                    </button>
                    <button
                        className="btn neutral"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>
                {deleteScheduleOverrideMutation.isLoading && (
                    <LoadingModal modalText="Removing Override..." />
                )}
            </form>
        </ModalBase>
    );
};

export default ConfirmRemoveOverrideModal;
