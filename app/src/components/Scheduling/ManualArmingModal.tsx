// React
import { FC, FormEvent, useContext } from 'react';

// Third Party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Api Calls
import { updateDefaultSchedule } from '../../api_calls/DefaultScheduleTemplates';

// Components
import ModalBase from '../ModalBase';
import LoadingModal from '../Modals/LoadingModal';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Styles
import '../../styles/components/Scheduling/ManualArmingModal.scss';

interface IProps {
    handleClose: () => void;
    accountId: string;
    siteId: string;
    action: 'disarm' | 'arm';
}

const ManualArmingModal: FC<IProps> = ({
    handleClose,
    accountId,
    siteId,
    action,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const onSuccess = (successMessage: string) => {
        queryClient.invalidateQueries(['get-schedule', accountId, siteId]);
        queryClient.invalidateQueries([
            'get-default-schedule',
            accountId,
            siteId,
        ]);
        queryClient.invalidateQueries(['get-site-status', accountId, siteId]);
        handleClose();
        toast.success(successMessage);
    };

    const armDisarmSite = useMutation({
        mutationFn: updateDefaultSchedule,
        onError: (error) => {
            console.log(error);
            toast.error(`Unable to ${action} site`);
        },
        onSuccess: () => onSuccess(`Site ${action}ed!`),
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser) {
            return;
        }

        const schedule_template_id = action === 'disarm' ? 2 : 1;

        armDisarmSite.mutate({
            user: activeUser,
            params: {
                schedule_template_id,
                account_id: Number(accountId),
                site_id: Number(siteId),
            },
        });
    };

    return (
        <ModalBase
            className="ManualArmingModalBase"
            title={action === 'disarm' ? 'Disarm Site?' : 'Arm Site?'}
            handleClose={handleClose}
        >
            <form
                id="schedule-form"
                key="schedule-form"
                onSubmit={handleSubmit}
                className="ManualArmingModal modal-content"
            >
                {action === 'disarm' ? (
                    <p>
                        Are you sure you want to disarm this site? Without a
                        schedule, the site will stay disarmed until you manually
                        arm it again.
                    </p>
                ) : (
                    <p>
                        Arm this site? Without a schedule, the site will stay
                        armed permanently.
                    </p>
                )}

                <div className="actionsContainer">
                    <button className="btn primary" type="submit">
                        {action === 'disarm' ? 'Disarm Site' : 'Arm Site'}
                    </button>
                    <button
                        className="btn danger"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>
                {armDisarmSite.isLoading && (
                    <LoadingModal modalText={`${action}ing site...`} />
                )}
            </form>
        </ModalBase>
    );
};

export default ManualArmingModal;
