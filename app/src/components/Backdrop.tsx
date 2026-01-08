// React
import React, { ReactElement, FC } from 'react';

// Third party
import { motion } from 'framer-motion';

// Styles
import '../styles/components/Backdrop.scss';

interface IProps {
    children: ReactElement;
    onClick: () => any;
    zIndex: number;
}

/**
 * Component that wraps its children in a clickable backdrop that covers the screen.
 * @param {IProps} props - Object with key/values for children component(s) and onClick event handler.
 * @returns {ReactElement} Backdrop with children nested within.
 */
const Backdrop: FC<IProps> = ({
    children,
    onClick,
    zIndex,
}: IProps): ReactElement => {
    return (
        <motion.div
            key="backdrop"
            className="Backdrop"
            onClick={onClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 1 }}
            style={{ zIndex }}
        >
            {children}
        </motion.div>
    );
};

export default Backdrop;
