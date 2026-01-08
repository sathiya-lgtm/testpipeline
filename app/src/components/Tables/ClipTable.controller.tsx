// Third party
import { toast } from 'react-toastify';
import {
    ColumnDef,
    createColumnHelper,
    Row,
    SortingFn,
    VisibilityState,
} from '@tanstack/react-table';

// Custom
import formatApiDateToLocalDate from '../../utils/formatApiDateToLocalDate';
import formatApiTimeToLocalTime from '../../utils/formatApiTimeToLocalTime';
import extractErrorMessage from '../../utils/extractErrorMessage';

// Custom types
import { IClip } from '../../types/tng-api.interfaces';

// Icons
import PersonIcon from '../../images/icons/EV_person.svg?react';
import VehicleIcon from '../../images/icons/EV_vehicle.svg?react';
import CheckIcon from '../../images/icons/sq_check.svg?react';
import XIcon from '../../images/icons/sq_X.svg?react';
import FlagIcon from '../../images/icons/flagged.svg?react';
import { convertTrackingSensitivityTextToNumber } from '../Outlets/Home/Camera/Camera.controller';

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
    data: IClip[];
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
    'person-motion-confidence': boolean;
    'person-confidence': boolean;
    'vehicle-motion-confidence': boolean;
    'vehicle-confidence': boolean;
    /** Permanently hidden. */
    'annotated-video-path': false;
    /** Permanently hidden. */
    'original-video-path': false;
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
    'person-motion-confidence': false,
    'person-confidence': false,
    'vehicle-motion-confidence': false,
    'vehicle-confidence': false,
    'annotated-video-path': false,
    'original-video-path': false,
    'motion-confidence': false,
};

export const standardModeExpandedColumnVisibility: IColumnVisibility = {
    mark: false,
    'person-motion-confidence': true,
    'person-confidence': true,
    'vehicle-motion-confidence': true,
    'vehicle-confidence': true,
    'annotated-video-path': false,
    'original-video-path': false,
    'motion-confidence': true,
};

/** Define what columns should become visible in Audit Mode and which should
 * stay hidden.
 */
export const auditModeColumnVisibility: IColumnVisibility = {
    mark: true,
    'person-motion-confidence': true,
    'person-confidence': true,
    'vehicle-motion-confidence': true,
    'vehicle-confidence': true,
    'annotated-video-path': false,
    'original-video-path': false,
    'motion-confidence': true,
};

/**
 * Deterimes which column should be highlighted red when viewing the clips table in audit mode
 */
interface IAIValues {
    personConfReading: number;
    personConfThreshold: number | undefined;
    personMotionReading: number | undefined;
    personMotionThreshold: number;
    vehicleConfReading: number;
    vehicleConfThreshold: number | undefined;
    vehicleMotionReading: number;
    vehicleMotionThreshold: number;
}

const getVehicleAndPersonAIValues = (row: IClip): IAIValues => {
    const {
        person_motion_confidence,
        min_confidence,
        vehicle_motion_confidence,
    } = row.payload;

    const personConfReading = row.results.alarm_info.max_conf_person;
    const personConfThreshold = min_confidence?.person;
    const personMotionReading = row.results.alarm_info.person_motion_confidence;
    const personMotionThreshold =
        typeof person_motion_confidence === 'number'
            ? person_motion_confidence
            : 30;
    const vehicleConfReading = row.results.alarm_info.max_conf_vehicle;
    const vehicleConfThreshold = min_confidence?.vehicle;
    let vehicleMotionReading = row.results.alarm_info.vehicle_motion_confidence;
    let vehicleMotionThreshold = vehicle_motion_confidence;

    if (typeof vehicleMotionReading !== 'number') {
        vehicleMotionReading =
            convertTrackingSensitivityTextToNumber(vehicleMotionReading);
    }

    if (typeof vehicleMotionThreshold !== 'number') {
        vehicleMotionThreshold = convertTrackingSensitivityTextToNumber(
            vehicleMotionThreshold
        );
    }

    return {
        personConfReading,
        personConfThreshold,
        personMotionReading,
        personMotionThreshold,
        vehicleConfReading,
        vehicleConfThreshold,
        vehicleMotionReading,
        vehicleMotionThreshold,
    };
};

const highlightColumnRed = (
    aiValues: IAIValues,
    column: 'personConf' | 'personMotion' | 'vehicleConf' | 'vehicleMotion'
) => {
    const {
        personConfReading,
        personConfThreshold,
        personMotionReading,
        personMotionThreshold,
        vehicleConfReading,
        vehicleConfThreshold,
        vehicleMotionReading,
        vehicleMotionThreshold,
    } = aiValues;

    const personFound = !!(
        personConfThreshold && personConfReading >= personConfThreshold
    );

    const vehicleFound = !!(
        vehicleConfReading &&
        vehicleConfThreshold &&
        vehicleConfReading >= vehicleConfThreshold
    );

    const personMoving = !!(
        personMotionReading && personMotionReading >= personMotionThreshold
    );
    const vehicleMoving = !!(vehicleMotionReading >= vehicleMotionThreshold);

    if (column === 'vehicleConf') {
        if (!vehicleFound) {
            return true;
        }

        return false;
    }

    if (column === 'vehicleMotion') {
        if (vehicleFound && !vehicleMoving) {
            return true;
        }

        return false;
    }

    if (column === 'personConf') {
        if (!personFound) {
            return true;
        }

        return false;
    }

    if (column === 'personMotion') {
        if (personFound && !personMoving) {
            return true;
        }

        return false;
    }

    return false;
};

/** Compares two sibling rows and returns either 1, 0, or -1 based on the comparison.
 * This function should be used as a custom sort for React Table.
 * Expects column to be sorted in table to have valid string formatted dates as values.
 * Will convert date to local time before doing comparison, subsequently, local time should
 * be displayed on table or else sorting logic will appear flawed.
 */
export const timeSort = (
    rowA: Row<IClip>,
    rowB: Row<IClip>,
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

/** Compares the key of two sibling rows and returns either 1, 0, or -1 based on the comparison.
 * This function should be used as a custom sort for React Table. Intended for sorting the 'mark'
 * column of ClipsTable.
 */
export const markSort = (
    rowA: Row<IClip>,
    rowB: Row<IClip>,
    columnId: string
): number => {
    const markA = (rowA.getValue(columnId) as any).key;
    const markB = (rowB.getValue(columnId) as any).key;

    return markA.localeCompare(markB);
};

const columnHelper = createColumnHelper<IClip>();

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const columns: ColumnDef<IClip, any>[] = [
    columnHelper.accessor(
        (row: IClip) => {
            try {
                const { alarm_info } = row.results;
                if (alarm_info) {
                    const hasPerson: boolean = alarm_info.person;
                    const hasVehicle: boolean = alarm_info.vehicle;

                    assertIsDefined(hasPerson, 'row.results.alarm_info.person');
                    assertIsDefined(hasVehicle, 'row.results.alarm_info.cars');

                    if (row.ai_error_event) {
                        // Prefixing the key with a letter to clearly determine sort order.
                        return <FlagIcon className="flag icon" key="a-flag" />;
                    }

                    if (hasPerson || hasVehicle) {
                        // Prefixing the key with a letter to clearly determine sort order.
                        return (
                            <CheckIcon className="check icon" key="c-check" />
                        );
                    }
                }
            } catch (error) {
                const warning: string = `Failed to identify classification for clip(s). Clips may not display accurate classification information.`;

                console.warn(`${warning} ${extractErrorMessage(error)}`);
                toast.warn(warning, {
                    toastId: 'failed-classification-warning',
                    autoClose: false,
                });

                // Prefixing the key with a letter to clearly determine sort order.
                return <XIcon className="x icon" key="b-x" />;
            }

            // Prefixing the key with a letter to clearly determine sort order.
            return <XIcon className="x icon" key="b-x" />;
        },
        {
            id: 'mark',
            header: () => null,
            cell: (info) => info.renderValue(),
            sortingFn: 'markSort',
            sortDescFirst: true,
        }
    ),
    columnHelper.accessor('account_name', {
        id: 'customer',
        header: () => 'Customer',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        sortDescFirst: true,
    }),
    columnHelper.accessor('site_name', {
        id: 'site',
        header: () => 'Site',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        sortDescFirst: true,
    }),
    columnHelper.accessor('camera_name', {
        id: 'camera',
        header: () => 'Camera',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        sortDescFirst: true,
    }),
    columnHelper.accessor('created_at', {
        id: 'date',
        header: () => 'Date',
        cell: (info) => {
            try {
                const formattedDate: string = formatApiDateToLocalDate(
                    info.renderValue() as string
                );

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
        sortDescFirst: true,
    }),
    columnHelper.accessor('created_at', {
        id: 'time',
        header: () => 'Time',
        cell: (info) => {
            try {
                const formattedTime: string = formatApiTimeToLocalTime(
                    info.renderValue() as string
                );

                return formattedTime;
            } catch (error) {
                const warning: string = `Failed to identify Time for all clips. Some clips will be missing a Time.`;

                console.warn(`${warning} ${extractErrorMessage(error)}`);
                toast.warn(warning, {
                    toastId: 'failed-time-identification-warning',
                    autoClose: false,
                });

                return null;
            }
        },
        sortingFn: timeSort,
        sortDescFirst: true,
    }),
    columnHelper.accessor(
        (row: IClip) => {
            try {
                const { alarm_info } = row.results;
                if (alarm_info) {
                    const hasPerson: boolean = alarm_info.person ?? false;
                    const hasVehicle: boolean = alarm_info.vehicle ?? false;
                    if (hasPerson || hasVehicle) {
                        return (
                            <span className="objects-icon-container">
                                {hasPerson === true ? (
                                    <PersonIcon className="person icon" />
                                ) : null}{' '}
                                {hasVehicle === true ? (
                                    <VehicleIcon className="vehicle icon" />
                                ) : null}
                            </span>
                        );
                    }
                }

                return null;
            } catch (error) {
                const errorMessage: string = `Failed to process column "objects":  ${extractErrorMessage(
                    error
                )}`;

                // Don't toast / notify user of this error because it's likely to have been caught for the 'mark' column above,
                // considering they are trying to access the same data.
                console.error(errorMessage);

                return null;
            }
        },
        {
            id: 'objects',
            header: () => 'Objects',
            cell: (info) => info.renderValue(),
            enableSorting: false,
        }
    ),
    columnHelper.accessor('analytic_events', {
        id: 'analytic-events',
        header: () => 'Analytic Events',
        cell: (info) => {
            if (info.renderValue()) {
                return info.renderValue();
            }

            return '-';
        },
        enableMultiSort: true,
        sortDescFirst: true,
    }),
    // We don't seem to be using this so commenting out for now
    // columnHelper.accessor(() => {}, {
    //     id: 'type',
    //     header: () => 'Type',
    //     cell: () => null,
    //     enableSorting: true,
    // }),
    columnHelper.accessor(() => {}, {
        id: 'attributes',
        header: () => 'Attributes',
        cell: () => null,
        enableSorting: true,
    }),
    columnHelper.accessor(
        (row: IClip) => {
            const aiValues = getVehicleAndPersonAIValues(row);
            const highlightRed = highlightColumnRed(aiValues, 'personConf');
            const { personConfReading, personConfThreshold } = aiValues;

            return (
                <div className={`${highlightRed ? 'highlight-red' : ''}`}>
                    <span className="confidence">
                        {personConfReading !== undefined
                            ? `${Math.floor(personConfReading * 100)}%`
                            : 'N/A'}
                    </span>
                    <span>{` - `}</span>
                    <span className="threshold">
                        {' '}
                        {personConfThreshold !== undefined
                            ? `${Math.floor(personConfThreshold * 100)}%`
                            : 'N/A'}
                    </span>
                </div>
            );
        },
        {
            id: 'person-confidence',
            header: () => 'Classification Confidence (Person)',
            cell: (info) => info.renderValue(),
            enableSorting: false,
        }
    ),
    columnHelper.accessor(
        (row: IClip) => {
            const aiValues = getVehicleAndPersonAIValues(row);
            const highlightRed = highlightColumnRed(aiValues, 'personMotion');
            const { personMotionReading, personMotionThreshold } = aiValues;

            return (
                <div className={`${highlightRed ? 'highlight-red' : ''}`}>
                    <span className="confidence">
                        {personMotionReading !== undefined
                            ? `${Math.floor(personMotionReading)}%`
                            : 'N/A'}
                    </span>
                    <span>{` - `}</span>
                    <span className="threshold">
                        {' '}
                        {personMotionThreshold !== undefined
                            ? `${Math.floor(personMotionThreshold)}%`
                            : 'N/A'}
                    </span>
                </div>
            );
        },
        {
            id: 'person-motion-confidence',
            header: () => 'Motion Confidence (Person)',
            cell: (info) => info.renderValue(),
            enableSorting: false,
        }
    ),
    columnHelper.accessor(
        (row: IClip) => {
            const aiValues = getVehicleAndPersonAIValues(row);
            const highlightRed = highlightColumnRed(aiValues, 'vehicleConf');
            const { vehicleConfReading, vehicleConfThreshold } = aiValues;

            return (
                <div className={`${highlightRed ? 'highlight-red' : ''}`}>
                    <span className="confidence">
                        {vehicleConfReading !== undefined
                            ? `${Math.floor(vehicleConfReading * 100)}%`
                            : 'N/A'}
                    </span>
                    <span>{` - `}</span>
                    <span className="threshold">
                        {vehicleConfThreshold !== undefined
                            ? `${Math.floor(vehicleConfThreshold * 100)}%`
                            : 'N/A'}
                    </span>
                </div>
            );
        },
        {
            id: 'vehicle-confidence',
            header: () => 'Classification Confidence (Vehicle)',
            cell: (info) => info.renderValue(),
            enableSorting: false,
        }
    ),
    columnHelper.accessor(
        (row: IClip) => {
            const aiValues = getVehicleAndPersonAIValues(row);
            const highlightRed = highlightColumnRed(aiValues, 'vehicleMotion');
            const { vehicleMotionReading, vehicleMotionThreshold } = aiValues;

            return (
                <div className={`${highlightRed ? 'highlight-red' : ''}`}>
                    <span className="confidence">
                        {vehicleMotionReading !== undefined
                            ? `${Math.floor(vehicleMotionReading)}%`
                            : 'N/A'}
                    </span>
                    <span>{` - `}</span>
                    <span className="threshold">
                        {' '}
                        {vehicleMotionThreshold !== undefined
                            ? `${Math.floor(vehicleMotionThreshold)}%`
                            : 'N/A'}
                    </span>
                </div>
            );
        },
        {
            id: 'vehicle-motion-confidence',
            header: () => 'Motion Confidence (Vehicle)',
            cell: (info) => info.renderValue(),
            enableSorting: false,
        }
    ),

    // The following column is to be hidden from the user and is only used to provide access elsewhere in the code via table API.
    columnHelper.accessor('aws_pre_sign_annotated', {
        id: 'annotated-video-path',
        header: () => 'Video Path',
        cell: () => null,
        enableSorting: false,
    }),
    // The following column is to be hidden from the user and is only used to provide access elsewhere in the code via table API.
    columnHelper.accessor('aws_pre_sign_origin', {
        id: 'original-video-path',
        header: () => 'Video Path',
        cell: () => null,
        enableSorting: false,
    }),
];

/**
 * Creates a copy of "initialClips" array that
 * features replacement IClip objects that correspond with
 * matching clip_ids.
 * @param {IClip[]} initialClips - Reference to original IClip array.
 * @param {IClip[]} replacementClips - IClip objects to replace original objects of matching clip_ids.
 * @returns {IClip[]} - Copy of original IClip array with corresponding IClip objects replace if found.
 */
const replaceClips = (
    initialClips: IClip[],
    replacementClips: IClip[]
): IClip[] => {
    const newClips: IClip[] = [...initialClips];

    replacementClips.forEach((replacementClip: IClip) => {
        const index = newClips.findIndex(
            (clip: IClip) => clip.clip_id === replacementClip.clip_id
        );

        if (index !== -1) {
            newClips[index] = replacementClip;
        }
    });

    return newClips;
};

/**
 * Standard reducer callback for useReducer hook for updating
 * state stored via useReducer. Either returns replacement state
 * that replaces IClip objects with corresponding clip_ids or simply
 * returns unaltered IClip object array.
 * @param {IClip[]} state - Reference to current state.
 * @param {Action} action
 * @returns {IClip[]}
 */
export const reducer = (state: IClip[], action: Action): IClip[] => {
    switch (action.type) {
        case 'replace':
            return replaceClips(state, action.data);
        default:
            return action.data;
    }
};
