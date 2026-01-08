// React
import React, { FC, FormEvent } from 'react';

// Components
import ModalBase from '../../ModalBase';

// styles
import '../../../styles/components/Modals/ConfirmChangePasswordModal.scss';

interface IProps {
    handleClose: () => void;
    updatePassword: () => void;
}

const UpdatePasswordModal: FC<IProps> = ({ handleClose, updatePassword }) => {
    const handleUpdatePassword = (e: FormEvent) => {
        e.preventDefault();
        updatePassword();
    };

    return (
        <ModalBase title="Update Password" handleClose={handleClose}>
            <form
                onSubmit={handleUpdatePassword}
                className="ConfirmChangePasswordModal"
            >
                <p>Are you sure you want to update your password?</p>

                <div>
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
            </form>
        </ModalBase>
    );
};

export default UpdatePasswordModal;
