export interface CaptureResolution {
    width: number;
    height: number;
}

export interface ContainerDimensions {
    height: number;
    width: number;
}

export interface HomeScreenAnnotations {
    target: boolean;
    areaOfInterest: boolean;
    block: boolean;
    learn: boolean;
    difference: boolean;
    nuisance: boolean;
    scale: boolean;
    grid: boolean;
}

export interface DetectionBox {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface PointAsPct {
    top: number;
    left: number;
    right: number | null;
    bottom: number | null;
}

export interface FocalPointPosition {
    top: number;
    left: number;
}

export interface AOESizesAsPct {
    top: number;
    right: number | null;
    bottom: number | null;
    left: number;
    height: number;
    width: number;
}

export type SmallestSizeIconType = 'rectangle' | 'person' | 'car';

export interface IScaleData {
    scaleLine: number[][];
    scaleLineAsPcts: PointAsPct[];
    midPointsAsPcts: PointAsPct[];
    smallestSize: string;
    focalPoint: number[];
    focalPointPosition: { top: number; left: number };
    scaleMode: '0' | '1';
    autoScaleEnabled: boolean;
    largestFilterEnabled: boolean;
    largestSize: string;
    maxAutoScale: string;
}

export interface ISaveScaleData {
    scaleLine: number[][];
    largestFilterEnabled: boolean;
    smallestSize: string;
    largestSize: string;
    autoScale: boolean;
    scaleMode: '0' | '1';
    focalPoint: number[];
    maxAutoScale: string;
}
export interface ISaveLineCrossingData {
    id: string;
    shape: string;
    vertices: {}[];
    direction: string;
    classify_confidence: { vehicle: number; person: number };
    motion_confidence: { vehicle: number; person: number };
    dwell: { vehicle: number; person: number };
}
export interface IPolyZoneData {
    id: string;
    shape: string;
    vertices: {}[];
    classify_confidence: { vehicle: number; person: number };
    motion_confidence: { vehicle: number; person: number };
    dwell: { vehicle: number; person: number };
}

export type ASMSetting = '1' | '3' | '5' | '7';
