/* eslint-disable react/no-array-index-key */
// react
import React, { useContext, useState, FC } from 'react';

// third party
import {
    flexRender,
    SortingState,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

// Controller
import { generateColumns, emailSort } from './AlertTable.controller';
import Toggle from '../Inputs/Toggle';

// context
import { AuthContext } from '../../contexts/AuthProvider';

// types
import { IAlert } from '../../types/tng-api.interfaces';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import EditIcon from '../../images/icons/EV.edit.svg?react';
import DeleteIcon from '../../images/icons/EV_ENT_CircleX.7.6.22.svg?react';

// styles
import '../../styles/components/Tables/AlertTable.scss';

interface IProps {
    data: IAlert[];
    onEditClick: (alertData: IAlert) => void;
    onDeleteClick: (alertData: IAlert) => void;
}

const AlertTable: FC<IProps> = ({ onEditClick, data, onDeleteClick }) => {
    const { activeUser } = useContext(AuthContext);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState({});

    const table = useReactTable<IAlert>({
        data,
        columns: generateColumns(activeUser),
        state: {
            sorting,
            columnVisibility,
        },
        onColumnVisibilityChange: setColumnVisibility,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        sortingFns: {
            markSort: () => {
                return 1;
            },
            timeSort: () => {
                return 1;
            },
            emailSort,
        },
    });

    return (
        <div>
            {table.getColumn(`serviceProvider`) && (
                <li className="service-provider-toggle-container">
                    <p>Show SP</p>
                    <Toggle
                        id="hide-service-provider"
                        value={
                            table
                                .getColumn(`serviceProvider`)
                                ?.getIsVisible() ?? false
                        }
                        onToggleChange={table
                            .getColumn(`serviceProvider`)
                            ?.getToggleVisibilityHandler()}
                        toggleOnText="True"
                        toggleOffText="False"
                    />
                </li>
            )}
            <table className="alerts-table">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
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
                                    <div className="column-title">
                                        Reconfigure
                                    </div>
                                </div>
                            </th>
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => {
                        return (
                            <tr key={row.original.alert_id} className="alert">
                                {row.getVisibleCells().map((cell, index) => (
                                    <td
                                        key={`${row.original.alert_id}-${index}`}
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}

                                <td>
                                    <div className="icons-container">
                                        <EditIcon
                                            onClick={() =>
                                                onEditClick(row.original)
                                            }
                                            className="edit-icon icon"
                                            id="edit-alert-btn"
                                        />
                                        <DeleteIcon
                                            onClick={() =>
                                                onDeleteClick(row.original)
                                            }
                                            className="delete-icon icon"
                                            id="delete-alert-btn"
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AlertTable;
