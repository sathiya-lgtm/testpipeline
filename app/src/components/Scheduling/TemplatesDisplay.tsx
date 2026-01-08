// React
import { FC, useContext, useMemo, useState, FormEvent } from 'react';

// Third Party
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Api Calls
import {
    deleteScheduleTemplate,
    getScheduleTemplates,
} from '../../api_calls/ScheduleTemplates';

// Components
import TemplatesTable from './TemplatesTable';
import TemplateModal from './TemplateModal';
import ModalBase from '../ModalBase';
import LoadingModal from '../Modals/LoadingModal';

// Controller
import {
    convertWeeklyScheduleToTimeBlocks,
    defaultScheduleDay,
} from './CurrentScheduleDisplay.controller';

// Context
import { AuthContext } from '../../contexts/AuthProvider';
import { ScheduleBlock } from './WeeklySchedule.controller';

// Types
import { IUser, SelectOption } from '../../types/interfaces';

export interface IConsolidatedTemplateData {
    schedule_name: string;
    schedule_template_id: number;
    schedule_time_zone_description: string;
    schedule_time_zone_id: number;
    schedule: ScheduleBlock[];
}

interface IProps {
    accountId: string;
    siteId: string;
    apiTimeZoneOptions: SelectOption[];
}

const TemplatesDisplay: FC<IProps> = ({
    accountId,
    siteId,
    apiTimeZoneOptions,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const [showCreateTemplateModal, setShowCreateTemplateModal] =
        useState(false);
    const [showDeleteTemplateModal, setShowDeleteTemplateModal] =
        useState(false);
    const [selectedTemplate, setSelectedTemplate] =
        useState<IConsolidatedTemplateData | null>(null);

    const handleEditTemplateClick = (rowData: IConsolidatedTemplateData) => {
        setShowCreateTemplateModal(true);
        setSelectedTemplate(rowData);
    };

    const handleDeleteTemplateClick = (rowData: IConsolidatedTemplateData) => {
        setShowDeleteTemplateModal(true);
        setSelectedTemplate(rowData);
    };

    const closeDeleteModal = () => {
        setShowDeleteTemplateModal(false);
        setSelectedTemplate(null);
    };

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

    const deleteScheduleTemplateMutation = useMutation({
        mutationFn: deleteScheduleTemplate,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to create template.');
        },
        onSuccess: () => {
            queryClient.invalidateQueries([
                'get-schedule-templates',
                accountId,
            ]);
            closeDeleteModal();
            toast.success('Schedule deleted');
        },
    });

    const deleteTemplate = (e: FormEvent) => {
        e.preventDefault();

        if (selectedTemplate && activeUser) {
            deleteScheduleTemplateMutation.mutate({
                user: activeUser,
                params: {
                    schedule_template_id: selectedTemplate.schedule_template_id,
                    account_id: Number(accountId),
                },
            });
        }
    };

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

                if (currentTemplateData?.schedule_time_zone_id !== 0) {
                    templateData.push(currentTemplateData);
                }
            }
        }

        return templateData;
    }, [templatesQuery.data]);

    const defaultSchedule = useMemo(() => {
        const { data } = templatesQuery;
        const schedule: ScheduleBlock[] = [];

        if (data) {
            for (let startDay = 0; startDay < 7; startDay += 1) {
                schedule.push(...defaultScheduleDay);
                // The above code should be better, we should remove the bottom later if it does
                // not break anything

                // Used for when data is an empty [], otherwise the ui breaks
                // if (data[startDay] && data[startDay].schedule) {
                //     schedule.push(...data[startDay].schedule);
                // }
            }
        }

        return schedule;
    }, [templatesQuery.data]);

    const selectedTemplateTimeBlocks = useMemo(() => {
        if (selectedTemplate) {
            return convertWeeklyScheduleToTimeBlocks(selectedTemplate.schedule);
        }

        return [
            {
                days: null,
                startTime: null,
                endTime: null,
            },
        ];
    }, [selectedTemplate]);

    const loadingText = useMemo(() => {
        if (deleteScheduleTemplateMutation.isLoading) {
            return 'Deleting template...';
        }

        return '';
    }, [deleteScheduleTemplateMutation.isLoading]);

    return (
        <div>
            <TemplatesTable
                data={consolatedTemplateData}
                addTemplate={() => {
                    setSelectedTemplate(null);
                    setShowCreateTemplateModal(true);
                }}
                editTemplate={handleEditTemplateClick}
                deleteTemplate={handleDeleteTemplateClick}
            />
            {showCreateTemplateModal && (
                <TemplateModal
                    accountId={accountId}
                    siteId={siteId}
                    weeklySchedule={defaultSchedule}
                    handleClose={() => {
                        setShowCreateTemplateModal(false);
                        setSelectedTemplate(null);
                    }}
                    currentScheduleName={selectedTemplate?.schedule_name}
                    currentTimeZone={
                        apiTimeZoneOptions.find(
                            (option) =>
                                option.value ===
                                selectedTemplate?.schedule_time_zone_id.toString()
                        ) || null
                    }
                    templateId={selectedTemplate?.schedule_template_id}
                    apiTimeZoneOptions={apiTimeZoneOptions}
                    currentTimeBlocks={selectedTemplateTimeBlocks}
                />
            )}
            {showDeleteTemplateModal && (
                <ModalBase
                    title="Delete Template?"
                    handleClose={closeDeleteModal}
                >
                    <form
                        onSubmit={deleteTemplate}
                        className="DeleteAlertModal"
                    >
                        <p>
                            Are you sure you want to unlink the following
                            template: <br />
                            {selectedTemplate?.schedule_name}
                        </p>

                        <div>
                            <button className="btn danger" type="submit">
                                Delete
                            </button>
                            <button
                                className="btn neutral"
                                type="button"
                                onClick={closeDeleteModal}
                            >
                                Cancel
                            </button>
                        </div>
                        {loadingText && (
                            <LoadingModal modalText={loadingText} />
                        )}
                    </form>
                </ModalBase>
            )}
        </div>
    );
};

export default TemplatesDisplay;
