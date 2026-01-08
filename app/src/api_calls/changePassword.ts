import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

interface IParams {
    user: IUser;
    password: string;
    confirm: string;
}

export default async ({ user, password, confirm }: IParams): Promise<any> => {
    const data = await customFetch(
        `/api/user/change_password`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ password, confirm }),
        },
        'Change Password'
    );

    const result: StandardApiResponseObj<any> = await data.json();
    return result.response;
};
