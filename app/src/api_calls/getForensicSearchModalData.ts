// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import { JobType } from '../types/enums';
import {
    StandardApiResponseObj,
    IClipPayload,
} from '../types/tng-api.interfaces';

export interface IForensicSearchModalData {
    annotation_required: boolean;
    ai_classification_error_id: number;
    ai_classification_error_comment: string;
    ai_classification_error_event: string | null;
    ai_classification_payload: IClipPayload | {};
    aws_pre_sign_thumbnail_url: string;
    aws_pre_sign_origin_url: string;
    aws_pre_sign_origin_unformatted_url: string;
    aws_pre_sign_annotated_url: string;
    aws_pre_sign_cleaned_detections_url: string;
    aws_pre_sign_message_url: string;
    aws_pre_sign_alarm_url: string;
    aws_pres_sign_multimodal_detections_url: string;
    job_type: JobType;
}

interface IParams {
    user: IUser;
    file_id: number;
}

export default async ({
    user,
    file_id,
}: IParams): Promise<IForensicSearchModalData> => {
    const data = await customFetch(
        `/api/alerts/forensic/search/urls`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({ file_id }),
        },
        'Forensic search modal datas'
    );

    const {
        response,
    }: StandardApiResponseObj<{ data: IForensicSearchModalData }> =
        await data.json();

    return response.data;
};
