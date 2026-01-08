// React
import { FC, useMemo, useContext } from 'react';

// Third party
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { LuShieldCheck, LuShieldOff } from 'react-icons/lu';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Api Calls
import { getSchedules, getSiteStatus } from '../../api_calls/Schedules';
import { getScheduleExceptions } from '../../api_calls/ScheduleExceptions';

// Components
import WeeklySchedule from '../Scheduling/WeeklySchedule';
import ExceptionsTable from '../Scheduling/ExceptionsTable';

// Types & Controllers
import { IUser } from '../../types/interfaces';
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

    // 2. Fetch Site Status
    const siteStatusQuery = useQuery({
        queryFn: () =>
            getSiteStatus({
                user: activeUser as IUser,
                params: {
                    account_id: accountId,
                    site_id: siteId,
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

    // 3. Determine schedule info, including ID and Name
    const { noActiveScheduleSet, scheduleId, timeZoneName } = useMemo(() => {
        if (scheduleQuery.data && scheduleQuery.data.data.length > 0) {
            const data = scheduleQuery.data.data[0];
            return {
                noActiveScheduleSet: data.schedule_site_id === 0,
                scheduleId: data.schedule_site_id,
                timeZoneName: data.schedule_time_zone_description,
            };
        }
        return {
            noActiveScheduleSet: true,
            scheduleId: 0,
            timeZoneName: '',
        };
    }, [scheduleQuery.data]);

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
        onError: (error) => {
            console.error(error);
            toast.error('Unable to get schedule Exceptions.');
        },
        enabled: !!activeUser && !noActiveScheduleSet && scheduleId !== 0,
    });

    // 6. Loading State
    if (scheduleQuery.isLoading || scheduleExceptionsQuery.isLoading) {
        return (
            <div className="p-4" style={{ color: 'white' }}>
                Loading Pro Monitoring Schedule...
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
                }}
            >
                <p style={{ margin: 0 }}>
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
                <p>
                    Timezone: <strong>{timeZoneName}</strong>
                </p>

                {/* Status */}
                <p className="schedule-status">
                    Status:{' '}
                    {siteStatusQuery.data?.is_armed === true && (
                        <span>
                            <span className="armed" style={{ marginRight: 5 }}>
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

            {/* Weekly Schedule View */}
            <div
                className="weeklyScheduleContainer"
                style={{
                    marginTop: '0',
                    padding: '10px',
                    background: '#333',
                    borderRadius: '4px',
                    width: '100%',
                }}
            >
                <WeeklySchedule weeklySchedule={weeklySchedule} />
            </div>

            {/* Schedule Exceptions Table */}
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
                    {/* Pass empty handlers to disable interactions */}
                    <ExceptionsTable
                        data={scheduleExceptionsQuery.data || []}
                        onDeleteExceptionClick={() => {}}
                        onEditExceptionClick={() => {}}
                    />
                </div>
            </div>
        </div>
    );
};

export default FactSheetProMonitoringSchedule;
