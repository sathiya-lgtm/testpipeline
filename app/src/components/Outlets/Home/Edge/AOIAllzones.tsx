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
import AOIDrawZones from "./AOIDrawZones";
import {SelectOption} from "../../../../types/interfaces";

interface FilterAndScalingOverlayProps {
    containerDimensions: ContainerDimensions;
    captureResolution: CaptureResolution;
    zones: any[];
    activeZone: string;
    activeMenuItem: string;
    selectedZone: SelectOption;
    zoneColorArray: {color: string, id: string}[]
}

interface RectPosition {
    top: number;
    left: number;
    right: number | null;
    bottom: number | null;
}

const AOIAllZones = ({
                         containerDimensions,
                         captureResolution,
                         zones,
                         activeZone,
                         activeMenuItem,
                         selectedZone,
                         zoneColorArray,
                          }: FilterAndScalingOverlayProps) => {

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
            <AOIDrawZones
                containerDimensions={containerDimensions}
                captureResolution={captureResolution}
                zones={zones}
                activeZone={activeZone}
                activeMenuItem={activeMenuItem}
                selectedZone={selectedZone}
                zoneColorArray={zoneColorArray}
            />
        </div>
    );
};

export default AOIAllZones;
