// React
import { useEffect, useState, useRef, Dispatch, SetStateAction } from 'react';

// Components
import NoScaleZone from './NoScaleZone';
import FocalPoint from './FocalPoint';
import SmallestSizeReferenceIcon from './SmallestSizeReferenceIcon';
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
import ScaleLine from './ScaleLine';
import LCLine from "./LCLine";
import {SelectOption} from "../../../../types/interfaces";

interface LCOverlayProps {
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
    zoneColorArray: {color: string, id: string}[];
    isAlarmVision: boolean;
    avZoneIndex: number;
}

interface RectPosition {
    top: number;
    left: number;
    right: number | null;
    bottom: number | null;
}

const LCOverlay = ({
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
    avZoneIndex
}: LCOverlayProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                overflow: 'hidden',
            }}
        >
            <LCLine
                containerDimensions={containerDimensions}
                captureResolution={captureResolution}
                lineCrossingLine={lineCrossingLine}
                setLineCrossingLine={setLineCrossingLine}
                LCAsPcts={LCAsPcts}
                setLCAsPcts={setLCAsPcts}
                LCMidPointsAsPcts={LCMidPointsAsPcts}
                setLCMidPointsAsPcts={setLCMidPointsAsPcts}
                selectedDirection={selectedDirection}
                setSelectedDirection={setSelectedDirection}
                rotationAngle={rotationAngle}
                setRotationAngle={setRotationAngle}
                selectedZone={selectedZone}
                zoneColorArray={zoneColorArray}
                isAlarmVision={isAlarmVision}
                avZoneIndex={avZoneIndex}
            />
        </div>
    );
};

export default LCOverlay;
