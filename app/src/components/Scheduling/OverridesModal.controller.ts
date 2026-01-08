// Third Party
import {
    format,
    setMinutes,
    setMilliseconds,
    setSeconds,
    addMinutes,
} from 'date-fns';

// Types
import { SelectOption } from '../../types/interfaces';
import { ScheduleBlock } from './WeeklySchedule.controller';

export const roundToNearest15Minutes = (date: Date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const baseDate = setMinutes(date, roundedMinutes);

    // Ensure that seconds and milliseconds are zeroed out
    return setMilliseconds(setSeconds(baseDate, 0), 0);
};

export const getScheduleStartIndex = (startDate: Date) => {
    let startIndex = startDate.getDay() * 96;
    startIndex += startDate.getHours() * 4;
    startIndex += Math.floor(startDate.getMinutes() / 15);
    return startIndex;
};

export const getNextEventDate = (
    action: 'arm' | 'disarm',
    overrideStartDateTime: Date,
    weeklySchedule: ScheduleBlock[]
) => {
    const currentTime = roundToNearest15Minutes(overrideStartDateTime);
    const startIndex = getScheduleStartIndex(currentTime);
    const armedTargetValue = action === 'arm';
    let endIndex = 0;

    for (let i = startIndex; i < weeklySchedule.length; i += 1) {
        if (weeklySchedule[i].armed === armedTargetValue) {
            endIndex = i;
            break;
        }
    }

    if (endIndex === 0) {
        for (let i = 0; i < weeklySchedule.length; i += 1) {
            if (weeklySchedule[i].armed === armedTargetValue) {
                endIndex = i;
                break;
            }
        }
    }

    if (endIndex > startIndex) {
        const timeToNextEventInMinutes = (endIndex - startIndex) * 15;
        return addMinutes(currentTime, timeToNextEventInMinutes);
    }

    const timeToNextEventInMinutes = (endIndex + startIndex) * 15;
    return addMinutes(currentTime, timeToNextEventInMinutes);
};

export const generateOverrideData = ({
    scheduleId,
    action,
    selectedReasonCode,
    overrideReason,
    startDate,
    endDate,
}: {
    scheduleId: number;
    action: 'arm' | 'disarm';
    selectedReasonCode: SelectOption;
    overrideReason: string;
    startDate: Date;
    endDate: Date | null;
}) => {
    const start_dt = format(startDate, 'yyyy-MM-dd HH:mm:ss.SSSSSS');
    const end_dt = endDate
        ? format(endDate, 'yyyy-MM-dd HH:mm:ss.SSSSSS')
        : null;

    if (action === 'arm') {
        return {
            schedule_site_id: scheduleId,
            schedule_reason_code_id: 0,
            override_reason: 'System armed by user',
            start_dt,
            end_dt,
            is_armed: true,
        };
    }

    if (selectedReasonCode.value === '0') {
        return {
            schedule_site_id: scheduleId,
            schedule_reason_code_id: 0,
            override_reason: overrideReason,
            start_dt,
            end_dt,
            is_armed: false,
        };
    }

    return {
        schedule_site_id: scheduleId,
        schedule_reason_code_id: Number(selectedReasonCode.value),
        override_reason: '',
        start_dt,
        end_dt,
        is_armed: false,
    };
};
