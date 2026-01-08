// React
import React, { FormEvent, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Custom
import ResetPasswordRequestApi from '../../api_calls/ResetPasswordRequestApi';
import handleHttpRequestError from '../../utils/handleHttpRequestError';

// Components
import Input from '../../components/Inputs/Input';

// styles
import '../../styles/views/ResetPassword.scss';


interface QueryParams {
    email: string | undefined;
};

const useQuery = (): QueryParams => {
  const query = new URLSearchParams(useLocation().search);
  return {
    email: query.get("email") ?? undefined
  };
};

const ResetPasswordRequest = () => {
    const navigate = useNavigate();
    const { setActiveUser } = useContext(AuthContext);
    const { email} = useQuery();
    const [emailId, setEmailId] = useState(email ?? '');

    const onSuccess = async (): Promise<void> => {
        toast.success('Your password reset request email has been sent.');

        setActiveUser(null);
        navigate('/');
    };



    const resetPasswordRequestMutation = useMutation({
        mutationFn: ResetPasswordRequestApi,
        onError: (err: unknown) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const sendResetPasswordMail = async (
        e: FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();

        const resetPasswordRequest = {
            email: emailId,
        };

        resetPasswordRequestMutation.mutate({
            resetPasswordRequest: resetPasswordRequest,
        });
    };

    return (
        <div className="passwordReset">
            <h1>Reset Password</h1>
            <form className="getEmailForm" onSubmit={sendResetPasswordMail}>
                <ul>
                    <li>
                        <Input
                            name="emailAddress"
                            className="input"
                            label="Email Address"
                            type="email"
                            value={emailId}
                            onChange={setEmailId}
                            required
                        />
                    </li>
                    <div className="loginBtnContainer">
                        <button
                            className="btn primary"
                            type="submit"
                            style={{ float: 'right' }}
                        >
                            Submit
                        </button>
                    </div>
                </ul>
            </form>
        </div>
    );
};

export default ResetPasswordRequest;
