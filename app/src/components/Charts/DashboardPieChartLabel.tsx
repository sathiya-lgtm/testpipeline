// React
import React, { FC } from 'react';

// Third-party
import { BsFillCircleFill } from 'react-icons/bs';

// styles
import '../../styles/components/Charts/DashboardPieChartLabel.scss';

interface IProps {
    circleColor: string;
    label: string;
}

const DashboardPieChartLabel: FC<IProps> = ({ circleColor, label }) => {
    return (
        <div className="dashboard-pie-chart-label">
            <div className="circle-container">
                <BsFillCircleFill
                    size={15}
                    color={circleColor}
                    className="circle"
                />
            </div>
            <div className="label-container">
                <p className="label">{label}</p>
            </div>
        </div>
    );
};

export default DashboardPieChartLabel;
