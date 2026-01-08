// React
import { FC, useContext, useState, useMemo } from 'react';

// Third Party
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { LuShieldCheck, LuShieldOff } from 'react-icons/lu';

// Api Calls
import { getDefaultSchedule } from '../../api_calls/DefaultScheduleTemplates';
import { getSiteStatus } from '../../api_calls/Schedules';

// Components
import ScheduleModal from './ScheduleModal';
import ManualArmingModal from './ManualArmingModal';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Types
import { ScheduleBlock } from './WeeklySchedule.controller';
import { SelectOption, IUser } from '../../types/interfaces';

// Styles
import '../../styles/components/Scheduling/NewScheduleDisplay.scss';

interface IProps {
    weeklySchedule: ScheduleBlock[];
    apiTimeZoneOptions: SelectOption[];
    accountId: string;
    siteId: string;
}

const NewScheduleDisplay: FC<IProps> = ({
    weeklySchedule,
    apiTimeZoneOptions,
    accountId,
    siteId,
}) => {
    const { activeUser } = useContext(AuthContext);

    const [showCreateScheduleModal, setShowCreateScheduleModal] =
        useState(false);
    const [showManualArmingModal, setShowManualArmingModal] = useState(false);
    const [overrideAction, setOverrideAction] = useState<'arm' | 'disarm'>(
        'arm'
    );

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

    const defaultScheduleQuery = useQuery({
        queryFn: () =>
            getDefaultSchedule({
                user: activeUser as IUser,
                params: {
                    account_id: Number(accountId),
                    site_id: Number(siteId),
                },
            }),
        queryKey: ['get-default-schedule', accountId, siteId],
        onError: (error) => {
            console.error(error);
            toast.error('Unable to get system status');
        },
        enabled: !!activeUser,
    });

    const defaultScheduleId = useMemo(() => {
        if (defaultScheduleQuery.data) {
            return defaultScheduleQuery.data[0].schedule_template_id;
        }

        return null;
    }, [defaultScheduleQuery.data]);

    return (
        <div className="NewScheduleDisplay">
            <div className="siteInfoContainer">
                <p>No schedule currently set up for this site.</p>

                {siteStatusQuery.data?.is_armed === true && (
                    <p className="siteStatus">
                        Site is currently{' '}
                        <span className="armed" style={{ marginRight: 5 }}>
                            Armed
                        </span>
                        <LuShieldCheck className="armed" />
                    </p>
                )}

                {siteStatusQuery.data?.is_armed === false && (
                    <p className="siteStatus">
                        Site is currently .{' '}
                        <span className="disarmed" style={{ marginRight: 5 }}>
                            Disarmed
                        </span>
                        <LuShieldOff className="disarmed" />
                    </p>
                )}

                <div className="siteActionsBtnContainer">
                    {defaultScheduleId === 1 && (
                        <button
                            onClick={() => {
                                setOverrideAction('disarm');
                                setShowManualArmingModal(true);
                            }}
                            className="btn danger"
                            type="button"
                        >
                            Disarm Site
                        </button>
                    )}

                    {defaultScheduleId === 2 && (
                        <button
                            onClick={() => {
                                setOverrideAction('arm');
                                setShowManualArmingModal(true);
                            }}
                            className="btn danger"
                            type="button"
                        >
                            Arm Site
                        </button>
                    )}

                    <button
                        className="btn primary"
                        type="button"
                        onClick={() => setShowCreateScheduleModal(true)}
                    >
                        Create Schedule
                    </button>
                </div>
            </div>

            {showCreateScheduleModal && (
                <ScheduleModal
                    weeklySchedule={weeklySchedule}
                    handleClose={() => setShowCreateScheduleModal(false)}
                    apiTimeZoneOptions={apiTimeZoneOptions}
                    accountId={accountId}
                    siteId={siteId}
                    currentTimeZone={null}
                    currentTimeBlocks={[
                        {
                            days: null,
                            startTime: null,
                            endTime: null,
                        },
                    ]}
                />
            )}
            {showManualArmingModal && (
                <ManualArmingModal
                    accountId={accountId}
                    siteId={siteId}
                    action={overrideAction}
                    handleClose={() => setShowManualArmingModal(false)}
                />
            )}
        </div>
    );
};

export default NewScheduleDisplay;
