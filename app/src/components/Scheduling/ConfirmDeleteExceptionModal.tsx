// React
import { FC, FormEvent, useContext } from 'react';

// Third party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Components
import ModalBase from '../ModalBase';
import LoadingModal from '../Modals/LoadingModal';

// Api Calls
import { deleteScheduleException } from '../../api_calls/ScheduleExceptions';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Styles
import '../../styles/components/Scheduling/ConfirmDeleteScheduleModal.scss';

interface IProps {
    handleClose: () => void;
    scheduleExceptionId: number;
    accountId: string;
    siteId: string;
    scheduleId: number;
}

const ConfirmDeleteScheduleExceptionModal: FC<IProps> = ({
    handleClose,
    scheduleExceptionId,
    accountId,
    siteId,
    scheduleId,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const onSuccess = async () => {
        queryClient.invalidateQueries([
            'get-schedule-exceptions',
            accountId,
            siteId,
            scheduleId,
        ]);
        toast.success('Schedule exception removed.');
        handleClose();
    };

    const deleteExceptionMutation = useMutation({
        mutationFn: deleteScheduleException,
        onError: () => toast.error('Unable to delete exception.'),
        onSuccess: () => onSuccess(),
    });

    const handleDeleteScheduleException = (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser) {
            return;
        }

        deleteExceptionMutation.mutate({
            user: activeUser,
            params: {
                schedule_site_exception_id: scheduleExceptionId,
            },
        });
    };

    return (
        <ModalBase
            className="ConfirmDeleteScheduleModalBase"
            title="Remove Schedule Exception?"
            handleClose={handleClose}
        >
            <form
                onSubmit={handleDeleteScheduleException}
                className="ConfirmDeleteScheduleModal"
            >
                <p>Are you sure you want to remove this schedule exception?</p>

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
                {deleteExceptionMutation.isLoading && (
                    <LoadingModal modalText="Removing schedule exception..." />
                )}
            </form>
        </ModalBase>
    );
};

export default ConfirmDeleteScheduleExceptionModal;
