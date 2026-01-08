import { HTTPError } from '../classes/HTTPError';

/** An extension of the Fetch API's 'RequestInit' interface for
 * assigning Fetch's 2nd argument (i.e. fetch options) that adds
 * custom fields to be used in the customFetch wrapper.
 */
interface IFetchOptions extends RequestInit {
    timeout?: number;
}

/** The maximum amount of time an HTTP request can take, by default (milliseconds). */
export const defaultRequestTimeout = 8_000;

const host = import.meta.env.VITE_API_DOMAIN || '';

/** A fetch wrapper that adds custom functionality such as custom fetch timeout, fetch error throwing, host URL defaulting, and
 * defaults  for RequestInit "header" options that can be overwritten when necessary by passing in additional "header" fields to wrapper.
 * @param {RequestInfo | URL} path - Standard 'input' argument for fetch API, being referred to as "path" because I presume that is the
 * only value that will need to be provided here. A complete URL is created if React detects an app domain to prepend to said path.
 * @param {IFetchOptions} options - An extension of the Fetch API's 2nd "init" argument that allows for the addition of custom fields.
 * Anything that can be passed in as fetch's 2nd argument can be passed in here.
 * @param {string?} action - String describing to what effect the HTTP request is being made (i.e. what "action" is the request attempting to perform
 * in laymen's terms). For example, if the request is attempting to update a mask, the action might be "update mask". This can be used
 * to provide more user friendly error messages.
 * @returns {Promise<Response>} Response option returned from fetch API call.
 */
export default async (
    path: RequestInfo | URL,
    options: IFetchOptions,
    action?: string
): Promise<Response> => {
    const { timeout = defaultRequestTimeout } = options;
    const controller: AbortController = new AbortController();
    let timeoutId: number | undefined;

    let response: Response;
    let title: string | undefined;
    let description: string | undefined;

    if (timeout) {
        // Will "abort" fetch request if timeout is reached.
        timeoutId = window.setTimeout(() => controller.abort(), timeout);
    }

    /** Wrapped in try-catch because error could be thrown by browser before
     * the fetch completes (e.g. a CORS error or Abort error). Note: this type of error is different
     * from those referenced in "!response.ok" which presumably requires the fetch to complete,
     * hence handling "!response.ok" differently.
     */
    try {
        response = await fetch(`${host}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods':
                    'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers':
                    'Origin, Content-Type, x-requested-with, x-requested-by, X-Auth-Token',
                ...options.headers,
            },
            signal: controller.signal,
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            // If it's an Abort error, just continue throwing and let downstream handle it.
            throw error;
        }

        const errorMessage =
            error instanceof Error ? error.message : String(error);
        description =
            'Data transfer incomplete. Some application functionality may not be working properly. Try again later.';

        throw new HTTPError(errorMessage, 500, title, description, action);
    } finally {
        // Always remove the timeout, regardless of outcome.
        if (timeoutId) clearTimeout(timeoutId);
    }

    // If fetch completed, but was not successful.
    if (!response.ok) {
        // Attempt to grab details from Response.

        try {
            const obj = await response.json();
            const { details } = obj;

            title = details.title;
            description = details.description;
        } catch (err) {
            // The details from the Response are helpful, but not essential, thus do nothing upon failure.
        }

        throw new HTTPError(
            response.statusText,
            response.status,
            title,
            description,
            action
        );
    }

    return response;
};
