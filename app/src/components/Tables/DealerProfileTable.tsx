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
import { generateColumns } from './DealerProfileTable.controller';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import EditIcon from '../../images/icons/EV.edit.svg?react';

// Types
import { IAPIDealerChecklist } from '../../types/tng-api.interfaces';

// Styles
import '../../styles/components/Tables/DealerManagementTable.scss';
import { FaRegFilePdf } from 'react-icons/fa';

interface IProps {
    data: IAPIDealerChecklist[];
    onEditClick: (dealerId?: string) => void;
    generatePDF: () => void;
}

const DealerProfileTable: FC<IProps> = ({
    data,
    onEditClick,
    generatePDF,
}: IProps): ReactElement => {
    const { activeUser } = useContext(AuthContext);

    const hasCompleted = data.some((d) => d.status === 'Completed');

    const [sorting, setSorting] = useState<SortingState>([
        { id: 'user-name', desc: false },
    ]);

    const tableOptions = {
        data,
        columns: generateColumns(activeUser),
        state: {
            sorting,
        },
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
            id="dealer-profile-table"
            data-testid="dealer-profile-table"
            className="dealer-profile-table"
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
                        {hasCompleted && (
                            <th className="not-sortable">
                                <div className="th-content">
                                    <div className="column-title">
                                        Export PDF
                                    </div>
                                </div>
                            </th>
                        )}
                        <th className="not-sortable">
                            <div className="th-content">
                                <div className="column-title">Edit/Update</div>
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
                            data-testid={`row-for-${row.original.dealer_onboarding_checklist_id}`}
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
                                            ? row.original
                                                  .dealer_onboarding_checklist_id
                                            : cell.id
                                    }
                                >
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                            {hasCompleted && (
                                <td>
                                    <div className="icons-container">
                                        <span
                                            title="Export as PDF"
                                            data-testid={`export-for-${row.original.dealer_onboarding_checklist_id}`}
                                        >
                                            <FaRegFilePdf
                                                size={25}
                                                onClick={() => generatePDF()}
                                            />
                                        </span>
                                    </div>
                                </td>
                            )}
                            <td>
                                <div className="icons-container">
                                    <span
                                        title="Edit Dealer"
                                        data-testid={`edit-button-for-${row.original.dealer_onboarding_checklist_id}`}
                                    >
                                        <EditIcon
                                            onClick={() => onEditClick()}
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

export default DealerProfileTable;
