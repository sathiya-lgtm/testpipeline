/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, { FC, FormEvent, useCallback, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Custom
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import updateUser from '../../api_calls/updateUser';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import ModalBase from '../ModalBase';
import ResetPasswordModal from './ResetPasswordModal';
import Button from '../Button';
import Input from '../Inputs/Input';

// Types
import { IManagedUser } from '../../types/tng-api.interfaces';
import { IUser } from '../../types/interfaces';

interface IProps {
    handleClose: () => void;
    selectedManagedUser: IManagedUser;
    refetch: () => void;
}

const EditUser: FC<IProps> = ({
    handleClose,
    selectedManagedUser,
    refetch,
}) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);

    const onSuccess = useCallback((): void => {
        toast.success('User updated!');
        refetch();
        handleClose();
    }, [refetch, handleClose]);

    const editUserMutation = useMutation({
        mutationFn: updateUser,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess,
    });

    const [displayName, setDisplayName] = useState<string>(
        selectedManagedUser.username
    );
    const [email, setEmail] = useState<string>(selectedManagedUser.email);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
        useState<boolean>();

    const handleSubmit = useCallback(
        (e: FormEvent<HTMLFormElement>): void => {
            e.preventDefault();

            const isChangingDisplayName =
                displayName !== '' &&
                displayName !== selectedManagedUser.username;
            const isChangingEmail =
                email !== '' && email !== selectedManagedUser.email;

            // Exit early if user is not modifying anything. API call will fail if submitting otherwise.
            if (!isChangingDisplayName && !isChangingEmail) {
                handleClose();

                return;
            }

            /** Requests made featuring the same values as what's currently stored in database
             * will result in the request being rejected. Need to leave undefined if value isn't changing.
             */
            editUserMutation.mutate({
                user: activeUser as IUser,
                updateUserData: {
                    action: 'edit-user',
                    target: {
                        id: selectedManagedUser.user_id,
                        email: isChangingEmail ? email : undefined,
                        username: isChangingDisplayName
                            ? displayName
                            : undefined,
                    },
                    prev: '',
                    additional:
                        selectedManagedUser.account_type === 'service provider'
                            ? 'sp'
                            : 'cl',
                },
            });
        },
        [displayName, email]
    );

    return (
        <ModalBase title="" handleClose={handleClose} className="sm">
            <>
                {isResetPasswordModalOpen && (
                    <ResetPasswordModal
                        handleCancelCallback={() =>
                            setIsResetPasswordModalOpen(false)
                        }
                        handleUpdateCallback={() => {
                            setIsResetPasswordModalOpen(false);
                            handleClose();
                        }}
                        selectedManagedUser={selectedManagedUser}
                    />
                )}
                <form className="modal-content" onSubmit={handleSubmit}>
                    <h3 className="center">
                        Edit{' '}
                        <strong data-testid="editing-user-display-name">
                            {selectedManagedUser.username}
                        </strong>
                    </h3>
                    <div>
                        <Input
                            id="edit-display-name"
                            name="edit-display-name"
                            label="Display Name"
                            className="input field"
                            data-testid="display-name"
                            type="text"
                            value={displayName}
                            autoComplete="false"
                            onChange={setDisplayName}
                            required
                        />
                        <Input
                            id="edit-email"
                            name="email"
                            label="Email"
                            data-testid="email"
                            className="input field"
                            type="text"
                            value={email}
                            autoComplete="false"
                            onChange={setEmail}
                            required
                        />
                    </div>
                    <div>
                        <div className="button-container">
                            <Button
                                id="reset-password-button"
                                data-testid="reset-password-button"
                                type="button"
                                label="Reset Password"
                                className="btn neutral"
                                onClick={() =>
                                    setIsResetPasswordModalOpen(true)
                                }
                            />
                        </div>
                        <div className="button-container">
                            <Button
                                id="confirm-edit-user-button"
                                type="submit"
                                label="Confirm"
                                className="btn primary"
                                onClick={() => {}}
                            />
                            <Button
                                id="cancel-edit-user-button"
                                type="button"
                                label="Cancel"
                                className="btn danger"
                                onClick={() => handleClose()}
                            />
                        </div>
                    </div>
                </form>
            </>
        </ModalBase>
    );
};

export default EditUser;
