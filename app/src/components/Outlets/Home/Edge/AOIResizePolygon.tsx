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
import AOIPolygon from "./AOIPolygon";
import {SelectOption} from "../../../../types/interfaces";

interface FilterAndScalingOverlayProps {
    containerDimensions: ContainerDimensions;
    captureResolution: CaptureResolution;
    AOI: number[][];
    setAOI: Dispatch<SetStateAction<number[][]>>;
    AOIAsPcts: PointAsPct[];
    setAOIAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
    AOIMidPointsAsPcts: PointAsPct[];
    setAOIMidPointsAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
    selectedZone: SelectOption;
    zoneColorArray: {color: string, id: string}[]
    isAlarmVision: boolean;
    avZoneIndex: number;
}

interface RectPosition {
    top: number;
    left: number;
    right: number | null;
    bottom: number | null;
}

const AOIResizePolygon = ({
    containerDimensions,
    captureResolution,
    AOI,
    setAOI,
                              AOIAsPcts,
                              setAOIAsPcts,
                              AOIMidPointsAsPcts,
                              setAOIMidPointsAsPcts,
    selectedZone,
    zoneColorArray,
    isAlarmVision,
    avZoneIndex,
}: FilterAndScalingOverlayProps) => {

    const containerRef = useRef<HTMLDivElement>(null);
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

            const newScaleLine = [...AOI];
            newScaleLine.push([yCord, xCord]);
            setAOI(newScaleLine);
            const newScaleLineAsPcts = convertScaleLineToPercents(
                newScaleLine,
                captureResolution
            );
            setAOIAsPcts(newScaleLineAsPcts);
            setAOIMidPointsAsPcts(generateMidPoints(newScaleLineAsPcts));
        }
    };
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
            <AOIPolygon
                containerDimensions={containerDimensions}
                captureResolution={captureResolution}
                AOI={AOI}
                setAOI={setAOI}
                AOIAsPcts={AOIAsPcts}
                setAOIAsPcts={setAOIAsPcts}
                AOIMidPointsAsPcts={AOIMidPointsAsPcts}
                setAOIMidPointsAsPcts={
                    setAOIMidPointsAsPcts
                }
                selectedZone={selectedZone}
                zoneColorArray={zoneColorArray}
                isAlarmVision={isAlarmVision}
                avZoneIndex={avZoneIndex}
            />
        </div>
    );
};

export default AOIResizePolygon;
