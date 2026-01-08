// Third party
import { format, parseISO } from 'date-fns';

// Types
import { AccountType } from '../../../types/enums';
import { SelectOption } from '../../../types/interfaces';
import { ITokenResponse } from '../../../api_calls/getKeywords';
import {
    IAISearchTokens,
    INLSearchTokens,
} from '../../../types/tng-api.interfaces';
import { INLForensicQueryObj } from '../../../api_calls/nlForensicSearchPaginated';
import { IAIForensicQueryObj } from '../../../api_calls/aiForensicSearchPaginated';

export const autoRefreshTimeoutSeconds = 30;

export const classificationOptions: SelectOption[] = [
    {
        label: 'Person',
        value: 'Person',
    },
    { label: 'Vehicle', value: 'Vehicle' },
];

export const eventTypeOptions: SelectOption[] = [
    { label: 'AI Behavior', value: 'AI Behavior' },
    { label: 'Access', value: 'Access' },
    { label: 'Instrusion', value: 'Intrusion' },
    { label: 'Device Health', value: 'Device Health' },
    { label: 'Camera Actions', value: 'Camera Actions' },
    { label: 'Schedule', value: 'Schedule' },
];

export const videoAIEventOptions: SelectOption[] = [
    {
        label: 'Loitering',
        value: 'Loitering',
    },
    {
        label: 'Detection',
        value: 'Detection',
    },
    {
        label: 'Line Cross',
        value: 'Line Cross',
    },
    {
        label: 'Unauthorized Access',
        value: 'Unauthorized Access',
    },
];

export const accessEventOptions: SelectOption[] = [
    {
        label: 'Access Request',
        value: 'Access Request',
    },
];

export const intrusionEventOptions: SelectOption[] = [
    {
        label: 'Disarmed',
        value: 'Disarmed',
    },
    {
        label: 'Armed',
        value: 'Armed',
    },
    {
        label: 'Perimeter Burg',
        value: 'Perimeter Burg',
    },
    {
        label: 'Perimeter Burg Restore',
        value: 'Perimeter Burg Restore',
    },
    {
        label: 'Zone Bypass',
        value: 'Zone Bypass',
    },
];

export const deviceHealthOptions: SelectOption[] = [
    {
        label: 'Camera On-line',
        value: 'Camera On-line',
    },
    {
        label: 'Camera Off-line',
        value: 'Camera Off-line',
    },
];

export const cameraActionsOptions: SelectOption[] = [
    {
        label: 'Camera Action Device',
        value: 'Camera Action Device',
    },
];

export const scheduleOptions: SelectOption[] = [
    {
        label: 'Site Armed',
        value: 'Site Armed',
    },
    {
        label: 'Site Disarmed',
        value: 'Site Disarmed',
    },
];

/** Returns the start of today in ISO string format (e.g. 2023-03-29T00:00:00).
 * The ISO string omits the "Z" at the end thus denotes the browser's local time.
 * @returns {string} The beginning of today's date in ISO string format in the browser's local time zone.
 */
export const generateDefaultFilterStartDate = (): string => {
    const today = new Date();

    // format function call takes Date object and formats to string in "yyyy-MM-dd" format in client timezone.
    // the seconds need to be set to zero, otherwise the select has the option to control seconds
    return `${format(today, 'yyyy-MM-dd')}T00:00:00`;
};

/** Returns the end of today in ISO string format (e.g. 2023-03-29T23:59:00).
 * The ISO string omits the "Z" at the end thus denotes the browser's local time.
 * @returns {string} The end of today's date in ISO string format in the browser's local time zone.
 */
export const generateDefaultFilterEndDate = (): string => {
    const today = new Date();

    // format function call takes Date object and formats to string in "yyyy-MM-dd" format in client timezone.
    // the seconds need to be set to zero, otherwise the select has the option to control seconds
    return `${format(today, 'yyyy-MM-dd')}T23:59:00`;
};

export const getNumberOfParentsForListTarget = (
    accountType: AccountType,
    targetType: 'account' | 'site' | 'camera'
): number => {
    if (targetType === 'account') {
        return accountType === AccountType.Evolon ? 1 : 0;
    }

    if (targetType === 'site') {
        switch (accountType) {
            case AccountType.Evolon:
                return 2;
            case AccountType.ServiceProvider:
                return 1;
            default:
                return 0;
        }
    }

    if (targetType === 'camera') {
        switch (accountType) {
            case AccountType.Evolon:
                return 3;
            case AccountType.ServiceProvider:
                return 2;
            default:
                return 1;
        }
    }

    return 0;
};

/**
 * Throws error if start or end ISO strings are invalid in relation to each other
 * or in relation to submitting a forensic search.
 * @param {string} start - ISO string denoting start date time.
 * @param {string} end - ISO string denoting end date time.
 * @returns {void}
 */
export const validateDates = (start: string, end: string): void => {
    // start and end can be empty if user clears date via browser's native input.
    const startTime = start !== '' ? new Date(start) : undefined;
    const endTime = end !== '' ? new Date(end) : undefined;

    if (!endTime) {
        throw new Error('An End Date must be provided.');
    }

    if (!startTime) {
        throw new Error('A Start Date must be provided.');
    }

    if (startTime >= endTime) {
        throw new Error('End Date must be after Start Date.');
    }

    if (startTime >= new Date()) {
        throw new Error('Start Date cannot be in the future.');
    }
};

export const defaultNLKeywords = [
    'person',
    'people',
    'vehicle',
    'vehicles',
    'car',
    'suv',
    'van',
    'truck',
    'bus',
    'bicycle',
    'motorcycle',
    'airplane',
    'train',
    'white',
    'black',
    'gray',
    'silver',
    'blue',
    'brown',
    'red',
    'yellow',
    'orange',
    'green',
    'pink',
    'purple',
    'male',
    'female',
    'Access',
    'AI Behavior',
    'Intrusion',
    'Device Health',
    'Camera Actions',
    'Access Request',
    'Loitering',
    'Detection',
    'Line Cross',
    'Disarmed',
    'Armed',
    'Perimeter Burg',
    'Perimeter Burg Restore',
    'Zone Bypass',
    'Camera On-line',
    'Camera Off-line',
    'Camera Action Device',
];

export const addSearchToHistory = (newSearch: string, username: string) => {
    const previousSearchData = localStorage.getItem('nlSearches');
    let previousSearches: string[] = [];
    let searchData: { [key: string]: string[] } = {};

    if (previousSearchData) {
        searchData = JSON.parse(previousSearchData);

        if (searchData[username]) {
            previousSearches = searchData[username];
        }
    }

    const formattedSearches = previousSearches.map((search) =>
        search.toLowerCase()
    );

    if (formattedSearches.includes(newSearch.toLowerCase())) {
        const index = formattedSearches.indexOf(newSearch.toLowerCase());

        // If the search is found and it's not already the first element
        if (index > 0) {
            previousSearches.splice(index, 1);
            previousSearches.unshift(newSearch);
        }
        return previousSearches;
    }

    if (previousSearches.length >= 5) {
        previousSearches.pop();
    }

    const result = [newSearch, ...previousSearches];
    searchData[username] = result;
    localStorage.setItem('nlSearches', JSON.stringify(searchData));
    return result;
};

export const getSearchHistory = (username: string) => {
    const previousSearchData = localStorage.getItem('nlSearches');
    let previousSearches: string[] = [];

    if (previousSearchData) {
        const searchData = JSON.parse(previousSearchData);

        if (searchData[username]) {
            previousSearches = searchData[username];
        }
    }

    return previousSearches;
};

export const buildNLSearch = (
    tokenResponse: ITokenResponse,
    nlQueryTokenResponse: INLSearchTokens,
    request: 'standard' | 'audit',
    last_index: number,
    serviceProviderId?: number
) => {
    const nlForensicObj: INLForensicQueryObj = {
        date_to: '',
        date_from: '',
        request,
        last_index,
        order: 'desc',
        '*service_provider': serviceProviderId,
    };
    const keysToConvert = ['sites', 'cameras', 'customers'];

    const tokenEntries: [keyof INLSearchTokens, string[]][] = Object.entries(
        nlQueryTokenResponse
    ) as [keyof INLSearchTokens, string[]][];

    tokenEntries.forEach(([key, value]) => {
        if (!keysToConvert.includes(key)) {
            nlForensicObj[key] = value as any;
        } else {
            const tokensDetails =
                tokenResponse.tokens[key as 'cameras' | 'sites' | 'customers'];
            const tokenIds: number[] = [];

            value.forEach((tokenName) => {
                tokensDetails.forEach((tokenDetail) => {
                    if (tokenDetail.text === tokenName) {
                        tokenIds.push(tokenDetail.id);
                    }
                });
            });

            nlForensicObj[key] = tokenIds as any;
        }
    });

    return nlForensicObj;
};

export const buildAISearch = (
    nlQueryBuilderTokenResponse: IAISearchTokens,
    site_id: number,
    is_audit_mode: boolean,
    page_limit: number,
    serviceProviderId?: number
) => {
    const aiForensicObj: IAIForensicQueryObj = {
        start_date: '',
        end_date: '',
        site_id,
        '*service_provider': serviceProviderId,
        file_id: 0,
        page_limit,
        is_audit_mode,
    };

    const keysToNotAdd = ['camera_names'];
    const dateKeys = ['start_date', 'end_date'];

    const tokenEntries: [keyof IAISearchTokens, string[]][] = Object.entries(
        nlQueryBuilderTokenResponse
    ) as [keyof IAISearchTokens, string[]][];

    tokenEntries.forEach(([key, value]) => {
        if (!keysToNotAdd.includes(key)) {
            if (dateKeys.includes(key)) {
                const date_value: any = parseISO(value as any)
                    .toISOString()
                    .replace('T', ' ')
                    .replace('Z', '');

                aiForensicObj[key] = date_value;
            } else {
                aiForensicObj[key] = value as any;
            }
        }
    });

    return aiForensicObj;
};
