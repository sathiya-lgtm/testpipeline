/* eslint-disable no-param-reassign */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-restricted-syntax */

// Utils
import { convertDetectionBoxToAOEPcts } from './utils/generalUtils';

// Types
import { CustomWebSocket } from './Edge';
import {
    ASMSetting,
    DetectionBox, IPolyZoneData,
    ISaveLineCrossingData,
    ISaveScaleData,
} from './edgeTypes';

export function getValue(input: string) {
    const v_start = input.indexOf('<value>');
    const v_end = input.indexOf('</value>');
    if (input.includes('ERROR')) {
        throw Error(input);
    }

    if (v_start === -1 || v_end === -1) {
        throw Error(input);
    }

    return input.substring(v_start + 7, v_end);
}

export async function getAppParam({
    socket,
    sequence,
    source_id,
    param,
}: {
    socket: CustomWebSocket;
    sequence: number;
    source_id: string;
    param: string;
}) {
    return new Promise((resolve: (value: string) => void, reject) => {
        const request = {
            type: 'edge_update',
            sequence,
            source_id,
            message: `action===ax-param-get&amp;pname===${param}`,
            tag: { param },
        };

        if (socket) {
            // This handles when the socket does not respond within 4 seconds
            const intervalId = setTimeout(() => {
                reject('ERROR: request timed out');
            }, 12000);

            socket.sendAndGetResponse(sequence, request, (response: any) => {
                clearInterval(intervalId);
                resolve(response);
            });
        } else {
            reject('ERROR: param websocket not active');
        }
    });
}

export async function setAppParam({
    socket,
    sequence,
    source_id,
    param,
    value,
}: {
    socket: CustomWebSocket;
    sequence: number;
    source_id: string;
    param: string;
    value: string;
}) {
    return new Promise((resolve: (value: string) => void, reject) => {
        const request = {
            type: 'edge_update',
            sequence,
            source_id,
            message: `action===ax-param-set&amp;pname===${param}&amp;value===${value}`,
            tag: { param, value },
        };

        if (socket) {
            const intervalId = setTimeout(() => {
                reject('ERROR: request timed out');
            }, 12000);

            socket.sendAndGetResponse(sequence, request, (response: any) => {
                clearInterval(intervalId);
                resolve(response);
            });
        } else {
            reject('ERROR: param websocket not active');
        }
    });
}

export const sendAppAction = ({
    socket,
    sequence,
    source_id,
    action,
    paramsDictionary,
}: {
    socket: CustomWebSocket | null;
    sequence: number;
    source_id: string;
    action: string;
    paramsDictionary?: { [key: string]: string };
}) => {
    return new Promise((resolve: (value: string) => void, reject) => {
        let fullAction = action;
        if (paramsDictionary != null) {
            for (const [key, value] of Object.entries(paramsDictionary)) {
                fullAction += `&amp;${key}===${value}`;
            }
        }
        const message = `action===${fullAction};;;${sequence}`;

        const request = {
            type: 'edge_update',
            sequence,
            source_id,
            message,
            tag: { params: paramsDictionary },
        };

        if (socket) {
            // This handles when the socket does not respond within 4 seconds
            const intervalId = setTimeout(() => {
                reject('ERROR: request timed out');
            }, 12000);

            socket.sendAndGetResponse(sequence, request, (response: any) => {
                clearInterval(intervalId);
                resolve(response);
            });
        } else {
            reject('ERROR: param websocket not active');
        }
    });
};

export const playAxisHorn = async ({
    socket,
    getSequence,
    source_id,
    axisHornAction,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    axisHornAction: {
        device: string;
        ip: string;
        vendor: string; // axis
        action: string; // play
        username: string;
        password: string;
        clip: number; // 0, 1, 2, 3
        volume: number; // 0 to 1000
    };
}) => {
    // Sometimes the clip and volume are strings but they need to always be numbers to work
    // This forces them to be numbers.
    axisHornAction.volume = Number(axisHornAction.volume);
    axisHornAction.clip = Number(axisHornAction.clip);
    console.log({ axisHornAction });
    const result = await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DeviceIO',
        value: JSON.stringify(axisHornAction),
    });

    return getValue(result);
};

export const getASMSetting = async ({
    socket,
    getSequence,
    source_id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
}) => {
    const asmSetting = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'ActiveSceneMgt',
    });

    return getValue(asmSetting);
};

export const getInsitesPreMilliseconds = async ({
    socket,
    getSequence,
    source_id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
}) => {
    const asmSetting = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'InsitesPreMilliseconds',
    });

    return getValue(asmSetting);
};

export const getInsitesPostMilliseconds = async ({
    socket,
    getSequence,
    source_id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
}) => {
    const asmSetting = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'InsitesPostMilliseconds',
    });

    return getValue(asmSetting);
};

export const getObjectDetectionStatus = async ({
    socket,
    getSequence,
    source_id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
}) => {
    const objectDetectionStatus = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DetectionOn',
    });

    return getValue(objectDetectionStatus);
};

export const getCaptureResolution = async ({
    socket,
    getSequence,
    source_id,
}: {
    socket: CustomWebSocket | null;
    getSequence: () => number;
    source_id: string;
}) => {
    const xmlResponseString = await sendAppAction({
        socket,
        sequence: getSequence(),
        source_id,
        action: 'get-capture-resolution',
    });
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlResponseString, 'text/xml');

    const widthValue =
        xmlDoc.getElementsByTagName('width')[0].childNodes[0].nodeValue;
    const heightValue =
        xmlDoc.getElementsByTagName('height')[0].childNodes[0].nodeValue;

    return {
        width: Number(widthValue),
        height: Number(heightValue),
    };
};

export const getNuisanceData = async ({
    socket,
    getSequence,
    source_id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
}) => {
    const nuisanceEnabledResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnEnabled',
    });

    const nuisanceCounterResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnCounter',
    });

    const nuisanceIntervalResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnInterval',
    });

    const nuisanceResetResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnResetInterval',
    });

    const nuisanceCoverageResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnResetThreshold',
    });

    const nuisanceData = {
        nuisanceEnabled: getValue(nuisanceEnabledResponse),
        nuisanceCounter: getValue(nuisanceCounterResponse),
        nuisanceInterval: getValue(nuisanceIntervalResponse),
        nuisanceReset: getValue(nuisanceResetResponse),
        nuisanceCoverage: getValue(nuisanceCoverageResponse),
    };

    return nuisanceData;
};

export const getAreaOfInterest = async ({
    socket,
    getSequence,
    source_id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
}) => {
    const detectionBoxLeft = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DetectionBoxLeft',
    });
    const detectionBoxTop = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DetectionBoxTop',
    });
    const detectionBoxRight = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DetectionBoxRight',
    });
    const detectionBoxBottom = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DetectionBoxBottom',
    });
    const cameraResolution = await getCaptureResolution({
        socket,
        source_id,
        getSequence,
    });

    const detectionBox = {
        top: Number(getValue(detectionBoxTop)),
        right: Number(getValue(detectionBoxRight)),
        bottom: Number(getValue(detectionBoxBottom)),
        left: Number(getValue(detectionBoxLeft)),
    };

    const aoeSizesAsPct = convertDetectionBoxToAOEPcts(
        detectionBox,
        cameraResolution
    );

    return { detectionBox, aoeSizesAsPct };
};

export const setActiveSceneManagement = async ({
    socket,
    getSequence,
    source_id,
    asmSetting,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    asmSetting: ASMSetting;
}) => {
    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'ActiveSceneMgt',
        value: asmSetting,
    });
};
export const setEventSecondsSettings = async ({
    socket,
    getSequence,
    source_id,
    preEventSeconds,
    postEventSeconds,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    preEventSeconds: number;
    postEventSeconds: number;
}) => {
    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'InsitesPreMilliseconds',
        value: (preEventSeconds * 1000).toString(),
    });
    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'InsitesPostMilliseconds',
        value: (postEventSeconds * 1000).toString(),
    });
};

export const setNuisanceSettings = async ({
    socket,
    getSequence,
    source_id,
    nuisanceSettings,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    nuisanceSettings: {
        nuisanceEnabled: '0' | '1';
        nuisanceCounter: string;
        nuisanceInterval: string;
        nuisanceReset: string;
        nuisanceCoverage: string;
    };
}) => {
    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnEnabled',
        value: nuisanceSettings.nuisanceEnabled,
    });
    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnCounter',
        value: nuisanceSettings.nuisanceCounter,
    });
    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnInterval',
        value: nuisanceSettings.nuisanceInterval,
    });
    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnResetInterval',
        value: nuisanceSettings.nuisanceReset,
    });
    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoLearnResetThreshold',
        value: nuisanceSettings.nuisanceCoverage,
    });
};

export const setAreaOfInterest = async ({
    socket,
    getSequence,
    source_id,
    detectionBox,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    detectionBox: DetectionBox;
}) => {
    const left = await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DetectionBoxLeft',
        value: detectionBox.left.toString(),
    });
    const right = await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DetectionBoxRight',
        value: detectionBox.right.toString(),
    });
    const top = await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DetectionBoxTop',
        value: detectionBox.top.toString(),
    });
    const bottom = await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'DetectionBoxBottom',
        value: detectionBox.bottom.toString(),
    });

    console.log(left, right, top, bottom);
};

export const getScaleLineEditorData = async ({
    socket,
    getSequence,
    source_id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
}) => {
    const captureResolution = await getCaptureResolution({
        socket,
        source_id,
        getSequence,
    });
    const scaleLineResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'ScaleLine',
    });
    const scaleLineString = getValue(scaleLineResponse);
    const scaleLine: number[][] = JSON.parse(scaleLineString);

    const scaleModeResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoScaleMode',
    });
    const scaleMode = getValue(scaleModeResponse) as '0' | '1';
    const autoScaleResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoScaleEnabled',
    });

    const autoScaleEnabled = getValue(autoScaleResponse) as '0' | '1';

    const smallestSizeResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'SmallestObjectSize',
    });
    const smallestSize = getValue(smallestSizeResponse);
    const largestSizeResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'LargestObjectSize',
    });
    const largestSize = getValue(largestSizeResponse);
    const focalPointResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'ScaleToPoint',
    });
    const largestFilterEnabledResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'LargeObjectEnabled',
    });
    const largestFilterEnabled = getValue(largestFilterEnabledResponse) === '1';
    const focalPointArr = JSON.parse(getValue(focalPointResponse));
    const maxAutoScaleResponse = await getAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'MaxAutoScale',
    });
    const maxAutoScale = getValue(maxAutoScaleResponse);

    return {
        captureResolution,
        scaleLine,
        scaleMode,
        autoScaleEnabled,
        smallestSize,
        largestSize,
        largestFilterEnabled,
        focalPointArr,
        maxAutoScale,
    };
};

export const setScaleLineData = async ({
    socket,
    getSequence,
    source_id,
    scaleLineData,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    scaleLineData: ISaveScaleData;
}) => {
    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'ScaleLine',
        value: JSON.stringify(scaleLineData.scaleLine),
    });

    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'LargeObjectEnabled',
        value: scaleLineData.largestFilterEnabled ? '1' : '0',
    });

    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'SmallestObjectSize',
        value: scaleLineData.smallestSize,
    });

    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'LargestObjectSize',
        value: scaleLineData.largestSize,
    });

    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoScaleEnabled',
        value: scaleLineData.autoScale ? '1' : '0',
    });

    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'AutoScaleMode',
        value: scaleLineData.scaleMode,
    });

    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'ScaleToPoint',
        value: JSON.stringify(scaleLineData.focalPoint),
    });

    await setAppParam({
        socket,
        sequence: getSequence(),
        source_id,
        param: 'MaxAutoScale',
        value: scaleLineData.maxAutoScale,
    });
};
export const setLineCrossingData = async ({
    socket,
    getSequence,
    source_id,
    lineCrossingData,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    lineCrossingData: ISaveLineCrossingData;
}) => {
    const params = {
        zoneId: lineCrossingData.id,
        value: JSON.stringify(lineCrossingData),
    };
    await sendAppAction({
        socket,
        sequence: getSequence(),
        source_id,
        action: 'set-zone',
        paramsDictionary: params,
    });
};
export const setPolyZoneData = async ({
    socket,
    getSequence,
    source_id,
    polyZoneData,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    polyZoneData: IPolyZoneData;
}) => {
    const params = {
        zoneId: polyZoneData.id,
        value: JSON.stringify(polyZoneData),
    };
    await sendAppAction({
        socket,
        sequence: getSequence(),
        source_id,
        action: 'set-zone',
        paramsDictionary: params,
    });
};
export const getLineCrossingData = async ({
    socket,
    getSequence,
    source_id,
    id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    id: string;
}) => {
    const params = {
        zoneId: id,
    };
    return sendAppAction({
        socket,
        sequence: getSequence(),
        source_id,
        action: 'get-zone',
        paramsDictionary: params,
    });
};
export const deleteZoneData = async ({
    socket,
    getSequence,
    source_id,
    id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    id: string;
}) => {
    const params = {
        zoneId: id,
    };
    return sendAppAction({
        socket,
        sequence: getSequence(),
        source_id,
        action: 'remove-zone',
        paramsDictionary: params,
    });
};
export const getZonesData = async ({
    socket,
    getSequence,
    source_id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
}) => {
    return sendAppAction({
        socket,
        sequence: getSequence(),
        source_id,
        action: 'get-zones',
    });
};
export const removeZoneData = async ({
    socket,
    getSequence,
    source_id,
    id,
}: {
    socket: CustomWebSocket;
    getSequence: () => number;
    source_id: string;
    id: string;
}) => {
    const params = {
        zoneId: id,
    };
    return sendAppAction({
        socket,
        sequence: getSequence(),
        source_id,
        action: 'remove-zone',
        paramsDictionary: params,
    });
};
