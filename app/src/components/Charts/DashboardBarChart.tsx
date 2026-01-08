// React
import React, { FC } from 'react';

// Third party
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';
import { CategoricalChartFunc } from 'recharts/types/chart/generateCategoricalChart';
import {
    NameType,
    ValueType,
    Payload,
} from 'recharts/types/component/DefaultTooltipContent';

// Custom
import {
    BarChartDisplay,
    IBarChartData,
    labelMap,
} from '../Outlets/Home/Dashboard/Dashboard.controller';

interface IProps {
    barChartDisplay: BarChartDisplay;
    barChartData: IBarChartData[];
    colors: {
        events: string;
        mitigated: string;
        people: string;
        vehicles: string;
        personLoitering: string;
        peopleAndVehicles: string;
    };
    onBarClick?: CategoricalChartFunc;
    showHourByHour?: boolean;
}

const toolTipTextPadding: string = '6px 0px';
const toolTipTextMargin: number = 0;

const getToolTipColor = (
    itemLabel: string,
    chartItems: Payload<ValueType, NameType>[]
): string | undefined => {
    let color: string | undefined;

    chartItems.forEach((item: Payload<ValueType, NameType>) => {
        if (item.dataKey === itemLabel) {
            color = item.color;
        }
    });

    return color;
};

const CustomTooltip = ({
    active,
    payload,
    label,
}: TooltipProps<ValueType, NameType>): JSX.Element | null => {
    const chartItems = payload;

    if (active && chartItems && chartItems.length) {
        const mitigated: number = chartItems[0]?.payload?.mitigated || 0;
        const events: number = chartItems[0]?.payload?.events || 0;
        const peopleEvents: number = chartItems[0]?.payload?.people || 0;
        const vehicleEvents: number = chartItems[0]?.payload?.vehicles || 0;
        const peopleAndVehicles: number =
            chartItems[0]?.payload?.peopleAndVehicles || 0;
        const personLoiteringEvents: number =
            chartItems[0]?.payload?.personLoitering || 0;
        const total: number = chartItems[0]?.payload?.total || 0;
        const barName = chartItems[0]?.name as string;

        const mitigatedColor: string | undefined = getToolTipColor(
            'mitigated',
            chartItems
        );
        const eventsColor: string | undefined = getToolTipColor(
            'events',
            chartItems
        );
        const peopleEventsColor: string | undefined = getToolTipColor(
            'people',
            chartItems
        );
        const vehicleEventsColor: string | undefined = getToolTipColor(
            'vehicles',
            chartItems
        );
        const peopleAndVehiclesColor: string | undefined = getToolTipColor(
            'peopleAndVehicles',
            chartItems
        );
        const personLoiteringEventsColor: string | undefined = getToolTipColor(
            'personLoitering',
            chartItems
        );

        return (
            <div
                className="custom-tooltip"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    color: 'white',
                    borderRadius: '5px',
                    padding: '5px 20px',
                    border: '1px solid black',
                }}
            >
                <p
                    className="label"
                    style={{
                        padding: toolTipTextPadding,
                        margin: toolTipTextMargin,
                    }}
                >
                    {label}
                </p>
                {peopleEventsColor && (
                    <p
                        className="person"
                        style={{
                            color: peopleEventsColor,
                            padding: toolTipTextPadding,
                            margin: toolTipTextMargin,
                        }}
                    >
                        {`${labelMap.people}: ${peopleEvents.toLocaleString()}`}
                    </p>
                )}
                {vehicleEventsColor && (
                    <p
                        className="vehicles"
                        style={{
                            color: vehicleEventsColor,
                            padding: toolTipTextPadding,
                            margin: toolTipTextMargin,
                        }}
                    >
                        {`${
                            labelMap.vehicles
                        }: ${vehicleEvents.toLocaleString()}`}
                    </p>
                )}
                {peopleAndVehiclesColor && (
                    <p
                        className="person-and-vehicles"
                        style={{
                            color: peopleAndVehiclesColor,
                            padding: toolTipTextPadding,
                            margin: toolTipTextMargin,
                        }}
                    >
                        {`${
                            labelMap.peopleAndVehicles
                        }: ${peopleAndVehicles.toLocaleString()}`}
                    </p>
                )}
                {personLoiteringEventsColor && (
                    <p
                        className="person-loitering"
                        style={{
                            color: personLoiteringEventsColor,
                            padding: toolTipTextPadding,
                            margin: toolTipTextMargin,
                        }}
                    >
                        {`${
                            labelMap.personLoitering
                        }: ${personLoiteringEvents.toLocaleString()}`}
                    </p>
                )}
                {vehicleEventsColor && eventsColor && <hr />}
                {eventsColor && (
                    <p
                        className="events"
                        style={{
                            color: eventsColor,
                            padding: toolTipTextPadding,
                            margin: toolTipTextMargin,
                        }}
                    >
                        {`${labelMap.events}: ${events.toLocaleString()}`}
                    </p>
                )}
                {mitigatedColor && (
                    <p
                        className="mitigated"
                        style={{
                            color: mitigatedColor,
                            padding: toolTipTextPadding,
                            margin: toolTipTextMargin,
                        }}
                    >
                        {`${labelMap.mitigated}: ${mitigated.toLocaleString()}`}
                    </p>
                )}

                {!barName?.includes('Loitering') && (
                    <p
                        className="total"
                        style={{
                            padding: toolTipTextPadding,
                            margin: toolTipTextMargin,
                        }}
                    >
                        Total: {eventsColor ? total.toLocaleString() : events}
                    </p>
                )}
            </div>
        );
    }

    return null;
};

const DashboardBarChart: FC<IProps> = ({
    barChartDisplay,
    barChartData,
    colors,
    onBarClick,
    showHourByHour,
}) => {
    return (
        <ResponsiveContainer width="100%" aspect={3.9}>
            <BarChart
                onClick={onBarClick}
                width={500}
                height={320}
                barGap={0}
                data={barChartData}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid
                    stroke="white"
                    strokeDasharray="3 3"
                    vertical={false}
                />
                <XAxis dataKey="name" stroke="white" />
                <YAxis stroke="white" />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                        fill: 'rgba(205, 205, 205, 0.3)',
                    }}
                />
                {(barChartDisplay === BarChartDisplay.TF ||
                    barChartDisplay === BarChartDisplay.All) && (
                    <>
                        <Bar
                            dataKey="events"
                            stackId="a"
                            fill={colors.events}
                            name={labelMap.events}
                            style={{
                                cursor: showHourByHour ? 'pointer' : 'default',
                            }}
                        />
                        <Bar
                            dataKey="mitigated"
                            stackId="a"
                            fill={colors.mitigated}
                            name={labelMap.mitigated}
                            style={{
                                cursor: showHourByHour ? 'pointer' : 'default',
                            }}
                        />
                    </>
                )}
                {barChartDisplay === BarChartDisplay.L && (
                    <Bar
                        dataKey="personLoitering"
                        stackId="c"
                        fill={colors.personLoitering}
                        name={labelMap.personLoitering}
                        style={{
                            cursor: showHourByHour ? 'pointer' : 'default',
                        }}
                    />
                )}
                {(barChartDisplay === BarChartDisplay.VP ||
                    barChartDisplay === BarChartDisplay.All) && (
                    <>
                        <Bar
                            dataKey="people"
                            stackId="b"
                            fill={colors.people}
                            name={labelMap.people}
                            style={{
                                cursor: showHourByHour ? 'pointer' : 'default',
                            }}
                        />
                        <Bar
                            dataKey="peopleAndVehicles"
                            stackId="b"
                            fill={colors.peopleAndVehicles}
                            name={labelMap.peopleAndVehicles}
                            style={{
                                cursor: showHourByHour ? 'pointer' : 'default',
                            }}
                        />
                        <Bar
                            dataKey="vehicles"
                            stackId="b"
                            fill={colors.vehicles}
                            name={labelMap.vehicles}
                            style={{
                                cursor: showHourByHour ? 'pointer' : 'default',
                            }}
                        />
                    </>
                )}
            </BarChart>
        </ResponsiveContainer>
    );
};

export default DashboardBarChart;
