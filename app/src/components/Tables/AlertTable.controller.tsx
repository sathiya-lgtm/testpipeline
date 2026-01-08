// Third party
import { ColumnDef, createColumnHelper, Row } from '@tanstack/react-table';

// Custom
import sortByEmail from '../../utils/sortByEmail';
import getAccountType from '../../utils/getAccountType';

// Custom types
import { IUser } from '../../types/interfaces';
import { IAlert, IAlertProperties } from '../../types/tng-api.interfaces';
import { AccountType } from '../../types/enums';

const columnHelper = createColumnHelper<IAlert>();

/** Compares two email address first by the domain name, then by the username */
export const emailSort = (
    rowA: Row<IAlert>,
    rowB: Row<IAlert>,
    columnId: string
): number => {
    const emailA = (rowA.getValue(columnId) as IAlertProperties).to_email;
    const emailB = (rowB.getValue(columnId) as IAlertProperties).to_email;

    return sortByEmail(emailA, emailB);
};

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const generateColumns = (
    activeUser: IUser | null
): ColumnDef<IAlert, any>[] => {
    const column: ColumnDef<IAlert, any>[] = [];
    const accountType: AccountType = getAccountType(activeUser);
    if (accountType === AccountType.Evolon) {
        column.push(
            columnHelper.accessor('service_provider_name', {
                id: 'serviceProvider',
                header: () => 'Service Provider',
                cell: (info) => info.renderValue(),
                enableMultiSort: true,
                enableHiding: true,
            })
        );
    }
    column.push(
        columnHelper.accessor('account_name', {
            id: 'customer',
            header: () => 'Customer',
            cell: (info) => info.renderValue(),
            enableMultiSort: true,
            enableHiding: true,
        })
    );
    column.push(
        columnHelper.accessor('site_name', {
            id: 'site',
            header: () => 'Site',
            cell: (info) => info.renderValue(),
            enableMultiSort: true,
            enableHiding: true,
        })
    );
    column.push(
        columnHelper.accessor('camera_name', {
            id: 'camera',
            header: () => 'Camera',
            cell: (info) => info.renderValue(),
            enableMultiSort: true,
            enableHiding: true,
        })
    );
    column.push(
        columnHelper.accessor('alert_name', {
            id: 'alertName',
            header: () => 'Alert Name',
            cell: (info) => info.renderValue(),
            enableMultiSort: true,
            enableHiding: true,
        })
    );
    column.push(
        columnHelper.accessor('alert_type', {
            id: 'alertType',
            header: () => 'Alert Recipient',
            cell: (info) => {
                const value = info.renderValue();

                if (value === 'email') {
                    return 'Email';
                }

                if (value === 'immix') {
                    return 'Immix Event';
                }

                if (value === 'device-io') {
                    return 'Immix Input Alarm';
                }

                if (value === 'immix-fortify-alert') {
                    return 'Immix Fortifeye Alert';
                }

                return info.renderValue();
            },
            enableMultiSort: true,
            enableHiding: true,
        })
    );
    column.push(
        columnHelper.accessor('alert_properties', {
            id: 'sendTo',
            header: () => 'Send to',
            cell: (info) => {
                const infoObj = info.getValue();

                if (infoObj.to_email) return infoObj.to_email;
                return 'N/A';
            },
            sortingFn: 'emailSort',
            enableMultiSort: true,
            enableHiding: true,
        })
    );
    return column;
};

export const columns: ColumnDef<IAlert, any>[] = [
    columnHelper.accessor('account_name', {
        id: 'customer',
        header: () => 'Customer',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
    }),
    columnHelper.accessor('site_name', {
        id: 'site',
        header: () => 'Site',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
    }),
    columnHelper.accessor('camera_name', {
        id: 'camera',
        header: () => 'Camera',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
    }),
    columnHelper.accessor('alert_name', {
        id: 'alertName',
        header: () => 'Alert Name',
        cell: (info) => info.renderValue(),
        enableMultiSort: true,
    }),
    columnHelper.accessor('alert_type', {
        id: 'alertType',
        header: () => 'Alert Recipient',
        cell: (info) => {
            const value = info.renderValue();

            if (value === 'email') {
                return 'Email';
            }

            if (value === 'immix') {
                return 'Immix Event';
            }

            if (value === 'device-io') {
                return 'Immix Input Alarm';
            }

            if (value === 'immix-fortify-alert') {
                return 'Immix Fortifeye Alert';
            }

            return info.renderValue();
        },
        enableMultiSort: true,
    }),
    columnHelper.accessor('alert_properties', {
        id: 'sendTo',
        header: () => 'Send to',
        cell: (info) => {
            const infoObj = info.getValue();

            if (infoObj.to_email) return infoObj.to_email;
            return 'N/A';
        },
        sortingFn: 'emailSort',
        enableMultiSort: true,
    }),
];
