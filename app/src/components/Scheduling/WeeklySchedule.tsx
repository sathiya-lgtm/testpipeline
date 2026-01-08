/* eslint-disable react/no-array-index-key */
// React
import { useMemo, FC, useState } from 'react';

// Controller
import {
    buildMonitoringBlockDisplayData,
    generateMonitroingBlocks,
    ScheduleBlock,
} from './WeeklySchedule.controller';

// Styles
import '../../styles/components/Scheduling/WeeklySchedule.scss';

interface MonitoringBlockProps {
    leftPct: number;
    widthPct: number;
    className: string;
    tooltipInfo: string;
    startTimeLabel: string;
    endTimeLabel: string;
}

export const MonitoringBlock: FC<MonitoringBlockProps> = ({
    leftPct,
    widthPct,
    className,
    tooltipInfo,
    startTimeLabel,
    endTimeLabel,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <>
            <div
                style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                }}
                className={className}
                data-tooltip={tooltipInfo}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {startTimeLabel} - {endTimeLabel}
            </div>

            {showTooltip && (
                <div
                    style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: '100%',
                        background: 'black',
                        padding: 5,
                        borderRadius: 5,
                    }}
                >
                    {tooltipInfo}
                </div>
            )}
        </>
    );
};

const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
// 168 hours in a week
// 10,080 minutes in a week

interface IProps {
    weeklySchedule: ScheduleBlock[];
}

const WeeklySchedule: FC<IProps> = ({ weeklySchedule }) => {
    const displayedMonitoringBlocks = useMemo(() => {
        const blocks = generateMonitroingBlocks(weeklySchedule);
        return blocks;
    }, [weeklySchedule]);

    return (
        <div className="weeklySchedule">
            {days.map((day) => {
                return (
                    <div key={day} className="dayBlock">
                        <div className="dayHeader">{day}</div>
                        <div className="dayBody" />
                    </div>
                );
            })}

            {displayedMonitoringBlocks.map((block, index) => {
                const {
                    leftPct,
                    widthPct,
                    className,
                    startTimeLabel,
                    endTimeLabel,
                    tooltipInfo,
                } = buildMonitoringBlockDisplayData(
                    block,
                    displayedMonitoringBlocks
                );

                return (
                    <MonitoringBlock
                        key={`mointoring-block-${index}`}
                        leftPct={leftPct}
                        widthPct={widthPct}
                        className={className}
                        tooltipInfo={tooltipInfo}
                        startTimeLabel={startTimeLabel}
                        endTimeLabel={endTimeLabel}
                    />
                );
            })}
        </div>
    );
};

export default WeeklySchedule;
