// React
import React, { FC, ReactElement, useContext, useState } from 'react';

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
    createDeleteIconTitle,
    createEditIconTitle,
    emailSort,
    isSelf,
    shouldEnableDeleteButton,
    shouldEnableEditButton,
} from './UserManagementTable.controller';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import EditIcon from '../../images/icons/EV.edit.svg?react';
import DeleteIcon from '../../images/icons/EV_ENT_CircleX.7.6.22.svg?react';

// Types
import { IManagedUser } from '../../types/tng-api.interfaces';

// Styles
import '../../styles/components/Tables/UserManagementTable.scss';
import { IUser } from '../../types/interfaces';

interface IProps {
    data: IManagedUser[];
    onEditClick: (managedUser: IManagedUser) => void;
    onDeleteClick: (managedUser: IManagedUser) => void;
}

/** Component that displays a table of users. TanStack's React Table library is
 * leveraged to create said table. The code is hard to read if you are unfamiliar with the library,
 * so be sure to review the official docs: https://tanstack.com/table/v8/docs/guide/overview
 * The documentation features some helpful, working examples: https://tanstack.com/table/v8/docs/examples/react/basic
 */
const UserManagementTable: FC<IProps> = ({
    data,
    onEditClick,
    onDeleteClick,
}: IProps): ReactElement => {
    const { activeUser } = useContext(AuthContext);
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'display-name', desc: false },
    ]);

    const tableOptions = {
        data,
        columns: generateColumns(activeUser),
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        sortingFns: {
            emailSort,
            markSort: () => {
                return 1;
            },
            timeSort: () => {
                return 1;
            },
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    };

    const table = useReactTable(tableOptions);

    return (
        <table
            id="user-management-table"
            data-testid="user-management-table"
            className="user-management-table"
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
            <tbody data-testid="user-management-table-body">
                {table.getRowModel().rows.map((row) => {
                    const shouldEnableDelete: boolean =
                        shouldEnableDeleteButton(row, activeUser as IUser);
                    const shouldEnableEdit: boolean = shouldEnableEditButton(
                        row,
                        activeUser as IUser
                    );
                    const isRowActiveUser: boolean = isSelf(
                        row,
                        activeUser as IUser
                    );

                    return (
                        <tr
                            id={row.id}
                            key={row.id}
                            data-testid={`row-for-${row.original.email}`}
                            className={`${
                                row.original.is_active ? '' : 'inactive'
                            } ${isRowActiveUser ? 'is-active-user' : ''}`}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    id={`${cell.column.id}-${row.id}`}
                                    className={
                                        cell.column.id === 'delete-user'
                                            ? 'delete-user-td'
                                            : undefined
                                    }
                                    key={
                                        cell.column.id === 'delete-user'
                                            ? row.original.email
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
                                        title={createEditIconTitle(
                                            shouldEnableEdit,
                                            isRowActiveUser
                                        )}
                                        data-testid={`edit-button-for-${row.original.email}`}
                                    >
                                        <EditIcon
                                            onClick={
                                                shouldEnableEdit
                                                    ? () =>
                                                          onEditClick(
                                                              row.original
                                                          )
                                                    : undefined
                                            }
                                            className={`${
                                                shouldEnableEdit
                                                    ? ''
                                                    : 'disabled'
                                            } edit-icon icon`}
                                        />
                                    </span>
                                    <span
                                        title={createDeleteIconTitle(
                                            shouldEnableDelete,
                                            isRowActiveUser
                                        )}
                                        data-testid={`delete-button-for-${row.original.email}`}
                                    >
                                        <DeleteIcon
                                            onClick={
                                                shouldEnableDelete
                                                    ? () =>
                                                          onDeleteClick(
                                                              row.original
                                                          )
                                                    : undefined
                                            }
                                            className={`${
                                                shouldEnableDelete
                                                    ? ''
                                                    : 'disabled'
                                            } delete-icon icon`}
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

export default UserManagementTable;
