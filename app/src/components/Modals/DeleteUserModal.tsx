// React
import React, { FC, FormEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Custom
import updateUser from '../../api_calls/updateUser';
import handleHttpRequestError from '../../utils/handleHttpRequestError';

// Content
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import ModalBase from '../ModalBase';

// Types
import { IManagedUser } from '../../types/tng-api.interfaces';
import { IUser } from '../../types/interfaces';

// Styles
import '../../styles/components/Modals/DeleteModal.scss';

interface IProps {
    handleClose: () => void;
    selectedManagedUser: IManagedUser;
    refetch: () => void;
}

const DeleteUserModal: FC<IProps> = ({
    handleClose,
    selectedManagedUser,
    refetch,
}) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);

    const onSuccess = async () => {
        toast.success('User deleted!');
        refetch();

        handleClose();
    };

    const deleteUserMutation = useMutation({
        mutationFn: updateUser,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const handleDelete = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();

        deleteUserMutation.mutate({
            user: activeUser as IUser,
            updateUserData: {
                action: 'delete-user',
                target: selectedManagedUser.user_id,
                prev: '',
                additional:
                    selectedManagedUser.account_type === 'service provider'
                        ? 'sp'
                        : 'cl',
            },
        });
    };

    return (
        <ModalBase title="Delete User" handleClose={handleClose}>
            <form
                data-testid="delete-user-form"
                onSubmit={handleDelete}
                className="DeleteModal"
            >
                <p>
                    Delete user &quot;
                    <i data-testid="delete-user-display-name">
                        {selectedManagedUser.username}
                    </i>
                    &quot;?
                </p>

                <div>
                    <button
                        data-testid="confirm-delete-user-button"
                        className="btn danger"
                        type="submit"
                    >
                        Delete
                    </button>
                    <button
                        data-testid="cancel-delete-user-button"
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

export default DeleteUserModal;
