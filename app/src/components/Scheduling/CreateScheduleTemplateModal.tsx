/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-associated-control */

// React
import { FC, FormEvent, useState, useContext } from 'react';

// Third Party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MultiValue, SingleValue } from 'react-select';

import { toast } from 'react-toastify';

// Api Calls
import { createScheduleTemplate } from '../../api_calls/ScheduleTemplates';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import ModalBase from '../ModalBase';
import Input from '../Inputs/Input';

// Controller
import {
    generateScheduleFromTimeBlocks,
    formatScheduleToSave,
} from './ScheduleModal.controller';
import { ScheduleBlock } from './WeeklySchedule.controller';

// Custom Types
import { SelectOption } from '../../types/interfaces';

// Styles
import '../../styles/components/Scheduling/CreateScheduleTemplateModal.scss';

export type TimeBlock = {
    days: MultiValue<SelectOption> | null;
    startTime: SingleValue<SelectOption> | null;
    endTime: SingleValue<SelectOption> | null;
};

interface IProps {
    handleClose: () => void;
    weeklySchedule: ScheduleBlock[];
    accountId: string;
    siteId: string;
    currentTimeBlocks: TimeBlock[];
    currentTimeZone: SelectOption | null;
    currentScheduleName: string;
}

const CreateScheduleTemplateModal: FC<IProps> = ({
    handleClose,
    weeklySchedule,
    accountId,
    siteId,
    currentTimeBlocks,
    currentTimeZone,
    currentScheduleName,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const [templateName, setTemplateName] = useState(currentScheduleName);

    const createScheduleTemplateMutation = useMutation({
        mutationFn: createScheduleTemplate,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to create template.');
        },
        onSuccess: () => {
            toast.success('Template Created.');
            queryClient.invalidateQueries([
                'get-schedule-templates',
                accountId,
            ]);
            handleClose();
        },
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser || !currentTimeZone) {
            return;
        }

        const { newWeeklySchedule, invalidSchedule } =
            generateScheduleFromTimeBlocks(weeklySchedule, currentTimeBlocks);

        if (invalidSchedule) {
            toast.error(
                'Invalid Schedule. Schedule time blocks can not overlap.'
            );
            return;
        }

        const formattedSchedule = formatScheduleToSave(newWeeklySchedule);

        const newTemplateData = {
            schedule_name: templateName,
            account_id: Number(accountId),
            site_id: Number(siteId),
            schedule_time_zone_id: Number(currentTimeZone.value),
            make_default: false,
            schedules: formattedSchedule,
        };

        createScheduleTemplateMutation.mutate({
            user: activeUser,
            params: newTemplateData,
        });
    };

    return (
        <ModalBase
            title="Create Schedule Template"
            handleClose={handleClose}
            className="CreateScheduleTemplateModalBase"
        >
            <form
                id="schedule-form"
                key="schedule-form"
                onSubmit={handleSubmit}
                className="CreateScheduleTemplateModal modal-content"
            >
                <p>
                    Would you like to create a schedule template from this
                    site&pos;s schedule?
                </p>
                <div className="templateNameContainer">
                    <Input
                        id="schedule-name-input"
                        name="schedule-name-input"
                        label="Template Name"
                        className="input"
                        type="text"
                        value={templateName}
                        autoComplete="false"
                        onChange={setTemplateName}
                        required
                    />
                </div>

                <div className="button-container">
                    <button className="btn primary" type="submit">
                        Create Template
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
        </ModalBase>
    );
};

export default CreateScheduleTemplateModal;
