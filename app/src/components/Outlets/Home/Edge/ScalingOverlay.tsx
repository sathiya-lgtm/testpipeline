// React
import { useEffect, useState, useRef, Dispatch, SetStateAction } from 'react';

// Components
import NoScaleZone from './NoScaleZone';
import FocalPoint from './FocalPoint';
import SmallestSizeReferenceIcon from './SmallestSizeReferenceIcon';
import ScaleLine from './ScaleLine';
import DragResizeRect from './DragResizeRect';

// utils
import {
    convertScaleLineToPercents,
    generateMidPoints,
} from './utils/scaleLine';
import { needScaling } from './utils/FilterAndScaling';
import {
    findRectFactors,
    calculateLargestSizeStartingDimensions,
    calculateLargestSizeRectArea,
} from './utils/generalUtils';

// Types
import {
    AOESizesAsPct,
    CaptureResolution,
    ContainerDimensions,
    PointAsPct,
    FocalPointPosition,
} from './edgeTypes';

interface FilterAndScalingOverlayProps {
    containerDimensions: ContainerDimensions;
    captureResolution: CaptureResolution;
    scaleLine: number[][];
    setScaleLine: Dispatch<SetStateAction<number[][]>>;
    scaleLineAsPcts: PointAsPct[];
    setScaleLinePcts: Dispatch<SetStateAction<PointAsPct[]>>;
    midPointsAsPcts: PointAsPct[];
    setMidPointsAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
    smallestSizeIcon: string;
    smallestSize: string;
    focalPoint: number[];
    setFocalPoint: Dispatch<SetStateAction<number[]>>;
    scaleMode: string;
    autoScaleEnabled: boolean;
    scaledSize: number;
    setScaledSize: Dispatch<SetStateAction<number>>;
    largestSize: string;
    setLargestSize: Dispatch<SetStateAction<string>>;
    largestFilterEnabled: boolean;
    maxAutoScale: string;
    focalPointPosition: FocalPointPosition;
    setFocalPointPosition: Dispatch<SetStateAction<FocalPointPosition>>;
}

interface RectPosition {
    top: number;
    left: number;
    right: number | null;
    bottom: number | null;
}

const ScalingOverlay = ({
    containerDimensions,
    captureResolution,
    scaleLine,
    setScaleLine,
    scaleLineAsPcts,
    setScaleLinePcts,
    midPointsAsPcts,
    setMidPointsAsPcts,
    smallestSizeIcon,
    smallestSize,
    focalPoint,
    setFocalPoint,
    scaleMode,
    autoScaleEnabled,
    scaledSize,
    setScaledSize,
    largestSize,
    setLargestSize,
    largestFilterEnabled,
    maxAutoScale,
    focalPointPosition,
    setFocalPointPosition,
}: FilterAndScalingOverlayProps) => {
    const [useScaling, setUseScaling] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [smallestSizeBoxDimensions, setSmallestSizeBoxDimensions] = useState({
        height: 0,
        width: 0,
    });
    const [smallestSizePosition, setSmallestSizePosition] =
        useState<RectPosition>({
            top: 10,
            left: 10,
            right: null,
            bottom: null,
        });

    const [largestSizeStartingDimensions, setLargestSizeStartingDimensions] =
        useState(
            calculateLargestSizeStartingDimensions(
                Number(largestSize),
                captureResolution.height,
                captureResolution.width
            )
        );
    const convertLargestPixelsToPercent = (value) => {
        const pixelPercent =
            (value / (captureResolution.width * captureResolution.height)) *
            100;
        setLargestSize(pixelPercent.toFixed(0).toString());
    };
    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const currentContainerDimensions =
            containerRef.current?.getBoundingClientRect();

        if (currentContainerDimensions) {
            const xCord = Math.round(
                ((e.clientX - currentContainerDimensions.x) /
                    currentContainerDimensions.width) *
                    captureResolution.width
            );
            const yCord =
                captureResolution.height -
                Math.round(
                    ((e.clientY - currentContainerDimensions.y) /
                        currentContainerDimensions.height) *
                        captureResolution.height
                );

            const newScaleLine = [...scaleLine];
            newScaleLine.push([yCord, xCord]);
            setScaleLine(newScaleLine);
            const newScaleLineAsPcts = convertScaleLineToPercents(
                newScaleLine,
                captureResolution
            );
            setScaleLinePcts(newScaleLineAsPcts);
            setMidPointsAsPcts(generateMidPoints(newScaleLineAsPcts));
        }
    };

    const changeSmallestAreaBoxSize = (sizeInput: string | number) => {
        const pixelArea = Number(sizeInput) * 2;
        let recSize = { height: 1, width: 1 };

        if (smallestSizeIcon === 'rectangle' || smallestSizeIcon === 'person') {
            recSize = findRectFactors(pixelArea, 0.33);
        } else {
            recSize = findRectFactors(pixelArea, 1.5);
        }
        // const recSize = findRectFactors(pixelArea, 0.33);
        const height =
            Math.round((recSize.height / captureResolution.height) * 10000) /
            100;
        const width =
            Math.round((recSize.width / captureResolution.width) * 10000) / 100;

        setSmallestSizeBoxDimensions({ height, width });
    };

    const onLargestSizeChange = ({ height, width }: AOESizesAsPct) => {
        const newSize = calculateLargestSizeRectArea(height, width, {
            height: captureResolution.height,
            width: captureResolution.width,
        });
        convertLargestPixelsToPercent(newSize);
    };

    const convertFocalPointToPixels = () => {
        const lat =
            captureResolution.height -
            captureResolution.height * (focalPointPosition.top / 100);
        const lng = captureResolution.width * (focalPointPosition.left / 100);

        return { lat, lng };
    };

    useEffect(() => {
        if (useScaling) {
            changeSmallestAreaBoxSize(scaledSize);
        } else {
            changeSmallestAreaBoxSize(smallestSize);
        }
    }, [smallestSize, scaledSize, useScaling, smallestSizeIcon]);

    useEffect(() => {
        if (autoScaleEnabled) {
            let yCord =
                captureResolution.height -
                Math.round(
                    captureResolution.height * (smallestSizePosition.top / 100)
                );
            let xCord = Math.round(
                captureResolution.width * (smallestSizePosition.left / 100)
            );

            if (yCord <= 2) {
                yCord = 2;
            }

            if (xCord <= 2) {
                xCord = 2;
            }

            const focalCenter = convertFocalPointToPixels();
            setFocalPoint([
                Math.round(focalCenter.lat),
                Math.round(focalCenter.lng),
            ]);

            const scaleData = needScaling(
                [yCord, xCord],
                scaleMode,
                focalCenter,
                scaleLine
            );

            if (scaleData.needScaling && scaleData.scalePercent) {
                setUseScaling(true);
                const newScaledSize =
                    (1 - scaleData.scalePercent) *
                        Number(maxAutoScale) *
                        Number(smallestSize) +
                    Number(smallestSize);
                setScaledSize(Math.round(newScaledSize));
            } else {
                setScaledSize(Number(smallestSize));
                setUseScaling(false);
            }
        }
    }, [
        smallestSizePosition,
        autoScaleEnabled,
        focalPointPosition,
        maxAutoScale,
    ]);

    useEffect(() => {
        if (!autoScaleEnabled) {
            setUseScaling(false);
        }
    }, [autoScaleEnabled]);

    return (
        <div
            ref={containerRef}
            onDoubleClick={handleDoubleClick}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                overflow: 'hidden',
            }}
        >
            {autoScaleEnabled && (
                <ScaleLine
                    containerDimensions={containerDimensions}
                    captureResolution={captureResolution}
                    scaleLine={scaleLine}
                    setScaleLine={setScaleLine}
                    scaleLineAsPcts={scaleLineAsPcts}
                    setScaleLinePcts={setScaleLinePcts}
                    midPointsAsPcts={midPointsAsPcts}
                    setMidPointsAsPcts={setMidPointsAsPcts}
                />
            )}

            <SmallestSizeReferenceIcon
                rectHeight={smallestSizeBoxDimensions.height}
                rectWidth={smallestSizeBoxDimensions.width}
                rectPosition={smallestSizePosition}
                setRectPosition={setSmallestSizePosition}
                containerDimensions={containerDimensions}
                smallestSizeIcon={smallestSizeIcon}
                smallestSize={smallestSize}
            />
            {scaleMode === '0' && autoScaleEnabled && (
                <>
                    <NoScaleZone
                        scaleLine={scaleLine}
                        focalPoint={focalPoint}
                        captureResolution={captureResolution}
                    />
                    <FocalPoint
                        focalPosition={focalPointPosition}
                        setFocalPosition={setFocalPointPosition}
                        containerDimensions={containerDimensions}
                    />
                </>
            )}

            {largestFilterEnabled && (
                <DragResizeRect
                    startingHeight={largestSizeStartingDimensions.height}
                    startingWidth={largestSizeStartingDimensions.width}
                    startingPosition={{
                        top: 10,
                        left: 25,
                        right: null,
                        bottom: null,
                    }}
                    containerDimensions={containerDimensions}
                    afterResizeDragCallback={onLargestSizeChange}
                />
            )}
        </div>
    );
};

export default ScalingOverlay;
