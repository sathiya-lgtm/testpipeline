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
import {
    FaArrowsAltH,
    FaLongArrowAltLeft,
    FaLongArrowAltRight,
} from 'react-icons/fa';
import { drawLCLine, drawScaleLine } from './utils/canvas';
import { generateMidPoints } from './utils/scaleLine';
import ArrowIcon from '../../../../images/icons/arrow-right.svg?react';

// Types
import {
    CaptureResolution,
    PointAsPct,
    ContainerDimensions,
} from './edgeTypes';

import ABArrowIcon from '../../../../images/icons/ABArrow.svg?react';
import A2BArrowIcon from '../../../../images/icons/A2BArrow.svg?react';
import B2AArrowIcon from '../../../../images/icons/B2AArrow.svg?react';
import { SelectOption } from '../../../../types/interfaces';

interface StartPoint {
    top: number;
    left: number;
    right: number | null;
    bottom: number | null;
}

interface ScalePointProps {
    containerDimensions: ContainerDimensions;
    captureResolution: CaptureResolution;
    lineCrossingLine: number[][];
    setLineCrossingLine: Dispatch<SetStateAction<number[][]>>;
    LCAsPcts: PointAsPct[];
    setLCAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
    LCMidPointsAsPcts: PointAsPct[];
    setLCMidPointsAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
    selectedDirection: '0' | '1' | '2';
    setSelectedDirection: Dispatch<SetStateAction<'0' | '1' | '2'>>;
    rotationAngle: number;
    setRotationAngle: Dispatch<SetStateAction<number>>;
    selectedZone: SelectOption;
    zoneColorArray: { color: string; id: string }[];
    isAlarmVision: boolean;
    avZoneIndex: number;
}

const LCLine = ({
    containerDimensions,
    captureResolution,
    lineCrossingLine,
    setLineCrossingLine,
    LCAsPcts,
    setLCAsPcts,
    LCMidPointsAsPcts,
    setLCMidPointsAsPcts,
    selectedDirection,
    setSelectedDirection,
    rotationAngle,
    setRotationAngle,
    selectedZone,
    zoneColorArray,
    isAlarmVision,
    avZoneIndex,
}: ScalePointProps) => {
    const [mouseStartingPos, setMouseStartingPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);
    const canvasRef = useRef(null);
    const [smallLine, setSmallLine] = useState(false);
    const [dimensions, setDimensions] = useState(100);

    const determineArrowAngle = (startPoint, endPoint) => {
        const angle = Math.atan2(
            endPoint[1] - startPoint[1],
            endPoint[0] - startPoint[0]
        );
        setRotationAngle((angle * 180) / Math.PI);
    };
    const handleDrag = (xDiffPct: number, yDiffPct: number) => {
        const { height, width } = containerDimensions;
        let newTopPosition = LCAsPcts[selectedPointIndex].top + yDiffPct;
        let newLeftPosition = LCAsPcts[selectedPointIndex].left + xDiffPct;
        let rightPosition = null;
        let bottomPosition = null;

        if (newTopPosition < 0) {
            newTopPosition = 0;
        }

        if (newLeftPosition < 0) {
            newLeftPosition = 0;
        }

        if ((newLeftPosition / 100) * width + 1 > width) {
            newLeftPosition = Math.round(((width - 1) / width) * 10000) / 100;
            rightPosition = 0;
        }

        if ((newTopPosition / 100) * height + 1 > height) {
            newTopPosition = Math.round(((height - 1) / height) * 10000) / 100;
            bottomPosition = 0;
        }

        const newPointPositions = [...LCAsPcts];
        newPointPositions[selectedPointIndex] = {
            top: newTopPosition,
            left: newLeftPosition,
            right: rightPosition,
            bottom: bottomPosition,
        };

        const newMidPoints = generateMidPoints(newPointPositions);
        setLCMidPointsAsPcts(newMidPoints);
        setLCAsPcts(newPointPositions);
    };

    const getXCord = (leftValue: number, rightValue: number | null) => {
        if (rightValue === 0) {
            return captureResolution.width - 1;
        }

        return Math.round((leftValue / 100) * captureResolution.width);
    };

    const getYCord = (topValue: number, bottomValue: number | null) => {
        if (bottomValue === 0) {
            return 0;
        }

        return (
            captureResolution.height -
            Math.round((topValue / 100) * captureResolution.height)
        );
    };

    const setNewPoints = () => {
        const newPoints = LCAsPcts.map((point) => {
            const newX = getXCord(point.left, point.right);
            const newY = getYCord(point.top, point.bottom);
            return [newY, newX];
        });

        setLineCrossingLine(newPoints);
        determineArrowAngle(newPoints[0], newPoints[1]);
        setLCMidPointsAsPcts(generateMidPoints(LCAsPcts));
    };

    const handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        pointIndex: number
    ) => {
        e.stopPropagation();
        setMouseStartingPos({ x: e.clientX, y: e.clientY });
        setSelectedPointIndex(pointIndex);
        setIsDragging(true);
    };

    const handleMidPointMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        midPointIndex: number
    ) => {
        e.stopPropagation();
        setMouseStartingPos({ x: e.clientX, y: e.clientY });
        const scaleLineAsPctsCopy = [...LCAsPcts];
        const newScalePoint = LCMidPointsAsPcts[midPointIndex];
        scaleLineAsPctsCopy.splice(midPointIndex + 1, 0, newScalePoint);

        setLCAsPcts(scaleLineAsPctsCopy);
        setSelectedPointIndex(midPointIndex + 1);
        setIsDragging(true);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleInteraction = useCallback(
        (e: MouseEvent) => {
            if (isDragging) {
                const xDiff = e.clientX - mouseStartingPos.x;
                const yDiff = e.clientY - mouseStartingPos.y;
                const xDiffPct =
                    Math.round((xDiff / containerDimensions.width) * 10000) /
                    100;
                const yDiffPct =
                    Math.round((yDiff / containerDimensions.height) * 10000) /
                    100;

                handleDrag(xDiffPct, yDiffPct);
            }
        },
        [mouseStartingPos.x, mouseStartingPos.y, isDragging]
    );

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);

        return () => window.addEventListener('mouseup', handleMouseUp);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleInteraction);

        return () => window.removeEventListener('mousemove', handleInteraction);
    }, [handleInteraction]);

    useEffect(() => {
        setNewPoints();
    }, [LCAsPcts]);

    useEffect(() => {
        if (canvasRef.current) {
            const colorDrawn = zoneColorArray.filter(
                (color) => color.id === selectedZone.value
            );
            const canvas: HTMLCanvasElement = canvasRef.current;
            const context = canvas.getContext('2d');
            context?.clearRect(
                0,
                0,
                captureResolution.width,
                captureResolution.height
            );
            drawLCLine(
                canvasRef,
                lineCrossingLine,
                colorDrawn[0].color ? colorDrawn[0].color : '#00aadc',
                {
                    height: captureResolution.height,
                    width: captureResolution.width,
                }
            );
            determineArrowAngle(lineCrossingLine[0], lineCrossingLine[1]);
        }
    }, [lineCrossingLine]);

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
    const calculateDimensions = () => {
        if (Math.abs(lineCrossingLine[1][0] - lineCrossingLine[0][0]) < 100) {
            setSmallLine(true);
            setDimensions(50);
        } else {
            setSmallLine(false);
            setDimensions(100);
        }
    };
    useEffect(() => {
        calculateDimensions();
    }, [lineCrossingLine]);
    return (
        <>
            {LCAsPcts.map((point, index) => {
                return (
                    <div
                        style={determinePointStyles(point)}
                        key={`slp-${point.top}-${point.left}`}
                    >
                        <div
                            onMouseDown={(e) => handleMouseDown(e, index)}
                            style={{
                                position: 'absolute',
                                height: 12,
                                width: 12,
                                top: -6,
                                left: -6,
                                background: 'white',
                                border: '1px solid black',
                                zIndex: 1,
                            }}
                        />
                    </div>
                );
            })}

            {LCMidPointsAsPcts.map((point, index) => {
                return (
                    <div
                        style={determinePointStyles(point)}
                        key={`mp-${point.top}-${point.left}`}
                    >
                        <div
                            // onMouseDown={(e) => handleMidPointMouseDown(e, index)}
                            style={{
                                position: 'absolute',
                                height: 45,
                                width: 45,
                                top: smallLine ? -20 : -40,
                                left: smallLine ? -25 : -50,
                                zIndex: '1',
                                opacity: '1',
                            }}
                        >
                            {selectedDirection === '0' ? (
                                <A2BArrowIcon
                                    height={dimensions}
                                    width={dimensions}
                                    transform={`rotate(${rotationAngle})`}
                                />
                            ) : selectedDirection === '1' ? (
                                <B2AArrowIcon
                                    height={dimensions}
                                    width={dimensions}
                                    transform={`rotate(${rotationAngle})`}
                                />
                            ) : (
                                <ABArrowIcon
                                    height={dimensions}
                                    width={dimensions}
                                    transform={`rotate(${rotationAngle})`}
                                />
                            )}
                        </div>
                    </div>
                );
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

export default LCLine;
