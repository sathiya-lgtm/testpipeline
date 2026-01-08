// Axios
import axios from 'axios';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

const endpoint = `api/alerts/test/immix`;
const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    server: string;
    port: number;
    email_to: string;
    subject: string;
}

export default async ({
    user,
    server,
    port,
    email_to,
    subject,
}: IParams): Promise<Response> => {
    const { data } = await axios.post<StandardApiResponseObj<any>>(
        `${host}/${endpoint}`,
        {
            server,
            port,
            email_to,
            subject,
        },
        {
            headers: { Authorization: `Bearer ${user.accessToken}` },
        }
    );

    return data.response;
};
