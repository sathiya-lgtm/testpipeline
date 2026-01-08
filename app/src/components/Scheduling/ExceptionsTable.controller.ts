// Third party
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';

// Custom types
import { IException } from '../../api_calls/ScheduleExceptions';

// utils
import { formatTimeStamp, formatDate } from './WeeklySchedule.controller';

const columnHelper = createColumnHelper<IException>();

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const columns: ColumnDef<IException, any>[] = [
    columnHelper.accessor('description', {
        id: 'description',
        header: () => 'Exception Name',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('is_armed', {
        id: 'is_armed',
        header: () => 'Status',
        cell: ({ getValue }) => {
            const isArmed = getValue();
            return isArmed ? 'Armed' : 'Disarmed';
        },
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('start_dt', {
        id: 'start_dt',
        header: () => 'Start Date/Time',
        cell: ({ getValue }) => {
            const [dateStr, timeStampStr] = getValue().split(' ');
            return `${formatDate(dateStr)} ${formatTimeStamp(timeStampStr)}`;
        },
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('end_dt', {
        id: 'end_dt',
        header: () => 'End Date/Time',
        cell: ({ getValue }) => {
            const [dateStr, timeStampStr] = getValue().split(' ');
            return `${formatDate(dateStr)} ${formatTimeStamp(timeStampStr)}`;
        },
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
];
