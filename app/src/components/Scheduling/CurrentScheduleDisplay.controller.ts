/* eslint-disable no-restricted-syntax */

// Third Party
import { SingleValue, MultiValue } from 'react-select';

// Controller
import {
    dayOptions,
    timeOptionsWithEndOfDay,
} from './ScheduleModal.controller';

// Types
import { ISchedule } from '../../api_calls/Schedules';
import { SelectOption } from '../../types/interfaces';
import { ScheduleBlock } from './WeeklySchedule.controller';

type TimeBlock = {
    day: number;
    startTime: string;
    endTime: string;
};

type ConsolidatedTimeBlock = {
    days: number[];
    start_time: string;
    end_time: string;
};

function consolidateTimeBlocks(
    timeBlocks: TimeBlock[]
): ConsolidatedTimeBlock[] {
    // Sort blocks by start time, end time, and day for easier grouping
    timeBlocks.sort(
        (a, b) =>
            a.startTime.localeCompare(b.startTime) ||
            a.endTime.localeCompare(b.endTime) ||
            a.day - b.day
    );

    const consolidatedBlocks: ConsolidatedTimeBlock[] = [];

    for (const block of timeBlocks) {
        const lastConsolidated =
            consolidatedBlocks[consolidatedBlocks.length - 1];

        // If the last consolidated block has the same start and end time, extend its days array
        if (
            lastConsolidated &&
            lastConsolidated.start_time === block.startTime &&
            lastConsolidated.end_time === block.endTime
        ) {
            lastConsolidated.days.push(block.day);
        } else {
            // Otherwise, start a new consolidated block
            consolidatedBlocks.push({
                days: [block.day],
                start_time: block.startTime,
                end_time: block.endTime,
            });
        }
    }

    return consolidatedBlocks;
}

function groupArray<T>(array: T[], groupCount: number): T[][] {
    const groupSize = array.length / groupCount;

    if (array.length % groupCount !== 0) {
        throw new Error(
            'Array length is not evenly divisible by the group count.'
        );
    }

    const groupedArray: T[][] = [];
    for (let i = 0; i < array.length; i += groupSize) {
        groupedArray.push(array.slice(i, i + groupSize));
    }

    return groupedArray;
}

export const convertWeeklyScheduleToTimeBlocks = (
    weeklySchedule: ScheduleBlock[]
) => {
    const tempResult: any = [];

    const weeklyScheduleByDay = groupArray(weeklySchedule, 7);

    weeklyScheduleByDay.forEach((schedule, dayIndex) => {
        let startTime: string | undefined;
        let endTime: string | undefined;

        schedule.forEach((block, index) => {
            if (!startTime && block.armed) {
                startTime = block.start_time;
            }

            if (startTime && !block.armed) {
                endTime = block.start_time;
                tempResult.push({
                    day: dayIndex,
                    startTime,
                    endTime,
                });
                startTime = undefined;
            }

            if (index === schedule.length - 1 && block.armed) {
                endTime =
                    timeOptionsWithEndOfDay[timeOptionsWithEndOfDay.length - 1]
                        .value;
                tempResult.push({
                    day: dayIndex,
                    startTime,
                    endTime,
                });
            }
        });
    });

    const consolidatedBlocks = consolidateTimeBlocks(tempResult);

    const result: {
        days: MultiValue<SelectOption>;
        startTime: SingleValue<SelectOption>;
        endTime: SingleValue<SelectOption>;
    }[] = consolidatedBlocks.map((block) => {
        return {
            days: block.days.map(
                (day) =>
                    dayOptions.find(
                        (option) => option.value === day.toString()
                    ) || { label: '', value: '' }
            ),
            startTime: timeOptionsWithEndOfDay.find(
                (option) => option.value === block.start_time
            ) || { label: '', value: '' },
            endTime: timeOptionsWithEndOfDay.find(
                (option) => option.value === block.end_time
            ) || { label: '', value: '' },
        };
    });
    return result;
};

export const convertScheduleDataToTimeBlocks = (scheduleData: ISchedule[]) => {
    const tempResult: any = [];
    scheduleData.forEach((item) => {
        let startTime: string | undefined;
        let endTime: string | undefined;

        item.schedule.forEach((block, index) => {
            if (!startTime && block.armed) {
                startTime = block.start_time;
            }

            if (startTime && !block.armed) {
                endTime = block.start_time;
                tempResult.push({
                    day: item.schedule_day_of_week_value,
                    startTime,
                    endTime,
                });
                startTime = undefined;
            }

            if (index === item.schedule.length - 1 && block.armed) {
                endTime =
                    timeOptionsWithEndOfDay[timeOptionsWithEndOfDay.length - 1]
                        .value;
                tempResult.push({
                    day: item.schedule_day_of_week_value,
                    startTime,
                    endTime,
                });
            }
        });
    });

    const consolidatedBlocks = consolidateTimeBlocks(tempResult);

    const result: {
        days: MultiValue<SelectOption>;
        startTime: SingleValue<SelectOption>;
        endTime: SingleValue<SelectOption>;
    }[] = consolidatedBlocks.map((block) => {
        return {
            days: block.days.map(
                (day) =>
                    dayOptions.find(
                        (option) => option.value === day.toString()
                    ) || { label: '', value: '' }
            ),
            startTime: timeOptionsWithEndOfDay.find(
                (option) => option.value === block.start_time
            ) || { label: '', value: '' },
            endTime: timeOptionsWithEndOfDay.find(
                (option) => option.value === block.end_time
            ) || { label: '', value: '' },
        };
    });
    return result;
};

export const defaultScheduleDay = [
    {
        armed: true,
        end_time: '00:14:59.999',
        start_time: '00:00:00.000',
    },
    {
        armed: true,
        end_time: '00:29:59.999',
        start_time: '00:15:00.000',
    },
    {
        armed: true,
        end_time: '00:44:59.999',
        start_time: '00:30:00.000',
    },
    {
        armed: true,
        end_time: '00:59:59.999',
        start_time: '00:45:00.000',
    },
    {
        armed: true,
        end_time: '01:14:59.999',
        start_time: '01:00:00.000',
    },
    {
        armed: true,
        end_time: '01:29:59.999',
        start_time: '01:15:00.000',
    },
    {
        armed: true,
        end_time: '01:44:59.999',
        start_time: '01:30:00.000',
    },
    {
        armed: true,
        end_time: '01:59:59.999',
        start_time: '01:45:00.000',
    },
    {
        armed: true,
        end_time: '02:14:59.999',
        start_time: '02:00:00.000',
    },
    {
        armed: true,
        end_time: '02:29:59.999',
        start_time: '02:15:00.000',
    },
    {
        armed: true,
        end_time: '02:44:59.999',
        start_time: '02:30:00.000',
    },
    {
        armed: true,
        end_time: '02:59:59.999',
        start_time: '02:45:00.000',
    },
    {
        armed: true,
        end_time: '03:14:59.999',
        start_time: '03:00:00.000',
    },
    {
        armed: true,
        end_time: '03:29:59.999',
        start_time: '03:15:00.000',
    },
    {
        armed: true,
        end_time: '03:44:59.999',
        start_time: '03:30:00.000',
    },
    {
        armed: true,
        end_time: '03:59:59.999',
        start_time: '03:45:00.000',
    },
    {
        armed: true,
        end_time: '04:14:59.999',
        start_time: '04:00:00.000',
    },
    {
        armed: true,
        end_time: '04:29:59.999',
        start_time: '04:15:00.000',
    },
    {
        armed: true,
        end_time: '04:44:59.999',
        start_time: '04:30:00.000',
    },
    {
        armed: true,
        end_time: '04:59:59.999',
        start_time: '04:45:00.000',
    },
    {
        armed: true,
        end_time: '05:14:59.999',
        start_time: '05:00:00.000',
    },
    {
        armed: true,
        end_time: '05:29:59.999',
        start_time: '05:15:00.000',
    },
    {
        armed: true,
        end_time: '05:44:59.999',
        start_time: '05:30:00.000',
    },
    {
        armed: true,
        end_time: '05:59:59.999',
        start_time: '05:45:00.000',
    },
    {
        armed: true,
        end_time: '06:14:59.999',
        start_time: '06:00:00.000',
    },
    {
        armed: true,
        end_time: '06:29:59.999',
        start_time: '06:15:00.000',
    },
    {
        armed: true,
        end_time: '06:44:59.999',
        start_time: '06:30:00.000',
    },
    {
        armed: true,
        end_time: '06:59:59.999',
        start_time: '06:45:00.000',
    },
    {
        armed: true,
        end_time: '07:14:59.999',
        start_time: '07:00:00.000',
    },
    {
        armed: true,
        end_time: '07:29:59.999',
        start_time: '07:15:00.000',
    },
    {
        armed: true,
        end_time: '07:44:59.999',
        start_time: '07:30:00.000',
    },
    {
        armed: true,
        end_time: '07:59:59.999',
        start_time: '07:45:00.000',
    },
    {
        armed: true,
        end_time: '08:14:59.999',
        start_time: '08:00:00.000',
    },
    {
        armed: true,
        end_time: '08:29:59.999',
        start_time: '08:15:00.000',
    },
    {
        armed: true,
        end_time: '08:44:59.999',
        start_time: '08:30:00.000',
    },
    {
        armed: true,
        end_time: '08:59:59.999',
        start_time: '08:45:00.000',
    },
    {
        armed: true,
        end_time: '09:14:59.999',
        start_time: '09:00:00.000',
    },
    {
        armed: true,
        end_time: '09:29:59.999',
        start_time: '09:15:00.000',
    },
    {
        armed: true,
        end_time: '09:44:59.999',
        start_time: '09:30:00.000',
    },
    {
        armed: true,
        end_time: '09:59:59.999',
        start_time: '09:45:00.000',
    },
    {
        armed: true,
        end_time: '10:14:59.999',
        start_time: '10:00:00.000',
    },
    {
        armed: true,
        end_time: '10:29:59.999',
        start_time: '10:15:00.000',
    },
    {
        armed: true,
        end_time: '10:44:59.999',
        start_time: '10:30:00.000',
    },
    {
        armed: true,
        end_time: '10:59:59.999',
        start_time: '10:45:00.000',
    },
    {
        armed: true,
        end_time: '11:14:59.999',
        start_time: '11:00:00.000',
    },
    {
        armed: true,
        end_time: '11:29:59.999',
        start_time: '11:15:00.000',
    },
    {
        armed: true,
        end_time: '11:44:59.999',
        start_time: '11:30:00.000',
    },
    {
        armed: true,
        end_time: '11:59:59.999',
        start_time: '11:45:00.000',
    },
    {
        armed: true,
        end_time: '12:14:59.999',
        start_time: '12:00:00.000',
    },
    {
        armed: true,
        end_time: '12:29:59.999',
        start_time: '12:15:00.000',
    },
    {
        armed: true,
        end_time: '12:44:59.999',
        start_time: '12:30:00.000',
    },
    {
        armed: true,
        end_time: '12:59:59.999',
        start_time: '12:45:00.000',
    },
    {
        armed: true,
        end_time: '13:14:59.999',
        start_time: '13:00:00.000',
    },
    {
        armed: true,
        end_time: '13:29:59.999',
        start_time: '13:15:00.000',
    },
    {
        armed: true,
        end_time: '13:44:59.999',
        start_time: '13:30:00.000',
    },
    {
        armed: true,
        end_time: '13:59:59.999',
        start_time: '13:45:00.000',
    },
    {
        armed: true,
        end_time: '14:14:59.999',
        start_time: '14:00:00.000',
    },
    {
        armed: true,
        end_time: '14:29:59.999',
        start_time: '14:15:00.000',
    },
    {
        armed: true,
        end_time: '14:44:59.999',
        start_time: '14:30:00.000',
    },
    {
        armed: true,
        end_time: '14:59:59.999',
        start_time: '14:45:00.000',
    },
    {
        armed: true,
        end_time: '15:14:59.999',
        start_time: '15:00:00.000',
    },
    {
        armed: true,
        end_time: '15:29:59.999',
        start_time: '15:15:00.000',
    },
    {
        armed: true,
        end_time: '15:44:59.999',
        start_time: '15:30:00.000',
    },
    {
        armed: true,
        end_time: '15:59:59.999',
        start_time: '15:45:00.000',
    },
    {
        armed: true,
        end_time: '16:14:59.999',
        start_time: '16:00:00.000',
    },
    {
        armed: true,
        end_time: '16:29:59.999',
        start_time: '16:15:00.000',
    },
    {
        armed: true,
        end_time: '16:44:59.999',
        start_time: '16:30:00.000',
    },
    {
        armed: true,
        end_time: '16:59:59.999',
        start_time: '16:45:00.000',
    },
    {
        armed: true,
        end_time: '17:14:59.999',
        start_time: '17:00:00.000',
    },
    {
        armed: true,
        end_time: '17:29:59.999',
        start_time: '17:15:00.000',
    },
    {
        armed: true,
        end_time: '17:44:59.999',
        start_time: '17:30:00.000',
    },
    {
        armed: true,
        end_time: '17:59:59.999',
        start_time: '17:45:00.000',
    },
    {
        armed: true,
        end_time: '18:14:59.999',
        start_time: '18:00:00.000',
    },
    {
        armed: true,
        end_time: '18:29:59.999',
        start_time: '18:15:00.000',
    },
    {
        armed: true,
        end_time: '18:44:59.999',
        start_time: '18:30:00.000',
    },
    {
        armed: true,
        end_time: '18:59:59.999',
        start_time: '18:45:00.000',
    },
    {
        armed: true,
        end_time: '19:14:59.999',
        start_time: '19:00:00.000',
    },
    {
        armed: true,
        end_time: '19:29:59.999',
        start_time: '19:15:00.000',
    },
    {
        armed: true,
        end_time: '19:44:59.999',
        start_time: '19:30:00.000',
    },
    {
        armed: true,
        end_time: '19:59:59.999',
        start_time: '19:45:00.000',
    },
    {
        armed: true,
        end_time: '20:14:59.999',
        start_time: '20:00:00.000',
    },
    {
        armed: true,
        end_time: '20:29:59.999',
        start_time: '20:15:00.000',
    },
    {
        armed: true,
        end_time: '20:44:59.999',
        start_time: '20:30:00.000',
    },
    {
        armed: true,
        end_time: '20:59:59.999',
        start_time: '20:45:00.000',
    },
    {
        armed: true,
        end_time: '21:14:59.999',
        start_time: '21:00:00.000',
    },
    {
        armed: true,
        end_time: '21:29:59.999',
        start_time: '21:15:00.000',
    },
    {
        armed: true,
        end_time: '21:44:59.999',
        start_time: '21:30:00.000',
    },
    {
        armed: true,
        end_time: '21:59:59.999',
        start_time: '21:45:00.000',
    },
    {
        armed: true,
        end_time: '22:14:59.999',
        start_time: '22:00:00.000',
    },
    {
        armed: true,
        end_time: '22:29:59.999',
        start_time: '22:15:00.000',
    },
    {
        armed: true,
        end_time: '22:44:59.999',
        start_time: '22:30:00.000',
    },
    {
        armed: true,
        end_time: '22:59:59.999',
        start_time: '22:45:00.000',
    },
    {
        armed: true,
        end_time: '23:14:59.999',
        start_time: '23:00:00.000',
    },
    {
        armed: true,
        end_time: '23:29:59.999',
        start_time: '23:15:00.000',
    },
    {
        armed: true,
        end_time: '23:44:59.999',
        start_time: '23:30:00.000',
    },
    {
        armed: true,
        end_time: '23:59:59.999',
        start_time: '23:45:00.000',
    },
];
