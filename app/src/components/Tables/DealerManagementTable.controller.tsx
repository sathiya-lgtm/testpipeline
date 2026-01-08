// Third party
import { ColumnDef, createColumnHelper, Row } from '@tanstack/react-table';
import { toast } from 'react-toastify';

// Custom
import formatApiTimeToLocalTime from '../../utils/formatApiTimeToLocalTime';
import formatApiDateToLocalDate from '../../utils/formatApiDateToLocalDate';
import extractErrorMessage from '../../utils/extractErrorMessage';

// Types
import { IDealerList } from '../../types/tng-api.interfaces';
import { IUser } from '../../types/interfaces';

export const timeSort = (
    rowA: Row<IDealerList>,
    rowB: Row<IDealerList>,
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

const columnHelper = createColumnHelper<IDealerList>();

/** Column definitions for TanStack's React Table API. Determines various qualities of each column
 * such as headers, values, ids, sorting logic, etc. Official doc: https://tanstack.com/table/v8/docs/guide/column-defs
 */
export const generateColumns = (
    activeUser: IUser | null
): ColumnDef<IDealerList, any>[] => {
    const column: ColumnDef<IDealerList, any>[] = [];

    column.push(
        columnHelper.accessor(
            (row: IDealerList) => {
                const serviceProviderName = row.service_provider_name;

                if (serviceProviderName) {
                    return serviceProviderName;
                }

                return '-';
            },
            {
                id: 'service-provider-name',
                header: () => 'Service Provider Name',
                cell: (info) => info.renderValue(),
                sortDescFirst: true,
            }
        )
    );
    // }
    column.push(
        columnHelper.accessor(
            (row: IDealerList) => {
                const dealerAccountNumber = row.dealer_account_number;

                if (dealerAccountNumber) {
                    return dealerAccountNumber;
                }

                return '-';
            },
            {
                id: 'dealer-account-number',
                header: () => 'Dealer Account Number',
                cell: (info) => info.renderValue(),
                sortDescFirst: true,
            }
        )
    );
    column.push(
        columnHelper.accessor(
            (row: IDealerList) => {
                const companyName = row.company_name;

                if (companyName) {
                    return companyName;
                }

                return '-';
            },
            {
                id: 'company-name',
                header: () => 'Company Name',
                cell: (info) => info.renderValue(),
                sortDescFirst: true,
            }
        )
    );
    column.push(
        columnHelper.accessor('status', {
            id: 'dealer-status',
            header: () => 'Status',
            cell: (info) => info.renderValue(),
            sortDescFirst: true,
        })
    );
    column.push(
        columnHelper.accessor('updated_at', {
            id: 'updated-at',
            header: () => 'Updated Date',
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
                        toastId: 'updated date parsing fail',
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
