import customFetch from '../utils/customFetch';

// Custom types
import { IUser, SelectOption } from '../types/interfaces';
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

interface INVRTemplate {
    name: string;
}

/** Fetch request for getting data for an individual camera via camera_id (e.g. 1, 215, 340, etc). */
export default async (user: IUser): Promise<SelectOption[]> => {
    const data = await customFetch(
        `/api/templates/nvr`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        },
        'Camera retrieval'
    );

    const result: StandardApiResponseObj<INVRTemplate[]> = await data.json();
    const templates: INVRTemplate[] = result.response;

    const formattedTemplates = templates.map((template) => {
        return { value: template.name, label: template.name };
    });

    return formattedTemplates;
};
