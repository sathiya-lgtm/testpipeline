// Third party
import { format, subDays } from 'date-fns';

// Custom types
import { SelectOption } from '../../../../types/interfaces';
import { ListTarget } from '../../../../contexts/ListTarget.controller';
import {
    IDashboardData,
    IEventDay,
    IEventHour,
} from '../../../../types/tng-api.interfaces';
import extractErrorMessage from '../../../../utils/extractErrorMessage';

enum Color {
    Yellow = '#ECB320',
    Red = '#ED1C24',
    Green = '#65bc7b',
    LightBlue = '#00AADC',
    Blue = '#3D7691',
    Gold = '#F7941D',
    Violet = '#6147FF',
}

export enum TimePreset {
    Custom = 'Custom',
    'Today' = 'Today',
    '7 Days' = '7 Days',
    '14 Days' = '14 Days',
    '30 Days' = '30 Days',
    '60 Days' = '60 Days',
    '90 Days' = '90 Days',
}

export enum BarChartDisplay {
    TF = 'True and False Events',
    VP = 'Vehicle and Person Events',
    L = 'Loitering Events',
    All = 'All Events',
}

export interface IKpi {
    name: string;
    color: Color;
    value: number;
}

export interface IBarChartData {
    name: string;
    events: number;
    mitigated: number;
    people: number;
    vehicles: number;
    peopleAndVehicles: number;
    personLoitering: number;
    vehicleLoitering: number;
    total: number;
}

export const colorMap = {
    events: Color.Green,
    mitigated: Color.Gold,
    people: Color.Red,
    vehicles: Color.LightBlue,
    peopleAndVehicles: Color.Violet,
    personLoitering: Color.Red,
};

export const labelMap = {
    events: 'True Events',
    mitigated: 'False Events',
    people: 'Person Events',
    vehicles: 'Vehicle Events',
    peopleAndVehicles: 'Person and Vehicle Events',
    personLoitering: 'Person Loitering Events',
};

export const getBarChartDisplayOptions = (showLoitering?: boolean) => {
    const options: SelectOption[] = [
        {
            label: BarChartDisplay.TF,
            value: BarChartDisplay.TF,
        },
        {
            label: BarChartDisplay.VP,
            value: BarChartDisplay.VP,
        },
        {
            label: BarChartDisplay.All,
            value: BarChartDisplay.All,
        },
    ];

    if (showLoitering) {
        options.splice(2, 0, {
            label: BarChartDisplay.L,
            value: BarChartDisplay.L,
        });
    }

    return options;
};

export const timePresetOptions = (
    retentionDays: number | undefined
): SelectOption[] => {
    const options: SelectOption[] = [];

    const presets = Object.values(TimePreset);

    presets.forEach((preset) => {
        const numberPattern = /\d+/; // Regular expression to match one or more digits
        const numberMatch = preset.match(numberPattern);
        let isDisabled = false;

        if (numberMatch && retentionDays) {
            const days = parseInt(numberMatch[0], 10);
            if (days > retentionDays) {
                isDisabled = true;
            }
        }

        options.push({
            label: preset,
            value: preset,
            isDisabled,
        });
    });

    return options;
};

/** Converts a date string to another format. Accepts a date string of either "yyyy-MM-dd" or "MM/dd/yyyy" format
 * and outputs a format of either "yyyy-MM-dd" or "MM/dd/yyyy". Output format is specified as the second argument.
 * @param {string} inputFormat - Current format of string either "yyyy-MM-dd" or "MM/dd/yyyy".
 * @param {'yyyy-MM-dd' | 'MM/dd/yyyy'} outputFormat - Desired output format either "yyyy-MM-dd" or "MM/dd/yyyy".
 * @returns {string}
 */
export const convertDashboardDateFormat = (
    inputFormat: string,
    outputFormat: 'yyyy-MM-dd' | 'MM/dd/yyyy'
): string => {
    /** Matches yyyy-MM-dd with exceptions for 1 digit month and day (e.g. yyyy-M-d). */
    const regExPattern1: RegExp = /^\d{4}[-]\d{1,2}[-]\d{1,2}$/;
    /** Matches MM/dd/yyyy with exceptions for 1 digit month and day (e.g. M/d/yyyy). */
    const regExPattern2: RegExp = /^\d{1,2}[/]\d{1,2}[/]\d{4}$/;

    if (
        regExPattern1.test(inputFormat) === false &&
        regExPattern2.test(inputFormat) === false
    ) {
        throw new Error(
            `Input date string format is not valid. Input string: ${inputFormat}\nValid formats include "yyyy-MM-dd" or "MM/dd/yyyy".`
        );
    }

    if (outputFormat === 'MM/dd/yyyy') {
        const asArray = inputFormat.split('-');

        return [asArray[1], asArray[2], asArray[0]].join('/');
    }

    const asArray = inputFormat.split('/');

    return [asArray[2], asArray[0], asArray[1]].join('-');
};

/** Takes Date object and formats to string in "yyyy-MM-dd 00:00:00" format in client timezone.
 * Keep in mind the beginning of the day in client timezone could be yesterday in UTC.
 *
 * Note: always supply a Date object where the time is defined, otherwise the Date constructor
 * will assume the time, which will lead to incorrect date conversions in this function.
 * For example, do not pass in new Date("2013-12-12") as an argument.
 */
export const setToBeginningOfDay = (date: Date): string => {
    return `${format(date, 'yyyy-MM-dd')} 00:00:00`;
};

/** Takes Date object and formats to string in "yyyy-MM-dd 23:59:59" format in client timezone.
 * Keep in mind the end of the day in client timezone could be tomorrow in UTC.
 *
 * Note: always supply a Date object where the time is defined, otherwise the Date constructor
 * will assume the time, which will lead to incorrect date conversions in this function.
 * For example, do not pass in new Date("2013-12-12") as an argument.
 */
export const setToEndOfDay = (date: Date): string => {
    return `${format(date, 'yyyy-MM-dd')} 23:59:59`;
};

/** Takes a time preset and subtracts the number of days indicated in said preset
 * then sets to the very beginning of the resulting day (e.g. 00:00:00).
 * @param {SelectOption} timePreset - Option featuring TimePresent as value.
 * @returns {string} Date string in client timezone in following format "yyyy-MM-dd 00:00:00".
 */
export const calculateStartDateFromPreset = (
    timePreset: SelectOption
): string => {
    let startDate: Date;

    switch (timePreset.value) {
        case TimePreset['90 Days']:
            startDate = subDays(new Date(), 89);

            break;
        case TimePreset['60 Days']:
            startDate = subDays(new Date(), 59);

            break;
        case TimePreset['30 Days']:
            startDate = subDays(new Date(), 29);

            break;
        case TimePreset['14 Days']:
            startDate = subDays(new Date(), 13);

            break;
        case TimePreset['7 Days']:
            startDate = subDays(new Date(), 6);

            break;
        default:
            startDate = new Date();
    }

    /** Start date zeroed out e.g. 1993/01/01 00:00:00 */
    const beginningOfStartDate: string = setToBeginningOfDay(startDate);

    return beginningOfStartDate;
};

/** Returns the end of today's date/time in format compatible with API (e.g. yyyy-mm-dd 23:59:59)
 * in client timezone. */
export const getEndDate = (): string => {
    const date = new Date();

    /** Today set to the final minute of final hour (e.g. 1993/01/01 23:59:59) */
    const endOfToday: string = setToEndOfDay(date);

    return endOfToday;
};

export const getTargetedAccount = (
    listTarget: ListTarget | null
): undefined | number[] => {
    if (listTarget === null || listTarget.type !== 'account') {
        return undefined;
    }

    return [listTarget.customerId];
};

export const getTargetedSites = (
    listTarget: ListTarget | null
): undefined | number[] => {
    if (listTarget === null || listTarget.type !== 'site') {
        return undefined;
    }

    return [listTarget.siteId];
};

export const getTargetedCameras = (
    listTarget: ListTarget | null
): undefined | number[] => {
    if (listTarget === null || listTarget.type !== 'camera') {
        return undefined;
    }

    return [listTarget.cameraId];
};

/** Returns Dashboard Data as sorted array.
 * Sorts Dashboard Data object by "date" in ascending order. The expected "date" format
 * is a string of 'yyyy-mm-dd'.
 */
export const sortDashboardData = (
    dashboardData: IDashboardData
): [string, IEventDay][] => {
    const asArray: [string, IEventDay][] = Object.entries(dashboardData);

    /** "dayLabels" should be date string formatted as 'yyyy-mm-dd' */
    const sortedArray = asArray.sort(
        ([dayLabelA], [dayLabelB]) =>
            // Sorts by date in ascending order.
            new Date(dayLabelA).getTime() - new Date(dayLabelB).getTime()
    );

    return sortedArray;
};

/** Returns a number 0-23 that corresponds to the user's current hour that
 * can then be used to index into an array.
 * @returns {number} A number between 0-23 that represents user's current hour.
 */
export const getHourIndexForCurrentTime = (): number => {
    return Number(format(new Date(), 'H'));
};

/** Returns a time label that corresponds to an hour (represented as an index of 0-23).
 * @param {number} hourIndex - A number between 0-23 that represents an hour of the day.
 * @returns {string} A label representing an hour of the day (e.g. 12:00 AM).
 */
export const convertHourIndexToLabel = (hourIndex: number) => {
    switch (hourIndex) {
        case 0:
            return '12:00 AM';
        case 1:
            return '01:00 AM';
        case 2:
            return '02:00 AM';
        case 3:
            return '03:00 AM';
        case 4:
            return '04:00 AM';
        case 5:
            return '05:00 AM';
        case 6:
            return '06:00 AM';
        case 7:
            return '07:00 AM';
        case 8:
            return '08:00 AM';
        case 9:
            return '09:00 AM';
        case 10:
            return '10:00 AM';
        case 11:
            return '11:00 AM';
        case 12:
            return '12:00 PM';
        case 13:
            return '01:00 PM';
        case 14:
            return '02:00 PM';
        case 15:
            return '03:00 PM';
        case 16:
            return '04:00 PM';
        case 17:
            return '05:00 PM';
        case 18:
            return '06:00 PM';
        case 19:
            return '07:00 PM';
        case 20:
            return '08:00 PM';
        case 21:
            return '09:00 PM';
        case 22:
            return '10:00 PM';
        case 23:
            return '11:00 PM';
        default:
            throw new Error(`Invalid hour index: ${hourIndex}`);
    }
};

/**
 * Converts event day to bar chart compatible format.
 * @param dayLabel - Label representing day of event day (i.e. "yyyy-mm-dd")
 * @param eventDayData - Day's worth of Dashboard data.
 * @returns {IBarChartData[]}
 */
export const convertToBarChartDay = (
    dayLabel: string,
    eventDayData: IEventDay
): IBarChartData => {
    const barChartDay: IBarChartData = {
        name: convertDashboardDateFormat(dayLabel, 'MM/dd/yyyy'),
        events: 0,
        mitigated: 0,
        people: 0,
        vehicles: 0,
        peopleAndVehicles: 0,
        total: 0,
        personLoitering: 0,
        vehicleLoitering: 0,
    };
    const hours: IEventHour[] = Object.values(eventDayData);

    hours.forEach((hour: IEventHour) => {
        const peopleAndVehicles: number =
            hour.person + hour.vehicle - hour.captured_events;

        barChartDay.events += hour.captured_events;
        barChartDay.mitigated += hour.mitigated;
        barChartDay.people += hour.person - peopleAndVehicles;
        barChartDay.vehicles += hour.vehicle - peopleAndVehicles;
        barChartDay.peopleAndVehicles += peopleAndVehicles;
        barChartDay.personLoitering += hour.person_loitering;
        barChartDay.vehicleLoitering += hour.vehicle_loitering;
        barChartDay.total += hour.captured_events + hour.mitigated;
    });

    return barChartDay;
};

/**
 * Converts an event hour to a bar chart compatible format.
 * @param hourIndex - Number between 0-23 representing the hour of the day.
 * @param eventHour - An hour's worth of Dashboard data.
 * @returns {IBarChartData[]}
 */
export const convertToBarChartHour = (
    hourIndex: number,
    eventHour: IEventHour
): IBarChartData => {
    const peopleAndVehicles: number =
        eventHour.person + eventHour.vehicle - eventHour.captured_events;

    const barChartHour: IBarChartData = {
        name: convertHourIndexToLabel(hourIndex),
        events: eventHour.captured_events,
        mitigated: eventHour.mitigated,
        people: eventHour.person - peopleAndVehicles,
        vehicles: eventHour.vehicle - peopleAndVehicles,
        peopleAndVehicles,
        personLoitering: eventHour.person_loitering,
        vehicleLoitering: eventHour.vehicle_loitering,
        total: eventHour.captured_events + eventHour.mitigated,
    };

    return barChartHour;
};

/**
 * Creates bar chart data grouped by day.
 * @param dashboardData - Dashboard data as an array.
 * @returns {IBarChartData[]}
 */
export const createDailyBarChartData = (
    dashboardData: [string, IEventDay][]
): IBarChartData[] => {
    const chartData: IBarChartData[] = [];

    dashboardData.forEach(([dayLabel, eventDay]) => {
        const barChartDay = convertToBarChartDay(dayLabel, eventDay);

        chartData.push(barChartDay);
    });

    return chartData;
};

/** Creates bar chart compatible data that displays data for each hour of the provided "targetDay".
 * @param {IEventDay} targetDay
 * @returns {IBarChartData[]}
 */
export const createHourlyBarChartData = (
    targetDay: IEventDay
): IBarChartData[] => {
    const chartData: IBarChartData[] = [];

    const eventHours: [string, IEventHour][] = Object.entries(targetDay);

    eventHours.forEach(([, eventHour], hourIndex) => {
        const barChartHour = convertToBarChartHour(hourIndex, eventHour);

        chartData.push(barChartHour);
    });

    return chartData;
};

/**
 * Creates data of the last 24 hours to be displayed on Bar Chart.
 * @param {[string, IEventDay][]} sortedDashboardData - Dashboard data as a sorted array.
 * @returns {IBarChartData[]} Data for the last 24 hours to be displayed on Bar Chart.
 */
export const createBarChartDataForLast24Hours = (
    sortedDashboardData: [string, IEventDay][]
): IBarChartData[] => {
    const currentHourAsIndex: number = getHourIndexForCurrentTime();
    let todaysEventDay: IEventDay = {};
    let yesterdaysEventDay: IEventDay = {};

    try {
        // eslint-disable-next-line prefer-destructuring
        todaysEventDay = sortedDashboardData[1][1];
    } catch (error) {
        const errorMessage: string = extractErrorMessage(error);

        console.error(errorMessage);
    }

    try {
        // eslint-disable-next-line prefer-destructuring
        yesterdaysEventDay = sortedDashboardData[0][1];
    } catch (error) {
        const errorMessage: string = extractErrorMessage(error);

        console.error(errorMessage);
    }

    const todaysHourlyBarChartData: IBarChartData[] = createHourlyBarChartData(
        todaysEventDay
    ).slice(0, currentHourAsIndex);
    const yesterdaysHourlyBarChartData: IBarChartData[] =
        createHourlyBarChartData(yesterdaysEventDay).slice(currentHourAsIndex);

    return [...yesterdaysHourlyBarChartData, ...todaysHourlyBarChartData];
};

/**
 * Extracts data for Dashboard KPIs from an array of Dashboard data.
 * @param {[string, IEventDay][]} dashboardData - Dashboard data as an array.
 * @returns - An object of type {[key: string]: IKpi}
 */
export const extractKPIs = (
    dashboardData: [string, IEventDay][]
): {
    totalEvents: IKpi;
    totalMitigated: IKpi;
    totalPeople: IKpi;
    totalVehicles: IKpi;
} => {
    const totalEvents: IKpi = {
        name: labelMap.events,
        value: 0,
        color: colorMap.events,
    };
    const totalMitigated: IKpi = {
        name: labelMap.mitigated,
        value: 0,
        color: colorMap.mitigated,
    };
    const totalPeople: IKpi = {
        name: labelMap.people,
        value: 0,
        color: colorMap.people,
    };
    const totalVehicles: IKpi = {
        name: labelMap.vehicles,
        value: 0,
        color: colorMap.vehicles,
    };

    dashboardData.forEach(([, eventDay]) => {
        const eventHours: IEventHour[] = Object.values(eventDay);

        eventHours.forEach((eventHour) => {
            totalEvents.value += eventHour.captured_events;
            totalMitigated.value += eventHour.mitigated;
            totalPeople.value += eventHour.person;
            totalVehicles.value += eventHour.vehicle;
        });
    });

    return {
        totalEvents,
        totalMitigated,
        totalPeople,
        totalVehicles,
    };
};
