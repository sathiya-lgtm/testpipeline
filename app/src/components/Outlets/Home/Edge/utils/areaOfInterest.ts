export const calculateDetectionBoxRight = (
    aoeRight: number | null,
    aoeLeft: number,
    aoeWidth: number,
    videoWidth: number
) => {
    let detectionBoxRight = 0;
    detectionBoxRight =
        aoeRight === 0
            ? videoWidth - 1
            : Math.round((videoWidth * (aoeLeft + aoeWidth)) / 100);
    return detectionBoxRight === videoWidth
        ? videoWidth - 1
        : detectionBoxRight;
};

export const calculateDetectionBoxBottom = (
    aoeBottom: number | null,
    aoeTop: number,
    aoeHeight: number,
    videoHeight: number
) => {
    let detectionBoxRight = 0;
    detectionBoxRight =
        aoeBottom === 0
            ? videoHeight - 1
            : Math.round((videoHeight * (aoeTop + aoeHeight)) / 100);
    return detectionBoxRight === videoHeight
        ? videoHeight - 1
        : detectionBoxRight;
};
