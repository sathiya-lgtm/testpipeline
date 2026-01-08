// React
import React, { ReactElement } from 'react';

interface IProps {
    id?: string;
    noDataText?: string;
    subText?: string;
}

/** Just displays text that reads "No Data". */
const NoData = ({ id, noDataText, subText }: IProps): ReactElement => {
    return (
        <div id={id} className="no-data">
            <p className="title">{noDataText || 'No Data'}</p>
            {subText && <p className="subtitle">{subText}</p>}
        </div>
    );
};

export default NoData;
