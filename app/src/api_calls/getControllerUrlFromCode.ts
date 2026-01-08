import customFetch from '../utils/customFetch';

// Types
import { StandardApiResponseObj } from '../types/tng-api.interfaces';

/** Makes a POST request to receive a given camera's mask. */
export default async (
    code: string
): Promise<{
    url: string;
    clip_url: string;
    aws_pre_sign_annotated_url?: string;
    aws_pre_sign_cleaned_detections_url?: string;
    aws_pre_sign_message_url?: string;
    aws_pre_sign_alarm_url?: string;
    aws_pres_sign_multimodal_detections_url?: string;
    camera_id: number;
    camera_name: string;
    clip_created_at?: string | null;
}> => {
    const data = await customFetch(
        `/api/live_view/find_controller_url`,
        {
            method: 'POST',
            body: JSON.stringify({ code }),
        },
        'Find Controller URL'
    );

    const {
        response,
    }: StandardApiResponseObj<{
        url: string;
        clip_url: string;
        aws_pre_sign_annotated_url: string;
        aws_pre_sign_cleaned_detections_url: string;
        aws_pre_sign_message_url: string;
        aws_pre_sign_alarm_url: string;
        aws_pres_sign_multimodal_detections_url: string;
        camera_id: number;
        camera_name: string;
        clip_created_at: string | null;
    }> = await data.json();

    return response;
};
