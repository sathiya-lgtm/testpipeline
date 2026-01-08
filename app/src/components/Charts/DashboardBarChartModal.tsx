// React
import React, { FC } from 'react';

// Custom
import {
    BarChartDisplay,
    IBarChartData,
} from '../Outlets/Home/Dashboard/Dashboard.controller';
import ModalBase from '../ModalBase';
import DashboardBarChart from './DashboardBarChart';

// Styles
import '../../styles/components/Modals/DashboardBarChartModal.scss';

interface IProps {
    title: string;
    barChartDisplay: BarChartDisplay;
    barChartData: IBarChartData[];
    colors: {
        events: string;
        mitigated: string;
        people: string;
        vehicles: string;
        peopleAndVehicles: string;
        personLoitering: string;
    };
    handleClose: () => void;
}

const DashboardBarChartModal: FC<IProps> = ({
    barChartDisplay,
    barChartData,
    colors,
    title,
    handleClose,
}) => {
    return (
        <ModalBase
            className="dashboard-bar-chart-modal"
            title={title}
            handleClose={handleClose}
        >
            <DashboardBarChart
                barChartDisplay={barChartDisplay}
                barChartData={barChartData}
                colors={colors}
            />
        </ModalBase>
    );
};

export default DashboardBarChartModal;
