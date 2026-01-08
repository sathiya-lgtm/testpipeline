// React
import React, { ReactElement, FC } from 'react';

import Breadcrumb from './Breadcrumb';

// Styles
import '../styles/components/Breadcrumbs.scss';

export interface IBreadCrumb {
    key: string;
    position: 'start' | 'middle' | 'end';
    label?: string;
    icon?: ReactElement;
    className?: string;
    to?: string;
}

interface IProps {
    breadcrumbs: IBreadCrumb[];
}

/**
 * Breadcrumbs.
 * @param {IProps} props
 * @returns {ReactElement} A Breadcrumbs element.
 */
const Breadcrumbs: FC<IProps> = ({ breadcrumbs }: IProps): ReactElement => {
    return (
        <div className="Breadcrumbs">
            {breadcrumbs.map((breadcrumb: IBreadCrumb) => {
                return (
                    <Breadcrumb key={breadcrumb.key} breadcrumb={breadcrumb} />
                );
            })}
        </div>
    );
};

export default Breadcrumbs;
