// React
import { FC, FormEvent, useContext } from 'react';

// Third party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Components
import ModalBase from '../ModalBase';
import LoadingModal from '../Modals/LoadingModal';

// Api Calls
import { deleteSchedule } from '../../api_calls/Schedules';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Styles
import '../../styles/components/Scheduling/ConfirmDeleteScheduleModal.scss';

interface IProps {
    handleClose: () => void;
    scheduleId: number;
    accountId: string;
    siteId: string;
}

const ConfirmDeleteScheduleModal: FC<IProps> = ({
    handleClose,
    scheduleId,
    accountId,
    siteId,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const onSuccess = async () => {
        queryClient.invalidateQueries(['get-schedule', accountId, siteId]);
        toast.success('Schedule Removed.');
        handleClose();
    };

    const unlinkStagesAccountMutation = useMutation({
        mutationFn: deleteSchedule,
        onError: () => toast.error('Unable to remove schedule'),
        onSuccess: () => onSuccess(),
    });

    const handleDeleteAlert = (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser) {
            return;
        }

        unlinkStagesAccountMutation.mutate({
            user: activeUser,
            params: {
                schedule_site_id: scheduleId,
            },
        });
    };

    return (
        <ModalBase
            className="ConfirmDeleteScheduleModalBase"
            title="Remove Schedule"
            handleClose={handleClose}
        >
            <form
                onSubmit={handleDeleteAlert}
                className="ConfirmDeleteScheduleModal"
            >
                <p>
                    Are you sure you want to remove the schedule for this site?
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
                {unlinkStagesAccountMutation.isLoading && (
                    <LoadingModal modalText="Removing Schedule..." />
                )}
            </form>
        </ModalBase>
    );
};

export default ConfirmDeleteScheduleModal;
