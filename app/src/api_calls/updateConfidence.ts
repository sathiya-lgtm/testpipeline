import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

interface IUpdateConfidenceData {
    camera_id: number;
    confidence: {
        person: number;
        vehicle: number;
    };
    disable_ai: {
        disable_person_ai: boolean;
        disable_vehicle_ai: boolean;
    };
}

interface IParams {
    user: IUser;
    confidenceData: IUpdateConfidenceData;
}

/** Makes a POST request to save mask. */
export default async ({ user, confidenceData }: IParams): Promise<void> => {
    await customFetch(
        `/api/cameras/confidence`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(confidenceData),
        },
        'Confidence update'
    );
};
