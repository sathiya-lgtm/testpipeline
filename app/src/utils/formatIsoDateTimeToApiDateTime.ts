/** Takes an ISO string formatted date (e.g. 2023-03-16T01:41) then converts said string into a format
 * that the API expects. Said ISO formatted string should be in local time, subsequently does not denote
 * UTC via a "Z" at the end. The local ISO string needs to be converted to UTC before being formatted for
 * the API. The result is the following format: yyyy-mm-dd 00:00:00
 * @param {string} inputDate - ISO formatted string in local time.
 * @returns {string | undefined} An API compatible formatted date string "yyyy-mm-dd 00:00:00" or undefined if an empty string is provided.
 */
export default (inputDate: string, type?: 'endDate') => {
    const date = new Date(inputDate); // Local time.
    /**
     *  If type of end Date is provided, we add 59 seconds to the date, that way users don't miss any clips in the selected time period.  Also,
     *  this fixes the ui so that the date select does not show seconds. This will only be used on the end date time filter.
     */
    if (type === 'endDate') {
        date.setSeconds(date.getSeconds() + 59);
    }

    const formattedDatePart1 = date.toISOString().split('T')[0]; // Converts to UTC in ISO format, then grabs yyyy-mm-dd.
    const formattedDatePart2 = date.toUTCString().split(' ')[4]; // Converts to UTC then grabs hours:minutes:seconds.

    return `${formattedDatePart1} ${formattedDatePart2}`;
};
