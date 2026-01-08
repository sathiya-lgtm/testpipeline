/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
// React
import {
    FC,
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
    useCallback,
    useContext,
    useMemo,
    useRef,
} from 'react';

// Third Party
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { MultiValue } from 'react-select';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { toast } from 'react-toastify';

// Api Calls
import forensicSearch2, {
    IForensicSearchParams,
} from '../../api_calls/forensicSearch2';
import aiForensicSearchPaginated, {
    IAIForensicQueryObj,
} from '../../api_calls/aiForensicSearchPaginated';

// Components
import Toggle from '../Inputs/Toggle';
import ForensicSearchClipModal from '../Modals/ForensicSearchClipModal';
import ReportClassificationErrorModal2 from '../Modals/ReportClassificationErrorModal2';

// Controller
import {
    columns,
    IColumnVisibility,
    defaultColumnVisibility,
    standardModeExpandedColumnVisibility,
    auditModeColumnVisibility,
    isStandardRowInAuditMode,
} from './ForensicSearchTable.controller';
import handleHttpRequestError from '../../utils/handleHttpRequestError';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import EvolonIcon from '../../images/icons/EV.evolonicon.svg?react';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Types
import { INewForensicClip } from '../../types/tng-api.interfaces';
import { ViewedClips } from './ClipTable.controller';
import { SelectOption, IUser } from '../../types/interfaces';

// Styles
import '../../styles/components/Tables/ClipTable.scss';

interface IProps {
    searchTab: 'fs' | 'nl';
    forensicSearchData: INewForensicClip[];
    setForensicSearchData: Dispatch<SetStateAction<INewForensicClip[]>>;
    nextPageAvailable: boolean;
    setNextPageAvailable: Dispatch<SetStateAction<boolean>>;
    autoRefreshText: string;
    auditModeEnabled: boolean;
    setAuditModeEnabled: Dispatch<SetStateAction<boolean>>;
    aiColumnsEnabled: boolean;
    setAIColumnsEnabled: Dispatch<SetStateAction<boolean>>;
    isClipModalOpen: boolean;
    setIsClipModalOpen: Dispatch<SetStateAction<boolean>>;
    filterStart: string;
    filterEnd: string;
    selectedClassifications: MultiValue<SelectOption> | null;
    selectedEventTypes: MultiValue<SelectOption> | null;
    selectedEvents: MultiValue<SelectOption> | null;
    selectedServiceProvider: SelectOption | null;
    selectedCustomers: SelectOption | null;
    selectedSites: SelectOption | null;
    selectedCameras: SelectOption | null;
    aiContextSearchInputs?: IAIForensicQueryObj | null;
}

const ForensicSearchTable: FC<IProps> = ({
    searchTab,
    forensicSearchData,
    setForensicSearchData,
    nextPageAvailable,
    setNextPageAvailable,
    autoRefreshText,
    auditModeEnabled,
    setAuditModeEnabled,
    aiColumnsEnabled,
    setAIColumnsEnabled,
    isClipModalOpen,
    setIsClipModalOpen,
    filterStart,
    filterEnd,
    selectedClassifications,
    selectedEventTypes,
    selectedEvents,
    selectedServiceProvider,
    selectedCustomers,
    selectedSites,
    selectedCameras,
    aiContextSearchInputs,
}) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const loader = useRef<HTMLTableRowElement | null>(null);

    // To prevent pagination API multiple call
    const [isPaginationAPILoading, setIsPaginationAPILoading] = useState(false);
    const isPaginationAPILoadingRef = useRef(isPaginationAPILoading);

    const [columnVisibility, setColumnVisibility] = useState<IColumnVisibility>(
        defaultColumnVisibility
    );
    const [selectedRowId, setSelectedRowId] = useState<number | undefined>(
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

    const handleRowClick = useCallback((aSelectedRowIndex: number): void => {
        setSelectedRowIndex(aSelectedRowIndex);
        setIsClipModalOpen(true);
    }, []);

    const onPaginatedSuccess = (response: any) => {
        if (response.data.length === 51) {
            setNextPageAvailable(true);
            setForensicSearchData((previousState) => [
                ...previousState,
                ...response.data.slice(0, -1),
            ]);
        } else {
            setNextPageAvailable(false);
            setForensicSearchData((previousState) => [
                ...previousState,
                ...response.data,
            ]);
        }
        setIsPaginationAPILoading(false);
    };

    const forensicSearchMutation = useMutation({
        mutationFn: forensicSearch2,
        onSuccess: (data) => onPaginatedSuccess(data),
        onError: (err) => {
            setIsPaginationAPILoading(false);
            handleHttpRequestError(err, setActiveUser, navigate);
        },
    });

    const aiSearchPaginatedMutation = useMutation({
        mutationFn: aiForensicSearchPaginated,
        onSuccess: (data) => onPaginatedSuccess(data),
        onError: (err) => {
            setIsPaginationAPILoading(false);
            handleHttpRequestError(err, setActiveUser, navigate);
        },
    });

    const tableOptions = {
        data: forensicSearchData,
        columns,
        state: {
            columnVisibility,
        },

        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        sortingFns: {
            markSort: () => {
                return 1;
            },
            timeSort: () => {
                return 1;
            },
            emailSort: () => {
                return 1;
            },
        },
    };

    const table = useReactTable(tableOptions);

    const selectedRow = useMemo(() => {
        const { rows } = table.getRowModel();

        if (typeof selectedRowIndex === 'number') {
            const selectedRowCopy = rows[selectedRowIndex];
            return selectedRowCopy;
        }

        return null;
    }, [table, selectedRowIndex]);

    const handleLoadMore = useCallback(() => {
        if (searchTab === 'nl') {
            if (!aiContextSearchInputs) {
                setIsPaginationAPILoading(false);
                return;
            }

            const lastClip = forensicSearchData[forensicSearchData.length - 1];
            aiContextSearchInputs['file_id'] = lastClip.file_id;

            aiSearchPaginatedMutation.mutate({
                user: activeUser as IUser,
                aiSearch: aiContextSearchInputs,
            });
        } else if (searchTab === 'fs') {
            const startDateObj = parseISO(filterStart);
            const endDateObj = parseISO(filterEnd);

            const start_date = startDateObj
                .toISOString()
                .replace('T', ' ') // replace 'T' with space
                .replace('Z', '') // remove 'Z'
                .replace('.000', '.999999');
            const end_date = endDateObj
                .toISOString()
                .replace('T', ' ') // replace 'T' with space
                .replace('Z', '') // remove 'Z'
                .replace('.000', '.999999');

            let service_provider_account_id: number | undefined;
            if (selectedServiceProvider) {
                service_provider_account_id = Number(
                    selectedServiceProvider.value
                );
            }

            const lastClip = forensicSearchData[forensicSearchData.length - 1];

            const forensicSearchParams: IForensicSearchParams = {
                start_date,
                end_date,
                service_provider_account_id,
                account_id: selectedCustomers?.value
                    ? Number(selectedCustomers?.value)
                    : 0,
                site_id: selectedSites?.value ? Number(selectedSites.value) : 0,
                camera_id: selectedCameras?.value
                    ? Number(selectedCameras.value)
                    : 0,
                page_limit: 51,
                is_audit_mode: auditModeEnabled,
                file_id: lastClip.file_id,
            };

            if (selectedClassifications) {
                forensicSearchParams.classifications_filter =
                    selectedClassifications.map(
                        (classification) => classification.value
                    );
            }

            if (selectedEventTypes) {
                forensicSearchParams.event_type_filter = selectedEventTypes.map(
                    (eventType) => eventType.value
                );
            }

            if (selectedEvents) {
                forensicSearchParams.events_filter = selectedEvents.map(
                    (event) => event.value
                );
            }

            forensicSearchMutation.mutate({
                user: activeUser as IUser,
                forensicSearch: forensicSearchParams,
            });
        }
    }, [
        filterStart,
        filterEnd,
        selectedCustomers,
        selectedSites,
        selectedCameras,
        selectedClassifications,
        selectedEventTypes,
        selectedEvents,
        forensicSearchData,
        auditModeEnabled,
    ]);

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

    useEffect(() => {
        isPaginationAPILoadingRef.current = isPaginationAPILoading;
    }, [isPaginationAPILoading]);

    useEffect(() => {
        if (!nextPageAvailable) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    !isPaginationAPILoadingRef.current
                ) {
                    setIsPaginationAPILoading(true);
                    handleLoadMore();
                }
            },
            { threshold: 0 }
        );
        if (loader.current) observer.observe(loader.current);

        return () => {
            if (loader.current) {
                observer.unobserve(loader.current);
            }
        };
    }, [handleLoadMore, nextPageAvailable]);

    return (
        <>
            <div className="clip-table-title-container">
                {forensicSearchData.length > 0 && (
                    <p>Showing {forensicSearchData.length} Results</p>
                )}

                {forensicSearchData.length === 0 && <div />}

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
                                        <div
                                            className="th-content"
                                            style={{ pointerEvents: 'none' }}
                                        >
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
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row, index) => {
                            const hasBeenViewed: number | undefined =
                                viewedClips[row.original.file_id];

                            return (
                                <tr
                                    key={row.original.file_id}
                                    className={`${
                                        row.original
                                            .ai_classification_error_event
                                            ? 'reported '
                                            : ''
                                    } ${hasBeenViewed ? 'viewed' : ''} ${
                                        isStandardRowInAuditMode(
                                            row.original.classifications,
                                            row.original.event_types
                                        )
                                            ? 'alert'
                                            : 'non-alert'
                                    } ${
                                        selectedRowId === row.original.file_id
                                            ? 'selected'
                                            : ''
                                    }`}
                                    onClick={() => {
                                        if (
                                            [
                                                'Device Health',
                                                'Intrusion',
                                                'Camera Actions',
                                                'Schedule',
                                            ].some((type) =>
                                                row.original.event_types.includes(
                                                    type
                                                )
                                            )
                                        ) {
                                            toast.info(
                                                'This event does not have a video clip.'
                                            );
                                        } else {
                                            handleRowClick(index);
                                        }
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={`${row.original.file_id}-${cell.id}`}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}

                        {nextPageAvailable && forensicSearchData.length > 0 && (
                            <tr ref={loader}>
                                <td
                                    colSpan={
                                        table.getVisibleLeafColumns().length
                                    }
                                    className="loadingContainer"
                                >
                                    <p>Loading more clips...</p>
                                    <EvolonIcon className="companyIcon" />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            {isFlagModalOpen && selectedRow && (
                <ReportClassificationErrorModal2
                    handleClose={() => {
                        setIsFlagModalOpen(false);
                    }}
                    forensicSearchData={forensicSearchData}
                    setForensicSearchData={setForensicSearchData}
                    accountName={selectedRow.original.account_name}
                    siteName={selectedRow.original.site_name}
                    cameraName={selectedRow.original.camera_name}
                    ai_error_comment={
                        selectedRow.original.ai_classification_error_comment
                    }
                    ai_error_event={
                        selectedRow.original.ai_classification_error_event
                    }
                    file_id={selectedRow.original.file_id}
                />
            )}

            {isClipModalOpen && typeof selectedRowIndex === 'number' && (
                <ForensicSearchClipModal
                    table={table}
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
        </>
    );
};

export default ForensicSearchTable;
