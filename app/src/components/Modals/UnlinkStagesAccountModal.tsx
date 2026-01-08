// React
import React, { FC, FormEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Components
import ModalBase from '../ModalBase';
import LoadingModal from './LoadingModal';

// Api Calls
import unlinkStagesAccount from '../../api_calls/unlinkStagesAccount';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Custom
import handleHttpRequestError from '../../utils/handleHttpRequestError';

// Types
import { IStagesDealerAccount } from '../../types/tng-api.interfaces';

// styles
import '../../styles/components/Modals/DeleteAlertModal.scss';

interface IProps {
    handleClose: () => void;
    selectedAccount: IStagesDealerAccount | null;
    refetchAccounts: () => any;
}

const UnlinkStagesAccountModal: FC<IProps> = ({
    handleClose,
    selectedAccount,
    refetchAccounts,
}) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);

    const onSuccess = async () => {
        toast.success('Account unlinked!');
        refetchAccounts();
        handleClose();
    };

    const unlinkStagesAccountMutation = useMutation({
        mutationFn: unlinkStagesAccount,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: () => onSuccess(),
    });

    const handleDeleteAlert = (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser || !selectedAccount) {
            return;
        }

        unlinkStagesAccountMutation.mutate({
            user: activeUser,
            account_id: selectedAccount.account_id,
            stages_account_id: selectedAccount.stages_account_id,
        });
    };

    return (
        <ModalBase title="Unlink Account" handleClose={handleClose}>
            <form onSubmit={handleDeleteAlert} className="DeleteAlertModal">
                <p>
                    Are you sure you want to unlink the following Account:{' '}
                    <br />
                    {selectedAccount?.account_name}
                </p>

                <div>
                    <button className="btn danger" type="submit">
                        Unlink
                    </button>
                    <button
                        className="btn neutral"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>
                {unlinkStagesAccountMutation.isLoading && (
                    <LoadingModal modalText="Unlinking account..." />
                )}
            </form>
        </ModalBase>
    );
};

export default UnlinkStagesAccountModal;
