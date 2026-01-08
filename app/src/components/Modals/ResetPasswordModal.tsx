// React
import React, { FC, useState, useContext, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Custom
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import updateUser, { UpdateUserData } from '../../api_calls/updateUser';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import Input from '../Inputs/Input';
import ModalBase from '../ModalBase';

// Types
import { IManagedUser } from '../../types/tng-api.interfaces';

// Styles
import '../../styles/components/Modals/DeleteModal.scss';
import { IUser } from '../../types/interfaces';

interface IProps {
    handleCancelCallback: () => void;
    handleUpdateCallback: () => void;
    selectedManagedUser: IManagedUser;
}

const ResetPasswordModal: FC<IProps> = ({
    handleCancelCallback,
    handleUpdateCallback,
    selectedManagedUser,
}) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);

    const [passwordChangeError, setPasswordChangeError] = useState<
        string | null
    >(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] =
        useState<boolean>(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };

    const onSuccess = async (): Promise<void> => {
        toast.success('Password updated!');

        handleUpdateCallback();
    };

    const updatePasswordMutation = useMutation({
        mutationFn: updateUser,
        onError: (err: unknown) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const isPasswordValid = (): boolean => {
        let isValid: boolean = true;

        if (newPassword !== confirmNewPassword) {
            setPasswordChangeError('Passwords do not match.');

            isValid = false;
        }

        if (newPassword.length < 8) {
            setPasswordChangeError(
                'Password must be at least 8 characters long.'
            );

            isValid = false;
        }

        return isValid;
    };

    const updatePassword = async (
        e: FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();

        if (!isPasswordValid()) {
            return;
        }

        /** Action value is based on whether user is resetting their own password
         * or another user's password.
         */
        const updateUserData =
            selectedManagedUser.user_id === activeUser?.id
                ? {
                      action: 'edit-user',
                      target: {
                          id: selectedManagedUser.user_id,
                          password: newPassword,
                      },
                      prev: '',
                      additional:
                          selectedManagedUser.account_type ===
                          'service provider'
                              ? 'sp'
                              : 'cl',
                  }
                : {
                      action: 'reset-password',
                      target: {
                          id: selectedManagedUser.user_id,
                          password: newPassword,
                      },
                      prev: '',
                      additional:
                          selectedManagedUser.account_type ===
                          'service provider'
                              ? 'sp'
                              : 'cl',
                  };

        updatePasswordMutation.mutate({
            user: activeUser as IUser,
            updateUserData: updateUserData as UpdateUserData,
        });
    };

    useEffect(
        () => setPasswordChangeError(null),
        [newPassword, confirmNewPassword]
    );

    return (
        <ModalBase
            title="Reset Password"
            handleClose={handleCancelCallback}
            className="sm"
        >
            <form
                id="reset-password-form"
                key="reset-password-form"
                onSubmit={(e) => updatePassword(e)}
                className="ResetPasswordModal modal-content"
            >
                <p className="center">
                    Reset password for{' '}
                    <strong>{selectedManagedUser.username}</strong>
                </p>
                <hr />
                <p className="center">{selectedManagedUser.username}</p>
                <ul>
                    <li key="new-password">
                        <Input
                            label="New Password"
                            className={`input field password-input ${
                                passwordChangeError ? 'error' : ''
                            }`}
                            type={passwordVisible ? 'text' : 'password'}
                            id="new-password"
                            name="new-password"
                            value={newPassword}
                            required
                            onChange={setNewPassword}
                            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d])(?=.{8,})[A-Za-z\d\W]{8,}$"
                            title="Must contain at least one uppercase and lowercase letter, one special character, and be at least 8 characters long."
                            autoComplete="off"
                            isPassword={true}
                            onClick={togglePasswordVisibility}
                            isPasswordVisible={passwordVisible}
                        />
                    </li>
                    <li key="confirm-password">
                        <Input
                            label="Confirm New Password"
                            className={`input field password-input ${
                                passwordChangeError ? 'error' : ''
                            }`}
                            type={confirmPasswordVisible ? 'text' : 'password'}
                            id="confirm-password"
                            name="confirm-password"
                            value={confirmNewPassword}
                            required
                            onChange={setConfirmNewPassword}
                            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d])(?=.{8,})[A-Za-z\d\W]{8,}$"
                            title="Must contain at least one uppercase and lowercase letter, one special character, and be at least 8 characters long."
                            autoComplete="false"
                            isPassword={true}
                            onClick={toggleConfirmPasswordVisibility}
                            isPasswordVisible={confirmPasswordVisible}
                        />
                        {passwordChangeError && (
                            <p id="password-error" className="error">
                                {passwordChangeError}
                            </p>
                        )}
                    </li>
                </ul>
                <div className="button-container">
                    <button className="btn primary" type="submit">
                        Update
                    </button>
                    <button
                        className="btn danger"
                        type="button"
                        onClick={handleCancelCallback}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </ModalBase>
    );
};

export default ResetPasswordModal;
