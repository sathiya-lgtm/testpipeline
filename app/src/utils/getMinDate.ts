// Third party
import { format, subDays } from 'date-fns';

/**
 * Returns a formatted date string based on today's date or a specified number of days back.
 * If days_back is provided, it calculates the date that many days in the past.
 * @param {number} [days_back] - Optional number of days to go back from today.
 * @returns {string} The calculated date in "yyyy-MM-dd" format.
 */
export default (days_back?: number): string => {
    let today = new Date();

    // If days_back is provided, subtract that many days from the current date.
    if (days_back !== undefined) {
        today = subDays(today, days_back);
    }

    // Takes Date object and formats to string in "yyyy-MM-dd" format in client timezone.
    return format(today, 'yyyy-MM-dd 00:00');
};
