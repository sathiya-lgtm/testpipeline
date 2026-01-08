/* eslint-disable react/no-array-index-key */
// React
import {
    FC,
    ReactElement,
    SetStateAction,
    useCallback,
    useEffect,
    useReducer,
    useState,
    Dispatch,
    useContext,
    useMemo,
} from 'react';

// Third party
import {
    flexRender,
    SortingState,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { UseMutationResult } from '@tanstack/react-query';
import { PiCaretRight, PiCaretLeft } from 'react-icons/pi';
import { FaCircleInfo } from 'react-icons/fa6';
import { toast } from 'react-toastify';

// Api Calls
import {
    ForesenicSearchOverviewData,
    ForensicSearchPaginatedResponse,
    IForensicSearchPaginatedParams,
} from '../../api_calls/forensicSearchPaginated';

// Controller
import {
    reducer,
    ViewedClips,
    columns,
    timeSort,
    markSort,
    IColumnVisibility,
    defaultColumnVisibility,
    auditModeColumnVisibility,
    standardModeExpandedColumnVisibility,
} from './ClipTable.controller';
import { emailSort } from './AlertTable.controller';

// Components
import Toggle from '../Inputs/Toggle';
import ClipModal from '../Modals/ClipModal';
import ReportClassificationErrorModal from '../Modals/ReportClassificationErrorModal';
import PaginatedClipsTableTooltip, {
    extractAISettingsValues,
} from './PaginatedClipsTableTooltip';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Utils
import formatIsoDateTimeToApiDateTime from '../../utils/formatIsoDateTimeToApiDateTime';
import getAccountType from '../../utils/getAccountType';

// Custom types
import {
    IAISearchTokens,
    IClip,
    IClipPayload,
    INLSearchTokens,
} from '../../types/tng-api.interfaces';
import { IUser, SelectOption } from '../../types/interfaces';
import { AccountType } from '../../types/enums';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';

// Styles
import '../../styles/components/Tables/ClipTable.scss';

interface IProps {
    searchTab: 'fs' | 'nl';
    clips: IClip[];
    setClips: Dispatch<SetStateAction<IClip[]>>;
    selectedServiceProvider: SelectOption | null;
    autoRefreshText: string;
    isClipModalOpen: boolean;
    setIsClipModalOpen: Dispatch<SetStateAction<boolean>>;
    auditModeEnabled: boolean;
    setAuditModeEnabled: Dispatch<SetStateAction<boolean>>;
    aiColumnsEnabled: boolean;
    setAIColumnsEnabled: Dispatch<SetStateAction<boolean>>;
    forensicSearchOverview: ForesenicSearchOverviewData | null;
    hashArray: string[];
    currentIndex: number;
    setCurrentIndex: Dispatch<SetStateAction<number>>;
    lastIndex: number;
    previousIndexes: number[];
    filterStart: string;
    filterEnd: string;
    // searchTokens: INLSearchTokens;
    searchTokens: IAISearchTokens;
    clipsMutationPaginated: UseMutationResult<
        ForensicSearchPaginatedResponse,
        unknown,
        IForensicSearchPaginatedParams,
        unknown
    >;
    handleInitialClipsSearch: () => Promise<void>;
}

const PaginatedClipsTable: FC<IProps> = ({
    searchTab,
    clips,
    setClips,
    selectedServiceProvider,
    autoRefreshText,
    isClipModalOpen,
    setIsClipModalOpen,
    auditModeEnabled,
    setAuditModeEnabled,
    aiColumnsEnabled,
    setAIColumnsEnabled,
    forensicSearchOverview,
    hashArray,
    currentIndex,
    lastIndex,
    previousIndexes,
    setCurrentIndex,
    searchTokens,
    filterStart,
    filterEnd,
    clipsMutationPaginated,
    handleInitialClipsSearch,
}): ReactElement => {
    const { activeUser } = useContext(AuthContext);

    const accountType: AccountType = useMemo(
        () => getAccountType(activeUser),
        [activeUser]
    );

    // Used useReducer here because it felt cleaner than useState...
    // ...only had to pass dispatch function to children without additional props and/or imports.
    const [data, dispatch] = useReducer(reducer, []);

    // const [isInAuditMode, setIsInAuditMode] = useState<boolean>(false);
    const [columnVisibility, setColumnVisibility] = useState<IColumnVisibility>(
        defaultColumnVisibility
    );
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'date', desc: true },
    ]);
    const [selectedRowId, setSelectedRowId] = useState<string | undefined>(
        undefined
    );
    const [selectedRowIndex, setSelectedRowIndex] = useState<
        number | undefined
    >();
    const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);
    const [viewedClips, setViewedClips] = useState<ViewedClips>({});

    // Clip Modal
    const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
    const [showMask, setShowMask] = useState(true);
    const [showAILabels, setShowAILabels] = useState(true);

    const tableOptions = {
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
        },
        onSortingChange: setSorting,
        sortingFns: {
            timeSort,
            markSort,
            emailSort,
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    };

    const table = useReactTable(tableOptions);

    const handleRowClick = useCallback(
        (aSelectedRowIndex: number, clipData: IClip): void => {
            setViewedClips((previousState) => {
                const newViewedClips = {
                    ...previousState,
                    [clipData.clip_id]: Date.now(),
                };
                localStorage.setItem(
                    'viewedClips',
                    JSON.stringify(newViewedClips)
                );
                return newViewedClips;
            });

            setSelectedRowIndex(aSelectedRowIndex);
            setIsClipModalOpen(true);
        },
        []
    );

    const startResultCount = useMemo(() => {
        return 1 + currentIndex * 50;
    }, [currentIndex]);

    const endResultCount = useMemo(() => {
        if (forensicSearchOverview && hashArray.length === currentIndex + 1) {
            return (
                startResultCount + forensicSearchOverview.last_page_count - 1
            );
        }

        return startResultCount + 49;
    }, [currentIndex, hashArray, startResultCount, forensicSearchOverview]);

    const copyAISettingsToClipboard = (clipPayload: IClipPayload) => {
        const formattedObject: Record<string, String> = {};
        const aiSettingsData = extractAISettingsValues(clipPayload);

        aiSettingsData.forEach(({ label, value }) => {
            formattedObject[label] = value;
        });

        const settingsString = JSON.stringify(formattedObject, null, 2);

        navigator.clipboard.writeText(settingsString);
        toast.success('AI Settings copied!');
    };

    const handleNextPageClick = async (direction: 'next' | 'previous') => {
        if (!activeUser) {
            return;
        }

        if (accountType === AccountType.Evolon && !selectedServiceProvider) {
            toast.error('Need to select a service provider');
            return;
        }

        let targetPage = currentIndex;
        let last_index = lastIndex;

        if (direction === 'next') {
            targetPage = currentIndex + 1;
        } else {
            targetPage = currentIndex - 1;

            if (currentIndex > 1) {
                last_index = previousIndexes[currentIndex - 2];
            } else {
                // Need to rerun orginally query here because it is the first page (these queries have a different structure)
                await handleInitialClipsSearch();
                setCurrentIndex(targetPage);
                return;
            }
        }

        const hash = hashArray[targetPage];
        setCurrentIndex(targetPage);

        let range_start = formatIsoDateTimeToApiDateTime(filterStart);
        let range_end = formatIsoDateTimeToApiDateTime(filterEnd, 'endDate');

        if (searchTab === 'nl') {
            // range_start = searchTokens.date_from;
            // range_end = searchTokens.date_to;
            range_start = searchTokens.start_date;
            range_end = searchTokens.end_date;
        }

        // clipsMutationPaginated.mutate({
        //     user: activeUser as IUser,
        //     forensicSearch: {
        //         '*service_provider':
        //             Number(selectedServiceProvider?.value) || undefined,
        //         range_start,
        //         range_end,
        //         request: auditModeEnabled ? 'audit' : 'standard',
        //         order: 'desc',
        //         hash,
        //         last_index,
        //     },
        // });
    };

    useEffect(() => {
        if (auditModeEnabled) {
            setColumnVisibility(auditModeColumnVisibility);
        } else if (aiColumnsEnabled) {
            setColumnVisibility(standardModeExpandedColumnVisibility);
        } else {
            setColumnVisibility(defaultColumnVisibility);
        }
    }, [auditModeEnabled, aiColumnsEnabled]);

    useEffect(() => {
        dispatch({ type: 'initialize', data: clips });

        setSelectedRowId(undefined);
    }, [clips]);

    useEffect(() => {
        const storedViewedClips = localStorage.getItem('viewedClips');

        if (storedViewedClips) {
            /**
             * Here, we are pulling any viewed clips from local storage.  We are deleting any view clips that were last view more than 7 days ago.
             * This is to prevent the local storage object for viewed clips from growing infinitely.
             */
            const savedViewedClips = JSON.parse(
                storedViewedClips
            ) as ViewedClips;

            const newViewedClips: ViewedClips = {};
            const sevenDays = 1000 * 60 * 60 * 24 * 7; // In milliseconds

            Object.entries(savedViewedClips).forEach(([key, value]) => {
                if (value > Date.now() - sevenDays) {
                    newViewedClips[key] = value;
                }
            });

            localStorage.setItem('viewedClips', JSON.stringify(newViewedClips));
            setViewedClips(newViewedClips);
        }
    }, []);

    return (
        <>
            <div className="clip-table-title-container">
                {forensicSearchOverview && (
                    <h4>
                        <span id="table-clip-count">
                            {startResultCount} - {endResultCount} of{' '}
                            {forensicSearchOverview.records}
                        </span>{' '}
                        Clips
                    </h4>
                )}

                {!forensicSearchOverview && <div />}

                <p id="search-status">{autoRefreshText}</p>

                <div className="paginated-clips-table-toggles-container">
                    {!auditModeEnabled && (
                        <div className="audit-mode-toggle-container">
                            <p id="ai-columns-toggle-label-1">
                                AI Confidence Values
                            </p>

                            <Toggle
                                id="ai-columns-toggle"
                                value={aiColumnsEnabled}
                                onToggleChange={() => {
                                    setAIColumnsEnabled(!aiColumnsEnabled);
                                }}
                                toggleOnText="ON"
                                toggleOffText="OFF"
                            />
                        </div>
                    )}

                    <div className="audit-mode-toggle-container">
                        <p id="audit-mode-toggle-label-1">Audit Mode</p>
                        <Toggle
                            id="audit-mode-toggle-1"
                            value={auditModeEnabled}
                            onToggleChange={() =>
                                setAuditModeEnabled(!auditModeEnabled)
                            }
                            toggleOnText="ON"
                            toggleOffText="OFF"
                        />
                    </div>
                </div>
            </div>
            <section className="clips-section">
                <table id="clips-table" className="clips-table">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        id={header.id}
                                        key={header.id}
                                        className={
                                            header.column.getCanSort()
                                                ? 'sortable'
                                                : 'not-sortable'
                                        }
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="th-content">
                                            {header.column.getCanSort() && (
                                                <DropDownArrowIcon
                                                    className={`dropdown-arrow ${
                                                        header.column.getIsSorted() ||
                                                        'unsorted'
                                                    }`}
                                                />
                                            )}
                                            <div className="column-title">
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext()
                                                )}
                                            </div>
                                        </div>
                                    </th>
                                ))}

                                {accountType === AccountType.Evolon && (
                                    <th className="not-sortable">
                                        <div className="th-content">
                                            <div className="column-title">
                                                AI Settings
                                            </div>
                                        </div>
                                    </th>
                                )}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table
                            .getRowModel()
                            .rows.filter((row) => {
                                /**
                                 * .filter is being used here to filter out clips
                                 * without detections/objects when not in Audit Mode.
                                 */
                                if (auditModeEnabled) return true;
                                return row.getValue('objects');
                            })
                            .map((row, index) => {
                                const hasObjects: null | Element =
                                    row.getValue('objects');

                                const hasBeenViewed: number | undefined =
                                    viewedClips[row.original.clip_id];

                                return (
                                    <tr
                                        id={row.original.clip_id}
                                        key={row.id}
                                        className={`
                                        ${
                                            row.original.ai_error_event
                                                ? 'reported '
                                                : ''
                                        }
                                        ${hasObjects ? 'alert' : 'non-alert'}${
                                            hasBeenViewed ? ' viewed' : ''
                                        }${
                                            selectedRowId === row.id
                                                ? ' selected'
                                                : ''
                                        }`}
                                        onClick={() => {
                                            handleRowClick(index, row.original);
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                title={
                                                    row.original
                                                        .ai_error_event &&
                                                    cell.column.id === 'mark'
                                                        ? row.original
                                                              .ai_error_event
                                                        : undefined
                                                }
                                                id={`${cell.column.id}-${row.original.clip_id}`}
                                                key={cell.id}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}

                                        {accountType === AccountType.Evolon && (
                                            <td>
                                                <PaginatedClipsTableTooltip
                                                    tooltipId={`${row.original.clip_id}-payload-tooltip`}
                                                    clipPayload={
                                                        row.original.payload
                                                    }
                                                />

                                                <div
                                                    className="icons-container"
                                                    data-tooltip-id={`${row.original.clip_id}-payload-tooltip`}
                                                >
                                                    <FaCircleInfo
                                                        className="control-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyAISettingsToClipboard(
                                                                row.original
                                                                    .payload
                                                            );
                                                        }}
                                                        size={26}
                                                    />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
                {isFlagModalOpen && typeof selectedRowIndex === 'number' && (
                    <ReportClassificationErrorModal
                        handleClose={() => {
                            setIsFlagModalOpen(false);
                        }}
                        rows={
                            auditModeEnabled
                                ? table.getRowModel().rows // Return every row if in Audit Mode.
                                : table
                                      .getRowModel()
                                      .rows.filter((row) =>
                                          row.getValue('objects')
                                      ) // Only return events with detected objects when not in Audit Mode.
                        }
                        selectedRowIndex={selectedRowIndex}
                        dispatch={dispatch}
                    />
                )}
                {isClipModalOpen && typeof selectedRowIndex === 'number' && (
                    <ClipModal
                        rows={
                            auditModeEnabled
                                ? table.getRowModel().rows // Return every row if in Audit Mode.
                                : table
                                      .getRowModel()
                                      .rows.filter((row) =>
                                          row.getValue('objects')
                                      ) // Only return events with detected objects when not in Audit Mode.
                        }
                        setClips={setClips}
                        selectedRowIndex={selectedRowIndex}
                        setSelectedRowIndex={setSelectedRowIndex}
                        setSelectedRowId={setSelectedRowId}
                        setIsVideoModalOpen={setIsClipModalOpen}
                        setViewedClips={setViewedClips}
                        setIsFlagModalOpen={setIsFlagModalOpen}
                        showBoundingBoxes={showBoundingBoxes}
                        setShowBoundingBoxes={setShowBoundingBoxes}
                        showMask={showMask}
                        setShowMask={setShowMask}
                        showAILabels={showAILabels}
                        setShowAILabels={setShowAILabels}
                    />
                )}
            </section>

            {forensicSearchOverview && (
                <div className="table-pagination-section">
                    <span>
                        {startResultCount} - {endResultCount} of{' '}
                        {forensicSearchOverview.records}
                    </span>
                    <div className="pagination-controls">
                        <button
                            className={currentIndex === 0 ? 'disabled' : ''}
                            disabled={currentIndex === 0}
                            type="button"
                            onClick={() => handleNextPageClick('previous')}
                        >
                            <PiCaretLeft size={24} />
                        </button>
                        <button
                            className={
                                currentIndex === hashArray.length - 1
                                    ? 'disabled'
                                    : ''
                            }
                            disabled={currentIndex === hashArray.length - 1}
                            type="button"
                            onClick={() => handleNextPageClick('next')}
                        >
                            <PiCaretRight size={24} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default PaginatedClipsTable;
