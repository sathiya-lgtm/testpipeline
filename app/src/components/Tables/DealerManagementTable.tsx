// React
import { FC, ReactElement, useContext, useState } from 'react';

// Third party
import {
    flexRender,
    SortingState,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

// Controller
import {
    // columns,
    generateColumns,
} from './DealerManagementTable.controller';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import EditIcon from '../../images/icons/EV.edit.svg?react';

// Types
import { IDealerList } from '../../types/tng-api.interfaces';

// Styles
import '../../styles/components/Tables/DealerManagementTable.scss';

interface IProps {
    data: IDealerList[];
    onEditClick: (dealerId?: string) => void;
}

const DealerManagementTable: FC<IProps> = ({
    data,
    onEditClick,
}: IProps): ReactElement => {
    const { activeUser } = useContext(AuthContext);

    const [sorting, setSorting] = useState<SortingState>([
        { id: 'service-provider-name', desc: false },
    ]);

    const tableOptions = {
        data,
        columns: generateColumns(activeUser),
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        sortingFns: {
            timeSort: () => {
                return 1;
            },
            emailSort: () => {
                return 1;
            },
            markSort: () => {
                return 1;
            },
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    };

    const table = useReactTable(tableOptions);

    return (
        <table
            id="dealer-management-table"
            data-testid="dealer-management-table"
            className="dealer-management-table"
        >
            <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <th
                                id={header.id}
                                key={header.id}
                                className={
                                    header.column.getCanSort()
                                        ? 'sortable'
                                        : 'not-sortable'
                                }
                                onClick={header.column.getToggleSortingHandler()}
                            >
                                <div className="th-content">
                                    {header.column.getCanSort() && (
                                        <DropDownArrowIcon
                                            className={`dropdown-arrow ${
                                                header.column.getIsSorted() ||
                                                'unsorted'
                                            }`}
                                        />
                                    )}
                                    <div className="column-title">
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </div>
                                </div>
                            </th>
                        ))}
                        <th className="not-sortable">
                            <div className="th-content">
                                <div className="column-title">Reconfigure</div>
                            </div>
                        </th>
                    </tr>
                ))}
            </thead>
            <tbody data-testid="dealer-management-table-body">
                {table.getRowModel().rows.map((row) => {
                    return (
                        <tr
                            id={row.id}
                            key={row.id}
                            data-testid={`row-for-${row.original.dealer_checklist_id}`}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    id={`${cell.column.id}-${row.id}`}
                                    className={
                                        cell.column.id === 'delete-dealer'
                                            ? 'delete-dealer-td'
                                            : undefined
                                    }
                                    key={
                                        cell.column.id === 'delete-dealer'
                                            ? row.original.dealer_checklist_id
                                            : cell.id
                                    }
                                >
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                            <td>
                                <div className="icons-container">
                                    <span
                                        title="Edit Dealer"
                                        data-testid={`edit-button-for-${row.original.dealer_checklist_id}`}
                                    >
                                        <EditIcon
                                            onClick={() =>
                                                onEditClick(
                                                    String(
                                                        row.original
                                                            .dealer_checklist_id
                                                    )
                                                )
                                            }
                                            className="edit-icon icon"
                                        />
                                    </span>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default DealerManagementTable;
