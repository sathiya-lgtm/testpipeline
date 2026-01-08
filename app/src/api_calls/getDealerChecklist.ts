import customFetch from '../utils/customFetch';
// Types
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IAPIDealerChecklist,
} from '../types/tng-api.interfaces';
import axios from 'axios';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    dealerId?: string;
}

/** Makes a GET request to retrieve all customers associated with a particular Service Provider. */
// export default async ({ user }: IParams): Promise<IDealerChecklist> => {
// const data = await customFetch(
//     `/api/dealer-onboarding-checklist/me`,
//     {
//         method: 'GET',
//         headers: {
//             Authorization: `Bearer ${user.accessToken}`,
//         },
//     },
//     'Dealer Profile retrieval'
// );

// const { response }: StandardApiResponseObj<IDealerChecklist> =
//     await data.json();

// return response;
// };

export default async ({
    user,
    dealerId,
}: IParams): Promise<
    IAPIDealerChecklist & { isDealerProfileAvailable?: true | false }
> => {
    try {
        let apiUrl = `${host}/api/dealer-onboarding-checklist/me`;

        if (dealerId) {
            apiUrl = `${host}/api/dealer-onboarding-checklist/${dealerId}`;
        }

        const { data, status } = await axios.get<
            StandardApiResponseObj<IAPIDealerChecklist>
        >(apiUrl, {
            headers: { Authorization: `Bearer ${user.accessToken}` },
            validateStatus: (status) => {
                // treat 200 and 404 as success
                return status === 200 || status === 404;
            },
        });

        if (status === 200) {
            return {
                ...data.response,
                isDealerProfileAvailable: true,
            };
        } else {
            // If status code is 404, then we should show the empty form
            return {
                dealer_account_number: '',
                company_name: '',
                president: '',
                company_contact_person: '',
                address: '',
                city: '',
                county: '',
                state: '',
                zip: '',
                office_hours: [],
                office_phone_number: '',
                back_line_number: '',
                state_burglar_license: [],
                private_security_license: [],
                tech_support_phone_number: '',
                tech_support_email_address: '',
                billing_contact_person: '',
                billing_contact_phone_number: '',
                billing_contact_email_address: '',
                company_passcode: '',
                authorized_office_personnel: [],
                technical_support_team: [],
                // report_setup: {
                //     account_changes: false,
                //     operator_signals: true,
                //     test_signals: true,
                // },
                report_setup: {},
                report_recipient_emails: [],
                status: 'Pending',
                isDealerProfileAvailable: false,
            };
        }
    } catch (error) {
        console.error('Failed to fetch Dealer Profile form:', error);
        throw new Error('Unable to fetch Dealer Profile data.');
    }
};
