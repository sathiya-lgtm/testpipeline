// React
import React, { useMemo, FC, useState, useEffect } from 'react';

// Third Party
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Api Calls
import getAccountPolicies from '../../../api_calls/getAccountPolicies';
import setMultiModalPolicies from '../../../api_calls/setMultiModalPolicies';

// Components
import Toggle from '../../../components/Inputs/Toggle';
import LoadingModal from '../../../components/Modals/LoadingModal';

// Types
import { IUser } from '../../../types/interfaces';
import { IAccountPolicy } from '../../../types/tng-api.interfaces';

interface IProps {
    activeUser: IUser;
    // setActiveUser: Dispatch<SetStateAction<IUser | null>>;
}

const MultiModalModel: FC<IProps> = ({ activeUser }) => {
    const queryClient = useQueryClient();

    const [loadingText, setLoadingText] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [filteredData, setFilteredData] = useState<IAccountPolicy[]>([]);

    const multiModalPoliciesQuery = useQuery({
        queryKey: ['account_multi_modal_polices'],
        queryFn: () => getAccountPolicies(activeUser),
    });

    const multiModalEnabledOnAllAccounts = useMemo(() => {
        const { data } = multiModalPoliciesQuery;

        if (data) {
            for (let i = 0; i < data.length; i += 1) {
                if (data[i].natural_language_search === false) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }, [multiModalPoliciesQuery.data]);

    const updateMultiModalPolicies = useMutation({
        mutationFn: setMultiModalPolicies,
    });

    const handleUpdateMultiModalPolicy = async (
        currentPolicies: IAccountPolicy[],
        natural_language_search: boolean
    ) => {
        if (!activeUser) {
            return;
        }

        setLoadingText('Updating AI Copilot Search settings...');

        // Don't updated MIY+ accounts
        const accounts = currentPolicies
            .filter((policy) => policy.miy_status !== 'MIY+')
            .map((policy) => policy.account_id);

        try {
            await updateMultiModalPolicies.mutateAsync({
                user: activeUser,
                accounts,
                natural_language_search,
            });

            queryClient.invalidateQueries({
                queryKey: ['account_multi_modal_polices'],
            });

            if (currentPolicies.length === 1) {
                toast.success(
                    `AI Copilot Search updated for ${currentPolicies[0].name}`
                );
            } else {
                toast.success(`AI Copilot Search updated for all accounts`);
            }
        } catch (err) {
            console.error(err);
            toast.error('Error, unable to update AI Copilot Search settings');
        }

        setLoadingText('');
    };

    useEffect(() => {
        if (multiModalPoliciesQuery.data && customerSearch) {
            const filteredResults = multiModalPoliciesQuery.data.filter(
                (item) =>
                    item.name
                        .toLowerCase()
                        .includes(customerSearch.toLowerCase())
            );

            setFilteredData(
                filteredResults.sort((a, b) =>
                    a.name
                        .toLowerCase()
                        .localeCompare(b.name.toLocaleLowerCase())
                )
            );
        } else if (multiModalPoliciesQuery.data) {
            setFilteredData(
                multiModalPoliciesQuery.data.sort((a, b) =>
                    a.name
                        .toLowerCase()
                        .localeCompare(b.name.toLocaleLowerCase())
                )
            );
        }
    }, [multiModalPoliciesQuery.data, customerSearch]);

    return (
        <motion.div
            id="CreateSite"
            key="CreateSite"
            className="multiModalModelForm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <div className="headerContainer">
                <div className="titleContainer">
                    <h3>
                        <span>AI Copilot Search (Beta)</span>
                    </h3>
                    {multiModalPoliciesQuery.data && (
                        <div className="multi-modal-toggle-container">
                            <p className="multi-modal-toggle-label">
                                All Customers
                            </p>
                            <Toggle
                                id="multi-modal-toggle-all"
                                value={multiModalEnabledOnAllAccounts}
                                onToggleChange={() => {
                                    handleUpdateMultiModalPolicy(
                                        multiModalPoliciesQuery.data,
                                        !multiModalEnabledOnAllAccounts
                                    );
                                }}
                                toggleOnText="ON"
                                toggleOffText="OFF"
                            />
                        </div>
                    )}
                </div>

                <div>
                    <input
                        className="input"
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                </div>
            </div>

            {multiModalPoliciesQuery.data &&
                filteredData.map((policy) => {
                    return (
                        <div className="policy-card" key={policy.account_id}>
                            <div className="policy-title">
                                <h3>{policy.name}</h3>
                                <span>{policy.camera_count} cameras</span>
                            </div>

                            <div className="multi-modal-toggle-container">
                                <p className="multi-modal-toggle-label">
                                    AI Copilot Search (Beta) <br />
                                    {policy.miy_status === 'MIY+' && (
                                        <span className="note">
                                            * MIY+ enables Copilot Search by
                                            default
                                        </span>
                                    )}
                                </p>

                                <Toggle
                                    id={`multi-modal-toggle-${policy.name}`}
                                    value={policy.natural_language_search}
                                    onToggleChange={() => {
                                        handleUpdateMultiModalPolicy(
                                            [policy],
                                            !policy.natural_language_search
                                        );
                                    }}
                                    disabled={policy.miy_status === 'MIY+'}
                                    toggleOnText="ON"
                                    toggleOffText="OFF"
                                />
                            </div>
                        </div>
                    );
                })}
            {loadingText && <LoadingModal modalText={loadingText} />}
        </motion.div>
    );
};

export default MultiModalModel;
