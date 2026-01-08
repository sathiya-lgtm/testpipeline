// React
import { FC, FormEvent, useState, useContext, useMemo } from 'react';

// Third Party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Select, { SingleValue } from 'react-select';
import { toast } from 'react-toastify';

// Api Calls
import {
    createScheduleExcpetion,
    updateScheduleExcpetion,
    IException,
} from '../../api_calls/ScheduleExceptions';

// Components
import ModalBase from '../ModalBase';
import Input from '../Inputs/Input';
import LoadingModal from '../Modals/LoadingModal';

// Controller
import {
    timeSelectCustomStyles,
    timeOptions,
    timeOptionsWithEndOfDay,
} from './ScheduleModal.controller';
import {
    exceptionStateOptions,
    extractExceptionName,
    extractExceptionArmedStatus,
    extractExceptionStartDate,
    extractExceptionStartTime,
    extractExceptionEndDate,
    extractExceptionEndTime,
    isValidException,
} from './ScheduleExceptionsModal.controller';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Custom Types
import { SelectOption } from '../../types/interfaces';

// Styles
import '../../styles/components/Scheduling/ScheduleExceptionsModal.scss';

interface IProps {
    handleClose: () => void;
    scheduleId: number;
    accountId: string;
    siteId: string;
    selectedException: IException | null;
    scheduleTimeZone: string;
}

const ScheduleExceptionsModal: FC<IProps> = ({
    handleClose,
    scheduleId,
    accountId,
    siteId,
    selectedException,
    scheduleTimeZone,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const [name, setName] = useState(extractExceptionName(selectedException));
    const [state, setState] = useState<SingleValue<SelectOption>>(
        extractExceptionArmedStatus(selectedException)
    );
    const [startDate, setStartDate] = useState(
        extractExceptionStartDate(selectedException)
    );
    const [startTime, setStartTime] =
        useState<SingleValue<SelectOption> | null>(
            extractExceptionStartTime(selectedException)
        );
    const [endDate, setEndDate] = useState(
        extractExceptionEndDate(selectedException)
    );
    const [endTime, setEndTime] = useState<SingleValue<SelectOption> | null>(
        extractExceptionEndTime(selectedException)
    );

    const onSuccess = () => {
        queryClient.invalidateQueries([
            'get-schedule-exceptions',
            accountId,
            siteId,
            scheduleId,
        ]);
        queryClient.invalidateQueries(['get-site-status', accountId, siteId]);
        handleClose();
    };

    const createScheduleExceptionMutation = useMutation({
        mutationFn: createScheduleExcpetion,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to create schedule.');
        },
        onSuccess,
    });

    const updateScheduleExceptionMutation = useMutation({
        mutationFn: updateScheduleExcpetion,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to update schedule exception.');
        },
        onSuccess,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser) {
            return;
        }

        if (!state || !startTime || !endTime) {
            toast.error('Missing exception information.');
            return;
        }

        const errorMessage = isValidException(
            startDate,
            startTime.value,
            endDate,
            endTime.value,
            scheduleTimeZone
        );

        if (errorMessage) {
            toast.error(errorMessage);
            return;
        }

        const newException = {
            schedule_site_id: scheduleId,
            description: name,
            start_dt: `${startDate} ${startTime.value}`,
            end_dt: `${endDate} ${endTime.value}`,
            is_armed: state.value === 'armed',
        };

        if (selectedException) {
            updateScheduleExceptionMutation.mutate({
                user: activeUser,
                params: {
                    ...newException,
                    schedule_site_exception_id:
                        selectedException.schedule_site_exception_id,
                },
            });
        } else {
            createScheduleExceptionMutation.mutate({
                user: activeUser,
                params: newException,
            });
        }
    };

    const loadingText = useMemo(() => {
        if (createScheduleExceptionMutation.isLoading) {
            return 'Creating new exception...';
        }

        if (updateScheduleExceptionMutation.isLoading) {
            return 'Updating exception...';
        }

        return '';
    }, [
        createScheduleExceptionMutation.isLoading,
        updateScheduleExceptionMutation.isLoading,
    ]);

    return (
        <ModalBase title="Add Schedule Exception" handleClose={handleClose}>
            <form
                id="schedule-form"
                key="schedule-form"
                onSubmit={handleSubmit}
                className="ScheduleExceptionsModal modal-content"
            >
                <div className="exceptionNameAndStateContainer">
                    <Input
                        id="exception-name-input"
                        name="exception-name-input"
                        label="Exception Name"
                        className="input field"
                        type="text"
                        value={name}
                        onChange={setName}
                        required
                    />

                    <div>
                        <span>
                            Status <span className="asterisk">*</span>
                        </span>
                        <div className="selectWrapper">
                            <Select
                                id="exception-state-select"
                                isMulti={false}
                                isClearable={false}
                                styles={timeSelectCustomStyles}
                                value={state}
                                options={exceptionStateOptions}
                                onChange={(newValue) => {
                                    setState(newValue);
                                }}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="exceptionInfoContainer">
                    <div>
                        <Input
                            id="exception-start-date-input"
                            name="exception-start-date-input"
                            label="Start Date"
                            className="input field"
                            type="date"
                            value={startDate}
                            onChange={setStartDate}
                            required
                        />
                    </div>

                    <div>
                        <span>
                            Start Time <span className="asterisk">*</span>
                        </span>
                        <div className="selectWrapper">
                            <Select
                                id="start-time-select"
                                isMulti={false}
                                className="select"
                                isClearable={false}
                                styles={timeSelectCustomStyles}
                                value={startTime}
                                options={timeOptions}
                                onChange={(newValue) => {
                                    setStartTime(newValue);
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Input
                            id="exception-end-date-input"
                            name="exception-end-date-input"
                            label="End Date"
                            className="input field"
                            type="date"
                            value={endDate}
                            onChange={setEndDate}
                            required
                        />
                    </div>

                    <div>
                        <span>
                            End Time <span className="asterisk">*</span>
                        </span>
                        <div className="selectWrapper">
                            <Select
                                id="end-time-select"
                                isMulti={false}
                                className="select"
                                isClearable={false}
                                styles={timeSelectCustomStyles}
                                value={endTime}
                                options={timeOptionsWithEndOfDay}
                                onChange={(newValue) => {
                                    setEndTime(newValue);
                                }}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="actionsContainer">
                    <button className="btn primary" type="submit">
                        {selectedException
                            ? 'Update Exception'
                            : 'Create Exception'}
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

export default ScheduleExceptionsModal;
