// Third party
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';

// Types
import { IStagesDealerCreds } from '../../types/tng-api.interfaces';

const columnHelper = createColumnHelper<IStagesDealerCreds>();

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const columns: ColumnDef<IStagesDealerCreds, any>[] = [
    columnHelper.accessor('dealer_name', {
        id: 'dealer_name',
        header: () => 'Dealer Name',
        cell: (info) => info.renderValue(),
        sortDescFirst: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('user_name', {
        id: 'user_name',
        header: () => 'Username',
        cell: (info) => info.renderValue(),
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('user_password', {
        id: 'user_password',
        header: () => 'Password',
        cell: (info) => info.renderValue(),
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('updated_at', {
        id: 'updated_at',
        header: () => 'Last Updated',
        cell: (info) => format(new Date(info.getValue()), 'M/dd/yyyy h:mm a'),
        enableGlobalFilter: false,
    }),
    columnHelper.accessor('days_to_expire', {
        id: 'days_to_expires',
        header: () => 'Days to Expire',
        cell: (info) => info.renderValue(),
        enableGlobalFilter: false,
    }),
];
