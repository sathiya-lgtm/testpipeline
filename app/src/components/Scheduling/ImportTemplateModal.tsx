/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-associated-control */

// React
import { FC, FormEvent, useContext, useMemo, useState } from 'react';

// Third Party
import { useQuery } from '@tanstack/react-query';
import Select, { MultiValue, SingleValue } from 'react-select';
import { toast } from 'react-toastify';

// Api Calls
import { getScheduleTemplates } from '../../api_calls/ScheduleTemplates';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import ModalBase from '../ModalBase';

// Controller
import { timeSelectCustomStyles } from './ScheduleModal.controller';
import { ScheduleBlock } from './WeeklySchedule.controller';

// Custom Types
import { SelectOption, IUser } from '../../types/interfaces';
import { IConsolidatedTemplateData } from './TemplatesDisplay';

// Styles
import '../../styles/components/Scheduling/ScheduleModal.scss';
import '../../styles/components/Scheduling/ImportTemplateModal.scss';

export type TimeBlock = {
    days: MultiValue<SelectOption> | null;
    startTime: SingleValue<SelectOption> | null;
    endTime: SingleValue<SelectOption> | null;
};

interface IProps {
    handleClose: () => void;
    accountId: string;
    applyTemplate: (templateData: IConsolidatedTemplateData) => void;
}

const ImportTemplateModal: FC<IProps> = ({
    handleClose,
    accountId,
    applyTemplate,
}) => {
    const { activeUser } = useContext(AuthContext);

    const [selectedScheduleTemplate, setSelectedScheduleTemplate] =
        useState<SingleValue<SelectOption> | null>(null);

    const templatesQuery = useQuery({
        queryFn: () =>
            getScheduleTemplates({
                user: activeUser as IUser,
                params: {
                    account_id: Number(accountId),
                },
            }),
        queryKey: ['get-schedule-templates', accountId],
        onError: (error) => {
            console.error(error);
            toast.error("Unable to get account's schedule templates.");
        },
        enabled: !!activeUser,
    });

    const consolatedTemplateData = useMemo(() => {
        const { data } = templatesQuery;
        const templateData: IConsolidatedTemplateData[] = [];

        if (data) {
            for (let startDay = 0; startDay < data.length; startDay += 7) {
                const currentTemplateData = {
                    schedule_name: data[startDay].schedule_name,
                    schedule_template_id: data[startDay].schedule_template_id,
                    schedule_time_zone_id: data[startDay].schedule_time_zone_id,
                    schedule_time_zone_description:
                        data[startDay].schedule_time_zone_description,
                    schedule: [] as ScheduleBlock[],
                };
                for (
                    let currentDay = startDay;
                    currentDay < startDay + 7;
                    currentDay += 1
                ) {
                    currentTemplateData.schedule.push(
                        ...data[currentDay].schedule
                    );
                }

                if (currentTemplateData.schedule_time_zone_id !== 0) {
                    templateData.push(currentTemplateData);
                }
            }
        }

        return templateData;
    }, [templatesQuery.data]);

    const templateOptions = useMemo(() => {
        return consolatedTemplateData.map((template) => {
            return {
                value: template.schedule_template_id.toString(),
                label: template.schedule_name,
            };
        });
    }, [consolatedTemplateData]);

    const selectedTemplate = useMemo(() => {
        if (selectedScheduleTemplate?.value) {
            const template = consolatedTemplateData.find((option) => {
                return (
                    option.schedule_template_id.toString() ===
                    selectedScheduleTemplate.value
                );
            });

            if (template) {
                return template;
            }
        }

        return null;
    }, [consolatedTemplateData, selectedScheduleTemplate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser || !selectedTemplate) {
            return;
        }

        applyTemplate(selectedTemplate);
        handleClose();
    };

    return (
        <ModalBase
            title="Import Schedule Template"
            handleClose={handleClose}
            className="ImportTemplateModalBase"
        >
            <form
                id="schedule-form"
                key="schedule-form"
                onSubmit={handleSubmit}
                className="CreateScheduleModal modal-content"
            >
                <div className="scheduleTemplateSelectContainer">
                    <div className="select-container">
                        <label htmlFor="timezone-select">
                            <span>Schedule Template</span>
                            <span className="asterisk">*</span>
                        </label>
                        <Select
                            className="scheduleTemplateSelect"
                            id="schedule-template-select"
                            value={selectedScheduleTemplate}
                            onChange={(newValue) =>
                                setSelectedScheduleTemplate(newValue)
                            }
                            isMulti={false}
                            styles={timeSelectCustomStyles}
                            placeholder="None"
                            options={templateOptions}
                            required
                        />
                    </div>
                </div>

                <div className="button-container">
                    <button className="btn primary" type="submit">
                        Import Template
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

export default ImportTemplateModal;
