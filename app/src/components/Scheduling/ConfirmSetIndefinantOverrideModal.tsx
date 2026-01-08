// React
import { FC, FormEvent } from 'react';

// Components
import ModalBase from '../ModalBase';

// Styles
import '../../styles/components/Scheduling/ConfirmDeleteScheduleModal.scss';

interface IProps {
    handleClose: () => void;
    onConfirm: (e: FormEvent) => void;
    action: 'arm' | 'disarm';
}

const ConfirmSetIndefinantOverrideModal: FC<IProps> = ({
    handleClose,
    onConfirm,
    action,
}) => {
    return (
        <ModalBase
            className="ConfirmDeleteScheduleModalBase"
            title={action === 'arm' ? 'Always Arm' : 'Always Disarm'}
            handleClose={handleClose}
        >
            <form
                onSubmit={(e) => {
                    onConfirm(e);
                    handleClose();
                }}
                className="ConfirmDeleteScheduleModal"
            >
                <p>
                    Setting the time period to always will ignore your schedule
                    until you manually update the override. Are you sure you
                    want to do this?
                </p>

                <div className="confirmButtonsContainer">
                    <button className="btn danger" type="submit">
                        {action === 'arm' ? 'Always Arm' : 'Always Disarm'}
                    </button>
                    <button
                        className="btn neutral"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </ModalBase>
    );
};

export default ConfirmSetIndefinantOverrideModal;
