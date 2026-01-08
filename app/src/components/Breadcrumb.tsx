// React
import React, { ReactElement, FC } from 'react';
import { Link } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';

// Icons
import DropDownArrowIcon from '../images/icons/EV_dropdown-arrow.5.12.22.svg?react';

export interface IBreadCrumb {
    key: string;
    position: 'start' | 'middle' | 'end';
    label?: string;
    icon?: ReactElement;
    className?: string;
    to?: string;
}

interface IProps {
    breadcrumb: IBreadCrumb;
}

/**
 * Breadcrumbs.
 * @param {IProps} props
 * @returns {ReactElement} A Breadcrumbs element.
 */
const Breadcrumb: FC<IProps> = ({ breadcrumb }: IProps): ReactElement => {
    const shape = () => {
        if (breadcrumb.position === 'start') {
            return (
                <motion.div
                    key={breadcrumb.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 1.2 },
                    }}
                    transition={{ duration: 1 }}
                    className={`breadcrumb start ${
                        breadcrumb.to ? 'highlight' : ''
                    }`}
                    title={breadcrumb.label}
                >
                    {breadcrumb.icon || null}
                    {breadcrumb.label && (
                        <p className="breadcrumb-label">{breadcrumb.label}</p>
                    )}
                    {breadcrumb.to && <DropDownArrowIcon className="icon" />}
                </motion.div>
            );
        }

        if (breadcrumb.position === 'end') {
            return (
                <motion.div
                    key={breadcrumb.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 1.2 },
                    }}
                    transition={{ duration: 1 }}
                    className={`breadcrumb end ${
                        breadcrumb.to ? 'highlight' : ''
                    }`}
                    title={breadcrumb.label}
                >
                    {breadcrumb.label && (
                        <p className="breadcrumb-label">{breadcrumb.label}</p>
                    )}
                    {breadcrumb.to && (
                        <DropDownArrowIcon className="icon chevron" />
                    )}
                </motion.div>
            );
        }

        return (
            <motion.div
                key={breadcrumb.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                    opacity: 0,
                    transition: { duration: 1.2 },
                }}
                transition={{ duration: 1 }}
                className={`breadcrumb middle ${
                    breadcrumb.to ? 'highlight' : ''
                }`}
                title={breadcrumb.label}
            >
                {breadcrumb.label && (
                    <p className="breadcrumb-label">{breadcrumb.label}</p>
                )}
                {breadcrumb.to && <DropDownArrowIcon className="icon" />}
            </motion.div>
        );
    };

    const render = () => {
        if (breadcrumb?.to) {
            return (
                <Link
                    key={`${breadcrumb.key} link`}
                    className="link"
                    to={breadcrumb.to}
                >
                    {shape()}
                </Link>
            );
        }

        return shape();
    };

    return render();
};

export default Breadcrumb;
