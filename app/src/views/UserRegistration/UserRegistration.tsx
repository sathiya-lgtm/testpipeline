// React
import React, { FormEvent, ReactElement, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Custom
import completeRegistration from '../../api_calls/completeRegistration';
import handleHttpRequestError from '../../utils/handleHttpRequestError';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import Input from '../../components/Inputs/Input';

// Icons
import InsitesLogo from '../../images/icons/Insites_Logo_white_and_green.svg?react';

// styles
import '../../styles/views/UserRegistration.scss';

const specialChars = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
const lowerCaseLetters = 'abcdefghijklmnopqrstuvwxyz';
const capitalLetters = lowerCaseLetters.toUpperCase();
const digits = '0123456789';

const isIn = (aString: string, checkIsIn: string): boolean => {
    return aString.split('').some((char) => checkIsIn.includes(char));
};

// TODO function is inefficient and could use better naming conventions.
const validatePassword = (
    newPassword: string,
    confirmNewPassword: string
): { isValid: boolean; invalidReason: string | undefined } => {
    const min = 6;
    const max = 99;
    let invalidReason: string | undefined;

    if (newPassword.length < min) {
        invalidReason = `Password must have at least ${min} characters.`;
    }

    if (newPassword.length > max) {
        invalidReason = `Password must be less than ${max} characters.`;
    }

    if (newPassword !== confirmNewPassword) {
        invalidReason = 'Passwords do not match.';
    }

    if (!isIn(newPassword, specialChars)) {
        invalidReason = 'Password must contain special character.';
    }

    if (!isIn(newPassword, lowerCaseLetters)) {
        invalidReason = 'Password must contain lowercase letter.';
    }

    if (!isIn(newPassword, capitalLetters)) {
        invalidReason = 'Password must contain capital letter.';
    }

    if (!isIn(newPassword, digits)) {
        invalidReason = 'Password must contain number.';
    }

    return {
        isValid: invalidReason === undefined,
        invalidReason,
    };
};

const UserRegistration = (): ReactElement => {
    const params = useParams();
    const navigate = useNavigate();
    const { setActiveUser } = useContext(AuthContext);
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

    const onSuccess = (): void => {
        toast.success('Password successfully updated.', {
            toastId: 'user-registration-complete',
        });

        setActiveUser(null);
        navigate('/');
    };

    const { mutate } = useMutation({
        mutationFn: completeRegistration,
        onSuccess: () => onSuccess(),
        onError: (error) =>
            handleHttpRequestError(error, setActiveUser, navigate),
    });

    const handleSubmit = (e: FormEvent): void => {
        e.preventDefault();

        const passwordValidationResult = validatePassword(
            newPassword,
            confirmNewPassword
        );

        if (!passwordValidationResult.isValid) {
            const { invalidReason } = passwordValidationResult;

            toast.error(invalidReason, { toastId: 'invalid-password' });

            return;
        }

        mutate({
            completeRegistrationData: {
                password: newPassword,
                confirm: confirmNewPassword,
            },
            registrationHash: params.hash as string,
        });
    };

    return (
        <div className="UserRegistration">
            <InsitesLogo id="insites-logo" className="insites-logo" />
            <h1>{`Let's change your password`}</h1>
            <form onSubmit={handleSubmit}>
                <ul>
                    <li>
                        <Input
                            name="new-password"
                            className="input password-input"
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={setNewPassword}
                            autoComplete="new-password"
                            required
                            isPassword={true}
                            onClick={togglePasswordVisibility}
                            isPasswordVisible={passwordVisible}
                        />
                    </li>
                    <li>
                        <Input
                            name="confirm-new-password"
                            className="input password-input"
                            label="Confirm New Password"
                            type="password"
                            value={confirmNewPassword}
                            onChange={setConfirmNewPassword}
                            autoComplete="new-password"
                            required
                            isPassword={true}
                            onClick={toggleConfirmPasswordVisibility}
                            isPasswordVisible={confirmPasswordVisible}
                        />
                    </li>
                    <div className="button-container">
                        <button className="btn primary" type="submit">
                            Save
                        </button>
                    </div>
                </ul>
            </form>
        </div>
    );
};

export default UserRegistration;
