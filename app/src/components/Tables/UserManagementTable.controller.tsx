// Third party
import { ColumnDef, createColumnHelper, Row } from '@tanstack/react-table';
import { toast } from 'react-toastify';

// Custom
import sortByEmail from '../../utils/sortByEmail';
import formatApiTimeToLocalTime from '../../utils/formatApiTimeToLocalTime';
import formatApiDateToLocalDate from '../../utils/formatApiDateToLocalDate';
import extractErrorMessage from '../../utils/extractErrorMessage';
import getAccountType from '../../utils/getAccountType';

// Types
import { IManagedUser } from '../../types/tng-api.interfaces';
import { IUser } from '../../types/interfaces';
import isActiveUserAdmin from '../../utils/isActiveUserAdmin';
import { AccountType } from '../../types/enums';

export enum AccessLevel {
    Admin = 'Admin',
    Standard = 'Standard',
}

export const isSelf = (row: Row<IManagedUser>, activeUser: IUser): boolean => {
    return row.original.user_id === activeUser?.id;
};

export const shouldEnableEditButton = (
    row: Row<IManagedUser>,
    activeUser: IUser
) => {
    if (isSelf(row, activeUser)) return true;
    if (isActiveUserAdmin(activeUser)) return true;

    return false;
};

export const shouldEnableDeleteButton = (
    row: Row<IManagedUser>,
    activeUser: IUser
) => {
    if (isSelf(row, activeUser)) return false;
    if (!isActiveUserAdmin(activeUser)) return false;

    return true;
};

export const parseAccessLevel = (managedUser: IManagedUser): AccessLevel => {
    const { roles } = managedUser;
    const accountType = managedUser.account_type;

    if (accountType === 'customer') {
        return roles.UserIsAdmin ? AccessLevel.Admin : AccessLevel.Standard;
    }

    if (accountType === 'service provider') {
        return roles.AccountAdmin ? AccessLevel.Admin : AccessLevel.Standard;
    }

    if (accountType === 'evolon') {
        return AccessLevel.Admin;
    }

    throw new Error(`Error. Invalid account type: ${accountType}`);
};

export const createEditIconTitle = (
    shouldEnableEdit: boolean,
    isRowActiveUser: boolean
): string => {
    if (isRowActiveUser) {
        return 'Edit user';
    }

    if (shouldEnableEdit) {
        return 'Edit user';
    }

    return 'Edit user (Admin only)';
};

export const createDeleteIconTitle = (
    shouldEnableDelete: boolean,
    isRowActiveUser: boolean
): string => {
    if (isRowActiveUser) {
        return 'Cannot remove yourself. Contact an Admin to remove.';
    }

    if (shouldEnableDelete) {
        return 'Delete user';
    }

    return 'Delete user (Admin only)';
};

/** Compares two email address first by the domain name, then by the username */
export const emailSort = (
    rowA: Row<IManagedUser>,
    rowB: Row<IManagedUser>,
    columnId: string
): number => {
    const emailA = rowA.getValue(columnId) as string;
    const emailB = rowB.getValue(columnId) as string;

    return sortByEmail(emailA, emailB);
};

/** Compares two sibling rows and returns either 1, 0, or -1 based on the comparison.
 * This function should be used as a custom sort for React Table.
 * Expects column to be sorted in table to have valid string formatted dates as values.
 * Will convert date to local time before doing comparison, subsequently, local time should
 * be displayed on table or else sorting logic will appear flawed.
 */
export const timeSort = (
    rowA: Row<IManagedUser>,
    rowB: Row<IManagedUser>,
    columnId: string
): number => {
    const a = rowA.getValue(columnId) as string;
    const b = rowB.getValue(columnId) as string;
    let timeA: Date;
    let timeB: Date;

    if (a) {
        // Uses "columnId" (e.g. 'time') to grab date/time, converts said date/time to local time, then grabs time "hh:mm:ss".
        timeA = new Date(`${a}Z`); // ! The Z at the end tells the Date object that the argument is UTC.
    } else {
        timeA = new Date('1/1/2000');
    }

    if (b) {
        // ! The Z at the end tells the Date object that the argument is UTC.
        timeB = new Date(`${b}Z`);
    } else {
        timeB = new Date('1/1/2000');
    }

    return timeA.getTime() - timeB.getTime();
};

const columnHelper = createColumnHelper<IManagedUser>();

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const generateColumns = (
    activeUser: IUser | null
): ColumnDef<IManagedUser, any>[] => {
    const column: ColumnDef<IManagedUser, any>[] = [];
    const accountType: AccountType = getAccountType(activeUser);
    if (accountType === AccountType.Evolon) {
        column.push(
            columnHelper.accessor(
                (row: IManagedUser) => {
                    const companyName = row.company;
                    const isSP = row.account_type === 'service provider';

                    if (isSP) {
                        return companyName;
                    }

                    return '-';
                },
                {
                    id: 'serviceprovider',
                    header: () => 'Service Provider',
                    cell: (info) => info.renderValue(),
                    sortDescFirst: true,
                }
            )
        );
    }
    column.push(
        columnHelper.accessor(
            (row: IManagedUser) => {
                const companyName = row.company;
                const isCustomer = row.account_type === 'customer';

                if (isCustomer) {
                    return companyName;
                }

                return '-';
            },
            {
                id: 'customer',
                header: () => 'Customer',
                cell: (info) => info.renderValue(),
                sortDescFirst: true,
            }
        )
    );
    column.push(
        columnHelper.accessor('username', {
            id: 'display-name',
            header: () => 'Display Name',
            cell: (info) => info.renderValue(),
            sortDescFirst: true,
        })
    );
    column.push(
        columnHelper.accessor('email', {
            id: 'email',
            header: () => 'Email',
            cell: (info) => info.renderValue(),
            sortingFn: 'emailSort',
            sortDescFirst: true,
        })
    );
    column.push(
        columnHelper.accessor('last_login', {
            id: 'last-login',
            header: () => 'Last Login',
            cell: (info) => {
                const lastLogin: string = info.renderValue();

                if (lastLogin === '' || !lastLogin) {
                    return null;
                }

                try {
                    const formattedTime: string = `${formatApiDateToLocalDate(
                        info.renderValue() as string
                    )} ${formatApiTimeToLocalTime(
                        info.renderValue() as string
                    )}`;

                    return formattedTime;
                } catch (error) {
                    const errorMessage: string = extractErrorMessage(error);

                    toast.error(errorMessage, {
                        toastId: 'last login parsing fail',
                    });

                    return null;
                }
            },
            sortingFn: timeSort,
            sortDescFirst: true,
        })
    );
    return column;
};

export const columns: ColumnDef<IManagedUser, any>[] = [
    columnHelper.accessor(
        (row: IManagedUser) => {
            const companyName = row.company;
            const isCustomer = row.account_type === 'customer';

            if (isCustomer) {
                return companyName;
            }

            return '-';
        },
        {
            id: 'customer',
            header: () => 'Customer',
            cell: (info) => info.renderValue(),
            sortDescFirst: true,
        }
    ),
    columnHelper.accessor('username', {
        id: 'display-name',
        header: () => 'Display Name',
        cell: (info) => info.renderValue(),
        sortDescFirst: true,
    }),
    columnHelper.accessor('email', {
        id: 'email',
        header: () => 'Email',
        cell: (info) => info.renderValue(),
        sortingFn: 'emailSort',
        sortDescFirst: true,
    }),
    columnHelper.accessor('last_login', {
        id: 'last-login',
        header: () => 'Last Login',
        cell: (info) => {
            const lastLogin: string = info.renderValue();

            if (lastLogin === '' || !lastLogin) {
                return null;
            }

            try {
                const formattedTime: string = `${formatApiDateToLocalDate(
                    info.renderValue() as string
                )} ${formatApiTimeToLocalTime(info.renderValue() as string)}`;

                return formattedTime;
            } catch (error) {
                const errorMessage: string = extractErrorMessage(error);

                console.error(errorMessage);
                toast.error(errorMessage, {
                    toastId: 'last login parsing fail',
                });

                return null;
            }
        },
        sortingFn: timeSort,
        sortDescFirst: true,
    }),
];
