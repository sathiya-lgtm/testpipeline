/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-associated-control */

// React
import { FC, FormEvent, useState, Fragment, useContext, useMemo } from 'react';

// Third Party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Select, { MultiValue, SingleValue } from 'react-select';
import { toast } from 'react-toastify';

// Api Calls
import {
    createScheduleTemplate,
    updateScheduleTemplate,
} from '../../api_calls/ScheduleTemplates';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import ModalBase from '../ModalBase';
import Input from '../Inputs/Input';
import LoadingModal from '../Modals/LoadingModal';

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
import { ScheduleBlock } from './WeeklySchedule.controller';

// Icons
import DeleteIcon from '../../images/icons/EV_ENT_CircleX.7.6.22.svg?react';

// Custom Types
import { SelectOption } from '../../types/interfaces';

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
    templateId?: number;
    currentScheduleName?: string;
}

const TemplateModal: FC<IProps> = ({
    handleClose,
    weeklySchedule,
    apiTimeZoneOptions,
    accountId,
    siteId,
    currentTimeBlocks,
    currentTimeZone,
    templateId,
    currentScheduleName,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const [scheduleName, setScheduleName] = useState(currentScheduleName || '');
    const [selectedTimeZone, setSelectedTimeZone] =
        useState<SingleValue<SelectOption> | null>(currentTimeZone);
    const [timeBlocks, setTimeBlocks] =
        useState<TimeBlock[]>(currentTimeBlocks);

    const onSuccess = (successMessage: string) => {
        queryClient.invalidateQueries(['get-schedule-templates', accountId]);
        handleClose();
        toast.success(successMessage);
    };

    const createScheduleTemplateMutation = useMutation({
        mutationFn: createScheduleTemplate,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to create template.');
        },
        onSuccess: () => onSuccess('Template created.'),
    });

    const updateScheduleTemplateMutation = useMutation({
        mutationFn: updateScheduleTemplate,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to update template.');
        },
        onSuccess: () => onSuccess('Template updated.'),
    });

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

        const newTemplateData = {
            schedule_name: scheduleName,
            account_id: Number(accountId),
            site_id: Number(siteId),
            schedule_time_zone_id: Number(selectedTimeZone?.value),
            make_default: false,
            schedules: formattedSchedule,
        };

        if (templateId) {
            updateScheduleTemplateMutation.mutate({
                user: activeUser,
                params: {
                    ...newTemplateData,
                    schedule_template_id: Number(templateId),
                },
            });
        } else {
            createScheduleTemplateMutation.mutate({
                user: activeUser,
                params: newTemplateData,
            });
        }
    };

    const loadingText = useMemo(() => {
        if (createScheduleTemplateMutation.isLoading) {
            return 'Creating new template...';
        }

        if (updateScheduleTemplateMutation.isLoading) {
            return 'Updating template...';
        }

        return '';
    }, [
        createScheduleTemplateMutation.isLoading,
        updateScheduleTemplateMutation.isLoading,
    ]);

    return (
        <ModalBase
            title={
                templateId
                    ? 'Update Schedule Template'
                    : 'Create Schedule Template'
            }
            handleClose={handleClose}
            className="CreateScheduleModalBase"
        >
            <form
                id="schedule-form"
                key="schedule-form"
                onSubmit={handleSubmit}
                className="CreateScheduleModal modal-content"
            >
                <div className="scheduleNameAndTimeZoneInputContainer">
                    <Input
                        id="schedule-name-input"
                        name="schedule-name-input"
                        label="Template Name"
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
                                                        parseInt(a.value, 10) -
                                                        parseInt(b.value, 10)
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

                                                setTimeBlocks(timeBlocksCopy);
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
                                            options={timeOptionsWithEndOfDay}
                                            onChange={(newValue) => {
                                                const timeBlocksCopy = [
                                                    ...timeBlocks,
                                                ];

                                                timeBlocksCopy[index].endTime =
                                                    newValue;

                                                setTimeBlocks(timeBlocksCopy);
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
                        {templateId ? 'Update Template' : 'Create Template'}
                    </button>
                    <button
                        className="btn danger"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>
                {loadingText && <LoadingModal modalText={loadingText} />}
            </form>
        </ModalBase>
    );
};

export default TemplateModal;
