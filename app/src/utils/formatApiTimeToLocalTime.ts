import format from 'date-fns/format';

/**
 * Converts date-time string expected from API into a local time string.
 * @param {string} apiTimeString - Date-time string from API in following format: {2023-03-29 21:30:11} (Note: the "|tz=UTC" suffice is removed prior).
 * @returns {string} Date in local time in following format {4:05:16 PM}.
 */
export default (apiTimeString: string): string => {
    // Note: the capital "Z" trailing the apiTimeString argument for Date constructor tells the Date object that the argument is in UTC.
    const formattedTime: string = format(new Date(`${apiTimeString}Z`), 'pp');

    return formattedTime;
};
