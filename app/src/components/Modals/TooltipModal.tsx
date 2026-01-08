// React
import React, { FC } from 'react';

// Components
import ModalBase from '../ModalBase';

// Styles
import '../../styles/components/Modals/TooltipModal.scss';

interface IProps {
    tooltipTitle: string;
    tooltipText: string;
    handleClose: () => void;
}

const TooltipModal: FC<IProps> = ({
    handleClose,
    tooltipText,
    tooltipTitle,
}) => {
    return (
        <ModalBase title={tooltipTitle} handleClose={handleClose}>
            <p className="tooltip-text">{tooltipText}</p>
        </ModalBase>
    );
};

export default TooltipModal;
