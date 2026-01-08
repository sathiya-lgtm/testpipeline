// React
import {
    useState,
    useRef,
    useEffect,
    useCallback,
    Dispatch,
    SetStateAction,
} from 'react';

// Utils
import { drawScaleLine } from './utils/canvas';
import { generateMidPoints } from './utils/scaleLine';

// Types
import {
    CaptureResolution,
    PointAsPct,
    ContainerDimensions,
} from './edgeTypes';

interface StartPoint {
    top: number;
    left: number;
    right: number | null;
    bottom: number | null;
}

interface ScalePointProps {
    containerDimensions: ContainerDimensions;
    captureResolution: CaptureResolution;
    scaleLine: number[][];
    setScaleLine: Dispatch<SetStateAction<number[][]>>;
    scaleLineAsPcts: PointAsPct[];
    setScaleLinePcts: Dispatch<SetStateAction<PointAsPct[]>>;
    midPointsAsPcts: PointAsPct[];
    setMidPointsAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
}

const ScaleLine = ({
    containerDimensions,
    captureResolution,
    scaleLine,
    setScaleLine,
    scaleLineAsPcts,
    setScaleLinePcts,
    midPointsAsPcts,
    setMidPointsAsPcts,
}: ScalePointProps) => {
    const [mouseStartingPos, setMouseStartingPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);

    const canvasRef = useRef(null);

    const handleDrag = (xDiffPct: number, yDiffPct: number) => {
        const { height, width } = containerDimensions;
        let newTopPosition = scaleLineAsPcts[selectedPointIndex].top + yDiffPct;
        let newLeftPosition =
            scaleLineAsPcts[selectedPointIndex].left + xDiffPct;
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

        const newPointPositions = [...scaleLineAsPcts];
        newPointPositions[selectedPointIndex] = {
            top: newTopPosition,
            left: newLeftPosition,
            right: rightPosition,
            bottom: bottomPosition,
        };

        const newMidPoints = generateMidPoints(newPointPositions);
        setMidPointsAsPcts(newMidPoints);
        setScaleLinePcts(newPointPositions);
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
        const newPoints = scaleLineAsPcts.map((point) => {
            const newX = getXCord(point.left, point.right);
            const newY = getYCord(point.top, point.bottom);
            return [newY, newX];
        });

        setScaleLine(newPoints);
        setMidPointsAsPcts(generateMidPoints(scaleLineAsPcts));
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
        const scaleLineAsPctsCopy = [...scaleLineAsPcts];
        const newScalePoint = midPointsAsPcts[midPointIndex];
        scaleLineAsPctsCopy.splice(midPointIndex + 1, 0, newScalePoint);

        setScaleLinePcts(scaleLineAsPctsCopy);
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

    const handleRightClick = (
        e: React.MouseEvent<HTMLDivElement>,
        index: number
    ) => {
        e.preventDefault();

        if (scaleLine.length > 2 && scaleLineAsPcts.length > 2) {
            const newScaleLine = [...scaleLine];
            const newScaleLineAsPcts = [...scaleLineAsPcts];

            newScaleLine.splice(index, 1);
            newScaleLineAsPcts.splice(index, 1);

            setScaleLine(newScaleLine);
            setScaleLinePcts(newScaleLineAsPcts);
            setMidPointsAsPcts(generateMidPoints(newScaleLineAsPcts));
        }
    };

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
    }, [scaleLineAsPcts]);

    useEffect(() => {
        if (canvasRef.current) {
            drawScaleLine(canvasRef, scaleLine, '#00aadc', {
                height: captureResolution.height,
                width: captureResolution.width,
            });
        }
    }, [scaleLine]);

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

    return (
        <>
            {scaleLineAsPcts.map((point, index) => {
                return (
                    <div
                        style={determinePointStyles(point)}
                        key={`slp-${point.top}-${point.left}`}
                    >
                        <div
                            onMouseDown={(e) => handleMouseDown(e, index)}
                            onContextMenu={(e) => handleRightClick(e, index)}
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

            {midPointsAsPcts.map((point, index) => {
                return (
                    <div
                        style={determinePointStyles(point)}
                        key={`mp-${point.top}-${point.left}`}
                    >
                        <div
                            onMouseDown={(e) =>
                                handleMidPointMouseDown(e, index)
                            }
                            style={{
                                position: 'absolute',
                                height: 12,
                                width: 12,
                                top: -6,
                                left: -6,
                                background: 'white',
                                border: '1px solid black',
                                zIndex: '1',
                                opacity: '0.4',
                            }}
                        />
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

export default ScaleLine;
