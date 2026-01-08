// React
import React, { FC, FormEvent, useContext, useState } from 'react';

// Third Party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// API Calls
import updateRetentionPolicy from '../../../api_calls/updateRetentionPolicy';

// Components
import ModalBase from '../../ModalBase';
import LoadingModal from '../LoadingModal';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';

// styles
import '../../../styles/components/Modals/DeleteAlertModal.scss';

interface IProps {
    handleClose: () => void;
    currentRetentionDays: number | undefined;
    newRetentionDays: number;
    accountName: string | undefined;
    accountId: string | undefined;
}

const UpdateRetentionPolicy: FC<IProps> = ({
    handleClose,
    currentRetentionDays,
    newRetentionDays,
    accountName,
    accountId,
}) => {
    const { activeUser } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const [isLoading, setIsLoading] = useState(false);

    const updateRetentionPolicyMutation = useMutation({
        mutationFn: updateRetentionPolicy,
    });

    const handleDeleteAlert = async (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser || !accountId) {
            return;
        }

        setIsLoading(true);

        try {
            await updateRetentionPolicyMutation.mutateAsync({
                user: activeUser,
                account_id: Number(accountId),
                retention_days: newRetentionDays,
            });

            queryClient.invalidateQueries({
                queryKey: ['retention_policy', accountId],
            });

            toast.success(`Data retention policy updated for ${accountName}`);
            handleClose();
        } catch (err) {
            console.error(err);
            toast.error('Error, unable to update retention policy');
        }

        setIsLoading(false);
    };

    return (
        <ModalBase title="Update Retention Policy" handleClose={handleClose}>
            <form onSubmit={handleDeleteAlert} className="DeleteAlertModal">
                <p>
                    Are you sure you want update the retention policy to{' '}
                    {newRetentionDays} days (previously set to{' '}
                    {currentRetentionDays} days) for {accountName}?
                </p>

                <div>
                    <button
                        className="btn danger"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                    <button className="btn primary" type="submit">
                        Update
                    </button>
                </div>

                {isLoading && <LoadingModal modalText="Deleting Camera..." />}
            </form>
        </ModalBase>
    );
};

export default UpdateRetentionPolicy;
