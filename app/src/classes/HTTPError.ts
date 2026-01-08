/** An extension of the browser's default Error class that incorporates properties (and potentially methods)
 * specific to HTTP errors. Was created to add error throwing to Fetch API requests.
 */
export class HTTPError extends Error {
    /** HTTP status code. Can be provided by Fetch API, InSite's API, the browser, added manually, etc. */
    statusCode: Number;

    /** A value that labels the error, usually provided by the InSites API if applicable.
     */
    title: string | undefined;

    /** A value that describes the error
     * in a user friendly format provided by the InSites API.
     */
    description: string | undefined;

    /**
     * String describing to what effect the HTTP request is being made (i.e. what "action" is the request attempting to perform
     * in laymen's terms). For example, if the request is attempting to update a mask, the action might be "update mask". This can be used
     * to provide more user friendly errors.
     */
    action: string | undefined;

    constructor(
        statusText: string,
        statusCode: Number,
        title?: string,
        description?: string,
        action?: string
    ) {
        super(statusText);

        this.statusCode = statusCode;
        this.title = title;
        this.description = description;
        this.action = action;
    }
}
