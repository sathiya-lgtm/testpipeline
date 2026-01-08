import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { ILoiteringOptions } from '../types/tng-api.interfaces';

interface IUpdateLoiteringData {
    camera_id: number;
    loitering_options: ILoiteringOptions;
}

export interface IUpdateLoiteringPostParams {
    user: IUser;
    updateLoiteringData: IUpdateLoiteringData;
}

/** Makes a POST request to update camera loitering settings. */
export default async ({
    user,
    updateLoiteringData,
}: IUpdateLoiteringPostParams): Promise<void> => {
    await customFetch(
        `/api/cameras/loitering`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(updateLoiteringData),
        },
        'Loitering update'
    );
};
