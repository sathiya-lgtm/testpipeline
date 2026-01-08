// React
import { FC } from 'react';

// Components
import ModalBase from '../ModalBase';

// Types
import { IStagesDealerCreds } from '../../types/tng-api.interfaces';

// Styles
import '../../styles/components/Modals/RefreshStagesPasswordModal.scss';

interface IProps {
    handleClose: () => void;
    selectedStagesDealerCreds: IStagesDealerCreds | null;
    refreshCreds: () => Promise<void>;
    type: 'single' | 'all';
}

const RefreshStagesPasswordModal: FC<IProps> = ({
    handleClose,
    selectedStagesDealerCreds,
    refreshCreds,
    type,
}) => {
    return (
        <ModalBase
            title="Refresh Credentials"
            handleClose={handleClose}
            className="refreshStagesPasswordModal"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    refreshCreds();
                }}
            >
                {type === 'single' ? (
                    <p>
                        Would you like to update the credentials for the dealer
                        account {selectedStagesDealerCreds?.dealer_name}?
                    </p>
                ) : (
                    <p>
                        Would you like to update the credentials for all dealer
                        accounts?
                    </p>
                )}

                <div className="btnContainer">
                    <button type="submit" className="btn primary">
                        Refresh
                    </button>
                    <button type="button" className="btn danger">
                        Cancel
                    </button>
                </div>
            </form>
        </ModalBase>
    );
};

export default RefreshStagesPasswordModal;
