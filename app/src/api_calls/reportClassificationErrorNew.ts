import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

interface IClassificationError {
    file_id: number;
    ai_classification_comment: string;
    ai_classification_event: string;
}

interface IParams {
    user: IUser;
    classificationError: IClassificationError;
}

interface IAIErrorClassificationResponse {
    ai_classification_error_comment: string;
    ai_classification_error_event: string;
    ai_classification_error_id: number;
}

/** Makes a POST request to report an AI classification error. */
export default async ({
    user,
    classificationError,
}: IParams): Promise<IAIErrorClassificationResponse> => {
    const data = await customFetch(
        `/api/report/ai_classification_error`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(classificationError),
        },
        'Report classification error'
    );

    const {
        response,
    }: StandardApiResponseObj<{ data: IAIErrorClassificationResponse }> =
        await data.json();

    return response.data;
};
