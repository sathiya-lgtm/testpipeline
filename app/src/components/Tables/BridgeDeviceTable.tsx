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
import { FaRegKeyboard } from 'react-icons/fa';

// Components
import Input from '../Inputs/Input';

// Controller
import { columns } from './BridgeDeviceTable.conrtoller';

// types
import { IBridgeSource } from '../../views/Utilities/Forms/BridgeControls';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';

// styles
import '../../styles/components/Tables/AlertTable.scss';

interface IProps {
    data: IBridgeSource[];
    onControlOptions: (bridgeData: IBridgeSource) => void;
}

const BridgeDeviceTable: FC<IProps> = ({ onControlOptions, data }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable<IBridgeSource>({
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
            <div style={{ marginBottom: '1rem', maxWidth: 300 }}>
                <Input
                    className="input"
                    label="Search"
                    name="bridgeSearchInput"
                    id="bridgeSearchInput"
                    value={globalFilter}
                    onChange={setGlobalFilter}
                    type="text"
                />
            </div>
            <table className="bridge-device-table">
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
                                    <div className="column-title">Controls</div>
                                </div>
                            </th>
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => {
                        return (
                            <tr key={row.original.bridge_id} className="alert">
                                {row.getVisibleCells().map((cell, index) => (
                                    <td
                                        key={`${row.original.bridge_id}-${index}`}
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}

                                <td>
                                    <div className="icons-container">
                                        <FaRegKeyboard
                                            onClick={() =>
                                                onControlOptions(row.original)
                                            }
                                            className="control-icon"
                                            size={26}
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

export default BridgeDeviceTable;
