import customFetch from '../utils/customFetch';

interface IResetPasswordRequest {
    email: string;
}

interface IParams {
    resetPasswordRequest: IResetPasswordRequest;
}

/** POST call to password reset request. */
export default async ({ resetPasswordRequest }: IParams): Promise<void> => {
    await customFetch(
        `/api/user/reset_password_request`,
        {
            method: 'POST',
            body: JSON.stringify(resetPasswordRequest),
        },
        'Reset Password Request'
    );
};
