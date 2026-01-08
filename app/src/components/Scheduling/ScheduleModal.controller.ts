// Third Party
import { StylesConfig } from 'react-select';

// Types
import { SelectOption } from '../../types/interfaces';
import { TimeBlock } from './ScheduleModal';
import { ScheduleBlock } from './WeeklySchedule.controller';

// How many time slots exisit in each day (15 minute intervals so 24 hours * 4 15 minute blocks = 96)
const dailyTimeSlots = 96;

export const timeSelectCustomStyles: StylesConfig<SelectOption> = {
    control: (provided, { isDisabled }) => ({
        ...provided,
        borderRadius: '5px',
        background: 'none',
        border: '1px solid #6a737b',
        opacity: isDisabled ? '0.5' : '1',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        minHeight: 40,
    }),

    singleValue: (provided) => {
        return {
            ...provided,
            color: 'white',
        };
    },
    multiValue: (provided) => {
        return {
            ...provided,
            background: '#161818',
        };
    },
    multiValueLabel: (provided) => ({
        ...provided,
        color: 'white',
    }),
    menu: (provided) => {
        return {
            ...provided,
            background: 'rgba(0, 0, 0, 1)',
            zIndex: 10,
        };
    },
    menuList: (provided) => {
        return { ...provided, maxHeight: 140 };
    },
    option: (provided, state) => {
        return {
            ...provided,
            background: state.isFocused ? 'rgba(50, 50, 50, 0.9)' : '',
            textDecoration: state.isDisabled ? 'line-through' : 'none',
            cursor: state.isDisabled ? 'not-allowed' : 'default',
        };
    },

    placeholder: (provided) => ({
        ...provided,
        marginBottom: 5,
        color: 'gray',
    }),
    input: (provided) => ({
        ...provided,
        margin: 0,
        marginBottom: 0,
        padding: 0,
        color: 'white',
    }),
    valueContainer: (provided) => ({
        ...provided,
        paddingTop: '0.5rem',
        paddingLeft: '0.625rem',
        paddingRight: '0.6rem',
        paddingBottom: 'calc(0.63rem - 5px)',
    }),
};

export const timeOptions = [
    { label: '12:00 AM', value: '00:00:00.000' },
    { label: '12:15 AM', value: '00:15:00.000' },
    { label: '12:30 AM', value: '00:30:00.000' },
    { label: '12:45 AM', value: '00:45:00.000' },
    { label: '1:00 AM', value: '01:00:00.000' },
    { label: '1:15 AM', value: '01:15:00.000' },
    { label: '1:30 AM', value: '01:30:00.000' },
    { label: '1:45 AM', value: '01:45:00.000' },
    { label: '2:00 AM', value: '02:00:00.000' },
    { label: '2:15 AM', value: '02:15:00.000' },
    { label: '2:30 AM', value: '02:30:00.000' },
    { label: '2:45 AM', value: '02:45:00.000' },
    { label: '3:00 AM', value: '03:00:00.000' },
    { label: '3:15 AM', value: '03:15:00.000' },
    { label: '3:30 AM', value: '03:30:00.000' },
    { label: '3:45 AM', value: '03:45:00.000' },
    { label: '4:00 AM', value: '04:00:00.000' },
    { label: '4:15 AM', value: '04:15:00.000' },
    { label: '4:30 AM', value: '04:30:00.000' },
    { label: '4:45 AM', value: '04:45:00.000' },
    { label: '5:00 AM', value: '05:00:00.000' },
    { label: '5:15 AM', value: '05:15:00.000' },
    { label: '5:30 AM', value: '05:30:00.000' },
    { label: '5:45 AM', value: '05:45:00.000' },
    { label: '6:00 AM', value: '06:00:00.000' },
    { label: '6:15 AM', value: '06:15:00.000' },
    { label: '6:30 AM', value: '06:30:00.000' },
    { label: '6:45 AM', value: '06:45:00.000' },
    { label: '7:00 AM', value: '07:00:00.000' },
    { label: '7:15 AM', value: '07:15:00.000' },
    { label: '7:30 AM', value: '07:30:00.000' },
    { label: '7:45 AM', value: '07:45:00.000' },
    { label: '8:00 AM', value: '08:00:00.000' },
    { label: '8:15 AM', value: '08:15:00.000' },
    { label: '8:30 AM', value: '08:30:00.000' },
    { label: '8:45 AM', value: '08:45:00.000' },
    { label: '9:00 AM', value: '09:00:00.000' },
    { label: '9:15 AM', value: '09:15:00.000' },
    { label: '9:30 AM', value: '09:30:00.000' },
    { label: '9:45 AM', value: '09:45:00.000' },
    { label: '10:00 AM', value: '10:00:00.000' },
    { label: '10:15 AM', value: '10:15:00.000' },
    { label: '10:30 AM', value: '10:30:00.000' },
    { label: '10:45 AM', value: '10:45:00.000' },
    { label: '11:00 AM', value: '11:00:00.000' },
    { label: '11:15 AM', value: '11:15:00.000' },
    { label: '11:30 AM', value: '11:30:00.000' },
    { label: '11:45 AM', value: '11:45:00.000' },
    { label: '12:00 PM', value: '12:00:00.000' },
    { label: '12:15 PM', value: '12:15:00.000' },
    { label: '12:30 PM', value: '12:30:00.000' },
    { label: '12:45 PM', value: '12:45:00.000' },
    { label: '1:00 PM', value: '13:00:00.000' },
    { label: '1:15 PM', value: '13:15:00.000' },
    { label: '1:30 PM', value: '13:30:00.000' },
    { label: '1:45 PM', value: '13:45:00.000' },
    { label: '2:00 PM', value: '14:00:00.000' },
    { label: '2:15 PM', value: '14:15:00.000' },
    { label: '2:30 PM', value: '14:30:00.000' },
    { label: '2:45 PM', value: '14:45:00.000' },
    { label: '3:00 PM', value: '15:00:00.000' },
    { label: '3:15 PM', value: '15:15:00.000' },
    { label: '3:30 PM', value: '15:30:00.000' },
    { label: '3:45 PM', value: '15:45:00.000' },
    { label: '4:00 PM', value: '16:00:00.000' },
    { label: '4:15 PM', value: '16:15:00.000' },
    { label: '4:30 PM', value: '16:30:00.000' },
    { label: '4:45 PM', value: '16:45:00.000' },
    { label: '5:00 PM', value: '17:00:00.000' },
    { label: '5:15 PM', value: '17:15:00.000' },
    { label: '5:30 PM', value: '17:30:00.000' },
    { label: '5:45 PM', value: '17:45:00.000' },
    { label: '6:00 PM', value: '18:00:00.000' },
    { label: '6:15 PM', value: '18:15:00.000' },
    { label: '6:30 PM', value: '18:30:00.000' },
    { label: '6:45 PM', value: '18:45:00.000' },
    { label: '7:00 PM', value: '19:00:00.000' },
    { label: '7:15 PM', value: '19:15:00.000' },
    { label: '7:30 PM', value: '19:30:00.000' },
    { label: '7:45 PM', value: '19:45:00.000' },
    { label: '8:00 PM', value: '20:00:00.000' },
    { label: '8:15 PM', value: '20:15:00.000' },
    { label: '8:30 PM', value: '20:30:00.000' },
    { label: '8:45 PM', value: '20:45:00.000' },
    { label: '9:00 PM', value: '21:00:00.000' },
    { label: '9:15 PM', value: '21:15:00.000' },
    { label: '9:30 PM', value: '21:30:00.000' },
    { label: '9:45 PM', value: '21:45:00.000' },
    { label: '10:00 PM', value: '22:00:00.000' },
    { label: '10:15 PM', value: '22:15:00.000' },
    { label: '10:30 PM', value: '22:30:00.000' },
    { label: '10:45 PM', value: '22:45:00.000' },
    { label: '11:00 PM', value: '23:00:00.000' },
    { label: '11:15 PM', value: '23:15:00.000' },
    { label: '11:30 PM', value: '23:30:00.000' },
    { label: '11:45 PM', value: '23:45:00.000' },
];

export const timeOptionsWithEndOfDay = [
    ...timeOptions,
    { label: 'End of Day', value: '24:00:00.000' },
];

export const dayOptions = [
    { label: 'Sun', value: '0' },
    { label: 'Mon', value: '1' },
    { label: 'Tues', value: '2' },
    { label: 'Wed', value: '3' },
    { label: 'Thurs', value: '4' },
    { label: 'Fri', value: '5' },
    { label: 'Sat', value: '6' },
];

export const timeZoneOptions = [
    { label: 'Eastern Time - (America/New_York)', value: 'America/New_York' },
    { label: 'Central Time - (America/Chicago)', value: 'America/Chicago' },
    { label: 'Mountain Time - (America/Denver)', value: 'America/Denver' },
    {
        label: 'Central Time (no DST) - (America/Phoenix)',
        value: 'America/Phoenix',
    },
    {
        label: 'Pacific Time - (America/Los_Angeles',
        value: 'America/Los_Angeles',
    },
    {
        label: 'Alaska Time - (America/Anchorage)',
        value: 'America/Anchorage',
    },
    {
        label: 'Hawaii-Aleutian TIme - (America/Adak)',
        value: 'America/Adak',
    },
];

export const isValidTimeBlock = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');

    if (endHour < startHour) {
        return false;
    }

    if (startHour === endHour && endMinute <= startMinute) {
        return false;
    }

    return true;
};

export const generateScheduleFromTimeBlocks = (
    weeklySchedule: ScheduleBlock[],
    timeBlocks: TimeBlock[]
) => {
    const newWeeklySchedule = weeklySchedule.map((scheduleBlock) => {
        return { ...scheduleBlock, armed: false };
    });

    let invalidSchedule = false;

    timeBlocks.forEach((timeblock) => {
        if (timeblock.days) {
            timeblock.days.forEach((day) => {
                const dayValue = Number(day.value);
                const startIndex = dayValue * dailyTimeSlots;
                const endIndex = dayValue * dailyTimeSlots + dailyTimeSlots;
                let armed = false;

                for (let i = startIndex; i < endIndex; i += 1) {
                    if (
                        newWeeklySchedule[i].start_time ===
                        timeblock.startTime?.value
                    ) {
                        armed = true;
                    }

                    if (
                        newWeeklySchedule[i].start_time ===
                        timeblock?.endTime?.value
                    ) {
                        armed = false;
                    }

                    if (armed) {
                        if (newWeeklySchedule[i].armed === true) {
                            invalidSchedule = true;
                        }

                        newWeeklySchedule[i].armed = armed;
                    }
                }
            });
        }
    });

    return { newWeeklySchedule, invalidSchedule };
};

export const formatTimeBlocksToSave = (timeBlocks: TimeBlock[]) => {
    const result: {
        block_days: number[];
        start_time: string;
        end_time: string;
    }[] = [];

    timeBlocks.forEach((timeBlock) => {
        if (timeBlock.days) {
            const block_days = timeBlock.days.map((day) => Number(day.value));
            const start_time = timeBlock.startTime?.value || '';
            const end_time = timeBlock.endTime?.value || '';
            result.push({ block_days, start_time, end_time });
        }
    });

    return result;
};

export const formatScheduleToSave = (weeklySchedule: ScheduleBlock[]) => {
    const dayIndexes = [0, 1, 2, 3, 4, 5, 6];
    const result: { [key: string]: ScheduleBlock[] } = {};

    dayIndexes.forEach((day) => {
        const startIndex = day * dailyTimeSlots;
        const endIndex = day * dailyTimeSlots + dailyTimeSlots;

        result[day] = weeklySchedule.slice(startIndex, endIndex);
    });

    return result;
};
