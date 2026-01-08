// React
import React, { FC, ReactElement, useState } from 'react';

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

// Controller
import { columns } from './StagesDealersTable.controller';

// Components
import Input from '../Inputs/Input';
import Select from '../Inputs/Select';
import LoadingModal from '../Modals/LoadingModal';
import StagesConfigurationModal from '../Modals/StagesConfigurationModal';

// Api Calls
import updateStagesAccountState from '../../api_calls/updateStagesAccountState';

// Icons
import DropDownArrowIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import DeleteIcon from '../../images/icons/EV_ENT_CircleX.7.6.22.svg?react';

// Types
import { IStagesDealerAccount } from '../../types/tng-api.interfaces';
import { IUser, SelectOption } from '../../types/interfaces';

// Styles
import '../../styles/components/Tables/StagesDealersTable.scss';

const AccountStateOptions = [
    { label: 'Pending', value: '1' },
    { label: 'Testing', value: '2' },
    { label: 'Active', value: '3' },
];

interface IProps {
    data: IStagesDealerAccount[];
    onDeleteClick: (accountData: IStagesDealerAccount) => void;
    activeUser: IUser;
    refetch: () => any;
}

const StagesDealersTable: FC<IProps> = ({
    data,
    onDeleteClick,
    activeUser,
    refetch,
}: IProps): ReactElement => {
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'account_name', desc: false },
    ]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedStagesAccount, setSelectedStagesAccount] =
        useState<IStagesDealerAccount | null>(null);
    const [showStagesConfigurationModal, setShowStagesConfigurationModal] =
        useState(false);

    const updateStagesAccountStateMutation = useMutation({
        mutationFn: updateStagesAccountState,
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

    const getAccountStatus = (accountState: string) => {
        const currentState = AccountStateOptions.find(
            (option) => option.value === accountState
        );

        if (currentState) {
            return currentState;
        }

        return AccountStateOptions[0];
    };

    const handleUpdateStagesAccountState = async (
        selectedOption: SelectOption,
        accountData: IStagesDealerAccount
    ) => {
        const newAccountStateId = Number(selectedOption.value);

        try {
            await updateStagesAccountStateMutation.mutateAsync({
                user: activeUser,
                stages_accounts_id: accountData.stages_accounts_id,
                stages_account_state_id: newAccountStateId,
            });
            refetch();
        } catch (err) {
            toast.error('Unable to update account state.');
        }
    };

    const handleRowClick = (accountData: IStagesDealerAccount) => {
        setSelectedStagesAccount(accountData);
        setShowStagesConfigurationModal(true);
    };

    return (
        <div>
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
            <table
                id="stages-dealers-table"
                data-testid="user-management-table"
                className="stages-dealers-table"
            >
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            <th className="not-sortable">
                                <div className="th-content">
                                    <div
                                        className="column-title"
                                        style={{ width: 118 }}
                                    >
                                        Account State
                                    </div>
                                </div>
                            </th>
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
                                    <div className="column-title">Unlink</div>
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
                                onClick={() => {
                                    handleRowClick(row.original);
                                }}
                            >
                                <td
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <div>
                                        <Select
                                            id="customers"
                                            value={getAccountStatus(
                                                row.original.stages_account_state_id.toString()
                                            )}
                                            onChange={(option) => {
                                                handleUpdateStagesAccountState(
                                                    option as SelectOption,
                                                    row.original
                                                );
                                            }}
                                            options={AccountStateOptions}
                                            isClearable={false}
                                        />
                                    </div>
                                </td>
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
            {updateStagesAccountStateMutation.isLoading && (
                <LoadingModal modalText="Updating account state..." />
            )}

            {showStagesConfigurationModal && selectedStagesAccount && (
                <StagesConfigurationModal
                    selectedStagesAccount={selectedStagesAccount}
                    handleClose={() => setShowStagesConfigurationModal(false)}
                />
            )}
        </div>
    );
};

export default StagesDealersTable;
