/* eslint-disable prefer-const */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-plusplus */
/* eslint-disable no-var */
/* eslint-disable one-var */
/* eslint-disable no-bitwise */
import {
    HomeScreenAnnotations,
    CaptureResolution,
    DetectionBox,
} from '../edgeTypes';

export const roundToHundredths = (inputNum: number) => {
    return Math.round(inputNum * 100) / 100;
};

export const convertCoordinateToPercent = (
    val: number,
    fullDimension: number
) => {
    const initialResult = (val / fullDimension) * 100;
    return Math.round(initialResult * 100) / 100;
};
export const convertLCCoordinateToPercent = (
    val: number,
    fullDimension: number
) => {
    const initialResult = (val / fullDimension) * 100;
    return Math.round(initialResult) / 100;
};
export const convertPercentToCoordinate = (
    val: number,
    fullDimension: number
) => {
    const initialResult = fullDimension * val;
    return Math.round(initialResult);
};
export const convertFilteredViewsToScreenAnnotations = (
    filteredViewBitwise: number
) => {
    const screenAnnotations: HomeScreenAnnotations = {
        target: false,
        areaOfInterest: false,
        block: false,
        learn: false,
        difference: false,
        nuisance: false,
        scale: false,
        grid: false,
    };

    if (filteredViewBitwise & 0x01) {
        screenAnnotations.target = true;
    }
    if (filteredViewBitwise & 0x02) {
        screenAnnotations.areaOfInterest = true;
    }
    if (filteredViewBitwise & 0x04) {
        screenAnnotations.block = true;
    }
    if (filteredViewBitwise & 0x08) {
        screenAnnotations.learn = true;
    }
    if (filteredViewBitwise & 0x20) {
        screenAnnotations.difference = true;
    }
    if (filteredViewBitwise & 0x10) {
        screenAnnotations.nuisance = true;
    }
    if (filteredViewBitwise & 0x40) {
        screenAnnotations.scale = true;
    }
    if (filteredViewBitwise & 0x80) {
        screenAnnotations.grid = true;
    }

    return screenAnnotations;
};

const getAOEDimensionsAsPct = (
    boxDimen1: number,
    boxDimen2: number,
    fullDimen: number
) => {
    const result = ((boxDimen2 - boxDimen1) / fullDimen) * 100;
    return Math.round(result * 100) / 100;
};

const getAOEOffsetAsPct = (boxDimen: number, fullDimen: number) => {
    const result = (boxDimen / fullDimen) * 100;
    return Math.round(result * 100) / 100;
};

export const convertDetectionBoxToAOEPcts = (
    detectionBox: DetectionBox,
    captureResolution: CaptureResolution
) => {
    const { top, left, bottom, right } = detectionBox;

    const aoeTop = getAOEOffsetAsPct(top, captureResolution.height);
    const aoeLeft = getAOEOffsetAsPct(left, captureResolution.width);
    const aoeBottom = bottom >= captureResolution.height - 1 ? 0 : null;
    const aoeRight = right >= captureResolution.width - 1 ? 0 : null;
    const aoeHeight = getAOEDimensionsAsPct(
        top,
        bottom,
        captureResolution.height
    );
    const aoeWidth = getAOEDimensionsAsPct(
        left,
        right,
        captureResolution.width
    );

    return {
        top: aoeTop,
        left: aoeLeft,
        bottom: aoeBottom,
        right: aoeRight,
        height: aoeHeight,
        width: aoeWidth,
    };
};

export const binaryRLDecode = (d: any) => {
    let start;
    const end = d.length;
    let zeros, ones;
    var data = [];
    let c;

    zeros = 0;
    ones = 0;
    for (start = 0; start < end; ) {
        c = d[start]; // pickup the count of 0's
        start++;
        zeros += c;
        while (c--) data.push(0);
        c = d[start]; // pickup the count of 1's
        start++;
        ones += c;
        while (c--) data.push(1);
    }

    return data;
};

export const binaryRLEncode = (d: any) => {
    let start = 0;
    const end = d.length;
    var tmp = [];
    let c = 0;
    let zeros = 0;
    let ones = 0;

    while (start < end) {
        while (start < end && d[start] === 0) {
            c++;
            start++;
        }
        tmp.push(c);
        zeros += c;
        c = 0;
        while (start < end && d[start] === 1) {
            c++;
            start++;
        }
        tmp.push(c);
        ones += c;
        c = 0;
    }

    const data = new Uint32Array(tmp);
    return data;
};

export const findRectFactors = (size: number, ratio: number) => {
    const width = Math.sqrt(size * ratio);
    const height = size / width;

    return { width, height };
};

export const calculateLargestSizeStartingDimensions = (
    largestArea: number,
    aspectRatioHeight: number,
    aspectRatioWidth: number
) => {
    const pixelArea = Number(largestArea) * 2;
    const height = (Math.sqrt(pixelArea) / aspectRatioHeight) * 100;
    const width = (Math.sqrt(pixelArea) / aspectRatioWidth) * 100;

    return {
        height: roundToHundredths(height),
        width: roundToHundredths(width),
    };
};

export const calculateLargestSizeRectArea = (
    recHeight: number,
    rectWidth: number,
    captureResolution: CaptureResolution
) => {
    const pixelHeight = (recHeight / 100) * captureResolution.height;
    const pixelWidth = (rectWidth / 100) * captureResolution.width;

    const area = Math.round(pixelHeight * pixelWidth);
    return JSON.stringify(area);
};

// Logic for logrythmic range selector
const minp = 0;
const maxp = 100;
const minv = Math.log(5);
const maxv = Math.log(10000);
const logScale = (maxv - minv) / (maxp - minp);

export const logPosition = (value: number) => {
    return (Math.log(value) - minv) / logScale + minp;
};

export const logValue = (position: number) => {
    return Math.exp(minv + logScale * (position - minp));
};

export const booleanToBit = (inputValue: boolean) => {
    if (inputValue) {
        return '1';
    }

    return '0';
};

export const compareObjects = (a: any, b: any) => {
    if (a === b) return true;

    if (
        typeof a !== 'object' ||
        typeof b !== 'object' ||
        a == null ||
        b == null
    )
        return false;

    const keysA = Object.keys(a),
        keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (let key of keysA) {
        if (!keysB.includes(key)) return false;

        if (typeof a[key] === 'function' || typeof b[key] === 'function') {
            if (a[key].toString() !== b[key].toString()) return false;
        } else if (!compareObjects(a[key], b[key])) {
            return false;
        }
    }

    return true;
};
