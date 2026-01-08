// Custom
import { format } from 'date-fns';

// Custom Types
import { IClip } from '../../types/tng-api.interfaces';

/** This is a signed URL that expires at most within 12 hours and thus should be replaced when needed. */
const videoPath =
    'https://evolon-tng-dev.s3.us-east-1.amazonaws.com/files/0092b73f-5479-4b68-897b-0a5a7ad9b1da/60ad6073-8d94-45c8-b835-477b62b36fdc_response-annotated.mp4?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEKb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMiJGMEQCIGJuSWXUXYVPF4Gpm1ZQq2Wsd933Hy0Ak9E8PI4NvKJ%2BAiAn0VMV6itSImmCQB24df3DAWr6gerfZ%2F8G7OtNqI5vDSrUAwhgEAAaDDI5MDI0MjE1NjE1MiIMASrsXfDfmb%2B6gG%2FwKrED8SkWcBODSs2BFVxyozdmfp7zoYhOgdn3oE5S5FBBx%2FT2sYA0BHZag2QCmbgE%2FBKjBTh%2FfWj52jxriioZtzYPjdj9faM68F4tHt41HYxO7XCKB7%2FaQoiKhudjBxIvzrkTUDHRGO16Ap6J1rk29cvLJIiYer%2FqnTOW7JSjTbar%2FcHKFm1Z4egvXHyLYMeCv0YtuEDYDtnnBDAFSbSGHHP%2F560x9ewg%2Ft5Y5HP6Dzq1BpVZvrBT5qoBpt2e5gQe5ppNvlPn15CVG0gs4EPLCAlp61uLYduWLq8wmk%2FX2wZQQtnvRsbFvbjtNjs%2FDB7wsb%2BCnyI%2FfVluJlGj%2FKYD1PlCoOrem9unMOeV8G1xfHuBVrpBEo3lPVxUm%2B0hEoNohrMkrj8YMF1v6j%2FWXvfcscm%2BcX337hhiLB5gWgy%2BPk98nWW%2B07Dbrw6Rx6iPWDeW32J04mOZSZncXeO2%2BxjLkgIuevsYQzFDaJ6HSkNoxR2jmH8U6jsX1fifjKh3XfmvG5RFasJrORF84o1inJMUu3BCZFzV6qvNSZtUnr40LcYCESjIb1VnHvctmanpghBbnxgXdTD52KegBjqVAnYQwMVXuX8tTnH9FkO2CWqg3Pil%2FeeY%2FKhD5QmkJMyGtckWtxT66waXQnalspy0jbQGJ5pvUA5eiTmaBmfUZAW7mXRg9PfY3wQYjQsk1MEnWPz9UXepE0cb87qxfhPslZHl44PnJgWZHqXqw0mR5uoHfc6ej2TANaiQ%2Flgx279dhOJKjXMF%2BnX8Z%2FM87y2XIi5BvjXe%2FvafypS0mZ9FuiH9Lo%2F8T7ane9a4ja%2FpmYzyX5KWJYGbYn1pu55bIy%2FZgub1qRL%2B7%2B5wWz3x6Uyv9lgepzswvOMSwjzPVc%2BBC3JxTMhuSP%2BOEaie6qFdGRbHnf5%2BfjEcXGeaRf7k4yto2IPje3hI8iAHp1pgP4pUW%2FPmuTb3J7I%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20230309T142733Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43200&X-Amz-Credential=ASIAUHE6H2Z4OBLRVLUL%2F20230309%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=7dc8bcb7deff80aa9a9a3c1bdc343b9baa608226d2ab8344fc7727d208a1f6d7';
const customers = [
    'Aspera',
    'BigFix',
    'BlueShip',
    'Red Hat',
    'SoftLayer',
    'Instana',
    'FileNet',
    'Trusteer',
    'Vivisimo',
    'Weather Underground',
];
const sites = [
    'Gateway',
    'Backyard',
    'Chem Lab',
    'Research Lab',
    'Football Field',
    'Stadium',
    'Basketball Court',
    'Central Station',
    'North Site',
    'South Site',
    'West Station',
    'North Station',
    '2nd Floor',
    'Top Floor',
    'Ground Floor',
    'Central Hallway',
];
const cameras = [
    'Corner',
    'Floor',
    'Ceiling',
    'Window',
    'Perimeter',
    'Front Cam',
    'Rear Cam',
    'Central Cam',
    'Sky Cam',
    'Overpass',
    'Stairs',
    'Garden',
    'Back Door',
    'Front Door',
];
export const histogramChartPlaceholderData = [
    {
        name: '11/1/2022',
        events: 500,
        mitigated: 400,
        total: 900,
    },
    {
        name: '11/2/2022',
        events: 450,
        mitigated: 300,
        total: 750,
    },
    {
        name: '11/3/2022',
        events: 200,
        mitigated: 500,
        total: 700,
    },
    {
        name: '11/4/2022',
        events: 123,
        mitigated: 210,
        total: 333,
    },
    {
        name: '11/5/2022',
        events: 457,
        mitigated: 104,
        total: 561,
    },
    {
        name: '11/6/2022',
        events: 980,
        mitigated: 200,
        total: 1180,
    },
    {
        name: '11/7/2022',
        events: 500,
        mitigated: 400,
        total: 900,
    },
    {
        name: '11/8/2022',
        events: 100,
        mitigated: 200,
        total: 300,
    },
    {
        name: '11/9/2022',
        events: 320,
        mitigated: 100,
        total: 420,
    },
    {
        name: '11/10/2022',
        events: 1000,
        mitigated: 100,
        total: 1100,
    },
    {
        name: '11/11/2022',
        events: 50,
        mitigated: 10,
        total: 60,
    },
    {
        name: '11/12/2022',
        events: 347,
        mitigated: 567,
        total: 914,
    },
    {
        name: '11/13/2022',
        events: 231,
        mitigated: 331,
        total: 562,
    },
    {
        name: '11/14/2022',
        events: 500,
        mitigated: 400,
        total: 900,
    },
];

const getRandomInt = () => {
    const min = Math.ceil(0);
    const max = Math.floor(100_000_000);

    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/** Generates a date that matches the format of what being returned from the API.
 * e.g. "2023-03-08 18:35:30".
 */
const generateDate = (): string => {
    const date = new Date(Date.now() - 1000 * getRandomInt());

    const formattedDatePart1 = format(date, 'yyyy-MM-dd'); // e.g. 2023-03-14
    const formattedDatePart2 = date.toString().split(' ')[4]; // e.g. 11:46:14

    return `${formattedDatePart1} ${formattedDatePart2}`;
};

export const mockCustomerOptions = customers.map((customer) => ({
    label: customer,
    value: customer,
}));

export const mockSiteOptions = sites.map((site) => ({
    label: site,
    value: site,
}));

export const mockCameraOptions = cameras.map((camera) => ({
    label: camera,
    value: camera,
}));

const generateRandomCustomer = () => {
    const randomIndex = Math.floor(Math.random() * customers.length);

    return customers[randomIndex];
};

const generateRandomSite = () => {
    const randomIndex = Math.floor(Math.random() * sites.length);

    return sites[randomIndex];
};

const generateRandomCamera = () => {
    const randomIndex = Math.floor(Math.random() * cameras.length);

    return cameras[randomIndex];
};

const generateRandomAlarm = () => {
    const randomConfidences = [
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
    ];

    const alarms = [
        {
            vehicle: randomConfidences[0] > 0.5,
            person: randomConfidences[1] > 0.5,
            max_conf_vehicle: randomConfidences[0],
            max_conf_person: randomConfidences[1],
        },
        {
            vehicle: randomConfidences[2] > 0.5,
            person: randomConfidences[3] > 0.5,
            max_conf_vehicle: randomConfidences[2],
            max_conf_person: randomConfidences[3],
        },
        {
            vehicle: randomConfidences[4] > 0.5,
            person: randomConfidences[5] > 0.5,
            max_conf_vehicle: randomConfidences[4],
            max_conf_person: randomConfidences[5],
        },
        {
            vehicle: randomConfidences[6] > 0.5,
            person: randomConfidences[7] > 0.5,
            max_conf_vehicle: randomConfidences[6],
            max_conf_person: randomConfidences[7],
        },
    ];
    const randomIndex = Math.floor(Math.random() * alarms.length);

    return alarms[randomIndex];
};

const generateClip = (): IClip => {
    return {
        created_at: generateDate(),
        aws_pre_sign_annotated: videoPath,
        aws_pre_sign_origin: videoPath,
        origin_path: 'path.mp4',
        job_type: 'verify',
        payload: {
            camera_type: 'rgb',
            mask: null,
            video_path: videoPath,
            min_confidence: {
                vehicle: 0.74,
                person: 0.91,
            },
        },
        results: {
            alarm_info: generateRandomAlarm(),
        },
        account_id: 1774,
        camera_id: 256,
        site_id: 100,
        camera_name: generateRandomCamera(),
        account_name: generateRandomCustomer(),
        site_name: generateRandomSite(),
    };
};

const generateClips = (): IClip[] => {
    const clips = [];

    for (let i = 0; i < 200; i += 1) {
        clips.push(generateClip());
    }

    return clips;
};

export const globalSearchClipData: IClip[] = generateClips();
