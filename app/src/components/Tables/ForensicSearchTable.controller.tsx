// Third party
import { toast } from 'react-toastify';
import {
    ColumnDef,
    createColumnHelper,
    Row,
    SortingFn,
    VisibilityState,
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

// Custom
import extractErrorMessage from '../../utils/extractErrorMessage';

// Custom types
import { INewForensicClip } from '../../types/tng-api.interfaces';

// Icons
import PersonIcon from '../../images/icons/EV_person.svg?react';
import VehicleIcon from '../../images/icons/EV_vehicle.svg?react';
import CheckIcon from '../../images/icons/sq_check.svg?react';
import XIcon from '../../images/icons/sq_X.svg?react';
import FlagIcon from '../../images/icons/flagged.svg?react';

export const isStandardRowInAuditMode = (
    classifications: string[],
    event_types: string[]
) => {
    const validClassifications = ['Person', 'Vehicle'];
    const validEventTypes = [
        'Intrusion',
        'Access',
        'Device Health',
        'Camera Actions',
        'Schedule',
    ];

    return (
        classifications.some((classification) =>
            validClassifications.includes(classification)
        ) ||
        event_types.some((eventType) => validEventTypes.includes(eventType))
    );
};

declare module '@tanstack/table-core' {
    interface SortingFns {
        timeSort: SortingFn<unknown>;
        markSort: SortingFn<unknown>;
        emailSort?: SortingFn<unknown> | undefined;
    }
}

/** Represents object type for reducer prompts
 * passed in as reducer's second argument for
 * useReducer hook.
 */
export type Action = {
    type: 'replace' | 'initialize';
    data: INewForensicClip[];
};

export interface ViewedClips {
    [key: string]: number;
}

/**
 * Constraints for columns that are either permanently hidden or
 * hidden only under certain conditions.
 */
export interface IColumnVisibility extends VisibilityState {
    mark: boolean;
    classified_person_motion_confidence: boolean;
    classified_max_conf_person: boolean;
    classified_max_conf_vehicle: boolean;
    classified_vehicle_motion_confidence: boolean;
}

export function assertIsDefined<T>(
    value: T,
    accessor: string
): asserts value is NonNullable<T> {
    if (value === undefined || value === null) {
        throw new Error(`${accessor} is not defined`);
    }
}

/**
 * Defines what columns should be hidden by default.
 */
export const defaultColumnVisibility: IColumnVisibility = {
    mark: false,
    classified_person_motion_confidence: false,
    classified_max_conf_person: false,
    classified_max_conf_vehicle: false,
    classified_vehicle_motion_confidence: false,
};

export const standardModeExpandedColumnVisibility: IColumnVisibility = {
    mark: false,
    classified_person_motion_confidence: true,
    classified_max_conf_person: true,
    classified_max_conf_vehicle: true,
    classified_vehicle_motion_confidence: true,
};

/** Define what columns should become visible in Audit Mode and which should
 * stay hidden.
 */
export const auditModeColumnVisibility: IColumnVisibility = {
    mark: true,
    classified_person_motion_confidence: true,
    classified_max_conf_person: true,
    classified_max_conf_vehicle: true,
    classified_vehicle_motion_confidence: true,
};

/** Compares two sibling rows and returns either 1, 0, or -1 based on the comparison.
 * This function should be used as a custom sort for React Table.
 * Expects column to be sorted in table to have valid string formatted dates as values.
 * Will convert date to local time before doing comparison, subsequently, local time should
 * be displayed on table or else sorting logic will appear flawed.
 */
export const timeSort = (
    rowA: Row<INewForensicClip>,
    rowB: Row<INewForensicClip>,
    columnId: string
): number => {
    // Uses "columnId" (e.g. 'time') to grab date/time, converts said date/time to local time, then grabs time "hh:mm:ss".
    const timeA = new Date(`${rowA.getValue(columnId) as string}Z`) // ! The Z at the end tells the Date object that the argument is UTC.
        .toString()
        .split(' ')[4];
    // ! The Z at the end tells the Date object that the argument is UTC.
    const timeB = new Date(`${rowB.getValue(columnId) as string}Z`)
        .toString()
        .split(' ')[4];

    return timeA.localeCompare(timeB);
};

const columnHelper = createColumnHelper<INewForensicClip>();

const highlightObjectConfidenceColumn = (
    objectConfReading: number,
    objectConfThreshold: number
) => {
    const objectFound = !!(
        objectConfReading &&
        objectConfThreshold &&
        objectConfReading >= objectConfThreshold
    );

    if (!objectFound) {
        return true;
    }

    return false;
};

const highlightObjectMotionColumn = (
    objectConfReading: number,
    objectConfThreshold: number,
    objectMotionReading: number,
    objectMotionThreshold: number
) => {
    const objectFound = !!(
        objectConfReading &&
        objectConfThreshold &&
        objectConfReading >= objectConfThreshold
    );

    const objectMoving = !!(objectMotionReading >= objectMotionThreshold);

    if (objectFound && !objectMoving) {
        return true;
    }

    return false;
};

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const columns: ColumnDef<INewForensicClip, any>[] = [
    columnHelper.accessor('classifications', {
        id: 'mark',
        header: '',
        cell: (info) => {
            const classifications = info.renderValue();
            const eventTypeArray = info.row.original.event_types;

            if (info.row.original.ai_classification_error_id !== 0) {
                // Prefixing the key with a letter to clearly determine sort order.
                return <FlagIcon className="flag icon" key="a-flag" />;
            }

            if (isStandardRowInAuditMode(classifications, eventTypeArray)) {
                return <CheckIcon className="check icon" key="c-check" />;
            }

            return <XIcon className="x icon" key="b-x" />;
        },
        enableSorting: false,
    }),
    columnHelper.accessor('account_name', {
        id: 'customer',
        header: 'Customer',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        sortDescFirst: true,
        enableSorting: false,
    }),
    columnHelper.accessor('site_name', {
        id: 'site',
        header: 'Site',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        sortDescFirst: true,
        enableSorting: false,
    }),
    columnHelper.accessor('camera_name', {
        id: 'camera',
        header: 'Camera',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        sortDescFirst: true,
        enableSorting: false,
    }),
    columnHelper.accessor('zone_ids', {
        id: 'zone_ids',
        header: 'Zone',
        cell: (info) => {
            const zoneInfo = info.renderValue();

            if (Array.isArray(zoneInfo)) {
                return zoneInfo.join(', ');
            }

            return zoneInfo;
        },
        enableMultiSort: true,
        sortDescFirst: true,
        enableSorting: false,
    }),
    columnHelper.accessor('event_dt', {
        id: 'event_dt',
        header: 'Date',
        cell: (info) => {
            try {
                const utcDate = parseISO(`${info.renderValue()}Z`);
                const formattedDate = format(utcDate, 'MM/dd/yyyy h:mm:ss a');

                return formattedDate;
            } catch (error) {
                const warning: string = `Failed to identify Date of all clips. Some clips will be missing a Date.`;

                console.warn(`${warning} ${extractErrorMessage(error)}`);
                toast.warn(warning, {
                    toastId: 'failed-date-identification-warning',
                    autoClose: false,
                });

                return null;
            }
        },
        sortingFn: 'datetime',
        enableSorting: false,
    }),
    columnHelper.accessor('classifications', {
        id: 'classifications',
        header: 'Object(s)',
        cell: (info) => {
            const classificationArray = info.renderValue();

            if (
                classificationArray.includes('Person') &&
                classificationArray.includes('Vehicle')
            ) {
                return (
                    <>
                        <PersonIcon className="person icon" />
                        <VehicleIcon className="vehicle icon" />
                    </>
                );
            }

            if (classificationArray.includes('Person')) {
                return <PersonIcon className="person icon" />;
            }

            if (classificationArray.includes('Vehicle')) {
                return <VehicleIcon className="vehicle icon" />;
            }

            return '-';
        },
        enableSorting: false,
    }),
    columnHelper.accessor('event_types', {
        id: 'event_types',
        header: 'Event Type',
        cell: (info) => {
            const eventTypeArray = info.renderValue();

            if (eventTypeArray.length === 0) {
                return '-';
            }

            if (eventTypeArray.length === 1) {
                return eventTypeArray[0];
            }

            return eventTypeArray.join(', ');
        },
        enableSorting: false,
    }),
    columnHelper.accessor('events', {
        id: 'events',
        header: 'Events',
        cell: (info) => {
            const eventsArray = info.renderValue();

            if (eventsArray.length === 0) {
                return '-';
            }

            if (eventsArray.length === 1) {
                return eventsArray[0];
            }

            return eventsArray.join(', ');
        },
        enableSorting: false,
    }),
    columnHelper.accessor('classified_max_conf_person', {
        id: 'classified_max_conf_person',
        header: 'Classification Confidence (Person)',
        cell: (info) => {
            const alertConfidence =
                info.row.original.classified_max_conf_person;
            const confidenceThreshold = info.row.original.min_conf_person;

            const highlightRed = highlightObjectConfidenceColumn(
                Number(alertConfidence),
                Number(confidenceThreshold)
            );

            return (
                <div className={`${highlightRed ? 'highlight-red' : ''}`}>
                    <span className="confidence">
                        {alertConfidence !== undefined
                            ? `${Math.floor(Number(alertConfidence) * 100)}%`
                            : 'N/A'}
                    </span>
                    <span>{` - `}</span>
                    <span className="threshold">
                        {' '}
                        {confidenceThreshold !== undefined
                            ? `${Math.floor(
                                  Number(confidenceThreshold) * 100
                              )}%`
                            : 'N/A'}
                    </span>
                </div>
            );
        },

        enableSorting: false,
    }),
    columnHelper.accessor('classified_person_motion_confidence', {
        id: 'classified_person_motion_confidence',
        header: 'Motion Confidence (Person)',
        cell: (info) => {
            const alertConfidence =
                info.row.original.classified_person_motion_confidence;
            const confidenceThreshold =
                info.row.original.person_motion_confidence;
            const personConfReading =
                info.row.original.classified_max_conf_person;
            const personConfThreshold = info.row.original.min_conf_person;

            const highlightRed = highlightObjectMotionColumn(
                Number(personConfReading),
                Number(personConfThreshold),
                Number(alertConfidence),
                Number(confidenceThreshold)
            );

            return (
                <div className={`${highlightRed ? 'highlight-red' : ''}`}>
                    <span className="confidence">
                        {alertConfidence !== undefined
                            ? `${alertConfidence.replace(/\..*$/, '')}%`
                            : 'N/A'}
                    </span>
                    <span>{` - `}</span>
                    <span className="threshold">
                        {' '}
                        {confidenceThreshold !== undefined
                            ? `${confidenceThreshold.replace(/\..*$/, '')}%`
                            : 'N/A'}
                    </span>
                </div>
            );
        },

        enableSorting: false,
    }),
    columnHelper.accessor('classified_max_conf_vehicle', {
        id: 'classified_max_conf_vehicle',
        header: 'Classification Confidence (Vehicle)',
        cell: (info) => {
            const alertConfidence =
                info.row.original.classified_max_conf_vehicle;
            const confidenceThreshold = info.row.original.min_conf_vehicle;

            const highlightRed = highlightObjectConfidenceColumn(
                Number(alertConfidence),
                Number(confidenceThreshold)
            );

            return (
                <div className={`${highlightRed ? 'highlight-red' : ''}`}>
                    <span className="confidence">
                        {alertConfidence !== undefined
                            ? `${Math.floor(Number(alertConfidence) * 100)}%`
                            : 'N/A'}
                    </span>
                    <span>{` - `}</span>
                    <span className="threshold">
                        {' '}
                        {confidenceThreshold !== undefined
                            ? `${Math.floor(
                                  Number(confidenceThreshold) * 100
                              )}%`
                            : 'N/A'}
                    </span>
                </div>
            );
        },

        enableSorting: false,
    }),
    columnHelper.accessor('classified_vehicle_motion_confidence', {
        id: 'classified_vehicle_motion_confidence',
        header: 'Motion Confidence (Vehicle)',
        cell: (info) => {
            const alertConfidence =
                info.row.original.classified_vehicle_motion_confidence;
            const confidenceThreshold =
                info.row.original.vehicle_motion_confidence;
            const vehicleConfReading =
                info.row.original.classified_max_conf_vehicle;
            const vehicleConfThreshold = info.row.original.min_conf_vehicle;

            const highlightRed = highlightObjectMotionColumn(
                Number(vehicleConfReading),
                Number(vehicleConfThreshold),
                Number(alertConfidence),
                Number(confidenceThreshold)
            );

            return (
                <div className={`${highlightRed ? 'highlight-red' : ''}`}>
                    <span className="confidence">
                        {alertConfidence !== undefined
                            ? `${alertConfidence.replace(/\..*$/, '')}%`
                            : 'N/A'}
                    </span>
                    <span>{` - `}</span>
                    <span className="threshold">
                        {' '}
                        {confidenceThreshold !== undefined
                            ? `${confidenceThreshold.replace(/\..*$/, '')}%`
                            : 'N/A'}
                    </span>
                </div>
            );
        },

        enableSorting: false,
    }),
];
