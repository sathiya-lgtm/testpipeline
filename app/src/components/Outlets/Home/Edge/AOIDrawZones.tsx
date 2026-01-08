// React
import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    Dispatch,
    SetStateAction,
} from 'react';

// Utils
import { drawAOI, drawScaleLine } from './utils/canvas';
import {convertScaleLineToPercents, generateLCMidPoints, generateMidPoints} from './utils/scaleLine';

// Types
import {
    CaptureResolution,
    PointAsPct,
    ContainerDimensions,
} from './edgeTypes';
import {
    convertLCCoordinateToPercent,
    convertPercentToCoordinate,
} from './utils/generalUtils';
import { SelectOption } from '../../../../types/interfaces';

import ABArrowIcon from '../../../../images/icons/ABArrow.svg?react';
import A2BArrowIcon from '../../../../images/icons/A2BArrow.svg?react';
import B2AArrowIcon from '../../../../images/icons/B2AArrow.svg?react';

interface StartPoint {
    top: number;
    left: number;
    right: number | null;
    bottom: number | null;
}

interface ScalePointProps {
    containerDimensions: ContainerDimensions;
    captureResolution: CaptureResolution;
    zones: any[];
    activeZone: string;
    activeMenuItem: string;
    selectedZone: SelectOption;
    zoneColorArray: { color: string; id: string }[];
    LCMidPointsAsPcts: PointAsPct[];
    setLCMidPointsAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
}

const AOIDrawZones = ({
    containerDimensions,
    captureResolution,
    zones,
    activeZone,
    activeMenuItem,
    selectedZone,
    zoneColorArray,
}: ScalePointProps) => {
    const [mouseStartingPos, setMouseStartingPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);
    const [zoneCount, setZoneCount] = useState(0);
    const [allLinesAsPcts, setAllLinesAsPcts] = useState<PointAsPct[][]>([]);
    const [allLCMidPointsAsPcts, setAllLCMidPointsAsPcts] = useState<PointAsPct[][]>([]);
    const [directions, setDirections] = useState<string[]>([]);
    const [rotationAngles, setRotationAngles] = useState<number[]>([]);
    const [allLines, setAllLines] = useState<number[][][]>([]);
    const canvasRef = useRef(null);

    const determineArrowAngle = (startPoint, endPoint) => {
        const angle = Math.atan2(
            endPoint[1] - startPoint[1],
            endPoint[0] - startPoint[0]
        );
        console.log((angle * 180) / Math.PI);
        return ((angle * 180) / Math.PI);
    };

    const determinePointStyles: any = (pointPosition: StartPoint) => {
        const rectStyles: any = {
            position: 'absolute',
            height: 1,
            width: 1,
            cursor: isDragging ? 'grabbing' : 'grab',
        };

        if (pointPosition.bottom === 0 && pointPosition.right === 0) {
            rectStyles.bottom = 0;
            rectStyles.right = 0;
        } else if (pointPosition.bottom === 0 && pointPosition.right !== 0) {
            rectStyles.bottom = 0;
            rectStyles.left = `${pointPosition.left}%`;
        } else if (pointPosition.bottom !== 0 && pointPosition.right === 0) {
            rectStyles.top = `${pointPosition.top}%`;
            rectStyles.right = 0;
        } else {
            rectStyles.top = `${pointPosition.top}%`;
            rectStyles.left = `${pointPosition.left}%`;
        }

        return rectStyles;
    };

    useEffect(() => {
        if (canvasRef.current) {
            const canvas: HTMLCanvasElement = canvasRef.current;
            const context = canvas.getContext('2d');
            context?.clearRect(
                0,
                0,
                captureResolution.width,
                captureResolution.height
            );
            const lines = [];
            const linesAsPcts = [];
            const selectedDirections = [];
            if (activeMenuItem === 'detection') {
                const prevZone = zones.filter((zone) => zone.id === activeZone);
                const newZones = zones.filter((zone) => zone.id !== activeZone);

                for (let i = 0; i < newZones.length; i++) {
                    const colorDrawn = zoneColorArray.filter(
                        (color) => color.id === newZones[i].id
                    );
                    console.log('Active Zone', newZones[i].direction)
                    if (newZones[i].shape === 'line') {
                        const line = [];
                        for (const vertex of newZones[i].vertices) {
                            line.push([
                                convertPercentToCoordinate(
                                    1 - vertex.y,
                                    captureResolution.height
                                ),
                                convertPercentToCoordinate(
                                    vertex.x,
                                    captureResolution.width
                                ),
                            ]);
                        }
                        lines.push(line);
                        linesAsPcts.push(convertScaleLineToPercents(line, captureResolution));
                        drawAOI(canvasRef, line, colorDrawn[0].color, {
                            height: captureResolution.height,
                            width: captureResolution.width,
                        });
                        selectedDirections.push((newZones[i].direction));
                    }
                    if (newZones[i].shape === 'polygon') {
                        const verticies = [];
                        for (const vertex of newZones[i].vertices) {
                            verticies.push([
                                convertPercentToCoordinate(
                                    1 - vertex.y,
                                    captureResolution.height
                                ),
                                convertPercentToCoordinate(
                                    vertex.x,
                                    captureResolution.width
                                ),
                            ]);
                        }
                        drawAOI(canvasRef, verticies, colorDrawn[0].color, {
                            height: captureResolution.height,
                            width: captureResolution.width,
                        });
                    }
                }
                setAllLines(lines);
                setAllLinesAsPcts(linesAsPcts);
                setDirections(selectedDirections);
            } else if (activeMenuItem === 'mask') {
                for (let i = 0; i < zones.length; i++) {
                    console.log('Test', i);
                    if (zones[i].shape === 'line') {
                        const line = [];
                        for (const vertex of zones[i].vertices) {
                            line.push([
                                convertPercentToCoordinate(
                                    1 - vertex.y,
                                    captureResolution.height
                                ),
                                convertPercentToCoordinate(
                                    vertex.x,
                                    captureResolution.width
                                ),
                            ]);
                        }
                        drawAOI(canvasRef, line, zoneColorArray[i].color, {
                            height: captureResolution.height,
                            width: captureResolution.width,
                        });
                    }
                    if (zones[i].shape === 'polygon') {
                        const verticies = [];
                        for (const vertex of zones[i].vertices) {
                            verticies.push([
                                convertPercentToCoordinate(
                                    1 - vertex.y,
                                    captureResolution.height
                                ),
                                convertPercentToCoordinate(
                                    vertex.x,
                                    captureResolution.width
                                ),
                            ]);
                        }
                        drawAOI(canvasRef, verticies, zoneColorArray[i].color, {
                            height: captureResolution.height,
                            width: captureResolution.width,
                        });
                    }
                }
            }
        }
    }, [zones]);

    useEffect(() => {
        const midPointsAsPcts = [];
        if(allLinesAsPcts) {
            for (const line of allLinesAsPcts) {
                midPointsAsPcts.push(generateLCMidPoints(line));
            }
            setAllLCMidPointsAsPcts(midPointsAsPcts);
        }
    }, [allLinesAsPcts]);
    useEffect(() => {
        const angles = [];
        if(allLines) {
            for (const line of allLines) {
                angles.push(determineArrowAngle(line[1], line[0]));
            }
            console.log(angles);
            setRotationAngles(angles)
        }
    }, [allLines]);

    useEffect(() => {
        console.log('Mid Point Information', allLinesAsPcts, allLCMidPointsAsPcts, directions, rotationAngles)
    }, [allLinesAsPcts, allLCMidPointsAsPcts, directions, rotationAngles]);



    return (
        <>
            {allLCMidPointsAsPcts?.map((points, outerIndex) => {
                console.log('outer index', outerIndex)
               return <div key={outerIndex}>
                    {
                        points.map((point) => {
                            console.log('inner index', rotationAngles[outerIndex])
                            return <div
                                style={determinePointStyles(point)}
                                key={`mp-${point.top}-${point.left}`}
                            >
                                <div
                                    // onMouseDown={(e) => handleMidPointMouseDown(e, index)}
                                    style={{
                                        position: 'absolute',
                                        height: 45,
                                        width: 45,
                                        top: -40,
                                        left: -50,
                                        zIndex: '1',
                                        opacity: '1',
                                    }}
                                >
                                    {directions![outerIndex] === 'R' ? (
                                        <A2BArrowIcon
                                            height={100}
                                            width={100}
                                            transform={`rotate(${rotationAngles[outerIndex]})`}
                                        />
                                    ) : directions![outerIndex] === 'L' ? (
                                        <B2AArrowIcon
                                            height={100}
                                            width={100}
                                            transform={`rotate(${rotationAngles[outerIndex]})`}
                                        />
                                    ) : directions![outerIndex] === 'B' &&
                                        <ABArrowIcon
                                            height={100}
                                            width={100}
                                            transform={`rotate(${rotationAngles[outerIndex]})`}
                                        />
                                    }
                                </div>
                                )
                            </div>
                        })}
                </div>
            })}
        <canvas
            width={captureResolution.width}
            height={captureResolution.height}
            ref={canvasRef}
            style={{
                position: 'absolute',
                background: 'none',
                top: 0,
                height: '100%',
                width: '100%',
            }}
        />
        </>
            );
};

export default AOIDrawZones;
