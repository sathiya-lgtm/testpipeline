// React
import React, { FC, FormEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Components
import ModalBase from '../../ModalBase';

// Api Calls
import deleteAlert from '../../../api_calls/deleteAlert';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';

// Custom
import handleHttpRequestError from '../../../utils/handleHttpRequestError';

// Types
import { IAlert } from '../../../types/tng-api.interfaces';

// styles
import '../../../styles/components/Modals/DeleteAlertModal.scss';

interface IProps {
    handleClose: () => void;
    selectedAlert: IAlert | null;
    refetchAlerts: () => any;
}

const DeleteAlertModal: FC<IProps> = ({
    handleClose,
    selectedAlert,
    refetchAlerts,
}) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);

    const onSuccess = async () => {
        toast.success('Alert deleted!');
        refetchAlerts();
        handleClose();
    };

    const deleteAlertMutation = useMutation({
        mutationFn: deleteAlert,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const handleDeleteAlert = (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser || !selectedAlert) {
            return;
        }

        deleteAlertMutation.mutate({
            user: activeUser,
            alert_id: selectedAlert.alert_id,
        });
    };

    return (
        <ModalBase title="Delete Alert" handleClose={handleClose}>
            <form onSubmit={handleDeleteAlert} className="DeleteAlertModal">
                <p>
                    Are you sure you want to delete the following Alert: <br />
                    {selectedAlert?.alert_name}
                </p>

                <div>
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
            </form>
        </ModalBase>
    );
};

export default DeleteAlertModal;
