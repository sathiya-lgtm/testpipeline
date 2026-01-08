/* eslint-disable no-await-in-loop */
// React
import React, { FC, ReactElement, useState, useEffect } from 'react';

// Third party
import {
    flexRender,
    SortingState,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Api Calls
import refreshStagesPassword from '../../api_calls/refreshStagesPassword';

// Controller
import { columns } from './StagesDealersCredsTable.controller';

// Components
import Input from '../Inputs/Input';
import RefreshStagesPasswordModal from '../Modals/RefreshStagesPasswordModal';
import LoadingModal from '../Modals/LoadingModal';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';

// Types
import { IStagesDealerCreds } from '../../types/tng-api.interfaces';
import { IUser } from '../../types/interfaces';

// Styles
import '../../styles/components/Tables/StagesDealersTable.scss';

interface IProps {
    data: IStagesDealerCreds[];
    activeUser: IUser;
    refetch: () => any;
}

const StagesDealersCredsTable: FC<IProps> = ({
    data,
    activeUser,
    refetch,
}: IProps): ReactElement => {
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'dealer_name', desc: false },
    ]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedDealer, setSelectedDealer] =
        useState<IStagesDealerCreds | null>(null);
    const [showPasswordRefreshModal, setShowPasswordRefreshModal] =
        useState(false);
    const [refreshType, setRefreshType] = useState<'single' | 'all'>('single');
    const [loadingStatus, setLoadingStatus] = useState<{
        currentPasswordNum: number;
        totalPasswords: number;
    } | null>(null);

    const refreshStagesPasswordMutation = useMutation({
        mutationFn: refreshStagesPassword,
    });

    const tableOptions = {
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        defaultColumnSizing: 'auto',
        onSortingChange: setSorting,
        sortingFns: {
            emailSort: () => {
                return 1;
            },
            markSort: () => {
                return 1;
            },
            timeSort: () => {
                return 1;
            },
        },
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    };

    const table = useReactTable(tableOptions);

    const handleRefreshClick = (accountData: IStagesDealerCreds) => {
        setSelectedDealer(accountData);
        setShowPasswordRefreshModal(true);
        setRefreshType('single');
    };

    const handleAllRefreshClick = () => {
        setShowPasswordRefreshModal(true);
        setRefreshType('all');
    };

    const refreshAccountPassword = async () => {
        try {
            if (selectedDealer && refreshType === 'single') {
                setLoadingStatus({
                    currentPasswordNum: 1,
                    totalPasswords: 1,
                });
                await refreshStagesPasswordMutation.mutateAsync({
                    user: activeUser,
                    user_name: selectedDealer.user_name,
                });
            } else if (refreshType === 'all') {
                for (let i = 0; i < data.length; i += 1) {
                    setLoadingStatus({
                        currentPasswordNum: i + 1,
                        totalPasswords: data.length,
                    });
                    const { user_name } = data[0];
                    await refreshStagesPasswordMutation.mutateAsync({
                        user: activeUser,
                        user_name,
                    });
                }
            }

            setLoadingStatus(null);
            refetch();
            toast.success(
                `${
                    refreshType === 'single'
                        ? 'Password refreshed'
                        : 'Passwords refreshed'
                }`
            );
            setShowPasswordRefreshModal(false);
        } catch (err) {
            toast.error(
                `Unable to refresh ${
                    refreshType === 'single' ? 'password' : 'passwords'
                }`
            );
            setLoadingStatus(null);
        }
    };

    useEffect(() => {
        if (data) {
            let foundAccount: IStagesDealerCreds | null = null;

            for (let i = 0; i < data.length; i += 1) {
                if (data[i].days_to_expire <= 7 && !foundAccount) {
                    foundAccount = data[i];
                } else if (
                    foundAccount &&
                    data[i].days_to_expire < foundAccount.days_to_expire
                ) {
                    foundAccount = data[i];
                }
            }

            if (foundAccount) {
                toast.warning(
                    `The password for dealer account ${foundAccount.dealer_name} will expire in ${foundAccount.days_to_expire} days`
                );
            }
        }
    }, [data]);

    return (
        <div>
            <div className="stagesSearchContainer">
                <div style={{ marginBottom: '1rem', maxWidth: 300 }}>
                    <Input
                        className="input"
                        label="Search"
                        name="alertSearchInput"
                        id="alertSearchInput"
                        value={globalFilter}
                        onChange={setGlobalFilter}
                        type="text"
                    />
                </div>
                <button
                    type="button"
                    className="btn danger outline"
                    onClick={handleAllRefreshClick}
                >
                    Refresh All Passwords
                </button>
            </div>

            <table
                id="stages-dealers-table"
                data-testid="user-management-table"
                className="stages-dealers-table"
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
                                    <div className="column-title">
                                        Refresh Password
                                    </div>
                                </div>
                            </th>
                        </tr>
                    ))}
                </thead>
                <tbody data-testid="user-management-table-body">
                    {table.getRowModel().rows.map((row) => {
                        return (
                            <tr
                                id={row.id}
                                key={row.id}
                                className={
                                    row.original.days_to_expire <= 7
                                        ? 'warning'
                                        : ''
                                }
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        id={`${cell.column.id}-${row.id}`}
                                        key={cell.column.id}
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}

                                <td
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <div className="icons-container">
                                        <button
                                            type="button"
                                            className="btn danger"
                                            onClick={() =>
                                                handleRefreshClick(row.original)
                                            }
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {loadingStatus && (
                <LoadingModal
                    modalText={`${
                        loadingStatus.totalPasswords > 1
                            ? `Updating password ${loadingStatus.currentPasswordNum} of ${loadingStatus.totalPasswords}`
                            : 'Updating password...'
                    }`}
                />
            )}
            {showPasswordRefreshModal && (
                <RefreshStagesPasswordModal
                    handleClose={() => setShowPasswordRefreshModal(false)}
                    selectedStagesDealerCreds={selectedDealer}
                    refreshCreds={refreshAccountPassword}
                    type={refreshType}
                />
            )}
        </div>
    );
};

export default StagesDealersCredsTable;
