// Third party
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';

// Custom types
import { IConsolidatedTemplateData } from './TemplatesDisplay';

const columnHelper = createColumnHelper<IConsolidatedTemplateData>();

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const columns: ColumnDef<IConsolidatedTemplateData, any>[] = [
    columnHelper.accessor('schedule_name', {
        id: 'schedule_name',
        header: () => 'Template Name',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
    columnHelper.accessor('schedule_time_zone_description', {
        id: 'schedule_time_zone_description',
        header: () => 'Time Zone',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
        enableGlobalFilter: true,
    }),
];
