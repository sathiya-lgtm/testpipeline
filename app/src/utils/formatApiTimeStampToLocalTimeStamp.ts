import format from 'date-fns/format';

/**
 * Converts date-time string expected from API into a local date string.
 * @param {string} apiTimeStampString - Date-time string from API in following format: {2023-03-29 21:30:11} (Note: the "|tz=UTC" suffice is removed prior).
 * @returns {string} Date in local time in following format {mm-dd-yyyy}
 */
export default (apiTimeStampString: string): string => {
    const [apiDateString, apiTimeString] = apiTimeStampString.split(' ');
    // Note: the capital "Z" trailing the apiDateString argument for Date constructor tells the Date object that the argument is in UTC.
    const formattedDate: string = format(
        new Date(`${apiDateString}Z${apiTimeString}`),
        'MM-dd-yyyy - hh:mm:ss a'
    );

    return formattedDate;
};
