import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';

interface IUpdateAnnotationSettings {
    camera_id: number;
    changes: {
        apply_blur?: boolean;
        suppress_untracked_persons?: boolean;
        suppress_untracked_vehicles?: boolean;
        job_type?: string;
    };
}

interface IParams {
    user: IUser;
    annotationSettings: IUpdateAnnotationSettings;
}

/** Makes a POST request to change vehicle motion sensitivity. */
export default async ({ user, annotationSettings }: IParams): Promise<void> => {
    await customFetch(
        `/api/cameras/update_properties`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(annotationSettings),
        },
        'Motion confidence update'
    );
};
