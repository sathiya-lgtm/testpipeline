// React
import React, { FC } from 'react';

// Recharts
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// uuid
import { v4 as uuidv4 } from 'uuid';

interface PieChartDataPoint {
    name: string;
    value: number;
    color: string;
}

interface IProps {
    pieChartData: PieChartDataPoint[];
}

const DashboardPieChart: FC<IProps> = ({ pieChartData }) => {
    return (
        <ResponsiveContainer aspect={2.9} width="100%">
            <PieChart>
                <Pie
                    stroke="none"
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="49%"
                    outerRadius="100%"
                    cx="50%"
                    cy="50%"
                >
                    {pieChartData.map((entry) => (
                        <Cell key={uuidv4()} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => {
                        return value.toLocaleString('en-us');
                    }}
                    itemStyle={{ color: 'white' }}
                    contentStyle={{
                        background: 'rgba(0, 0, 0, 0.95)',
                        borderRadius: '5px',
                        border: '1px solid black',
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default DashboardPieChart;
