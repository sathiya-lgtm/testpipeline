// Axios
import axios from 'axios';

const endpoint = `api/files/trigger-annotate-video/`;
const host = import.meta.env.VITE_AI_API_DOMAIN || '';

interface ITriggerAnnotateProps {
    annotated_video_url: string;
    api_key: string;
}

export interface ITriggerAnnotateResponse {
    file_uuid: string;
    file_name: string;
    exists: boolean;
}

export default async ({
    params,
}: {
    params: ITriggerAnnotateProps;
}): Promise<ITriggerAnnotateResponse> => {
    const { data } = await axios.post<ITriggerAnnotateResponse>(
        `${host}/${endpoint}`,
        {
            ...params,
        }
    );

    return data;
};
