/* eslint-disable no-plusplus */
// Utils
import { convertCoordinateToPercent } from './generalUtils';

// Types
import { CaptureResolution, PointAsPct } from '../edgeTypes';

export const getStartingPosition = (
    cords: number[],
    captureResolution: CaptureResolution
) => {
    const yCord = captureResolution.height - cords[0];
    const xCord = cords[1];

    const top = convertCoordinateToPercent(yCord, captureResolution.height);
    const left = convertCoordinateToPercent(xCord, captureResolution.width);
    const bottom = cords[0] === 0 ? 0 : null;
    const right = cords[0] === captureResolution.width - 1 ? 0 : null;

    return { top, left, bottom, right };
};

export const convertScaleLineToPercents = (
    startingPoints: number[][],
    captureResolution: CaptureResolution
) => {
    return startingPoints.map((point) => {
        return getStartingPosition(point, captureResolution);
    });
};

export const generateMidPoints = (scaleLineAsPcts: PointAsPct[]) => {
    const result: { top: number; left: number; right: null; bottom: null }[] =
        [];

    for (let i = 0; i < scaleLineAsPcts.length - 1; i++) {
        const top = (scaleLineAsPcts[i].top + scaleLineAsPcts[i + 1].top) / 2;
        const left =
            (scaleLineAsPcts[i].left + scaleLineAsPcts[i + 1].left) / 2;

        result.push({ top, left, right: null, bottom: null });
    }

    return result;
};
export const generateLCMidPoints = (LCAsPcts: PointAsPct[]) => {
    const result: { top: number; left: number; right: null; bottom: null }[] =
        [];

    for (let i = 0; i < LCAsPcts.length - 1; i++) {
        const top = (LCAsPcts[i].top + LCAsPcts[i + 1].top) / 2;
        const left =
            (LCAsPcts[i].left + LCAsPcts[i + 1].left) / 2;

        result.push({ top, left, right: null, bottom: null });
    }

    return result;
};
export const generateAOIMidPoints = (AOIAsPcts: PointAsPct[]) => {
    const result: { top: number; left: number; right: null; bottom: null }[] =
        [];

    for (let i = 0; i < AOIAsPcts.length - 1; i++) {
        const top = (AOIAsPcts[i].top + AOIAsPcts[i + 1].top) / 2;
        const left =
            (AOIAsPcts[i].left + AOIAsPcts[i + 1].left) / 2;

        result.push({ top, left, right: null, bottom: null });
    }

    return result;
};
