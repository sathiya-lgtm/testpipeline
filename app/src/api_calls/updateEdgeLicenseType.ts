import customFetch from '../utils/customFetch';

// Types
import { EdgeLicenseTypes } from '../types/tng-api.interfaces';
import { IUser } from '../types/interfaces';

interface IParams {
    user: IUser;
    cameraId: number;
    licenseType: EdgeLicenseTypes;
}

export default async ({
    user,
    cameraId,
    licenseType,
}: IParams): Promise<Response> => {
    return customFetch(
        `/api/cameras/update_properties`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({
                camera_id: cameraId,
                changes: { license_type: licenseType },
            }),
        },
        'Update camera type'
    );
};
