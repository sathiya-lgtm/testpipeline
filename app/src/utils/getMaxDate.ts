// Third party
import { format } from 'date-fns';

/**
 * Returns tomorrows date as to be supplied as max value
 * for date input element.
 * @returns {string} Today's date in "2023-03-21" format.
 */
export default (): string => {
    const today = new Date();

    // Takes Date object and formats to string in "yyyy-MM-dd" format in client timezone.
    return format(today, 'yyyy-MM-dd HH:MM');
};
