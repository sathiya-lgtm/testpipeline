// Utils
import customFetch from '../utils/customFetch';

// Types
import { IUser } from '../types/interfaces';
import {
    IAIQueryBuilderKeywordMismatchObj,
    IAISearchTokens,
    StandardApiResponseObj,
} from '../types/tng-api.interfaces';

export interface IAIForensicQueryBuilderInputObj {
    site_id: number;
    user_query: string;
    service_provider_id?: number;
    timezone?: string;
}

export interface IAIQueryBuilderResponseObj {
    tokens: IAISearchTokens;
    keyword_mismatch_tokens: IAIQueryBuilderKeywordMismatchObj;
}

interface IParams {
    user: IUser;
    aiQueryBuilderInputs: IAIForensicQueryBuilderInputObj | undefined;
}

export default async ({
    user,
    aiQueryBuilderInputs,
}: IParams): Promise<IAIQueryBuilderResponseObj> => {
    let url = '/api/ai/forensic/query_builder';

    const data = await customFetch(
        url,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(aiQueryBuilderInputs),
            timeout: 30000,
        },
        'AI Forensic search'
    );

    const { response }: StandardApiResponseObj<IAIQueryBuilderResponseObj> =
        await data.json();

    return response;
};
