import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

interface IClassificationError {
    event_type: string;
    file_uuid: string;
    comment: string;
}

interface IParams {
    user: IUser;
    classificationError: IClassificationError;
}

/** Makes a POST request to report an AI classification error. */
export default async ({
    user,
    classificationError,
}: IParams): Promise<Response> => {
    return customFetch(
        `/api/report/ai_error`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(classificationError),
        },
        'Report classification error'
    );
};
