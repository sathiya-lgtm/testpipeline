// date-fns
import { parse, format, parseISO } from 'date-fns';

export type MointoringBlock = {
    start_day: number;
    start_time: string;
    end_day: number | null;
    end_time: string | null;
};

export type ScheduleBlock = {
    armed: boolean;
    start_time: string;
    end_time: string;
};

export const formatTimeStamp = (timeString: string) => {
    const date = parse(timeString, 'HH:mm:ss.SSSSSS', new Date());
    const formattedTime = format(date, 'h:mm a');
    return formattedTime;
};

export const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'MM/dd/yyyy');
};

export const formatDayNumToStr = (dayNum: number) => {
    const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];

    if (dayNum >= 0 && dayNum <= 6) {
        return days[dayNum];
    }

    return '';
};

export const generateMonitroingBlocks = (currentSchedule: ScheduleBlock[]) => {
    const blocks: MointoringBlock[] = [];

    const currentMointoringBlock: MointoringBlock = {
        start_day: -1,
        start_time: '',
        end_day: null,
        end_time: null,
    };

    currentSchedule.forEach((timeblock, index) => {
        if (timeblock.armed && currentMointoringBlock.start_day === -1) {
            currentMointoringBlock.start_day = Math.floor(index / 96);
            currentMointoringBlock.start_time = timeblock.start_time;
        }

        if (!timeblock.armed && currentMointoringBlock.start_day !== -1) {
            currentMointoringBlock.end_day = Math.floor(index / 96);

            currentMointoringBlock.end_time = timeblock.start_time;

            blocks.push({ ...currentMointoringBlock });

            // Need to reset currentMonitoringBlock
            currentMointoringBlock.start_day = -1;
            currentMointoringBlock.start_time = '';
            currentMointoringBlock.end_day = null;
            currentMointoringBlock.end_time = null;
        }

        if (
            index === currentSchedule.length - 1 &&
            currentMointoringBlock.start_day !== -1
        ) {
            blocks.push({ ...currentMointoringBlock });
        }
    });

    return blocks;
};

export const buildMonitoringBlockDisplayData = (
    block: MointoringBlock,
    monitoringBlocks: MointoringBlock[]
) => {
    const startHourOfWeek =
        block.start_day * 24 + Number(block.start_time.split(':')[0]);
    let endHourOfWeek = 168;

    if (block.end_day !== null && block.end_time !== null) {
        endHourOfWeek =
            block.end_day * 24 + Number(block.end_time.split(':')[0]);
    }

    const leftPct = (startHourOfWeek / 168) * 100;
    const widthPct = ((endHourOfWeek - startHourOfWeek) / 168) * 100;

    let startTimeLabel = '';
    let tooltipStartTime = '';
    if (
        block.start_day === 0 &&
        block.start_time === '00:00:00.000' &&
        !monitoringBlocks[monitoringBlocks.length - 1].end_time
    ) {
        const target = monitoringBlocks[monitoringBlocks.length - 1];

        startTimeLabel = formatTimeStamp(target.start_time);
        tooltipStartTime = `${formatDayNumToStr(
            target.start_day
        )} ${startTimeLabel}`;
    } else {
        startTimeLabel = formatTimeStamp(block.start_time);
        tooltipStartTime = `${formatDayNumToStr(
            block.start_day
        )} ${startTimeLabel}`;
    }

    let endTimeLabel = '';
    let tooltipEndTime = '';
    if (
        !block.end_time &&
        monitoringBlocks[0].end_time !== null &&
        monitoringBlocks[0].end_day !== null
    ) {
        endTimeLabel = formatTimeStamp(monitoringBlocks[0].end_time);
        tooltipEndTime = `${formatDayNumToStr(
            monitoringBlocks[0].end_day
        )} ${endTimeLabel}`;
    } else if (block.end_time !== null && block.end_day !== null) {
        endTimeLabel = formatTimeStamp(block.end_time);
        tooltipEndTime = `${formatDayNumToStr(block.end_day)} ${endTimeLabel}`;
    }

    if (!endTimeLabel) {
        endTimeLabel = 'End of Week';
    }

    if (!tooltipEndTime) {
        tooltipEndTime = 'End of Week';
    }

    let className = 'event';

    if (!block.end_time) {
        className = 'splitEventStart';
    }

    if (
        block.start_day === 0 &&
        block.start_time === '00:00:00.000' &&
        !monitoringBlocks[monitoringBlocks.length - 1].end_time
    ) {
        className = 'splitEventEnd';
    }

    const tooltipInfo = `${tooltipStartTime} - ${tooltipEndTime}`;

    return {
        leftPct,
        widthPct,
        className,
        startTimeLabel,
        endTimeLabel,
        tooltipInfo,
    };
};

export const WeekdaySchedule = [
    { armed: true, start_time: '00:00:00.000', end_time: '00:59:59.000' },
    { armed: true, start_time: '01:00:00.000', end_time: '01:59:59.000' },
    { armed: true, start_time: '02:00:00.000', end_time: '02:59:59.000' },
    { armed: true, start_time: '03:00:00.000', end_time: '03:59:59.000' },
    { armed: true, start_time: '04:00:00.000', end_time: '04:59:59.000' },
    { armed: true, start_time: '05:00:00.000', end_time: '05:59:59.000' },
    { armed: true, start_time: '06:00:00.000', end_time: '06:59:59.000' },
    { armed: true, start_time: '07:00:00.000', end_time: '07:59:59.000' },
    { armed: true, start_time: '08:00:00.000', end_time: '08:59:59.000' },
    { armed: false, start_time: '09:00:00.000', end_time: '09:59:59.000' },
    { armed: false, start_time: '10:00:00.000', end_time: '10:59:59.000' },
    { armed: false, start_time: '11:00:00.000', end_time: '11:59:59.000' },
    { armed: false, start_time: '12:00:00.000', end_time: '12:59:59.000' },
    { armed: false, start_time: '13:00:00.000', end_time: '13:59:59.000' },
    { armed: false, start_time: '14:00:00.000', end_time: '14:59:59.000' },
    { armed: false, start_time: '15:00:00.000', end_time: '15:59:59.000' },
    { armed: false, start_time: '16:00:00.000', end_time: '16:59:59.000' },
    { armed: true, start_time: '17:00:00.000', end_time: '17:59:59.000' },
    { armed: true, start_time: '18:00:00.000', end_time: '18:59:59.000' },
    { armed: true, start_time: '19:00:00.000', end_time: '19:59:59.000' },
    { armed: true, start_time: '20:00:00.000', end_time: '20:59:59.000' },
    { armed: true, start_time: '21:00:00.000', end_time: '21:59:59.000' },
    { armed: true, start_time: '22:00:00.000', end_time: '22:59:59.000' },
    { armed: true, start_time: '23:00:00.000', end_time: '23:59:59.000' },
];

export const WeekendSchedule = [
    { armed: true, start_time: '00:00:00.000', end_time: '00:59:59.000' },
    { armed: true, start_time: '01:00:00.000', end_time: '01:59:59.000' },
    { armed: true, start_time: '02:00:00.000', end_time: '02:59:59.000' },
    { armed: true, start_time: '03:00:00.000', end_time: '03:59:59.000' },
    { armed: true, start_time: '04:00:00.000', end_time: '04:59:59.000' },
    { armed: true, start_time: '05:00:00.000', end_time: '05:59:59.000' },
    { armed: true, start_time: '06:00:00.000', end_time: '06:59:59.000' },
    { armed: true, start_time: '07:00:00.000', end_time: '07:59:59.000' },
    { armed: true, start_time: '08:00:00.000', end_time: '08:59:59.000' },
    { armed: true, start_time: '09:00:00.000', end_time: '09:59:59.000' },
    { armed: true, start_time: '10:00:00.000', end_time: '10:59:59.000' },
    { armed: true, start_time: '11:00:00.000', end_time: '11:59:59.000' },
    { armed: true, start_time: '12:00:00.000', end_time: '12:59:59.000' },
    { armed: true, start_time: '13:00:00.000', end_time: '13:59:59.000' },
    { armed: true, start_time: '14:00:00.000', end_time: '14:59:59.000' },
    { armed: true, start_time: '15:00:00.000', end_time: '15:59:59.000' },
    { armed: true, start_time: '16:00:00.000', end_time: '16:59:59.000' },
    { armed: true, start_time: '17:00:00.000', end_time: '17:59:59.000' },
    { armed: true, start_time: '18:00:00.000', end_time: '18:59:59.000' },
    { armed: true, start_time: '19:00:00.000', end_time: '19:59:59.000' },
    { armed: true, start_time: '20:00:00.000', end_time: '20:59:59.000' },
    { armed: true, start_time: '21:00:00.000', end_time: '21:59:59.000' },
    { armed: true, start_time: '22:00:00.000', end_time: '22:59:59.000' },
    { armed: true, start_time: '23:00:00.000', end_time: '23:59:59.000' },
];

export const defaultSchedule: ScheduleBlock[] = [
    ...WeekendSchedule,
    ...WeekdaySchedule,
    ...WeekdaySchedule,
    ...WeekdaySchedule,
    ...WeekdaySchedule,
    ...WeekdaySchedule,
    ...WeekendSchedule,
];

export const monitoringBlocks = [
    {
        start_day: 0,
        start_time: '00:00:00.000',
        end_day: 1,
        end_time: '09:00:00.000',
    },
    {
        start_day: 1,
        start_time: '17:00:00.000',
        end_day: 2,
        end_time: '09:00:00.000',
    },
    {
        start_day: 2,
        start_time: '17:00:00.000',
        end_day: 3,
        end_time: '09:00:00.000',
    },
    {
        start_day: 3,
        start_time: '17:00:00.000',
        end_day: 4,
        end_time: '09:00:00.000',
    },
    {
        start_day: 4,
        start_time: '17:00:00.000',
        end_day: 5,
        end_time: '09:00:00.000',
    },
    {
        start_day: 5,
        start_time: '17:00:00.000',
        end_day: null,
        end_time: null,
    },
];
