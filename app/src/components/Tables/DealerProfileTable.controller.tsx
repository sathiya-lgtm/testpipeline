// Third party
import { ColumnDef, createColumnHelper, Row } from '@tanstack/react-table';
import { toast } from 'react-toastify';

// Custom
import formatApiTimeToLocalTime from '../../utils/formatApiTimeToLocalTime';
import formatApiDateToLocalDate from '../../utils/formatApiDateToLocalDate';
import extractErrorMessage from '../../utils/extractErrorMessage';

// Types
import { IAPIDealerChecklist } from '../../types/tng-api.interfaces';
import { IUser } from '../../types/interfaces';
import { FaCheck, FaTimes } from 'react-icons/fa';

export const timeSort = (
    rowA: Row<IAPIDealerChecklist>,
    rowB: Row<IAPIDealerChecklist>,
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

const columnHelper = createColumnHelper<IAPIDealerChecklist>();

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const generateColumns = (
    activeUser: IUser | null
): ColumnDef<IAPIDealerChecklist, any>[] => {
    const column: ColumnDef<IAPIDealerChecklist, any>[] = [];

    column.push(
        columnHelper.accessor(
            (row: IAPIDealerChecklist) => {
                const userName = activeUser?.username;

                if (userName) {
                    return userName;
                }

                return '-';
            },
            {
                id: 'user-name',
                header: () => 'User',
                cell: (info) => info.renderValue(),
            }
        )
    );
    column.push(
        columnHelper.accessor('created_at', {
            id: 'created-date',
            header: () => 'Created Date',
            cell: (info) => {
                const createdDate: string = info.renderValue();

                if (createdDate === '' || !createdDate) {
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
                        toastId: 'created date parsing fail',
                    });

                    return null;
                }
            },
        })
    );
    column.push(
        columnHelper.accessor('updated_at', {
            id: 'modified-date',
            header: () => 'Last Modified',
            cell: (info) => {
                const updatedDate: string = info.renderValue();

                if (updatedDate === '' || !updatedDate) {
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
                        toastId: 'last modified date parsing fail',
                    });

                    return null;
                }
            },
        })
    );
    column.push(
        columnHelper.accessor('status', {
            id: 'dealer-status',
            header: () => 'Completed',
            cell: (info) => {
                const dealerStatus = info.renderValue() as
                    | 'Pending'
                    | 'Completed';

                if (dealerStatus === 'Completed') {
                    return <FaCheck color="green" size={25} />;
                } else {
                    return <FaTimes color="red" size={25} />;
                }
            },
        })
    );

    return column;
};
