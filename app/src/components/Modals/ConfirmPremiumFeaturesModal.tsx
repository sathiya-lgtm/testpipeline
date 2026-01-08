// React
import React, { FC } from 'react';

// Components
import ModalBase from '../ModalBase';
import Button from '../Button';

// Types

// Styles
import '../../styles/components/Modals/ConfirmPremiumFeaturesModal.scss';

interface IProps {
    handleConfirm: () => void;
    handleClose: () => void;
}

const ConfirmPremiumFeaturesModal: FC<IProps> = ({
    handleConfirm,
    handleClose,
}) => {
    return (
        <ModalBase title="Premium Features" handleClose={handleClose}>
            <div className="ConfirmPremiumFeaturesModal">
                <p>Did you want to enable Premium Features for this Camera?</p>
                <hr />
                <p>This will be an additional charge for this Camera.</p>
                <div className="button-container">
                    <Button
                        id="confirm-premium-features-button"
                        type="button"
                        label="Confirm"
                        className="btn primary"
                        onClick={() => handleConfirm()}
                    />
                    <Button
                        id="cancel-premium-features-button"
                        type="button"
                        label="Cancel"
                        className="btn danger"
                        onClick={() => handleClose()}
                    />
                </div>
            </div>
        </ModalBase>
    );
};

export default ConfirmPremiumFeaturesModal;
