/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-associated-control */

// React
import { FC, FormEvent, useState, Fragment, useContext, useMemo } from 'react';

// Third Party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Select, { MultiValue, SingleValue } from 'react-select';
import { MdDownload } from 'react-icons/md';
import { toast } from 'react-toastify';

// Api Calls
import { createSchedule, updateSchedule } from '../../api_calls/Schedules';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import ModalBase from '../ModalBase';
import Input from '../Inputs/Input';
import ImportTemplateModal from './ImportTemplateModal';
import LoadingModal from '../Modals/LoadingModal';

// Icons
import DeleteIcon from '../../images/icons/EV_ENT_CircleX.7.6.22.svg?react';

// Controller
import {
    timeOptions,
    timeOptionsWithEndOfDay,
    dayOptions,
    timeSelectCustomStyles,
    generateScheduleFromTimeBlocks,
    formatScheduleToSave,
    isValidTimeBlock,
} from './ScheduleModal.controller';
import { convertWeeklyScheduleToTimeBlocks } from './CurrentScheduleDisplay.controller';
import { ScheduleBlock } from './WeeklySchedule.controller';

// Custom Types
import { SelectOption } from '../../types/interfaces';
import { IConsolidatedTemplateData } from './TemplatesDisplay';

// Styles
import '../../styles/components/Scheduling/ScheduleModal.scss';

export type TimeBlock = {
    days: MultiValue<SelectOption> | null;
    startTime: SingleValue<SelectOption> | null;
    endTime: SingleValue<SelectOption> | null;
};

interface IProps {
    handleClose: () => void;
    weeklySchedule: ScheduleBlock[];
    apiTimeZoneOptions: SelectOption[];
    accountId: string;
    siteId: string;
    currentTimeBlocks: TimeBlock[];
    currentTimeZone: SelectOption | null;
    scheduleId?: number;
    currentScheduleName?: string;
}

const ScheduleModal: FC<IProps> = ({
    handleClose,
    weeklySchedule,
    apiTimeZoneOptions,
    accountId,
    siteId,
    currentTimeBlocks,
    currentTimeZone,
    scheduleId,
    currentScheduleName,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const [scheduleName, setScheduleName] = useState(currentScheduleName || '');
    const [selectedTimeZone, setSelectedTimeZone] =
        useState<SingleValue<SelectOption> | null>(currentTimeZone);
    const [timeBlocks, setTimeBlocks] =
        useState<TimeBlock[]>(currentTimeBlocks);
    const [showImportTemplateModal, setShowImportTemplateModal] =
        useState(false);

    const onSuccess = () => {
        queryClient.invalidateQueries(['get-schedule', accountId, siteId]);
        queryClient.invalidateQueries(['get-site-status', accountId, siteId]);
        handleClose();
    };

    const createScheduleMutation = useMutation({
        mutationFn: createSchedule,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to create schedule.');
        },
        onSuccess,
    });

    const updateScheduleMutation = useMutation({
        mutationFn: updateSchedule,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to update schedule.');
        },
        onSuccess,
    });

    const applyScheduleTemplate = (templateData: IConsolidatedTemplateData) => {
        const templateTimeZone = apiTimeZoneOptions.find((option) => {
            return (
                option.value === templateData.schedule_time_zone_id.toString()
            );
        });

        if (templateTimeZone) {
            setSelectedTimeZone(templateTimeZone);
        }
        setScheduleName(templateData.schedule_name);
        setTimeBlocks(convertWeeklyScheduleToTimeBlocks(templateData.schedule));
    };

    const removeTimeBlock = (targetIndex: number) => {
        if (timeBlocks.length <= 1) {
            toast.error('Must have at least one time block.');
            return;
        }

        const timeBlockCopy = [...timeBlocks];
        timeBlockCopy.splice(targetIndex, 1);
        setTimeBlocks(timeBlockCopy);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser) {
            return;
        }

        for (let i = 0; i < timeBlocks.length; i += 1) {
            const blockStartTime = timeBlocks[i].startTime?.value;
            const blockEndTime = timeBlocks[i].endTime?.value;

            if (
                blockStartTime &&
                blockEndTime &&
                !isValidTimeBlock(blockStartTime, blockEndTime)
            ) {
                toast.error(
                    'End times must be after start times on time blocks.'
                );
                return;
            }
        }

        const { newWeeklySchedule, invalidSchedule } =
            generateScheduleFromTimeBlocks(weeklySchedule, timeBlocks);

        if (invalidSchedule) {
            toast.error(
                'Invalid Schedule. Schedule time blocks can not overlap.'
            );
            return;
        }

        const formattedSchedule = formatScheduleToSave(newWeeklySchedule);

        const newScheduleData = {
            schedule_name: scheduleName,
            account_id: Number(accountId),
            site_id: Number(siteId),
            schedule_time_zone_id: Number(selectedTimeZone?.value),
            is_active: true,
            schedules: formattedSchedule,
        };

        if (scheduleId) {
            updateScheduleMutation.mutate({
                user: activeUser,
                params: {
                    ...newScheduleData,
                    schedule_site_id: scheduleId,
                },
            });
        } else {
            createScheduleMutation.mutate({
                user: activeUser,
                params: newScheduleData,
            });
        }
    };

    const loadingText = useMemo(() => {
        if (createScheduleMutation.isLoading) {
            return 'Creating new schedule...';
        }

        if (updateScheduleMutation.isLoading) {
            return 'Updating schedule...';
        }

        return '';
    }, [updateScheduleMutation.isLoading, createScheduleMutation.isLoading]);

    return (
        <ModalBase
            title={
                scheduleId ? 'Update Armed Schedule' : 'Create Armed Schedule'
            }
            handleClose={handleClose}
            className="CreateScheduleModalBase"
            zIndex={200}
        >
            <>
                <form
                    id="schedule-form"
                    key="schedule-form"
                    onSubmit={handleSubmit}
                    className="CreateScheduleModal modal-content"
                >
                    <div className="importScheduleTemplateContainer">
                        <span>Import Schedule Template</span>
                        <button
                            className="iconBtn middleBtn"
                            type="button"
                            onClick={() => setShowImportTemplateModal(true)}
                        >
                            <MdDownload className="iconBtnReactIcon" />
                        </button>
                    </div>
                    <div className="scheduleNameAndTimeZoneInputContainer">
                        <Input
                            id="schedule-name-input"
                            name="schedule-name-input"
                            label="Schedule Name"
                            className="input"
                            type="text"
                            value={scheduleName}
                            autoComplete="false"
                            onChange={setScheduleName}
                            required
                        />
                        <div className="select-container">
                            <label htmlFor="timezone-select">
                                <span>Timezone</span>
                                <span className="asterisk">*</span>
                            </label>
                            <Select
                                className="timeZoneSelect"
                                id="timezone-select"
                                value={selectedTimeZone}
                                onChange={(newValue) =>
                                    setSelectedTimeZone(newValue)
                                }
                                isMulti={false}
                                styles={timeSelectCustomStyles}
                                placeholder="None"
                                options={apiTimeZoneOptions}
                                required
                            />
                        </div>
                    </div>
                    <div className="monitoringBlock">
                        {timeBlocks.map((timeBlock, index) => {
                            return (
                                <Fragment key={`timeblock-${index}`}>
                                    <div>
                                        <span>Day(s)</span>
                                        <Select
                                            id={`day-select-${index}`}
                                            isMulti
                                            className="select"
                                            value={timeBlock.days}
                                            styles={timeSelectCustomStyles}
                                            options={dayOptions}
                                            onChange={(newValue) => {
                                                const timeBlocksCopy = [
                                                    ...timeBlocks,
                                                ];

                                                if (Array.isArray(newValue)) {
                                                    newValue.sort(
                                                        (
                                                            a: SelectOption,
                                                            b: SelectOption
                                                        ) =>
                                                            parseInt(
                                                                a.value,
                                                                10
                                                            ) -
                                                            parseInt(
                                                                b.value,
                                                                10
                                                            )
                                                    );
                                                }

                                                timeBlocksCopy[index].days =
                                                    newValue;

                                                setTimeBlocks(timeBlocksCopy);
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="timeSelectsContainer">
                                        <div>
                                            <span>Start Time</span>
                                            <Select
                                                id={`start-time-select-${index}`}
                                                isMulti={false}
                                                className="select"
                                                isClearable={false}
                                                styles={timeSelectCustomStyles}
                                                value={timeBlock.startTime}
                                                options={timeOptions}
                                                onChange={(newValue) => {
                                                    const timeBlocksCopy = [
                                                        ...timeBlocks,
                                                    ];

                                                    timeBlocksCopy[
                                                        index
                                                    ].startTime = newValue;

                                                    setTimeBlocks(
                                                        timeBlocksCopy
                                                    );
                                                }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <span>End Time</span>
                                            <Select
                                                id={`end-time-select-${index}`}
                                                isMulti={false}
                                                className="select"
                                                isClearable={false}
                                                styles={timeSelectCustomStyles}
                                                value={timeBlock.endTime}
                                                options={
                                                    timeOptionsWithEndOfDay
                                                }
                                                onChange={(newValue) => {
                                                    const timeBlocksCopy = [
                                                        ...timeBlocks,
                                                    ];

                                                    timeBlocksCopy[
                                                        index
                                                    ].endTime = newValue;

                                                    setTimeBlocks(
                                                        timeBlocksCopy
                                                    );
                                                }}
                                                required
                                            />
                                        </div>
                                        <div className="deleteMonitorBlockContainer">
                                            <DeleteIcon
                                                className="deleteIcon"
                                                onClick={() =>
                                                    removeTimeBlock(index)
                                                }
                                            />
                                        </div>
                                    </div>
                                </Fragment>
                            );
                        })}
                    </div>

                    <div className="timeBlocksButtonContainer">
                        <button
                            type="button"
                            className="btn outline primary"
                            onClick={() => {
                                setTimeBlocks([
                                    ...timeBlocks,
                                    {
                                        days: null,
                                        startTime: null,
                                        endTime: null,
                                    },
                                ]);
                            }}
                        >
                            Add Time Block +
                        </button>
                    </div>

                    <div className="actionsContainer">
                        <button className="btn primary" type="submit">
                            {scheduleId ? 'Update Schedule' : 'Create Schedule'}
                        </button>
                        <button
                            className="btn danger"
                            type="button"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
                {loadingText && <LoadingModal modalText={loadingText} />}
                {showImportTemplateModal && (
                    <ImportTemplateModal
                        accountId={accountId}
                        handleClose={() => setShowImportTemplateModal(false)}
                        applyTemplate={applyScheduleTemplate}
                    />
                )}
            </>
        </ModalBase>
    );
};

export default ScheduleModal;
