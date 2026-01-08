// Types
import { toast } from 'react-toastify';
import { IUser } from '../types/interfaces';
import {
    StandardApiResponseObj,
    IAPISubscriberFactSheet,
} from '../types/tng-api.interfaces';
import axios from 'axios';

const host = import.meta.env.VITE_API_DOMAIN || '';

interface IParams {
    user: IUser;
    siteId: string;
}

export default async ({
    user,
    siteId,
}: IParams): Promise<IAPISubscriberFactSheet | undefined> => {
    try {
        const apiUrl = `${host}/api/sites/fact-sheet/${siteId}`;

        const { data, status } = await axios.get<
            StandardApiResponseObj<IAPISubscriberFactSheet>
        >(apiUrl, {
            headers: { Authorization: `Bearer ${user.accessToken}` },
            // validateStatus: (status) => {
            //     // treat 200 and 404 as success
            //     return status === 200 || status === 404;
            // },
        });

        if (status === 200) return data.response;
        // else {
        //     // If status code is 404, then we should show the empty form
        //     return {
        //         dealer_number: '',
        //         dealer_name: '',
        //         subscriber_account_number: '',
        //         subscriber_account_type: 'Residential',
        //         video_system_types: [],
        //         business_name: '',
        //         address: '',
        //         suite_number: '',
        //         city: '',
        //         state: '',
        //         zip: '',
        //         customer_name: '',
        //         customer_email: '',
        //         customer_cell: '',
        //         location_phone_primary: '',
        //         location_phone_secondary: '',
        //         subdivision: '',
        //         cross_street: '',
        //         alarm_permit_number: '',
        //         // police_department: { name: '', phone: '' },
        //         // fire_department: { name: '', phone: '' },
        //         // ems_service: { name: '', phone: '' },
        //         // guard_service: { name: '', phone: '' },
        //         police_department: {},
        //         fire_department: {},
        //         ems_service: {},
        //         guard_service: {},

        //         post_dispatch_contacts: [],
        //         event_notification_emails: [],

        //         subscriber_authorized_delegates: [],

        //         video_camera_list: [],
        //         // video_camera_list: [
        //         //     {
        //         //         zone: '9126',
        //         //         description: 'AXIS M1054 AXIS M1054 AXIS M1054 AXIS M1054 AXIS M1054 AXIS M1054 AXIS M1054 AXIS M1054 AXIS M1054 AXIS M1054AXIS M1054 AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054AXIS M1054',
        //         //         camera_model: '',
        //         //     },
        //         // ],

        //         audio_horn_list: [],

        //         // sos_action_plan: {
        //         //     dispatch_immediately: 'Police',
        //         //     post_dispatch_action: '',
        //         //     sos_notification_recipients: [],
        //         // },
        //         sos_action_plan: {},

        //         report_setup: {
        //             account_changes: false,
        //             operator_signals: true,
        //             test_signals: true,
        //         },
        //         report_recipient_emails: [],

        //         dealer_tech_support_phone: '',
        //         dealer_tech_support_email: '',
        //         status: 'Pending',
        //     };
        // }
    } catch (error) {
        console.error('Failed to fetch Subscriber Fact Sheet form:', error);
        // throw new Error('Unable to fetch Subscriber Fact Sheet data.');
        toast.error('Unable to fetch Subscriber Fact Sheet data.');
    }
};
