/* eslint-disable react/no-array-index-key */
// react
import { useState, FC } from 'react';

// third party
import {
    flexRender,
    SortingState,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

// Components
// import Input from '../Inputs/Input';

// Controller
import { columns } from './ExceptionsTable.controller';

// types
import { IException } from '../../api_calls/ScheduleExceptions';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import EditIcon from '../../images/icons/EV.edit.svg?react';
import DeleteIcon from '../../images/icons/EV_ENT_CircleX.7.6.22.svg?react';

// styles
import '../../styles/components/Scheduling/ExceptionsTable.scss';

interface IProps {
    data: IException[];
    onEditExceptionClick: (rowData: IException) => void;
    onDeleteExceptionClick: (rowData: IException) => void;
}

const ExceptionsTable: FC<IProps> = ({
    data,
    onEditExceptionClick,
    onDeleteExceptionClick,
}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable<IException>({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        sortingFns: {
            markSort: () => {
                return 1;
            },
            timeSort: () => {
                return 1;
            },
            emailSort: () => {
                return 1;
            },
        },
    });

    return (
        <>
            {/* <div
                style={{
                    marginBottom: '1rem',
                    maxWidth: 300,
                }}
            >
                <Input
                    className="input"
                    label="Search"
                    name="bridgeSearchInput"
                    id="bridgeSearchInput"
                    value={globalFilter}
                    onChange={setGlobalFilter}
                    type="text"
                />
            </div> */}
            <table className="exceptions-table">
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
                            <tr
                                key={row.original.schedule_site_exception_id}
                                className="alert"
                            >
                                {row.getVisibleCells().map((cell, index) => (
                                    <td
                                        key={`${row.original.schedule_site_exception_id}-${index}`}
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
                                            className="edit-icon icon"
                                            id="edit-alert-btn"
                                            onClick={() =>
                                                onEditExceptionClick(
                                                    row.original
                                                )
                                            }
                                        />
                                        <DeleteIcon
                                            className="delete-icon icon"
                                            id="delete-alert-btn"
                                            onClick={() =>
                                                onDeleteExceptionClick(
                                                    row.original
                                                )
                                            }
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </>
    );
};

export default ExceptionsTable;
