// React
import React, {
    FormEvent,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

// React Router Dom
import { useNavigate, useParams } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { GoEye, GoEyeClosed } from 'react-icons/go';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Custom
import ResetUserPassword from '../../api_calls/ResetUserPassword';
import handleHttpRequestError from '../../utils/handleHttpRequestError';

// styles
import '../../styles/views/ResetPassword.scss';

const ResetPassword = () => {
    const params = useParams();
    const navigate = useNavigate();
    const { setActiveUser } = useContext(AuthContext);

    const [passwordChangeError, setPasswordChangeError] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };

    const onSuccess = async (): Promise<void> => {
        toast.success('Password updated!');

        setActiveUser(null);
        navigate('/');
    };

    const updatePasswordMutation = useMutation({
        mutationFn: ResetUserPassword,
        onError: (err: unknown) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const isPasswordValid = (): boolean => {
        let isValid: boolean = true;
        setPasswordChangeError('');

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

        const updateUserPassword = {
            password: newPassword,
            confirm: confirmNewPassword,
            token: params.tokenhash as string,
        };

        updatePasswordMutation.mutate({
            updateUserPassword: updateUserPassword,
        });
    };

    useEffect(
        () => setPasswordChangeError(''),
        [newPassword, confirmNewPassword]
    );

    return (
        <div className="passwordReset">
            <h1>Reset Password</h1>
            <form
                id="reset-password-form"
                key="reset-password-form"
                onSubmit={(e) => updatePassword(e)}
                className="ResetPasswordModal modal-content"
            >
                <ul>
                    <li key="new-password">
                        <label htmlFor="newPasswordInput">
                            New Password
                            <div className="password-field">
                                <input
                                    className={`input password-input ${
                                        passwordChangeError ? 'error' : ''
                                    }`}
                                    type={passwordVisible ? 'text' : 'password'}
                                    id="new-password"
                                    name="new-password"
                                    value={newPassword}
                                    required
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setPasswordChangeError('');
                                    }}
                                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d])(?=.{8,})[A-Za-z\d\W]{8,}$"
                                    title="Must contain at least one uppercase and lowercase letter, one special character, and be at least 8 characters long."
                                    autoComplete="off"
                                />

                                <span
                                    className="form-password-input-reveal"
                                    onClick={togglePasswordVisibility}
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
                    <li key="confirm-password">
                        <label htmlFor="newPasswordInput">
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
                                    id="confirm-password"
                                    name="confirm-password"
                                    value={confirmNewPassword}
                                    required
                                    onChange={(e) => {
                                        setConfirmNewPassword(e.target.value);
                                        setPasswordChangeError('');
                                    }}
                                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d])(?=.{8,})[A-Za-z\d\W]{8,}$"
                                    title="Must contain at least one uppercase and lowercase letter, one special character, and be at least 8 characters long."
                                    autoComplete="false"
                                />

                                <span
                                    className="form-password-input-reveal"
                                    onClick={toggleConfirmPasswordVisibility}
                                >
                                    {confirmPasswordVisible ? (
                                        <GoEyeClosed />
                                    ) : (
                                        <GoEye />
                                    )}
                                </span>
                            </div>
                        </label>
                        {passwordChangeError && (
                            <p id="password-error" className="error">
                                {passwordChangeError}
                            </p>
                        )}
                    </li>
                </ul>
                <div className="button-container">
                    <button
                        className="btn primary"
                        type="submit"
                        style={{ float: 'right' }}
                    >
                        Update
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ResetPassword;
