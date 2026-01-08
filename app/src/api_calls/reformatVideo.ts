// Axios
import axios from 'axios';

const endpoint = `api/files/reformat-video/`;
const host = import.meta.env.VITE_AI_API_DOMAIN || '';

export interface IReformatProps {
    file_uuid: string;
    file_name: string;
    api_key: string;
}

export interface IReformatResponse {
    file_uuid: string;
    file_name: string;
    original_size: number;
    reformat_size: number;
    frame_count: number;
    aws_presigned_video: string;
    aws_presigned_alarm: string;
}

export default async ({
    params,
}: {
    params: IReformatProps;
}): Promise<IReformatResponse> => {
    const { data } = await axios.post<IReformatResponse>(
        `${host}/${endpoint}`,
        {
            ...params,
        }
    );
    return data;
};
