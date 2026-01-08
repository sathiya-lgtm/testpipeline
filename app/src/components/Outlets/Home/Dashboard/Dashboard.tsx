/* eslint-disable jsx-a11y/control-has-associated-label */
// React
import React, {
    ReactElement,
    useEffect,
    useContext,
    useState,
    useMemo,
    useCallback,
    useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { SingleValue, MultiValue } from 'react-select';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { BsFillCircleFill } from 'react-icons/bs';
import {
    CategoricalChartFunc,
    CategoricalChartState,
} from 'recharts/types/chart/generateCategoricalChart';

// Custom
import { toast } from 'react-toastify';
import getDashboard from '../../../../api_calls/getDashboard';
import getTimeZoneName from '../../../../utils/getTimeZoneName';
import extractErrorMessage from '../../../../utils/extractErrorMessage';
import handleHttpRequestError from '../../../../utils/handleHttpRequestError';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';
import { ListTargetContext } from '../../../../contexts/ListTarget';

// Controller
import {
    BarChartDisplay,
    getBarChartDisplayOptions,
    colorMap,
    createDailyBarChartData,
    createHourlyBarChartData,
    extractKPIs,
    convertDashboardDateFormat,
    getEndDate,
    calculateStartDateFromPreset,
    getTargetedAccount,
    getTargetedCameras,
    getTargetedSites,
    IBarChartData,
    IKpi,
    labelMap,
    sortDashboardData,
    TimePreset,
    timePresetOptions,
} from './Dashboard.controller';

// Components
import NoData from '../../../NoData';
import SingleSelect from '../../../Inputs/Select';
import DashboardPieChart from '../../../Charts/DashboardPieChart';
import DashboardBarChart from '../../../Charts/DashboardBarChart';
import DashboardPieChartLabel from '../../../Charts/DashboardPieChartLabel';
import LoadingModal from '../../../Modals/LoadingModal';
import DateRangeModal from '../../../Modals/DateRangeModal';
import Breadcrumbs, { IBreadCrumb } from '../../../Breadcrumbs';

// Custom types
import { IUser, SelectOption } from '../../../../types/interfaces';
import { IEventDay } from '../../../../types/tng-api.interfaces';
import DashboardBarChartModal from '../../../Charts/DashboardBarChartModal';

// Icons
import GlobeIcon from '../../../../images/icons/globe.svg?react';

// Styles
import '../../../../styles/components/Outlets/Home/Dashboard.scss';

const Dashboard = (): ReactElement => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const { listTarget } = useContext(ListTargetContext);
    /** Used as a key for the dashboard's React Query. Distinguishes the scope in which the query is searching as
     * defined by the different types of listTarget (e.g. Customer, Site, Camera).
     */
    const dashboardQueryScope: string = useMemo(() => {
        let scope: string = 'scope=';

        if (listTarget) {
            scope += `${listTarget.type}:`;

            if (listTarget.type === 'service-provider') {
                scope += `${listTarget.type}:`;
            }

            if (listTarget.type === 'account') {
                scope += `${listTarget.customerId}:`;
            }

            if (listTarget.type === 'site') {
                scope += `${listTarget.siteId}:`;
            }

            if (listTarget.type === 'camera') {
                scope += `${listTarget.cameraId}:`;
            }
        } else {
            scope += 'all';
        }

        return scope;
    }, [listTarget]);

    /** Should be date formatted as "yyyy-MM-dd" in client's timezone or empty string. */
    const [customStartDate, setCustomStartDate] = useState<string>('');

    /** Should be date formatted as "yyyy-MM-dd" in client's timezone or empty string. */
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [selectedBarChartDisplay, setSelectedBarChartDisplay] =
        useState<SelectOption>(getBarChartDisplayOptions()[0]);
    const [selectedTimePreset, setSelectedTimePreset] = useState<SelectOption>(
        timePresetOptions(activeUser?.properties?.retention_days)[1]
    );
    const [rangeStart, setRangeStart] = useState<string>(
        calculateStartDateFromPreset(selectedTimePreset)
    );
    const [rangeEnd, setRangeEnd] = useState('');

    const [events, setEvents] = useState<IKpi>();
    const [mitigated, setMitigated] = useState<IKpi>();
    const [people, setPeople] = useState<IKpi>();
    const [vehicles, setVehicles] = useState<IKpi>();
    const [barChartData, setBarChartData] = useState<IBarChartData[]>([]);
    /** State for dashboard dates (e.g. date displayed on bar chart labels, label for date range dropdown, etc).
     * Format should be "MM/dd/yyyy" as change for IST-1513.
     */
    const selectedBarChartDay = useRef<string | null>(null);
    const [modalBarCharData, setModalBarCharData] = useState<IBarChartData[]>(
        []
    );
    const [isBarChartModalOpen, setIsBarChartModalOpen] =
        useState<boolean>(false);
    const [isDateRangeModalOpen, setIsDateRangeModalOpen] =
        useState<boolean>(false);

    const dashboardQueryTimeIntervalIdRef = useRef<number | undefined>(
        undefined
    );
    const [dashboardQueryTime, setDashboardQueryTime] = useState<number | null>(
        null
    );
    const incrementDashboardQueryTime = useCallback(() => {
        if (dashboardQueryTime) {
            setDashboardQueryTime(dashboardQueryTime + 1);
        } else {
            setDashboardQueryTime(1);
        }
    }, [dashboardQueryTime]);

    const barChartDisplay = useMemo(() => {
        return selectedBarChartDisplay.value as BarChartDisplay;
    }, [selectedBarChartDisplay]);

    const determineBreadcrumbs = () => {
        console.log({ listTarget });
        const breadcrumbs: IBreadCrumb[] = [
            {
                key: 'globe',
                position: 'start',
                icon: <GlobeIcon className="icon globe" />,
            },
        ];

        if (listTarget && 'customerName' in listTarget) {
            breadcrumbs.push({
                key: `${listTarget.customerName} ${listTarget.customerId} breadcrumb`,
                label: listTarget.customerName,
                position: 'middle',
            });
        }

        if (listTarget && 'siteName' in listTarget) {
            breadcrumbs.push({
                key: `${listTarget.siteName} ${listTarget.siteId} breadcrumb`,
                label: listTarget.siteName,
                position: 'middle',
            });
        }

        if (listTarget && 'cameraName' in listTarget) {
            let prefix = 'camera';
            const jobType = listTarget.camera_properties.job_type;

            if (jobType === 'edge') {
                prefix = 'edge';
            } else if (jobType === 'device-io') {
                prefix = 'device-io';
            } else if (jobType === 'panel') {
                prefix = 'panel';
            }

            breadcrumbs.push({
                key: `${listTarget.cameraName} ${listTarget.cameraId} breadcrumb`,
                label: listTarget.cameraName,
                position: 'end',
                to: `${prefix}/${listTarget.cameraId}`,
                className: 'camera-link',
            });
        }

        return breadcrumbs;
    };

    // React Query.
    /** Re-executes every render unless query is "Fresh" and has active cache for specific "queryKey" combination.
     * The values in the queryKey in combination with the staleTime tell React Query whether to make new request or not.
     */
    const dashboardQuery = useQuery({
        queryKey: [`dashboard`, rangeStart, rangeEnd, dashboardQueryScope],
        queryFn: () =>
            getDashboard({
                user: activeUser as IUser,
                dashboardSearch: {
                    range_start: rangeStart,
                    range_end: rangeEnd || getEndDate(),
                    '*timezone': getTimeZoneName(),
                    '*accounts': getTargetedAccount(listTarget),
                    '*sites': getTargetedSites(listTarget),
                    '*cameras': getTargetedCameras(listTarget),
                },
            }),
        enabled: !!(rangeStart && rangeEnd),
        retry: 2,
        cacheTime: 60000, // Will cache for 1 minute.
        staleTime: 30000, // Will not refetch the same query twice until stale time expires, uses cache instead.
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    const handleTimePresetChange = useCallback(
        (
            selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
        ): void => {
            const result = selectOption as SingleValue<SelectOption>;

            // If the label is "Custom", should open Date Range modal.
            if (result?.label === TimePreset.Custom) {
                setIsDateRangeModalOpen(true);
            } else {
                setSelectedTimePreset(result || selectedTimePreset);
            }
        },
        [selectedTimePreset]
    );

    /** Begins process of opening hourly bar chart modal. BarChart library
     * will handle error in this function if not handled manually.
     */
    const handleBarClick: CategoricalChartFunc = useCallback(
        (chartState: CategoricalChartState): void => {
            selectedBarChartDay.current = chartState?.activeLabel
                ? chartState.activeLabel
                : null;

            if (selectedBarChartDay.current && dashboardQuery.data) {
                const hourlyBarChartData = createHourlyBarChartData(
                    dashboardQuery.data.dashboard_data[
                        convertDashboardDateFormat(
                            selectedBarChartDay.current,
                            'yyyy-MM-dd'
                        )
                    ]
                );

                setModalBarCharData(hourlyBarChartData);
                setIsBarChartModalOpen(true);
            }
        },
        [dashboardQuery.data, selectedBarChartDay]
    );

    useEffect(() => {
        return () => {
            window.clearInterval(dashboardQueryTimeIntervalIdRef.current);
        };
    }, []);

    useEffect(() => {
        if (dashboardQuery.data) {
            try {
                const { data } = dashboardQuery;
                const sortedDashboardData: [string, IEventDay][] =
                    sortDashboardData(data.dashboard_data);
                const {
                    totalEvents,
                    totalMitigated,
                    totalPeople,
                    totalVehicles,
                } = extractKPIs(sortedDashboardData);

                /** Hourly bar chart data if preset is today or range starts and ends on same day. */
                const chart: IBarChartData[] =
                    selectedTimePreset.value === TimePreset.Today ||
                    rangeStart.split(' ')[0] === rangeEnd.split(' ')[0] // Grabs date at index 0 thus excludes time (hours, minutes, seconds).
                        ? createHourlyBarChartData(sortedDashboardData[0][1]) // Assumes there is only one Event Day available, which is for current day.
                        : createDailyBarChartData(sortedDashboardData);

                setEvents(totalEvents);
                setMitigated(totalMitigated);
                setPeople(totalPeople);
                setVehicles(totalVehicles);
                setBarChartData(chart);
            } catch (error) {
                const errorMessage: string = extractErrorMessage(error);

                console.error(errorMessage);
                toast.error(
                    'Failed to display event data for dashboard. Refresh and try again later. Contact Customer Support if the issue persists.'
                );
            }
        }
    }, [dashboardQuery.data]);

    /** Will execute after selectedTimePresent is initialized and after
     * it is reassigned. Executes twice when in strict mode due to initialization.
     */
    useEffect(() => {
        // Will execute immediately if initialized to a truthy value.

        // If label is not Custom, but the value is...
        // The label will be Custom only if the user has yet to set a Custom date range, otherwise the label is said date range.
        if (
            selectedTimePreset.label !== TimePreset.Custom &&
            selectedTimePreset.value === TimePreset.Custom
        ) {
            /**  */
            const startDate = `${customStartDate} 00:00:00`;
            const endDate = `${customEndDate} 23:59:59`;

            setRangeStart(startDate);
            setRangeEnd(endDate);
        } else if (selectedTimePreset.value) {
            const startDate = calculateStartDateFromPreset(selectedTimePreset);
            const endDate = getEndDate();

            setRangeStart(startDate);
            setRangeEnd(endDate);
        }
    }, [selectedTimePreset]);

    useEffect(() => {
        if (
            dashboardQuery.isLoading &&
            dashboardQueryTimeIntervalIdRef.current === undefined
        ) {
            const intervalId: number = window.setInterval(
                incrementDashboardQueryTime,
                1_000
            );
            dashboardQueryTimeIntervalIdRef.current = intervalId;
        } else {
            window.clearInterval(dashboardQueryTimeIntervalIdRef.current);
            setDashboardQueryTime(null);
            dashboardQueryTimeIntervalIdRef.current = undefined;
        }
    }, [dashboardQuery.isLoading]);

    return (
        <div className="Dashboard">
            {isBarChartModalOpen && selectedBarChartDay.current && (
                <AnimatePresence mode="wait">
                    <DashboardBarChartModal
                        title={`Hour by hour for ${selectedBarChartDay.current}`}
                        handleClose={() => setIsBarChartModalOpen(false)}
                        barChartDisplay={
                            selectedBarChartDisplay.value as BarChartDisplay
                        }
                        barChartData={modalBarCharData}
                        colors={colorMap}
                    />
                </AnimatePresence>
            )}
            {dashboardQueryTime && !dashboardQuery.isError && (
                <LoadingModal
                    modalText="Retrieving dashboard data..."
                    logoSize="lg"
                    zIndex={96}
                />
            )}
            {isDateRangeModalOpen && (
                <DateRangeModal
                    handleClose={() => setIsDateRangeModalOpen(false)}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                    setCustomStartDate={setCustomStartDate}
                    setCustomEndDate={setCustomEndDate}
                    setSelectedTimePreset={setSelectedTimePreset}
                />
            )}

            <AnimatePresence mode="wait">
                <div className="title-container">
                    <Breadcrumbs breadcrumbs={determineBreadcrumbs()} />
                </div>
            </AnimatePresence>
            <ul className="header">
                <AnimatePresence mode="wait">
                    {listTarget?.type === 'site' &&
                    listTarget.properties?.email &&
                    listTarget.properties.job_type &&
                    listTarget.properties.job_type.includes('nvr') ? (
                        <li className="smtp-site-email">
                            <span>{listTarget.properties.email}</span>
                            <button
                                type="button"
                                className="btn primary copyEmailBtn"
                                data-toggle="tooltip"
                                data-placement="bottom"
                                title="Copy to clipboard"
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        listTarget?.properties?.email || ''
                                    );
                                    toast.success('Email address copied!');
                                }}
                            >
                                <svg
                                    className="icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    xmlnsXlink="http://www.w3.org/1999/xlink"
                                    version="1.1"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" />
                                </svg>
                            </button>
                        </li>
                    ) : (
                        <li />
                    )}
                </AnimatePresence>

                <div className="header-group">
                    <li className="field-container">
                        <div className="field">
                            <span
                                className="label tooltip bottom wide no-pointer"
                                data-tooltip={`Select date range for dashboard data. Date range must be within threshold defined within your data retention policy. ${
                                    activeUser?.properties?.retention_days &&
                                    `(${activeUser?.properties?.retention_days} days)`
                                }`}
                            >
                                Date Range:
                            </span>
                            <span>Today</span>
                            {/* <SingleSelect
                                id="preset-date-select"
                                isClearable={false}
                                value={selectedTimePreset}
                                onChange={(
                                    e:
                                        | MultiValue<SelectOption>
                                        | SingleValue<SelectOption>
                                ) => {
                                    handleTimePresetChange(e);
                                }}
                                options={timePresetOptions(
                                    activeUser?.properties?.retention_days
                                )}
                            /> */}
                        </div>
                    </li>
                </div>
            </ul>
            <div className="eventCardContainer">
                <div className="card eventCard">
                    <BsFillCircleFill
                        size={15}
                        color={colorMap.events}
                        className="circle"
                    />
                    <div>
                        <p
                            className="label tooltip bottom wide no-pointer"
                            data-tooltip="Events that trigger an alarm after AI processing."
                        >
                            {labelMap.events}
                        </p>
                        <p
                            id={`kpi-${labelMap.events
                                .toLowerCase()
                                .split(' ')
                                .join('-')}`}
                            className="number"
                        >
                            {events ? events.value.toLocaleString() : 0}
                        </p>
                    </div>
                </div>
                <div className="card eventCard">
                    <BsFillCircleFill
                        size={15}
                        color={colorMap.mitigated}
                        className="circle"
                    />
                    <div>
                        <p
                            className="label tooltip bottom wide no-pointer"
                            data-tooltip="Events that do not trigger an alarm after AI processing."
                        >
                            {labelMap.mitigated}
                        </p>
                        <p
                            id={`kpi-${labelMap.mitigated
                                .toLowerCase()
                                .split(' ')
                                .join('-')}`}
                            className="number"
                        >
                            {mitigated ? mitigated.value.toLocaleString() : 0}
                        </p>
                    </div>
                </div>
                <div className="card eventCard">
                    <BsFillCircleFill
                        size={15}
                        color={colorMap.people}
                        className="circle"
                    />
                    <div>
                        <p
                            className="label tooltip bottom wide no-pointer"
                            data-tooltip="Events that contain a person after AI processing."
                        >
                            {labelMap.people}
                        </p>
                        <p
                            id={`kpi-${labelMap.people
                                .toLowerCase()
                                .split(' ')
                                .join('-')}`}
                            className="number"
                        >
                            {people ? people.value.toLocaleString() : 0}
                        </p>
                    </div>
                </div>
                <div className="card eventCard">
                    <BsFillCircleFill
                        size={15}
                        color={colorMap.vehicles}
                        className="circle"
                    />
                    <div>
                        <p
                            className="label tooltip bottom wide no-pointer"
                            data-tooltip="Events that contain a vehicle after AI processing."
                        >
                            {labelMap.vehicles}
                        </p>
                        <p
                            id={`kpi-${labelMap.vehicles
                                .toLowerCase()
                                .split(' ')
                                .join('-')}`}
                            className="number"
                        >
                            {vehicles ? vehicles.value.toLocaleString() : 0}
                        </p>
                    </div>
                </div>
            </div>
            <div className="pieChartsContainer">
                <div className="card">
                    <h3 className="cardTitle">Events</h3>
                    <div className="labelContainer">
                        <DashboardPieChartLabel
                            label={labelMap.events}
                            circleColor={colorMap.events}
                        />
                        <DashboardPieChartLabel
                            label={labelMap.mitigated}
                            circleColor={colorMap.mitigated}
                        />
                    </div>

                    {events?.value === 0 && mitigated?.value === 0 && (
                        <NoData id="no-events-data" />
                    )}
                    <div className="alertPieChartsContainer">
                        <DashboardPieChart
                            pieChartData={
                                events && mitigated ? [events, mitigated] : []
                            }
                        />
                    </div>
                </div>
                <div className="card">
                    <h3 className="cardTitle">Objects</h3>
                    <div className="labelContainer">
                        <DashboardPieChartLabel
                            label={labelMap.people}
                            circleColor={colorMap.people}
                        />
                        <DashboardPieChartLabel
                            label={labelMap.vehicles}
                            circleColor={colorMap.vehicles}
                        />
                    </div>
                    {people?.value === 0 && vehicles?.value === 0 && (
                        <NoData id="no-objects-data" />
                    )}
                    <div className="alertPieChartsContainer">
                        <DashboardPieChart
                            pieChartData={
                                people && vehicles ? [people, vehicles] : []
                            }
                        />
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="trafficVolumeTitleSection">
                    <div className="column">
                        <h3 className="cardTitle">Event Comparison</h3>
                        <div
                            id="events-displayed-dropdown-container"
                            className="field"
                        >
                            <span
                                id="events-displayed-label"
                                className="label tooltip bottom wide no-pointer"
                                data-tooltip="Select which events you'd like to display on the bar chart."
                            >
                                Events Displayed:
                            </span>
                            <SingleSelect
                                id="events-displayed-dropdown"
                                isClearable={false}
                                value={selectedBarChartDisplay}
                                onChange={(
                                    e:
                                        | MultiValue<SelectOption>
                                        | SingleValue<SelectOption>
                                ) => {
                                    if (e) {
                                        setSelectedBarChartDisplay(
                                            e as SelectOption
                                        );
                                    }
                                }}
                                options={getBarChartDisplayOptions(
                                    dashboardQuery.data?.features.loitering
                                )}
                            />
                        </div>
                    </div>
                    <div className="legend">
                        {(barChartDisplay === BarChartDisplay.TF ||
                            barChartDisplay === BarChartDisplay.All) && (
                            <>
                                <DashboardPieChartLabel
                                    label={labelMap.events}
                                    circleColor={colorMap.events}
                                />
                                <DashboardPieChartLabel
                                    label={labelMap.mitigated}
                                    circleColor={colorMap.mitigated}
                                />
                            </>
                        )}

                        {(barChartDisplay === BarChartDisplay.VP ||
                            barChartDisplay === BarChartDisplay.All) && (
                            <>
                                <DashboardPieChartLabel
                                    label={labelMap.people}
                                    circleColor={colorMap.people}
                                />
                                <DashboardPieChartLabel
                                    label={labelMap.vehicles}
                                    circleColor={colorMap.vehicles}
                                />
                                <DashboardPieChartLabel
                                    label={labelMap.peopleAndVehicles}
                                    circleColor={colorMap.peopleAndVehicles}
                                />
                            </>
                        )}

                        {barChartDisplay === BarChartDisplay.L && (
                            <DashboardPieChartLabel
                                label={labelMap.personLoitering}
                                circleColor={colorMap.personLoitering}
                            />
                        )}
                    </div>
                </div>
                {barChartData.filter((data) => data.total > 0).length === 0 && (
                    <NoData id="no-events-comparison-data" />
                )}
                <div className="eventsBarChartContainer">
                    <DashboardBarChart
                        barChartDisplay={barChartDisplay}
                        barChartData={barChartData}
                        colors={colorMap}
                        onBarClick={
                            selectedTimePreset.value !== TimePreset.Today &&
                            rangeStart.split(' ')[0] !== rangeEnd.split(' ')[0] // Grabs date at index 0 thus excludes time (hours, minutes, seconds).
                                ? handleBarClick
                                : undefined
                        }
                        showHourByHour={
                            selectedTimePreset.value !== TimePreset.Today
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
