// React
import React, { ReactElement, FC, CSSProperties, useEffect } from 'react';

// Third party
import { motion } from 'framer-motion';

// Components
import Backdrop from './Backdrop';

// Styles
import '../styles/components/ModalBase.scss';

interface IProps {
    title: string | ReactElement;
    handleClose: () => any;
    children?: string | ReactElement | ReactElement[] | null;
    closeOnBackdropClick?: boolean;
    className?: string;
    /** Defines a specific z-index for loading modal. Default is 98. */
    zIndex?: number;
    minHeight?: string;
    minWidth?: string;
    maxWidth?: string;
}

/**
 * React component for wrapping any modal content.
 * @param {IProps} props
 * @returns {ReactNode} Modal wrapper.
 */
const ModalBase: FC<IProps> = ({
    title,
    handleClose,
    children,
    closeOnBackdropClick = true,
    className,
    zIndex = 100,
    minHeight,
    minWidth,
    maxWidth
}: IProps): ReactElement => {
    const style: CSSProperties = {};
    if (minHeight) {
        style.minHeight = minHeight;
    }
    if (minWidth) {
        style.minWidth = minWidth;
    }
    if(maxWidth){
        style.maxWidth = maxWidth;
    }

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent ) => {
            if(e.key === 'Escape') {
                handleClose()
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        }
    }, [handleClose])

    return (
        <Backdrop
            onClick={closeOnBackdropClick ? handleClose : () => {}}
            zIndex={zIndex}
        >
            <motion.div
                key="modal"
                className={`ModalBase ${className || ''}`}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.2 } }}
                transition={{ duration: 1 }}
                style={style}
            >
                <header>
                    <h2>{title}</h2>
                    <button type="button" id="x-button" onClick={handleClose}>
                        X
                    </button>
                </header>
                <div className="modal-body">{children}</div>
            </motion.div>
        </Backdrop>
    );
};

export default ModalBase;
