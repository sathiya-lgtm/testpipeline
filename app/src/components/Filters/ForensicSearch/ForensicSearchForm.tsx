// React
import { FC, Dispatch, SetStateAction, useMemo, useContext } from 'react';

// Third party
import { toast } from 'react-toastify';
import { SingleValue, MultiValue } from 'react-select';

// Components
import SingleSelect from '../../Inputs/Select';
import MultiSelect from '../../Inputs/MultiSelect';

// Controller
import {
    validateDates,
    generateDefaultFilterEndDate,
    classificationOptions,
    eventTypeOptions,
    videoAIEventOptions,
    accessEventOptions,
    intrusionEventOptions,
    deviceHealthOptions,
    cameraActionsOptions,
    scheduleOptions,
} from './ForensicSearchFilter.controller';

// Utils
import extractErrorMessage from '../../../utils/extractErrorMessage';
import getAccountType from '../../../utils/getAccountType';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';

// Types
import { SelectOption } from '../../../types/interfaces';
import { AccountType } from '../../../types/enums';

interface IProps {
    filterStart: string;
    setFilterStart: Dispatch<SetStateAction<string>>;
    filterEnd: string;
    setFilterEnd: Dispatch<SetStateAction<string>>;
    minStartDate: string | undefined;
    handleClipSearch: () => Promise<void>;
    clearSearch: () => void;
    fetchingCameras: boolean;
    cameraOptions: SelectOption[];
    selectedCameras: SelectOption | null;
    handleCameraSelect: (selectOption: SingleValue<SelectOption>) => void;
    fetchingSites: boolean;
    siteOptions: SelectOption[];
    selectedSites: SelectOption | null;
    handleSiteSelect: (selectOption: SingleValue<SelectOption>) => void;
    fetchingCustomers: boolean;
    customerOptions: SelectOption[];
    selectedCustomers: SelectOption | null;
    handleCustomerSelect: (selectOption: SingleValue<SelectOption>) => void;
    selectedClassifications: MultiValue<SelectOption> | null;
    setSelectedClassifications: Dispatch<
        SetStateAction<MultiValue<SelectOption> | null>
    >;
    selectedEventTypes: MultiValue<SelectOption> | null;
    setSelectedEventTypes: Dispatch<
        SetStateAction<MultiValue<SelectOption> | null>
    >;
    selectedEvents: MultiValue<SelectOption> | null;
    setSelectedEvents: Dispatch<
        SetStateAction<MultiValue<SelectOption> | null>
    >;
}

const ForensicSearchForm: FC<IProps> = ({
    filterStart,
    setFilterStart,
    filterEnd,
    setFilterEnd,
    minStartDate,
    handleClipSearch,
    clearSearch,
    fetchingCameras,
    cameraOptions,
    selectedCameras,
    handleCameraSelect,
    fetchingSites,
    siteOptions,
    selectedSites,
    handleSiteSelect,
    fetchingCustomers,
    customerOptions,
    selectedCustomers,
    handleCustomerSelect,
    selectedClassifications,
    setSelectedClassifications,
    selectedEventTypes,
    setSelectedEventTypes,
    selectedEvents,
    setSelectedEvents,
}) => {
    const { activeUser } = useContext(AuthContext);

    const accountType: AccountType = useMemo(
        () => getAccountType(activeUser),
        [activeUser]
    );

    /** Default Customer option if active user is Customer and necessary data is available. */
    const defaultCustomer = useMemo(() => {
        if (
            accountType === AccountType.Customer &&
            activeUser?.account_name &&
            activeUser?.client_account
        )
            return {
                label: activeUser.account_name,
                value: String(activeUser.client_account),
            };
        return null;
    }, [activeUser]);

    const eventTypesOptions = useMemo(() => {
        const result: SelectOption[] = [];

        if (selectedEventTypes) {
            if (
                selectedEventTypes.some((item) => item.value === 'AI Behavior')
            ) {
                result.push(...videoAIEventOptions);
            }

            if (selectedEventTypes.some((item) => item.value === 'Access')) {
                result.push(...accessEventOptions);
            }

            if (selectedEventTypes.some((item) => item.value === 'Intrusion')) {
                result.push(...intrusionEventOptions);
            }

            if (
                selectedEventTypes.some(
                    (item) => item.value === 'Device Health'
                )
            ) {
                result.push(...deviceHealthOptions);
            }

            if (
                selectedEventTypes.some(
                    (item) => item.value === 'Camera Actions'
                )
            ) {
                result.push(...cameraActionsOptions);
            }

            if (selectedEventTypes.some((item) => item.value === 'Schedule')) {
                result.push(...scheduleOptions);
            }
        }

        return result;
    }, [selectedClassifications, selectedEventTypes]);

    return (
        <form
            className="forensic-search-form"
            onSubmit={(e) => {
                e.preventDefault();
                try {
                    validateDates(filterStart, filterEnd);
                } catch (error) {
                    toast.warn(extractErrorMessage(error));

                    return;
                }

                handleClipSearch();
            }}
        >
            <div className="fields-container">
                <div className="field-group">
                    <div className="field-pair">
                        <label
                            htmlFor="filter-start"
                            className="field timeFilter"
                        >
                            <span className="filter-start label">Start</span>
                            <span className="asterisk">*</span>
                            <input
                                className="input"
                                type="datetime-local"
                                id="filter-start"
                                name="filter-start"
                                min={minStartDate}
                                max={generateDefaultFilterEndDate()}
                                value={filterStart}
                                onChange={(e) => {
                                    setFilterStart(e.target.value);
                                }}
                            />
                        </label>
                        <label
                            htmlFor="filter-end"
                            className="field timeFilter"
                        >
                            <span className="label">End</span>
                            <span className="asterisk">*</span>
                            <input
                                className="input"
                                type="datetime-local"
                                id="filter-end"
                                name="filter-end"
                                min={filterStart || minStartDate}
                                max={generateDefaultFilterEndDate()}
                                value={filterEnd}
                                required
                                onChange={(e) => {
                                    setFilterEnd(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                    <div className="field-pair">
                        <div
                            className={`field ${
                                defaultCustomer !== null ? 'defaulted' : ''
                            } ${fetchingCustomers ? 'fetching' : ''}`}
                        >
                            <span className="label">Customer</span>

                            <SingleSelect
                                id="customer-select"
                                value={selectedCustomers}
                                onChange={handleCustomerSelect}
                                placeholder={fetchingCameras ? '' : undefined}
                                options={customerOptions}
                                disabled={defaultCustomer !== null}
                            />
                        </div>
                        <div
                            className={`field 
                        ${fetchingSites ? 'fetching' : ''}`}
                        >
                            <span className="label">Site</span>
                            <SingleSelect
                                id="site-select"
                                value={selectedSites}
                                onChange={handleSiteSelect}
                                placeholder={fetchingSites ? '' : undefined}
                                options={siteOptions}
                                noOptionsMessage="A Customer with registered sites must be selected first."
                            />
                        </div>
                    </div>
                </div>
                <div className="field-group">
                    <div className="field-pair">
                        <div
                            className={`field ${
                                fetchingCameras ? 'fetching' : ''
                            }`}
                        >
                            <span className="label">Device</span>
                            <SingleSelect
                                id="camera-select"
                                value={selectedCameras}
                                onChange={handleCameraSelect}
                                placeholder={fetchingCameras ? '' : undefined}
                                options={cameraOptions}
                                noOptionsMessage="A Site with registered cameras must be selected first."
                            />
                        </div>
                        <div className="field">
                            <span className="label">Object(s)</span>
                            <MultiSelect
                                id="object-select"
                                value={selectedClassifications}
                                onChange={(classifications) => {
                                    if (classifications.length === 0)
                                        setSelectedClassifications(null);
                                    else
                                        setSelectedClassifications(
                                            classifications
                                        );
                                }}
                                options={classificationOptions}
                            />
                        </div>
                    </div>

                    <div className="field-group">
                        <div className="field-pair">
                            <div className="field">
                                <span className="label">Event Type(s)</span>
                                <MultiSelect
                                    id="object-select"
                                    value={selectedEventTypes}
                                    onChange={(eventTypes) => {
                                        setSelectedEvents(null);

                                        if (eventTypes.length === 0)
                                            setSelectedEventTypes(null);
                                        else setSelectedEventTypes(eventTypes);
                                    }}
                                    options={eventTypeOptions}
                                />
                            </div>
                            {selectedEventTypes && (
                                <div className="field">
                                    <span className="label">Events</span>
                                    <MultiSelect
                                        id="analytic-events-select"
                                        value={selectedEvents}
                                        onChange={(events) => {
                                            if (events.length === 0)
                                                setSelectedEvents(null);
                                            else setSelectedEvents(events);
                                        }}
                                        options={eventTypesOptions}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="filter-button-container">
                <button
                    id="forensic-search-filter-button"
                    className="btn primary"
                    type="submit"
                >
                    Filter
                </button>
                <button
                    id="forensic-search-clear-button"
                    className="btn danger"
                    type="button"
                    onClick={clearSearch}
                >
                    Clear
                </button>
            </div>
        </form>
    );
};

export default ForensicSearchForm;
