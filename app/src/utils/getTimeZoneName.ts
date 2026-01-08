import { toast } from 'react-toastify';
import extractErrorMessage from './extractErrorMessage';

const toastId: string = 'timezone-warning';

/** Returns user's local timezone in timezone name format: 'america/chicago' (all lowercase)
 * or undefined upon error. Will display notification to user that data will be displayed in UTC
 * upon said error.
 */
export default (): string | undefined => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
    } catch (error) {
        const errorMessage: string = extractErrorMessage(error);

        console.error(errorMessage);
        toast.warn(
            'There was an issue detecting your time zone. Data will be displayed according to UTC time.',
            { toastId }
        );

        return undefined;
    }
};
