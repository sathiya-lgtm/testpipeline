import customFetch from '../utils/customFetch';

interface IResetPassword {
    password: string;
    confirm: string;
    token: string;
}

interface IParams {
    updateUserPassword: IResetPassword;
}

/** POST request to update the user password. */
export default async ({ updateUserPassword }: IParams): Promise<void> => {
    await customFetch(
        `/api/user/reset_password`,
        {
            method: 'POST',
            body: JSON.stringify(updateUserPassword),
        },
        'User Password update'
    );
};
