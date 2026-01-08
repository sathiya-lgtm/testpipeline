/* eslint-disable prefer-promise-reject-errors */
// Types
import { IBridgeCamera } from '../../../views/Utilities/Forms/BridgeControls';
import { CustomWebSocket } from '../../Outlets/Home/Edge/Edge';

export const formatMacAddress = (mac: string, sensorNumber?: number) => {
    let camera_unique_id = mac
        .replaceAll(':', '')
        .replaceAll('-', '')
        .toLowerCase();
    if (sensorNumber) {
        camera_unique_id += sensorNumber.toString(16).padStart(2, '0');
    }

    return camera_unique_id;
};

export const sendBridgeCommand = async ({
    socket,
    sequence,
    request,
}: {
    socket: CustomWebSocket;
    sequence: number;
    request: any;
}) => {
    return new Promise((resolve: (value: any) => void, reject) => {
        if (socket) {
            const intervalId = setTimeout(() => {
                reject('ERROR: request timed out');
            }, 8000);

            socket.sendAndGetResponse(sequence, request, (response: any) => {
                clearInterval(intervalId);
                resolve(response);
            });
        } else {
            reject('ERROR: param websocket not active');
        }
    });
};

export const getBridgeCameraList = async ({
    socket,
    sequence,
    source_id,
}: {
    socket: CustomWebSocket;
    sequence: number;
    source_id: string;
}) => {
    const request = {
        type: 'command',
        cmd: 'getDeviceList',
        sequence,
        source_id,
        tag: { type: 'command', cmd: 'getDeviceList' },
    };

    const result = await sendBridgeCommand({ socket, sequence, request });
    return result as { data: IBridgeCamera[]; status: number };
};

export const restartBridgeCamera = async ({
    socket,
    sequence,
    source_id,
    cameraUniqueId,
}: {
    socket: CustomWebSocket;
    sequence: number;
    source_id: string;
    cameraUniqueId: string;
}) => {
    const request = {
        type: 'command',
        cmd: 'restart',
        sequence,
        target: 'edge',
        source_id,
        uniqueId: cameraUniqueId,
        tag: {
            type: 'command',
            cmd: 'restart',
            target: 'edge',
            uniqueId: cameraUniqueId,
        },
    };

    const result = await sendBridgeCommand({ socket, sequence, request });
    return result as { data: IBridgeCamera[]; status: number };
};

export const restartBridgeDevice = async ({
    socket,
    sequence,
    source_id,
}: {
    socket: CustomWebSocket;
    sequence: number;
    source_id: string;
}) => {
    const request = {
        type: 'command',
        cmd: 'restart',
        sequence,
        target: 'bridge',
        source_id,
        tag: {
            type: 'command',
            cmd: 'restart',
            target: 'bridge',
        },
    };

    const result = await sendBridgeCommand({ socket, sequence, request });
    return result as { data: IBridgeCamera[]; status: number };
};

export const restartBridgeOS = async ({
    socket,
    sequence,
    source_id,
}: {
    socket: CustomWebSocket;
    sequence: number;
    source_id: string;
}) => {
    const request = {
        type: 'command',
        cmd: 'restart',
        sequence,
        target: 'os',
        source_id,
        tag: {
            type: 'command',
            cmd: 'restart',
            target: 'os',
        },
    };

    const result = await sendBridgeCommand({ socket, sequence, request });
    return result as { data: IBridgeCamera[]; status: number };
};

export const getBridgeLogs = async ({
    socket,
    sequence,
    source_id,
    rangeStart,
    rangeEnd,
    target,
}: {
    socket: CustomWebSocket;
    sequence: number;
    source_id: string;
    rangeStart: number;
    rangeEnd: number;
    target: 'info' | 'error';
}) => {
    const request = {
        type: 'command',
        cmd: 'getLogs',
        rangeStart,
        rangeEnd,
        target,
        sequence,
        source_id,
        tag: { type: 'command', cmd: 'getLogs' },
    };

    const result = await sendBridgeCommand({ socket, sequence, request });
    return result as {
        status: number;
        data: string;
        rangeStart: number;
        rangeEnd: number;
    };
};

export const groupByTenLines = (logLines: string[]): string[] => {
    const logParagraphs: string[] = [];
    let logParagraph: string = '';
    // combine into 10 line packets
    for (let i = 0; i < logLines.length; i += 1) {
        logParagraph += logLines[i];
        logParagraph += '\r\n';
        if (i % 10 === 9) {
            logParagraphs.push(logParagraph);
            logParagraph = '';
        }
    }
    return logParagraphs;
};
