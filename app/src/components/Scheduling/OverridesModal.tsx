// React
import { FC, FormEvent, useContext, useState, useMemo } from 'react';

// Third Party
import Select, { SingleValue } from 'react-select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { addHours, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Api Calls
import { getScheduleReasonCodes } from '../../api_calls/ScheduleReasonCodes';
import {
    createScheduleOverride,
    updateScheduleOverride,
    IScheduleOverride,
} from '../../api_calls/ScheduleOverides';

// Components
import ModalBase from '../ModalBase';
import Input from '../Inputs/Input';
import ConfirmSetIndefinantOverrideModal from './ConfirmSetIndefinantOverrideModal';
import LoadingModal from '../Modals/LoadingModal';

// Controller
import {
    timeSelectCustomStyles,
    timeOptions,
} from './ScheduleModal.controller';
import {
    generateOverrideData,
    getNextEventDate,
} from './OverridesModal.controller';
import { ScheduleBlock } from './WeeklySchedule.controller';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Custom Types
import { SelectOption, IUser } from '../../types/interfaces';
import { IException } from '../../api_calls/ScheduleExceptions';

// Styles
import '../../styles/components/Scheduling/OverridesModal.scss';

const disarmPeriodOptions = [
    { label: 'Disarm for 1 hour', value: '1' },
    { label: 'Disarm for 2 hours', value: '2' },
    { label: 'Disarm for 4 hours', value: '4' },
    { label: 'Disarm for 8 hours', value: '8' },
    { label: 'Disarm for 12 hours', value: '12' },
    { label: 'Disarm until set time', value: 'setTime' },
    { label: 'Disarm until next schedule event', value: 'nextEvent' },
    { label: 'Disarm always', value: 'always' },
];

const armPeriodOptions = [
    { label: 'Arm for 1 hour', value: '1' },
    { label: 'Arm for 2 hours', value: '2' },
    { label: 'Arm for 4 hours', value: '4' },
    { label: 'Arm for 8 hours', value: '8' },
    { label: 'Arm for 12 hours', value: '12' },
    { label: 'Arm until set time', value: 'setTime' },
    { label: 'Arm until next schedule event', value: 'nextEvent' },
    { label: 'Arm always', value: 'always' },
];

interface IProps {
    handleClose: () => void;
    accountId: string;
    siteId: string;
    scheduleId: number;
    scheduleTimeZoneLabel: string;
    scheduleTimeZone: string;
    action: 'disarm' | 'arm';
    currentOverride: IScheduleOverride | null;
    weeklySchedule: ScheduleBlock[];
    exceptions: IException[];
    systemArmed: boolean;
}

const DisarmScheduleModal: FC<IProps> = ({
    handleClose,
    accountId,
    siteId,
    scheduleId,
    scheduleTimeZoneLabel,
    scheduleTimeZone,
    action,
    currentOverride,
    weeklySchedule,
    exceptions,
    systemArmed,
}) => {
    const queryClient = useQueryClient();
    const { activeUser } = useContext(AuthContext);

    const [selectedPeriod, setSelectedPeriod] = useState<
        SingleValue<SelectOption>
    >(action === 'disarm' ? disarmPeriodOptions[0] : armPeriodOptions[0]);
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState<SingleValue<SelectOption> | null>(
        null
    );
    const [customReasonCode, setCustomReasonCode] = useState('');
    const [selectedReasonCode, setSelectedReasonCode] =
        useState<SingleValue<SelectOption> | null>(null);
    const [showIndefinantOverrideModal, setShowIndefinantOverrideModal] =
        useState(false);

    const onSuccess = (successMessage: string) => {
        queryClient.invalidateQueries([
            'get-schedule-overrides',
            accountId,
            siteId,
            scheduleId,
        ]);
        queryClient.invalidateQueries(['get-site-status', accountId, siteId]);
        handleClose();
        toast.success(successMessage);
    };

    const createOverrideMutation = useMutation({
        mutationFn: createScheduleOverride,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to create template.');
        },
        onSuccess: () => onSuccess('Schedule override added.'),
    });

    const updateOverrideMutation = useMutation({
        mutationFn: updateScheduleOverride,
        onError: (error) => {
            console.log(error);
            toast.error('Unable to create template.');
        },
        onSuccess: () => onSuccess('Schedule override added.'),
    });

    const reasonCodesQuery = useQuery({
        queryFn: () =>
            getScheduleReasonCodes({
                user: activeUser as IUser,
                params: {
                    account_id: Number(accountId),
                },
            }),
        queryKey: ['get-schedule-reason-codes', accountId],
        onError: (error) => {
            console.error(error);
            toast.error('Unable to get schedule Exceptions.');
        },
        enabled: !!activeUser,
    });

    const reasonCodeOptions = useMemo(() => {
        const defaultReasonCode = [{ value: '0', label: 'Other' }];

        if (reasonCodesQuery.data) {
            const savedReasonCodeOptions = reasonCodesQuery.data.map(
                (reasonCodeData) => {
                    return {
                        label: reasonCodeData.description,
                        value: reasonCodeData.schedule_reason_code_id.toString(),
                    };
                }
            );

            return [...savedReasonCodeOptions, ...defaultReasonCode];
        }

        return defaultReasonCode;
    }, [reasonCodesQuery.data]);

    const handleAlwaysSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!selectedPeriod || !activeUser) {
            return;
        }

        setShowIndefinantOverrideModal(true);
    };

    const nextEventDateTime = useMemo(() => {
        if (selectedPeriod?.value === 'nextEvent') {
            const overrideStartDateTime = toZonedTime(
                new Date(),
                scheduleTimeZone
            );
            return getNextEventDate(
                action,
                overrideStartDateTime,
                weeklySchedule
            );
        }

        return null;
    }, [action, weeklySchedule, scheduleTimeZone, selectedPeriod]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!selectedPeriod || !activeUser) {
            return;
        }

        const overrideStartDateTime = toZonedTime(new Date(), scheduleTimeZone);
        let overrideEndDateTime: Date | null = overrideStartDateTime;

        if (['1', '2', '4', '8', '12'].includes(selectedPeriod.value)) {
            overrideEndDateTime = addHours(
                overrideStartDateTime,
                Number(selectedPeriod.value)
            );
        } else if (selectedPeriod.value === 'always') {
            overrideEndDateTime = null;
        } else if (selectedPeriod.value === 'setTime' && endTime?.value) {
            overrideEndDateTime = toZonedTime(
                new Date(`${endDate} ${endTime.value}`),
                scheduleTimeZone
            );

            if (overrideEndDateTime <= overrideStartDateTime) {
                toast.error('End time must be later than now.');
                return;
            }
        } else if (selectedPeriod.value === 'nextEvent') {
            overrideEndDateTime = getNextEventDate(
                action,
                overrideStartDateTime,
                weeklySchedule
            );
        }

        const overrideData = generateOverrideData({
            scheduleId,
            action,
            selectedReasonCode: selectedReasonCode || reasonCodeOptions[0],
            overrideReason: customReasonCode,
            startDate: overrideStartDateTime,
            endDate: overrideEndDateTime,
        });

        if (!currentOverride) {
            createOverrideMutation.mutate({
                user: activeUser,
                params: overrideData,
            });
        } else {
            updateOverrideMutation.mutate({
                user: activeUser,
                params: {
                    schedule_site_override_id:
                        currentOverride.schedule_site_override_id,
                    ...overrideData,
                },
            });
        }
    };

    const timePeriodOptions = useMemo(() => {
        let exceptionActive = false;

        exceptions.forEach((exception) => {
            const exceptionStartDate = toZonedTime(
                new Date(exception.start_dt),
                scheduleTimeZone
            );
            const exceptionEndDate = toZonedTime(
                new Date(exception.end_dt),
                scheduleTimeZone
            );
            const currentTime = toZonedTime(
                new Date(Date.now()),
                scheduleTimeZone
            );

            if (
                exceptionStartDate <= currentTime &&
                exceptionEndDate >= currentTime
            ) {
                exceptionActive = true;
            }
        });

        if (action === 'arm') {
            if (systemArmed || exceptionActive) {
                return armPeriodOptions.filter((option) => {
                    return option.value !== 'nextEvent';
                });
            }

            return armPeriodOptions;
        }

        if (!systemArmed || exceptionActive) {
            return disarmPeriodOptions.filter((option) => {
                return option.value !== 'nextEvent';
            });
        }

        return disarmPeriodOptions;
    }, [action, systemArmed]);

    return (
        <ModalBase
            className="DisarmScheduleModalBase"
            title={
                action === 'disarm'
                    ? 'Manual Override (Disarm)'
                    : 'Manual Override (Arm)'
            }
            handleClose={handleClose}
        >
            <>
                <form
                    id="schedule-form"
                    key="schedule-form"
                    onSubmit={
                        selectedPeriod?.value === 'always'
                            ? handleAlwaysSubmit
                            : handleSubmit
                    }
                    className="DisarmScheduleModal modal-content"
                >
                    <div className="disarmPeriodSelectContainer">
                        <Select
                            id="disarm-period-select"
                            isMulti={false}
                            isClearable={false}
                            styles={timeSelectCustomStyles}
                            value={selectedPeriod}
                            options={timePeriodOptions}
                            onChange={(newValue) => {
                                setSelectedPeriod(newValue);
                            }}
                        />

                        {nextEventDateTime && action === 'disarm' && (
                            <p>
                                System will be disarmed until{' '}
                                {format(
                                    toZonedTime(
                                        nextEventDateTime,
                                        scheduleTimeZone
                                    ),
                                    'MM/dd/yyyy h:mm a'
                                )}{' '}
                                ({scheduleTimeZoneLabel})
                            </p>
                        )}

                        {nextEventDateTime && action === 'arm' && (
                            <p>
                                System will be armed until{' '}
                                {format(
                                    toZonedTime(
                                        nextEventDateTime,
                                        scheduleTimeZone
                                    ),
                                    'MM/dd/yyyy h:mm a'
                                )}{' '}
                                ({scheduleTimeZoneLabel})
                            </p>
                        )}
                    </div>

                    {selectedPeriod?.value === 'setTime' && (
                        <div className="disarmDateTimeContainer">
                            <div>
                                <Input
                                    id="exception-end-date-input"
                                    name="exception-end-date-input"
                                    label="End Date"
                                    className="input"
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
                                        options={timeOptions}
                                        onChange={(newValue) => {
                                            setEndTime(newValue);
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {action === 'disarm' && (
                        <div className="reasonCodeContainer">
                            <span>
                                Reason Code <span className="asterisk">*</span>
                            </span>
                            <div className="selectWrapper">
                                <Select
                                    id="reason-code-select"
                                    isMulti={false}
                                    className="select"
                                    isClearable={false}
                                    styles={timeSelectCustomStyles}
                                    value={selectedReasonCode}
                                    options={reasonCodeOptions}
                                    onChange={(newValue) => {
                                        setSelectedReasonCode(newValue);
                                    }}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {action === 'disarm' &&
                        selectedReasonCode?.label === 'Other' && (
                            <div>
                                <Input
                                    id="custom-reason-code-input"
                                    name="custom-reason-code-input"
                                    label="Disarm Reason"
                                    className="input"
                                    type="text"
                                    value={customReasonCode}
                                    onChange={setCustomReasonCode}
                                    required
                                />
                            </div>
                        )}

                    <div className="actionsContainer">
                        <button className="btn primary" type="submit">
                            {action === 'disarm' ? 'Disarm Site' : 'Arm Site'}
                        </button>
                        <button
                            className="btn danger"
                            type="button"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>
                    {(createOverrideMutation.isLoading ||
                        updateOverrideMutation.isLoading) && (
                        <LoadingModal modalText="Adding override..." />
                    )}
                </form>
                {showIndefinantOverrideModal && (
                    <ConfirmSetIndefinantOverrideModal
                        handleClose={() =>
                            setShowIndefinantOverrideModal(false)
                        }
                        onConfirm={handleSubmit}
                        action={action}
                    />
                )}
            </>
        </ModalBase>
    );
};

export default DisarmScheduleModal;
