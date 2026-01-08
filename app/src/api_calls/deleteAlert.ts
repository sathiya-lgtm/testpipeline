import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

interface IParams {
    user: IUser;
    alert_id: number;
}

export default async ({ user, alert_id }: IParams): Promise<Response> => {
    return customFetch(
        `/api/alerts/trigger/delete`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ alert_id }),
        },
        'Delete Alert'
    );
};
