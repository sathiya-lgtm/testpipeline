// React
import { FC, useEffect, useState, useRef } from 'react';

// Components
import ModalBase from '../../../ModalBase';
import LoadingModal from '../../../Modals/LoadingModal';

// Types
import { CustomWebSocket } from './Edge';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/EdgeLogsModal.scss';

interface IProps {
    handleClose: () => void;
    socket: CustomWebSocket;
    source_id: string;
    getSequence: () => number;
}

const EdgeLogsModal: FC<IProps> = ({
    handleClose,
    socket,
    source_id,
    getSequence,
}) => {
    const [lines, setLines] = useState<string[]>([]);
    const startRangeRef = useRef<number>(0);
    const endRangeRef = useRef<number>(0);
    const logPageRef = useRef<number>(0);
    const chunkSize = useRef<number>(0);
    const isLoading = useRef<boolean>(false);

    const getLogfile = (
        page: number,
        rangeStart: number,
        rangeEnd: number,
        customSocket: CustomWebSocket,
        logfileCallback: any
    ) => {
        console.log('getLogfile: ', page, source_id);
        if (logfileCallback) {
            const sequence = getSequence();
            let message = 'action===get-logs';
            message += `&amp;page===${page}`;
            message += `&amp;rangeStart===${rangeStart}`;
            message += `&amp;rangeEnd===${rangeEnd}`;
            message += `;;;${sequence}`;

            const request = {
                type: 'edge_update',
                sequence,
                source_id,
                message,
                tag: 'my tag',
            };

            console.log('sending log request: ', request);
            customSocket.sendAndGetResponse(sequence, request, logfileCallback);
        }
    };

    // const groupByTenLines = (logLines: string[]): string[] => {
    //     const logParagraphs: string[] = [];
    //     let logParagraph: string = '';
    //     // combine into 10 line packets
    //     for (let i = 0; i < logLines.length; i += 1) {
    //         logParagraph += logLines[i];
    //         logParagraph += '\r\n';
    //         if (i % 10 === 9) {
    //             logParagraphs.push(logParagraph);
    //             logParagraph = '';
    //         }
    //     }
    //     return logParagraphs;
    // };

    const nextLogChunk = (customSocket: CustomWebSocket) => {
        if (isLoading.current) {
            return;
        }
        if (source_id) {
            isLoading.current = true;

            let page = logPageRef.current;
            let endRange = startRangeRef.current;
            let startRange = -1;
            if (endRange === 0) {
                page += 1;
                endRange = -1;
            } else {
                startRange = endRange - chunkSize.current;
                if (startRange < 0) {
                    startRange = 0;
                }
            }

            getLogfile(
                page,
                startRange,
                endRange,
                customSocket,
                (logData: any) => {
                    const trimmedStr = logData.split(';;;')[0];
                    const logDataObject = JSON.parse(trimmedStr);
                    if (logDataObject) {
                        const b64 = logDataObject.logData;
                        // Decode base64 string
                        const text = atob(b64);
                        let logLines = text.split(/\r?\n/);
                        console.log(
                            'range: ',
                            logDataObject.startRange,
                            logDataObject.endRange
                        );
                        let { rangeStart } = logDataObject;
                        if (rangeStart !== 0) {
                            const firstLine = logLines.at(0);
                            console.log('firstLine: ', firstLine);
                            if (firstLine) {
                                rangeStart += firstLine.length + 1;
                            }
                            logLines = logLines.slice(1);
                        }
                        startRangeRef.current = rangeStart;
                        endRangeRef.current = logDataObject.endRange;
                        logPageRef.current = logDataObject.page;
                        console.log(
                            'log stuff: ',
                            logPageRef.current,
                            chunkSize.current,
                            startRangeRef.current,
                            endRangeRef.current
                        );

                        logLines = logLines.reverse();

                        setLines((oldList) => [...oldList, ...logLines]);
                        isLoading.current = false;
                    } else {
                        console.log('unable to parse: ', logData);
                    }
                }
            );
        }
    };

    const doFirstLogQuery = (customSocket: CustomWebSocket) => {
        isLoading.current = true;

        getLogfile(1, -1, -1, customSocket, (logData: any) => {
            const trimmedStr = logData.split(';;;')[0];
            const logDataObject = JSON.parse(trimmedStr);
            if (logDataObject) {
                const b64 = logDataObject.logData;

                // Decode base64 string
                const text = atob(b64);
                let logLines = text.split(/\r?\n/);
                console.log(
                    'range: ',
                    logDataObject.startRange,
                    logDataObject.endRange
                );
                let { startRange } = logDataObject;
                if (startRange !== 0) {
                    const firstLine = logLines.at(0);
                    console.log('firstLine: ', firstLine);
                    if (firstLine) {
                        startRange += firstLine.length + 1;
                    }
                    logLines = logLines.slice(1);
                }
                startRangeRef.current = startRange;
                endRangeRef.current = logDataObject.endRange;
                chunkSize.current =
                    logDataObject.endRange - logDataObject.startRange;
                logPageRef.current = logDataObject.page;
                console.log(
                    'log stuff: ',
                    logPageRef.current,
                    chunkSize.current,
                    startRangeRef.current,
                    endRangeRef.current
                );

                logLines = logLines.reverse();
                setLines(logLines);
                isLoading.current = false;
            } else {
                console.log('unable to parse: ', logData);
            }
        });
    };

    const refreshLogs = () => {
        setLines([]);
        doFirstLogQuery(socket);
    };

    useEffect(() => {
        if (source_id && socket) {
            console.log('loading log file for: ', source_id);
            doFirstLogQuery(socket);
        }
    }, [source_id, socket]);

    useEffect(() => {
        console.log({ lines });
    }, [lines]);

    return (
        <ModalBase
            title="Edge Camera Logs"
            handleClose={handleClose}
            className="EdgeLogsModal"
        >
            <div className="logsContainer">
                {lines.map((line) => {
                    return <p className="log">{line}</p>;
                })}

                <div className="logActionsContainer">
                    <button
                        className="btn primary"
                        type="button"
                        onClick={() => refreshLogs()}
                    >
                        Refresh Logs
                    </button>
                    <button
                        className="btn primary"
                        type="button"
                        onClick={() => nextLogChunk(socket)}
                    >
                        Load More
                    </button>
                </div>

                {isLoading.current && (
                    <LoadingModal modalText="loading logs..." />
                )}
            </div>
        </ModalBase>
    );
};

export default EdgeLogsModal;
