/** Attempts to extract Error.message from instance of Error class, otherwise
 * converts "error" argument to string.
 * @param {any} error - Error class instance or any.
 * @return {string} - Extracted Error.message or "error" converted to string.
 */
export default (error: any): string => {
    return error instanceof Error ? error.message : String(error);
};
