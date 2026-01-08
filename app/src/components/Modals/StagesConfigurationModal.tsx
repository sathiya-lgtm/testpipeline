// React
import { FC } from 'react';

// Components
import ModalBase from '../ModalBase';

import StagesAlertsTests from '../Stages/StagesAlertsTests';

// Types
import { IStagesDealerAccount } from '../../types/tng-api.interfaces';

// Styles
import '../../styles/components/Modals/StagesConfigurationModal.scss';

interface IProps {
    handleClose: () => void;
    selectedStagesAccount: IStagesDealerAccount;
}

const StagesConfigurationModal: FC<IProps> = ({
    handleClose,
    selectedStagesAccount,
}) => {
    return (
        <ModalBase
            title="Stages Account Information"
            handleClose={handleClose}
            className="stagesConfigurationModal"
        >
            <div>
                <div className="accountInfoContainer">
                    <p>
                        <span className="label">Insites Customer Account:</span>{' '}
                        {selectedStagesAccount.account_name}
                    </p>
                    <p>
                        <span className="label">Insites Site:</span>{' '}
                        {selectedStagesAccount.site_name}
                    </p>

                    <p>
                        <span className="label">Stages Dealer Name:</span>{' '}
                        {selectedStagesAccount.stages_account_name}
                    </p>
                    <p>
                        <span className="label">Stages Account Name:</span>{' '}
                        {selectedStagesAccount.stages_site_group_name}
                    </p>

                    <p>
                        <span className="label">Stages Site Name:</span>{' '}
                        {selectedStagesAccount?.stages_site_name}
                    </p>
                </div>

                <StagesAlertsTests
                    customerAccountId={selectedStagesAccount.account_id}
                    siteId={selectedStagesAccount.site_id}
                />
            </div>
        </ModalBase>
    );
};

export default StagesConfigurationModal;
