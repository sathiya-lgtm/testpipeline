// Third party
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';

// Custom types
import { IBridgeSource } from '../../views/Utilities/Forms/BridgeControls';

const columnHelper = createColumnHelper<IBridgeSource>();

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const columns: ColumnDef<IBridgeSource, any>[] = [
    columnHelper.accessor('name', {
        id: 'bridge_name',
        header: () => 'Bridge Name',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('account_id', {
        id: 'account_id',
        header: () => 'Account ID',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('bridge_id', {
        id: 'bridge_id',
        header: () => 'Bridge ID',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('source_id', {
        id: 'source_id',
        header: () => 'Source ID',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
];
