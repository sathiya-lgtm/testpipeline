/** Represents an object that features a created_at property. */
interface IDate {
    created_at: string;
}

/** Callback function to be passed to Array.sort method that will
 * sort elements by their ".created_at" property in descending order.
 * @param {IDate} a - First object (with .created_at property) to be sorted.
 * @param {IDate} b - Second element (with .created_at property) to be sorted.
 * @returns {number} A positive number, negative number or 0.
 */
export default (a: IDate, b: IDate): number =>
    new Date(`${b.created_at}Z`).getTime() -
    new Date(`${a.created_at}Z`).getTime();
