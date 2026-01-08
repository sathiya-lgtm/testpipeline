// React
import React, {
    Dispatch,
    FC,
    SetStateAction,
    useEffect,
    useState,
    useMemo,
    useContext,
} from 'react';

// Third party
import { format } from 'date-fns';

// Custom
import getMaxDate from '../../utils/getMaxDate';
import {
    TimePreset,
    convertDashboardDateFormat,
} from '../Outlets/Home/Dashboard/Dashboard.controller';

// Components
import ModalBase from '../ModalBase';
import Button from '../Button';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Types
import { SelectOption } from '../../types/interfaces';

// Styles
import '../../styles/components/Modals/DateRangeModal.scss';

interface IProps {
    customStartDate: string;
    customEndDate: string;
    setCustomStartDate: Dispatch<SetStateAction<string>>;
    setCustomEndDate: Dispatch<SetStateAction<string>>;
    setSelectedTimePreset: Dispatch<SetStateAction<SelectOption>>;
    handleClose: () => void;
}

const DateRangeModal: FC<IProps> = ({
    handleClose,
    customStartDate,
    customEndDate,
    setCustomStartDate,
    setCustomEndDate,
    setSelectedTimePreset,
}) => {
    const { activeUser } = useContext(AuthContext);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const minStartDate = useMemo(() => {
        if (activeUser?.properties.retention_days) {
            const today = new Date();
            const dataRetentionStartDate = new Date(today);
            dataRetentionStartDate.setDate(
                today.getDate() - (activeUser.properties.retention_days - 1)
            );

            return `${format(dataRetentionStartDate, 'yyyy-MM-dd')}`;
        }

        return undefined;
    }, [activeUser]);

    const handleApply = () => {
        if (
            new Date(customStartDate).getTime() >
            new Date(customEndDate).getTime()
        ) {
            setErrorMessage('Start Date cannot be later than End Date');
        }

        if (customStartDate && customEndDate) {
            setSelectedTimePreset({
                label: `${convertDashboardDateFormat(
                    customStartDate,
                    'MM/dd/yyyy'
                )} - ${convertDashboardDateFormat(
                    customEndDate,
                    'MM/dd/yyyy'
                )}`,
                value: TimePreset.Custom,
            });

            handleClose();
        } else {
            setErrorMessage('Must select both a Start Date and End Date.');
        }
    };

    useEffect(() => {
        setErrorMessage(null);
    }, [customStartDate, customEndDate]);

    return (
        <ModalBase
            title="Custom Date Range"
            handleClose={handleClose}
            className="sm"
        >
            <form className="DateRangeModal">
                {errorMessage && <p className="error">{errorMessage}</p>}
                {activeUser?.properties?.retention_days && (
                    <p className="text-secondary">
                        Retention Policy: {activeUser.properties.retention_days}{' '}
                        days
                    </p>
                )}
                <div className="field-container">
                    <label
                        htmlFor="custom-start-date"
                        className="field timeFilter"
                    >
                        <span
                            className="label tooltip bottom wide"
                            data-tooltip="Select starting date for date range of dashboard. Date range cannot exceed threshold defined within your data retention policy."
                        >
                            Custom Start Date:
                        </span>
                        <input
                            className="input date-input"
                            type="date"
                            id="custom-start-date"
                            name="custom-start-date"
                            min={minStartDate}
                            max={customEndDate || getMaxDate()}
                            value={customStartDate}
                            onChange={(e) => {
                                setCustomStartDate(e.target.value);
                            }}
                        />
                    </label>
                </div>
                <div className="field-container">
                    <label
                        htmlFor="custom-end-date"
                        className="field timeFilter"
                    >
                        <span
                            className="label tooltip top wide"
                            data-tooltip="Select ending date for date range of dashboard. Date range cannot exceed threshold defined within your data retention policy."
                        >
                            Custom End Date:
                        </span>
                        <input
                            className="input date-input"
                            type="date"
                            id="custom-end-date"
                            name="custom-end-date"
                            min={customStartDate || minStartDate}
                            max={getMaxDate()}
                            value={customEndDate}
                            onChange={(e) => {
                                setCustomEndDate(e.target.value);
                            }}
                        />
                    </label>
                </div>
                <div className="button-container">
                    <Button
                        id="confidence-apply-button"
                        type="button"
                        label="Apply"
                        className="btn primary"
                        onClick={() => handleApply()}
                    />
                    <Button
                        id="confidence-cancel-button"
                        type="button"
                        label="Cancel"
                        className="btn neutral"
                        onClick={() => handleClose()}
                    />
                </div>
            </form>
        </ModalBase>
    );
};

export default DateRangeModal;
