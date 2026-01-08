// Controller
import {
    formatTimeStamp,
    MointoringBlock,
    ScheduleBlock,
} from './WeeklySchedule.controller';

// Types

export type ScheduleBlockWithDate = ScheduleBlock & {
    date: string;
};

export type MointoringBlockWithDates = MointoringBlock & {
    start_date: string;
    end_date: string;
};

export const generateMonitoringBlocksForActiveSchedule = (
    currentSchedule: ScheduleBlockWithDate[]
) => {
    const blocks: MointoringBlockWithDates[] = [];

    const currentMointoringBlock: MointoringBlockWithDates = {
        start_day: -1,
        start_time: '',
        start_date: '',
        end_day: null,
        end_time: null,
        end_date: '',
    };

    currentSchedule.forEach((timeblock, index) => {
        if (timeblock.armed && currentMointoringBlock.start_day === -1) {
            currentMointoringBlock.start_day = Math.floor(index / 96);
            currentMointoringBlock.start_time = timeblock.start_time;
            currentMointoringBlock.start_date = timeblock.date;
        }

        if (!timeblock.armed && currentMointoringBlock.start_day !== -1) {
            currentMointoringBlock.end_day = Math.floor(index / 96);
            currentMointoringBlock.end_time = timeblock.start_time;
            currentMointoringBlock.end_date = timeblock.date;

            blocks.push({ ...currentMointoringBlock });

            // Need to reset currentMonitoringBlock
            currentMointoringBlock.start_day = -1;
            currentMointoringBlock.start_time = '';
            currentMointoringBlock.start_date = '';
            currentMointoringBlock.end_day = null;
            currentMointoringBlock.end_time = null;
            currentMointoringBlock.end_date = '';
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

export const buildActiveScheduleMonitoringBlockDisplayData = (
    block: MointoringBlockWithDates,
    monitoringBlocks: MointoringBlockWithDates[]
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
    const startTimeLabel = formatTimeStamp(block.start_time);
    const tooltipStartTime = `${block.start_date} ${startTimeLabel}`;
    let endTimeLabel = 'End of Week';
    let tooltipEndTime = 'End of week';

    if (block.end_time !== null && block.end_day !== null) {
        endTimeLabel = formatTimeStamp(block.end_time);
        tooltipEndTime = `${block.end_date} ${endTimeLabel}`;
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
