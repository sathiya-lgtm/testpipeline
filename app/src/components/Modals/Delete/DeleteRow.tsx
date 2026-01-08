import { FC, ReactElement } from 'react';
import ModalBase from '../../ModalBase';

import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../ButtonGroup/ButtonGroup';

export interface IDeleteRowModalProps {
    show: boolean;
    what: string | ReactElement | ReactElement[] | null;
    data?: any | null;
    onClose: () => void;
    onDelete: (data: any) => void;
}

const DeleteRowModal: FC<IDeleteRowModalProps> = ({
    show,
    what,
    data,
    onClose,
    onDelete,
}: IDeleteRowModalProps) => {
    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };
    const handleDelete = () => {
        if (onDelete && data) {
            onDelete(data);
        }
    };
    if (show) {
        return (
            <ModalBase title={`Delete ${what}`} handleClose={handleClose}>
                <p className="modal-body">
                    Are you sure you want to delete the {what}?
                </p>
                <ButtonGroup alignment={ButtonGroupAlignment.middleright}>
                    <button
                        data-testid="confirm-delete-row-button"
                        className="btn danger"
                        type="button"
                        onClick={handleDelete}
                    >
                        Delete
                    </button>
                    <button
                        data-testid="cancel-delete-row-button"
                        className="btn neutral"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </ButtonGroup>
            </ModalBase>
        );
    }
    return null;
};

export default DeleteRowModal;
