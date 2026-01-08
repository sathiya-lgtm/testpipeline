// Third party
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';

// Types
import { IStagesDealerAccount } from '../../types/tng-api.interfaces';

const columnHelper = createColumnHelper<IStagesDealerAccount>();

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const columns: ColumnDef<IStagesDealerAccount, any>[] = [
    columnHelper.accessor('account_name', {
        id: 'account_name',
        header: () => 'Insites Account Name',
        cell: (info) => info.renderValue(),
        sortDescFirst: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('site_name', {
        id: 'site_name',
        header: () => 'Insites Site Name',
        cell: (info) => info.renderValue(),
        sortDescFirst: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('stages_site_group_name', {
        id: 'stages_site_group_name',
        header: () => 'Stages Group Name',
        cell: (info) => info.renderValue(),
        sortDescFirst: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('stages_account_name', {
        id: 'stages_account_name',
        header: () => 'Stages Account Name',
        cell: (info) => info.renderValue(),
        sortDescFirst: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('stages_site_name', {
        id: 'stages_site_name',
        header: () => 'Stages Site Name',
        cell: (info) => info.renderValue(),
        sortDescFirst: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('user_name', {
        id: 'user_name',
        header: () => 'Username',
        cell: (info) => info.renderValue(),
        sortDescFirst: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('user_password', {
        id: 'user_password',
        header: () => 'Password',
        cell: (info) => info.renderValue(),
        sortDescFirst: true,
        enableGlobalFilter: true,
    }),
];
