import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

interface IUpdateMotionConfidenceData {
    camera_id: number;
    changes: {
        vehicle_motion_confidence: number;
        person_motion_confidence: number;
    };
}

interface IParams {
    user: IUser;
    motionConfidenceData: IUpdateMotionConfidenceData;
}

/** Makes a POST request to change vehicle motion sensitivity. */
export default async ({
    user,
    motionConfidenceData,
}: IParams): Promise<void> => {
    await customFetch(
        `/api/cameras/update_properties`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(motionConfidenceData),
        },
        'Motion confidence update'
    );
};
