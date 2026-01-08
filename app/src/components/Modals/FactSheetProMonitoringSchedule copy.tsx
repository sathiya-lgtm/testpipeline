// React
import { FC, useMemo, useContext } from 'react';

// Third party
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Api Calls
import { getSchedules } from '../../api_calls/Schedules';
import { getScheduleExceptions } from '../../api_calls/ScheduleExceptions';
// Required for fetching time zone descriptions
import getScheduleTimeZones from '../../api_calls/getScheduleTimeZones';

// Components
import WeeklySchedule from '../Scheduling/WeeklySchedule';
import ExceptionsTable from '../Scheduling/ExceptionsTable';

// Types & Controllers
import { IUser, SelectOption } from '../../types/interfaces';
import { ScheduleBlock } from '../Scheduling/WeeklySchedule.controller';

// Styles
import '../../styles/components/Scheduling/CurrentScheduleDisplay.scss';

interface IProps {
    accountId: number;
    siteId: number;
}

const FactSheetProMonitoringSchedule: FC<IProps> = ({ accountId, siteId }) => {
    const { activeUser } = useContext(AuthContext);

    // 1. Fetch Schedule Data
    const scheduleQuery = useQuery({
        queryFn: () =>
            getSchedules({
                user: activeUser as IUser,
                params: {
                    account_id: accountId,
                    site_id: siteId,
                },
            }),
        queryKey: ['get-schedule', accountId, siteId],
        onError: (error) => {
            console.error(error);
            toast.error("Unable to get site's schedule");
        },
        enabled: !!activeUser && !!accountId && !!siteId,
    });

    // 2. Fetch Time Zone Options
    const timeZoneQuery = useQuery({
        queryFn: () => getScheduleTimeZones({ user: activeUser as IUser }),
        queryKey: ['get-schedule-timezones'],
        enabled: !!activeUser,
    });

    // 3. Determine schedule info, including ID and Name (FORCING 'Default Schedule')
    const { noActiveScheduleSet, scheduleId, scheduleName, timeZoneId } =
        useMemo(() => {
            if (scheduleQuery.data && scheduleQuery.data.data.length > 0) {
                const data = scheduleQuery.data.data[0];
                return {
                    noActiveScheduleSet: data.schedule_site_id === 0,
                    scheduleId: data.schedule_site_id,
                    scheduleName: 'Default Schedule',
                    timeZoneId: data.schedule_time_zone_id,
                };
            }
            return {
                noActiveScheduleSet: true,
                scheduleId: 0,
                scheduleName: 'Default Schedule',
                timeZoneId: 0,
            };
        }, [scheduleQuery.data]);

    // Helper to get the descriptive time zone string
    const timeZoneDescription = useMemo(() => {
        if (scheduleQuery.data?.data && timeZoneQuery.data) {
            const schedule = scheduleQuery.data.data[0];
            const timeZone = timeZoneQuery.data.find(
                (tz: SelectOption) => tz.value === timeZoneId
            );

            // Fallback
            return (
                timeZone?.label ||
                schedule.schedule_time_zone_description ||
                'Eastern Time - (America/New_York)'
            );
        }
        return 'Eastern Time - (America/New_York)';
    }, [scheduleQuery.data, timeZoneQuery.data, timeZoneId]);

    // 4. Flatten Data for WeeklySchedule Component
    const weeklySchedule = useMemo(() => {
        const schedule: ScheduleBlock[] = [];
        if (scheduleQuery.data?.data) {
            scheduleQuery.data.data.forEach((item) => {
                item.schedule.forEach((scheduleItem) => {
                    schedule.push(scheduleItem);
                });
            });
        }
        return schedule;
    }, [scheduleQuery.data]);

    // 5. Fetch Exceptions (Only if schedule exists)
    const scheduleExceptionsQuery = useQuery({
        queryFn: () =>
            getScheduleExceptions({
                user: activeUser as IUser,
                params: {
                    schedule_site_id: scheduleId,
                    account_id: accountId,
                    site_id: siteId,
                },
            }),
        queryKey: ['get-schedule-exceptions', accountId, siteId, scheduleId],
        enabled: !!activeUser && !noActiveScheduleSet && scheduleId !== 0,
    });

    // 6. Loading State
    if (
        scheduleQuery.isLoading ||
        timeZoneQuery.isLoading ||
        scheduleExceptionsQuery.isLoading
    ) {
        return (
            <div className="p-4" style={{ color: 'white' }}>
                Loading Schedule...
            </div>
        );
    }

    // 7. No Schedule State
    if (noActiveScheduleSet) {
        return (
            <div
                className="no-schedule-alert"
                style={{
                    padding: '1rem',
                    background: '#2c2c2c',
                    borderRadius: '4px',
                    marginTop: '1rem',
                }}
            >
                <p style={{ color: '#ffffff', margin: 0 }}>
                    There is no schedule configured for this site. Please create
                    one by navigating to{' '}
                    <strong>
                        Utilities → Video Monitoring Services → Scheduling.
                    </strong>
                </p>
            </div>
        );
    }

    // 8. Main Render
    return (
        <div
            className="pro-monitoring-schedule-display"
            style={{ width: '100%' }}
        >
            {/* Header: Timezone and Status Display */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                }}
            >
                {/* Timezone */}
                <p style={{ color: '#fff', fontSize: '14px', margin: 0 }}>
                    Timezone: <strong>{timeZoneDescription}</strong>
                </p>

                {/* Status: Disarmed */}
                <p style={{ color: '#fff', fontSize: '14px', margin: 0 }}>
                    Status:{' '}
                    <strong style={{ color: '#d9534f' }}>Disarmed</strong>
                </p>
            </div>

            {/* Weekly Schedule View - Explicitly setting width to 100% */}
            <div
                className="weeklyScheduleContainer"
                style={{
                    marginTop: '0',
                    padding: '10px',
                    background: '#333',
                    borderRadius: '4px',
                    width: '100%', // Increased width
                }}
            >
                {/* Assuming WeeklySchedule component will stretch to its container's width */}
                <WeeklySchedule weeklySchedule={weeklySchedule} />
            </div>

            {/* Schedule Exceptions Table - Explicitly setting width to 100% */}
            <div
                className="scheduleExcepetionsContainer"
                style={{ marginTop: '2rem', width: '100%' }}
            >
                <h3
                    className="title"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'white',
                        marginBottom: '10px',
                    }}
                >
                    Schedule Exceptions
                </h3>

                <div
                    className="read-only-exceptions-table"
                    style={{ width: '100%' }}
                >
                    {/* Pass empty handlers to disable interactions (removes Reconfigure column) */}
                    <ExceptionsTable
                        data={scheduleExceptionsQuery.data || []}
                        onDeleteExceptionClick={() => {}}
                        onEditExceptionClick={() => {}}
                    />
                </div>
            </div>

            {/* Style to hide the Reconfigure column ONLY. */}
            <style>{`
                /* Hides the last column (Reconfigure) in the exceptions table */
                .read-only-exceptions-table table th:last-child,
                .read-only-exceptions-table table td:last-child {
                    display: none !important;
                }
            `}</style>
        </div>
    );
};

export default FactSheetProMonitoringSchedule;
