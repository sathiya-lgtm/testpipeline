// React
import React, {
    FC,
    ReactElement,
    useEffect,
    useState,
    Dispatch,
    SetStateAction,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

// Custom
import isActiveUserAdmin from '../../../utils/isActiveUserAdmin';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import getManagedUsers from '../../../api_calls/getManagedUsers';

// Components
import Input from '../../../components/Inputs/Input';
import UserManagementTable from '../../../components/Tables/UserManagementTable';
import DeleteUserModal from '../../../components/Modals/DeleteUserModal';
import CreateUserModal from '../../../components/Modals/CreateUser';
import EditUserModal from '../../../components/Modals/EditUser';

// Types
import { AccountTypeModifier, AccountType } from '../../../types/enums';
import { IUser, SelectOption } from '../../../types/interfaces';
import { IManagedUser } from '../../../types/tng-api.interfaces';

// Styles
import '../../../styles/components/UserManagement.scss';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
}

/**
 * Component for rendering the page/form for managing users.
 * @returns {ReactElement}
 */
const UserManagement: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
    defaultCustomer,
}: IProps): ReactElement => {
    const navigate = useNavigate();

    const [userSearch, setUserSearch] = useState<string>('');
    const [selectedManagedUser, setSelectedManagedUser] =
        useState<IManagedUser | null>(null);
    const [managedUsers, setManagedUsers] = useState<IManagedUser[]>([]);

    // Modals
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] =
        useState<boolean>();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] =
        useState<boolean>(false);

    const { data, refetch } = useQuery({
        queryKey: ['managed-users'],
        queryFn: () => getManagedUsers(activeUser as IUser),
        onError: (err: unknown) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        staleTime: 3_000,
        cacheTime: 3_000,
    });

    const onCreateUserClick = (): void => {
        setSelectedManagedUser(null);
        setIsCreateUserModalOpen(true);
    };

    const onEditClick = (managedUser: IManagedUser): void => {
        if (activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly)) {
            return;
        }

        setSelectedManagedUser(managedUser);
        setIsEditUserModalOpen(true);
    };

    const onDeleteClick = (managedUser: IManagedUser): void => {
        if (activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly)) {
            return;
        }

        setSelectedManagedUser(managedUser);
        setIsDeleteModalOpen(true);
    };

    useEffect(() => {
        if (data) {
            setManagedUsers(data);
        }
    }, [data]);

    useEffect(() => {
        if (data) {
            let newManagedUsers: IManagedUser[] = [];

            newManagedUsers = data.filter((managedUser) => {
                const customer = managedUser.company.toLowerCase();
                const displayName = managedUser.username.toLowerCase();
                const email = managedUser.email.toLowerCase();
                const search = userSearch.toLowerCase();

                return (
                    customer.includes(search) ||
                    displayName.includes(search) ||
                    email.includes(search)
                );
            });

            setManagedUsers(newManagedUsers);
        }
    }, [userSearch, data]);

    return (
        <motion.div
            id="UserManagement"
            key="UserManagement"
            className="UserManagement"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            {isCreateUserModalOpen && (
                <CreateUserModal
                    activeUser={activeUser}
                    setActiveUser={setActiveUser}
                    accountType={accountType}
                    defaultServiceProvider={defaultServiceProvider}
                    defaultCustomer={defaultCustomer}
                    handleClose={() => setIsCreateUserModalOpen(false)}
                    refetch={refetch}
                />
            )}
            {isDeleteModalOpen && selectedManagedUser && (
                <DeleteUserModal
                    handleClose={() => setIsDeleteModalOpen(false)}
                    selectedManagedUser={selectedManagedUser}
                    refetch={refetch}
                />
            )}
            {isEditUserModalOpen && selectedManagedUser && (
                <EditUserModal
                    selectedManagedUser={selectedManagedUser}
                    handleClose={() => setIsEditUserModalOpen(false)}
                    refetch={refetch}
                />
            )}
            <h3 className="title">User Management</h3>
            <div className="container">
                <Input
                    className="input"
                    label="Search"
                    name="user-search"
                    data-testid="user-search"
                    id="user-search"
                    value={userSearch}
                    onChange={setUserSearch}
                    type="text"
                />
                {isActiveUserAdmin(activeUser) && (
                    <button
                        className="btn primary"
                        type="button"
                        id="create-user"
                        data-testid="create-user"
                        onClick={onCreateUserClick}
                        disabled={activeUser?.modifier?.includes(
                            AccountTypeModifier.ReadOnly
                        )}
                    >
                        Create User
                    </button>
                )}
            </div>
            <div className="table-container">
                <UserManagementTable
                    data={managedUsers}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                />
            </div>
        </motion.div>
    );
};

export default UserManagement;
