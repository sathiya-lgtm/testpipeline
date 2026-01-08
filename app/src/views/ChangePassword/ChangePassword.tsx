// React
import React, { useState, FormEvent, useContext } from 'react';

// React Router
import { Link, useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { GoEye, GoEyeClosed } from 'react-icons/go';

// Api Calls
import changePassword from '../../api_calls/changePassword';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import ConfirmChangePasswordModal from '../../components/Modals/Password/ConfirmPasswordChangeModal';

// Utils
import handleHttpRequestError from '../../utils/handleHttpRequestError';

// styles
import '../../styles/views/ChangePassword.scss';

// TODO this page does not make a request to change password, thus should either be removed or updated.
const ChangePassword = () => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);

    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] =
        useState<boolean>(false);
    const [passwordChangeError, setPasswordChangeError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showConfirmChangeModal, setShowConfirmChangeModal] = useState(false);

    const onSuccess = async () => {
        toast.success('Password Updated!');
        setShowConfirmChangeModal(false);
        setNewPassword('');
        setConfirmNewPassword('');
    };

    const updatePasswordMutation = useMutation({
        mutationFn: changePassword,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const changePasswordCheck = (e: FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmNewPassword) {
            setPasswordChangeError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordChangeError(
                'Password must be at least 8 characters long.'
            );
            return;
        }

        setShowConfirmChangeModal(true);
    };

    const updatePassword = () => {
        if (!activeUser) {
            return;
        }

        updatePasswordMutation.mutate({
            user: activeUser,
            password: newPassword,
            confirm: confirmNewPassword,
        });
    };

    return (
        <div className="changePassword">
            <h1>Change Password</h1>
            <form className="changePasswordForm" onSubmit={changePasswordCheck}>
                <ul>
                    <li>
                        <label htmlFor="newPasswordInput">
                            New Password
                            <div className="password-field">
                                <input
                                    className={`input password-input ${
                                        passwordChangeError ? 'error' : ''
                                    }`}
                                    type={passwordVisible ? 'text' : 'password'}
                                    id="newPasswordInput"
                                    name="newPasswordInput"
                                    value={newPassword}
                                    required
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setPasswordChangeError('');
                                    }}
                                    autoComplete="password"
                                />

                                <span
                                    className="form-password-input-reveal"
                                    onClick={() =>
                                        setPasswordVisible(!passwordVisible)
                                    }
                                >
                                    {passwordVisible ? (
                                        <GoEyeClosed />
                                    ) : (
                                        <GoEye />
                                    )}
                                </span>
                            </div>
                        </label>
                    </li>
                    <li>
                        <label htmlFor="confirmNewPasswordInput">
                            Confirm New Password
                            <div className="password-field">
                                <input
                                    className={`input password-input ${
                                        passwordChangeError ? 'error' : ''
                                    }`}
                                    type={
                                        confirmPasswordVisible
                                            ? 'text'
                                            : 'password'
                                    }
                                    id="confirmNewPasswordInput"
                                    name="confirmNewPasswordInput"
                                    value={confirmNewPassword}
                                    required
                                    onChange={(e) => {
                                        setConfirmNewPassword(e.target.value);
                                        setPasswordChangeError('');
                                    }}
                                    autoComplete="password"
                                />

                                <span
                                    className="form-password-input-reveal"
                                    onClick={() =>
                                        setConfirmPasswordVisible(
                                            !confirmPasswordVisible
                                        )
                                    }
                                >
                                    {confirmPasswordVisible ? (
                                        <GoEyeClosed />
                                    ) : (
                                        <GoEye />
                                    )}
                                </span>
                            </div>
                        </label>
                        {passwordChangeError ? (
                            <p id="password change error" className="error">
                                {passwordChangeError}
                            </p>
                        ) : null}
                    </li>

                    <li className="updatePasswordBtns">
                        <button className="btn primary mr-30" type="submit">
                            Update
                        </button>
                        <Link to="/home" className="btn danger">
                            Cancel
                        </Link>
                    </li>
                </ul>
            </form>
            {showConfirmChangeModal && (
                <ConfirmChangePasswordModal
                    handleClose={() => setShowConfirmChangeModal(false)}
                    updatePassword={updatePassword}
                />
            )}
        </div>
    );
};

export default ChangePassword;
