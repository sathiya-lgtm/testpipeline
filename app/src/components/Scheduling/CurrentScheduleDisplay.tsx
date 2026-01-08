// React
import { FC, useState, useMemo, useContext } from 'react';

// Third party
import { useQuery } from '@tanstack/react-query';
import { LuShieldCheck, LuShieldOff } from 'react-icons/lu';
import { CiMedicalClipboard } from 'react-icons/ci';
import { IoAddOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';

// Api Calls
import {
    getScheduleExceptions,
    IException,
} from '../../api_calls/ScheduleExceptions';
import { getSiteStatus, ISchedule } from '../../api_calls/Schedules';

// components
import ActiveScheduleView from './ActiveScheduleView';
import WeeklySchedule from './WeeklySchedule';
import ExceptionsTable from './ExceptionsTable';
import ScheduleModal from './ScheduleModal';
import ScheduleExceptionsModal from './ScheduleExceptionsModal';
import TabPanel, { TabPage } from '../TabPanel/TabPanel';
import TemplatesDisplay from './TemplatesDisplay';
import CreateScheduleTemplateModal from './CreateScheduleTemplateModal';
import ConfirmDeleteScheduleModal from './ConfirmDeleteScheduleModal';
import ConfirmDeleteScheduleExceptionModal from './ConfirmDeleteExceptionModal';

// Controller
import { ScheduleBlock } from './WeeklySchedule.controller';
import { timeZoneOptions } from './ScheduleModal.controller';
import { convertScheduleDataToTimeBlocks } from './CurrentScheduleDisplay.controller';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Icons
import EditIcon from '../../images/icons/EV.edit.svg?react';
import DeleteIcon from '../../images/icons/EV_ENT_CircleX.7.6.22.svg?react';

// Types
import { SelectOption, IUser } from '../../types/interfaces';

// Styles
import '../../styles/components/Scheduling/CurrentScheduleDisplay.scss';

interface IProps {
    scheduleData: ISchedule[];
    apiTimeZoneOptions: SelectOption[];
    accountId: string;
    siteId: string;
    siteHasPanel: boolean;
}

const CurrentScheduleDisplay: FC<IProps> = ({
    scheduleData,
    apiTimeZoneOptions,
    accountId,
    siteId,
    siteHasPanel,
}) => {
    const { activeUser } = useContext(AuthContext);

    const [showUpdateScheduleModal, setShowUpdateScheduleModal] =
        useState(false);
    const [showScheduleExceptionModal, setShowScheduleExcpetionModal] =
        useState(false);
    const [
        showCreateScheduleTemplateModal,
        setShowCreateScheduleTemplateModal,
    ] = useState(false);
    const [showDeleteScheduleModal, setShowDeleteScheduleModal] =
        useState(false);
    const [
        showDeleteScheduleExceptionModal,
        setShowDeleteScheduleExceptionModal,
    ] = useState(false);
    const [selectedScheduleException, setSelectedScheduleException] =
        useState<IException | null>(null);

    const handleEditScheduleExceptionClick = (rowData: IException) => {
        setSelectedScheduleException(rowData);
        setShowScheduleExcpetionModal(true);
    };

    const handleCloseScheduleExceptionModal = () => {
        setSelectedScheduleException(null);
        setShowScheduleExcpetionModal(false);
    };

    const handleDeleteScheduleExceptionClick = (rowData: IException) => {
        setSelectedScheduleException(rowData);
        setShowDeleteScheduleExceptionModal(true);
    };

    const handleCloseDeleteScheduleExceptionModal = () => {
        setSelectedScheduleException(null);
        setShowDeleteScheduleExceptionModal(false);
    };

    const currentTimeBlocks = useMemo(() => {
        return convertScheduleDataToTimeBlocks(scheduleData);
    }, [scheduleData]);

    const {
        scheduleName,
        scheduleId,
        scheduleTimeZone,
        scheduleTimeZoneDescription,
    } = useMemo(() => {
        const data = scheduleData[0];
        return {
            scheduleName: data.schedule_name,
            scheduleId: data.schedule_site_id,
            scheduleTimeZone: data.schedule_time_zone,
            scheduleTimeZoneDescription: data.schedule_time_zone_description,
        };
    }, [scheduleData]);

    const scheduleTimeZoneSelectValue = useMemo(() => {
        const result = apiTimeZoneOptions.find(
            (option) =>
                Number(option.value) === scheduleData[0].schedule_time_zone_id
        );

        return result || null;
    }, [timeZoneOptions, scheduleData]);

    const weeklySchedule = useMemo(() => {
        const schedule: ScheduleBlock[] = [];
        scheduleData.forEach((item) => {
            item.schedule.forEach((scheduleItem) => {
                schedule.push(scheduleItem);
            });
        });
        return schedule;
    }, [scheduleData]);

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

    return (
        <TabPanel>
            <TabPage label="Weekly View">
                <ActiveScheduleView
                    scheduleTimeZone={scheduleTimeZone}
                    scheduleTimeZoneDescription={scheduleTimeZoneDescription}
                    scheduleId={scheduleId}
                    accountId={accountId}
                    siteId={siteId}
                    weeklySchedule={weeklySchedule}
                    scheduleTimeZoneSelectValue={scheduleTimeZoneSelectValue}
                    siteHasPanel={siteHasPanel}
                />
            </TabPage>
            <TabPage label="Default Schedule/Exceptions">
                <>
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
                    </div>

                    <div className="weeklyScheduleContainer">
                        <div className="scheduleEditsContainer">
                            <button
                                className="tooltip iconBtn firstBtn"
                                type="button"
                                onClick={() => setShowUpdateScheduleModal(true)}
                                data-tooltip="Edit Schedule"
                            >
                                <EditIcon className="iconBtnIcon" />
                            </button>
                            <button
                                className="tooltip iconBtn middleBtn"
                                type="button"
                                data-tooltip="Create Schedule Template"
                                onClick={() =>
                                    setShowCreateScheduleTemplateModal(true)
                                }
                            >
                                <CiMedicalClipboard className="iconBtnReactIcon" />
                            </button>
                            <button
                                className="tooltip iconBtn lastBtn"
                                type="button"
                                onClick={() => {
                                    if (siteHasPanel) {
                                        toast.warn(
                                            'You cannot remove the schedule for a site with an alarm panel'
                                        );
                                    } else {
                                        setShowDeleteScheduleModal(true);
                                    }
                                }}
                                data-tooltip="Remove Schedule"
                            >
                                <DeleteIcon className="iconBtnIcon" />
                            </button>
                        </div>
                        <WeeklySchedule weeklySchedule={weeklySchedule} />
                    </div>

                    <div className="scheduleExcepetionsContainer">
                        <h3 className="title">
                            Schedule Exceptions{' '}
                            <button
                                type="button"
                                className="btn iconBtn primary"
                                onClick={() =>
                                    setShowScheduleExcpetionModal(true)
                                }
                            >
                                <IoAddOutline />
                            </button>
                        </h3>

                        <div>
                            <ExceptionsTable
                                data={scheduleExceptionsQuery.data || []}
                                onDeleteExceptionClick={
                                    handleDeleteScheduleExceptionClick
                                }
                                onEditExceptionClick={
                                    handleEditScheduleExceptionClick
                                }
                            />
                        </div>
                    </div>

                    {showDeleteScheduleExceptionModal &&
                        selectedScheduleException && (
                            <ConfirmDeleteScheduleExceptionModal
                                handleClose={
                                    handleCloseDeleteScheduleExceptionModal
                                }
                                scheduleExceptionId={
                                    selectedScheduleException.schedule_site_exception_id
                                }
                                scheduleId={
                                    selectedScheduleException.schedule_site_id
                                }
                                accountId={accountId}
                                siteId={siteId}
                            />
                        )}

                    {showScheduleExceptionModal && (
                        <ScheduleExceptionsModal
                            handleClose={handleCloseScheduleExceptionModal}
                            accountId={accountId}
                            siteId={siteId}
                            scheduleId={scheduleId}
                            selectedException={selectedScheduleException}
                            scheduleTimeZone={scheduleTimeZone}
                        />
                    )}

                    {showCreateScheduleTemplateModal && (
                        <CreateScheduleTemplateModal
                            handleClose={() =>
                                setShowCreateScheduleTemplateModal(false)
                            }
                            accountId={accountId}
                            siteId={siteId}
                            weeklySchedule={weeklySchedule}
                            currentTimeBlocks={currentTimeBlocks}
                            currentTimeZone={scheduleTimeZoneSelectValue}
                            currentScheduleName={scheduleName}
                        />
                    )}

                    {showUpdateScheduleModal && (
                        <ScheduleModal
                            handleClose={() =>
                                setShowUpdateScheduleModal(false)
                            }
                            weeklySchedule={weeklySchedule}
                            currentTimeBlocks={currentTimeBlocks}
                            scheduleId={scheduleId}
                            accountId={accountId}
                            siteId={siteId}
                            currentScheduleName={scheduleName}
                            apiTimeZoneOptions={apiTimeZoneOptions}
                            currentTimeZone={scheduleTimeZoneSelectValue}
                        />
                    )}

                    {showDeleteScheduleModal && (
                        <ConfirmDeleteScheduleModal
                            handleClose={() =>
                                setShowDeleteScheduleModal(false)
                            }
                            accountId={accountId}
                            siteId={siteId}
                            scheduleId={scheduleId}
                        />
                    )}
                </>
            </TabPage>
            <TabPage label="Schedule Templates">
                <TemplatesDisplay
                    accountId={accountId}
                    siteId={siteId}
                    apiTimeZoneOptions={apiTimeZoneOptions}
                />
            </TabPage>
        </TabPanel>
    );
};

export default CurrentScheduleDisplay;
