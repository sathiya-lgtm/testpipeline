/* eslint-disable react/no-array-index-key */

// React
import { FC, useState, useMemo, useContext } from 'react';

// Third Party
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import {
    format,
    startOfWeek,
    endOfWeek,
    addDays,
    addWeeks,
    addMonths,
    parseISO,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
    PiCaretRight,
    PiCaretLeft,
    PiCaretDoubleLeft,
    PiCaretDoubleRight,
} from 'react-icons/pi';
import { LuShieldCheck, LuShieldOff } from 'react-icons/lu';

// Api Calls
import {
    getScheduleExceptions,
    IException,
} from '../../api_calls/ScheduleExceptions';
import { getScheduleOverrides } from '../../api_calls/ScheduleOverides';
import { getSiteStatus } from '../../api_calls/Schedules';

// Components
import { MonitoringBlock } from './WeeklySchedule';
import OverridesModal from './OverridesModal';
import ConfirmRemoveOverrideModal from './ConfirmRemoveOverridesModal';

// Controller
import { ScheduleBlock } from './WeeklySchedule.controller';
import {
    buildActiveScheduleMonitoringBlockDisplayData,
    generateMonitoringBlocksForActiveSchedule,
} from './ActiveScheduleView.controller';

// Custom Types
import { IUser, SelectOption } from '../../types/interfaces';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Styles
import '../../styles/components/Scheduling/ActiveScheduleView.scss';

const getDefaultWeekStartDate = (targetTimeZone: string) => {
    const date = new Date();
    const zonedTime = toZonedTime(date, targetTimeZone);
    return startOfWeek(zonedTime, { weekStartsOn: 0 });
};

const getExceptionStartAndEndDate = (
    exception: IException,
    scheduleTimeZone: string
) => {
    const startDate = toZonedTime(
        new Date(exception.start_dt),
        scheduleTimeZone
    );
    const endDate = toZonedTime(new Date(exception.end_dt), scheduleTimeZone);

    return { startDate, endDate };
};

const formatExceptionDateTime = (exceptionDateTime: string) => {
    const date = parseISO(exceptionDateTime);
    return format(date, 'MM/dd/yyyy h:mm a');
};

interface IProps {
    scheduleTimeZone: string;
    scheduleTimeZoneDescription: string;
    scheduleId: number;
    accountId: string;
    siteId: string;
    weeklySchedule: ScheduleBlock[];
    scheduleTimeZoneSelectValue: SelectOption | null;
    siteHasPanel: boolean;
}

const ActiveScheduleView: FC<IProps> = ({
    scheduleTimeZone,
    scheduleTimeZoneDescription,
    scheduleId,
    accountId,
    siteId,
    weeklySchedule,
    scheduleTimeZoneSelectValue,
    siteHasPanel,
}) => {
    const { activeUser } = useContext(AuthContext);

    const [showDisarmScheduleModal, setShowDisarmScheduleModal] =
        useState(false);
    const [showConfirmRemoveOverrideModal, setShowConfirmRemoveOverrideModal] =
        useState(false);
    const [overrideAction, setOverrideAction] = useState<'arm' | 'disarm'>(
        'arm'
    );
    const [weekStartDate, setWeekStartDate] = useState<Date>(
        getDefaultWeekStartDate(scheduleTimeZone)
    );

    const scheduleExceptionsQuery = useQuery({
        queryFn: () =>
            getScheduleExceptions({
                user: activeUser as IUser,
                params: {
                    schedule_site_id: scheduleId,
                    account_id: Number(accountId),
                    site_id: Number(siteId),
                },
            }),
        queryKey: ['get-schedule-exceptions', accountId, siteId, scheduleId],
        onError: (error) => {
            console.error(error);
            toast.error('Unable to get schedule Exceptions.');
        },
        enabled: !!activeUser,
    });

    const scheduleOverridesQuery = useQuery({
        queryFn: () =>
            getScheduleOverrides({
                user: activeUser as IUser,
                params: {
                    schedule_site_id: scheduleId,
                    account_id: Number(accountId),
                    site_id: Number(siteId),
                },
            }),
        queryKey: ['get-schedule-overrides', accountId, siteId, scheduleId],
        onError: (error) => {
            console.error(error);
            toast.error('Unable to get schedule overrides.');
        },
        enabled: !!activeUser,
    });

    const siteStatusQuery = useQuery({
        queryFn: () =>
            getSiteStatus({
                user: activeUser as IUser,
                params: {
                    account_id: Number(accountId),
                    site_id: Number(siteId),
                },
            }),
        queryKey: ['get-site-status', accountId, siteId],
        onError: (error) => {
            console.error(error);
            toast.error('Unable to get site armed status.');
        },
        refetchInterval: 8000,
        refetchIntervalInBackground: true,
        enabled: !!activeUser,
    });

    const currentOverride = useMemo(() => {
        if (
            scheduleOverridesQuery.data &&
            scheduleOverridesQuery.data.length > 0
        ) {
            return scheduleOverridesQuery.data[0];
        }

        return null;
    }, [scheduleOverridesQuery.data]);

    const overrideActive = useMemo(() => {
        if (!currentOverride) {
            return false;
        }

        if (currentOverride.end_dt) {
            const overrideStartDateTime = new Date(currentOverride.start_dt);
            const overrideEndDateTime = new Date(currentOverride.end_dt);

            const currentDateTime = toZonedTime(new Date(), scheduleTimeZone);

            return (
                currentDateTime > overrideStartDateTime &&
                currentDateTime < overrideEndDateTime
            );
        }

        return true;
    }, [scheduleTimeZone, currentOverride]);

    const handleNavigateActiveSchedule = (
        interval: number,
        unit: 'week' | 'month'
    ) => {
        if (unit === 'week') {
            const newStartDate = addWeeks(weekStartDate, interval);
            setWeekStartDate(newStartDate);
        } else {
            const newStartDate = addMonths(weekStartDate, interval);
            setWeekStartDate(newStartDate);
        }
    };

    const weekEndDate = useMemo(() => {
        return endOfWeek(weekStartDate, { weekStartsOn: 0 });
    }, [weekStartDate]);

    const scheduleWeekDates = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
    }, [weekStartDate]);

    const currentWeekExceptions = useMemo(() => {
        if (scheduleExceptionsQuery.data) {
            return scheduleExceptionsQuery.data.filter((exception) => {
                const { startDate, endDate } = getExceptionStartAndEndDate(
                    exception,
                    scheduleTimeZone
                );

                if (startDate >= weekStartDate && startDate <= weekEndDate) {
                    return true;
                }

                if (endDate >= weekStartDate && endDate <= weekEndDate) {
                    return true;
                }

                return false;
            });
        }

        return [];
    }, [
        scheduleExceptionsQuery.data,
        weekStartDate,
        weekEndDate,
        scheduleTimeZone,
    ]);

    const weeklyScheduleWithDates = useMemo(() => {
        return weeklySchedule.map((scheduleBlock, index) => {
            const targetIndex = Math.floor(index / 96);
            const dateStr = format(
                scheduleWeekDates[targetIndex],
                'MM-dd-yyyy'
            );
            return { ...scheduleBlock, date: dateStr };
        });
    }, [weeklySchedule, scheduleWeekDates]);

    const weeklyScheduleWithExceptions = useMemo(() => {
        const weeklyScheduleWithDatesCopy = [...weeklyScheduleWithDates];

        currentWeekExceptions.forEach((currentException) => {
            const currentExceptionStartTime = currentException.start_dt
                .split(' ')[1]
                .slice(0, -3);
            const currentExceptionEndTime = currentException.end_dt
                .split(' ')[1]
                .slice(0, -3);

            const startDate = new Date(currentException.start_dt);
            const endDate = new Date(currentException.end_dt);

            const startDateStr = format(startDate, 'MM-dd-yyyy');
            const endDateStr = format(endDate, 'MM-dd-yyyy');

            if (startDate >= weekStartDate && startDate <= weekEndDate) {
                let exceptionBlockStarted = false;
                weeklyScheduleWithDates.forEach(
                    (scheduleBlock, scheduleBlockIndex) => {
                        if (
                            scheduleBlock.date === startDateStr &&
                            scheduleBlock.start_time ===
                                currentExceptionStartTime
                        ) {
                            exceptionBlockStarted = true;
                        }

                        if (
                            scheduleBlock.date === endDateStr &&
                            scheduleBlock.start_time === currentExceptionEndTime
                        ) {
                            exceptionBlockStarted = false;
                        }

                        if (exceptionBlockStarted) {
                            weeklyScheduleWithDatesCopy[
                                scheduleBlockIndex
                            ].armed = currentException.is_armed;
                        }
                    }
                );
            }

            if (startDate <= weekStartDate) {
                let exceptionBlockStarted = true;
                weeklyScheduleWithDates.forEach(
                    (scheduleBlock, scheduleBlockIndex) => {
                        if (
                            scheduleBlock.date === endDateStr &&
                            scheduleBlock.start_time === currentExceptionEndTime
                        ) {
                            exceptionBlockStarted = false;
                        }

                        if (exceptionBlockStarted) {
                            weeklyScheduleWithDatesCopy[
                                scheduleBlockIndex
                            ].armed = currentException.is_armed;
                        }
                    }
                );
            }
        });

        return weeklyScheduleWithDatesCopy;
    }, [currentWeekExceptions, weeklyScheduleWithDates, scheduleTimeZone]);

    const displayedMonitoringBlocks = useMemo(() => {
        const blocks = generateMonitoringBlocksForActiveSchedule(
            weeklyScheduleWithExceptions
        );
        return blocks;
    }, [weeklyScheduleWithExceptions]);

    return (
        <div style={{ position: 'relative' }}>
            <div className="scheduleInfoContainer">
                <div className="timezoneContainer">
                    <p className="label">
                        Timezone: {scheduleTimeZoneSelectValue?.label}
                    </p>
                </div>

                <div className="currentStatusContainer">
                    <p className="label">
                        Status:{' '}
                        {siteStatusQuery.data?.is_armed === true && (
                            <span>
                                <span
                                    className="armed"
                                    style={{ marginRight: 5 }}
                                >
                                    Armed
                                </span>
                                <LuShieldCheck className="armed" />
                            </span>
                        )}
                        {siteStatusQuery.data?.is_armed === false && (
                            <span>
                                <span
                                    className="disarmed"
                                    style={{ marginRight: 5 }}
                                >
                                    Disarmed
                                </span>
                                <LuShieldOff className="disarmed" />
                            </span>
                        )}
                    </p>
                </div>

                {!siteHasPanel && (
                    <div className="manualOveridesContainer">
                        <p className="label">Manual Overrides: </p>
                        <div className="manualOveridesBtnContainer">
                            <button
                                type="button"
                                data-tooltip="Arm site"
                                className="tooltip top-odd btn danger outline iconBtn"
                                onClick={() => {
                                    setOverrideAction('arm');
                                    setShowDisarmScheduleModal(true);
                                }}
                            >
                                <LuShieldCheck className="armed" />
                            </button>
                            <button
                                type="button"
                                data-tooltip="Disarm site"
                                className="tooltip top-odd btn danger iconBtn"
                                onClick={() => {
                                    setOverrideAction('disarm');
                                    setShowDisarmScheduleModal(true);
                                }}
                            >
                                <LuShieldOff />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="scheduleControlsContainer">
                <button
                    type="button"
                    onClick={() => handleNavigateActiveSchedule(-1, 'month')}
                >
                    <PiCaretDoubleLeft size={24} />
                </button>
                <button
                    type="button"
                    onClick={() => handleNavigateActiveSchedule(-1, 'week')}
                >
                    <PiCaretLeft size={24} />
                </button>
                <button
                    type="button"
                    onClick={() => handleNavigateActiveSchedule(1, 'week')}
                >
                    <PiCaretRight size={24} />
                </button>
                <button
                    type="button"
                    onClick={() => handleNavigateActiveSchedule(1, 'month')}
                >
                    <PiCaretDoubleRight size={24} />
                </button>
            </div>

            <div className="weeklyScheduleContainer">
                <div className="weeklySchedule">
                    {scheduleWeekDates.map((weekDate) => {
                        return (
                            <div
                                key={weekDate.toISOString()}
                                className="dayBlock"
                            >
                                <div className="dayHeader">
                                    {format(weekDate, 'eee')} <br />
                                    {format(weekDate, 'MM-dd-yyyy')}
                                </div>
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
                        } = buildActiveScheduleMonitoringBlockDisplayData(
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
            </div>

            {currentWeekExceptions.length > 0 && (
                <div>
                    <h3>Current Week Exceptions</h3>

                    {currentWeekExceptions.map((exception) => {
                        return (
                            <div
                                className="exceptionRecord"
                                key={`${exception.start_dt}-${exception.end_dt}`}
                            >
                                <div className="exceptionHeader">
                                    <div className="exceptionName">
                                        {exception.description}
                                    </div>
                                    <div className="exceptionStatus">
                                        {exception.is_armed ? (
                                            <span>
                                                <span
                                                    className="armed"
                                                    style={{ marginRight: 5 }}
                                                >
                                                    Armed
                                                </span>
                                                <LuShieldCheck className="armed" />
                                            </span>
                                        ) : (
                                            <span>
                                                <span
                                                    className="disarmed"
                                                    style={{ marginRight: 5 }}
                                                >
                                                    Disarmed
                                                </span>
                                                <LuShieldOff className="disarmed" />
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="exceptionDates">
                                    {formatExceptionDateTime(
                                        exception.start_dt
                                    )}{' '}
                                    -{' '}
                                    {formatExceptionDateTime(exception.end_dt)}{' '}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {overrideActive && currentOverride && (
                <div className="overrideActiveOverlay">
                    <div className="overrideStatusContainer">
                        {currentOverride.end_dt && (
                            <p>
                                {siteHasPanel ? 'Panel' : ''} Override Active
                                until <br />
                                {format(
                                    currentOverride.end_dt,
                                    'MM/dd/yyyy h:mm a'
                                )}{' '}
                                {scheduleTimeZoneDescription}
                            </p>
                        )}

                        {currentOverride.end_dt === null && (
                            <p>
                                Permanent {siteHasPanel ? 'Panel' : ''} Override
                                Active.
                            </p>
                        )}

                        <p>
                            {currentOverride.is_armed ? (
                                <>
                                    <span
                                        className="armed"
                                        style={{ marginRight: 5 }}
                                    >
                                        System Armed
                                    </span>
                                    <LuShieldCheck className="armed" />
                                </>
                            ) : (
                                <>
                                    <span
                                        className="disarmed"
                                        style={{ marginRight: 5 }}
                                    >
                                        System Disarmed
                                    </span>
                                    <LuShieldOff className="disarmed" />
                                </>
                            )}
                        </p>
                        {!siteHasPanel && (
                            <div className="overrideOptionsContainer">
                                <button
                                    type="button"
                                    className="btn danger"
                                    onClick={() => {
                                        setShowConfirmRemoveOverrideModal(true);
                                    }}
                                >
                                    Remove Override
                                </button>

                                {currentOverride.is_armed && (
                                    <button
                                        type="button"
                                        className="btn danger"
                                        onClick={() => {
                                            setOverrideAction('disarm');
                                            setShowDisarmScheduleModal(true);
                                        }}
                                    >
                                        Disarm System
                                    </button>
                                )}

                                {!currentOverride.is_armed && (
                                    <button
                                        type="button"
                                        className="btn danger"
                                        onClick={() => {
                                            setOverrideAction('arm');
                                            setShowDisarmScheduleModal(true);
                                        }}
                                    >
                                        Arm System
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {currentOverride && showConfirmRemoveOverrideModal && (
                <ConfirmRemoveOverrideModal
                    handleClose={() => {
                        setShowConfirmRemoveOverrideModal(false);
                    }}
                    scheduleId={scheduleId}
                    overrideId={currentOverride.schedule_site_override_id}
                    accountId={accountId}
                    siteId={siteId}
                />
            )}

            {showDisarmScheduleModal && scheduleTimeZoneSelectValue && (
                <OverridesModal
                    handleClose={() => setShowDisarmScheduleModal(false)}
                    scheduleId={scheduleId}
                    accountId={accountId}
                    siteId={siteId}
                    scheduleTimeZoneLabel={scheduleTimeZoneSelectValue.label}
                    scheduleTimeZone={scheduleTimeZone}
                    action={overrideAction}
                    currentOverride={currentOverride}
                    weeklySchedule={weeklySchedule}
                    exceptions={scheduleExceptionsQuery.data || []}
                    systemArmed={siteStatusQuery.data?.is_armed || false}
                />
            )}
        </div>
    );
};

export default ActiveScheduleView;
