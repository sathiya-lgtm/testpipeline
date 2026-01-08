import { toZonedTime } from 'date-fns-tz';

// Controller
import { timeOptions } from './ScheduleModal.controller';

// types
import { IException } from '../../api_calls/ScheduleExceptions';

export const exceptionStateOptions = [
    { label: 'Armed', value: 'armed' },
    { label: 'Disarmed', value: 'disarmed' },
];

export const extractExceptionName = (selectedException: IException | null) => {
    if (selectedException) {
        return selectedException?.description;
    }

    return '';
};

export const extractExceptionArmedStatus = (
    selectedException: IException | null
) => {
    if (selectedException && !selectedException.is_armed) {
        return exceptionStateOptions[1];
    }

    return exceptionStateOptions[0];
};

export const extractExceptionStartDate = (
    selectedException: IException | null
) => {
    if (selectedException) {
        return selectedException.start_dt.split(' ')[0];
    }

    return '';
};

export const extractExceptionStartTime = (
    selectedException: IException | null
) => {
    if (selectedException) {
        const startTime = selectedException.start_dt
            .split(' ')[1]
            .split('.')[0];

        return (
            timeOptions.find((option) => option.value.includes(startTime)) ||
            null
        );
    }

    return null;
};

export const extractExceptionEndDate = (
    selectedException: IException | null
) => {
    if (selectedException) {
        return selectedException.end_dt.split(' ')[0];
    }

    return '';
};

export const extractExceptionEndTime = (
    selectedException: IException | null
) => {
    if (selectedException) {
        const startTime = selectedException.end_dt.split(' ')[1].split('.')[0];

        return (
            timeOptions.find((option) => option.value.includes(startTime)) ||
            null
        );
    }

    return null;
};

export const isValidException = (
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    scheduleTimeZone: string
) => {
    const exceptionStartDateTime = toZonedTime(
        new Date(`${startDate} ${startTime}`),
        scheduleTimeZone
    );

    const exceptionEndDateTime = toZonedTime(
        new Date(`${endDate} ${endTime}`),
        scheduleTimeZone
    );

    if (exceptionEndDateTime <= exceptionStartDateTime) {
        return 'The end of exception can not be before it starts.';
    }

    return null;
};
