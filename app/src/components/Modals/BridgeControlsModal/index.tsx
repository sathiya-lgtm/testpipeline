/* eslint-disable react/no-array-index-key */
/* eslint-disable prefer-promise-reject-errors */
// React
import { FC, FormEvent, useEffect, useState, useRef } from 'react';

// Third Party
import { toast } from 'react-toastify';

// Controller
import {
    formatMacAddress,
    getBridgeCameraList,
    restartBridgeCamera,
    restartBridgeDevice,
    restartBridgeOS,
    getBridgeLogs,
} from './BridgeControlModal.controller';

// Components
import ModalBase from '../../ModalBase';
import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../ButtonGroup/ButtonGroup';
import TabPanel, { TabPage } from '../../TabPanel/TabPanel';
import LoadingModal from '../LoadingModal';

// Types
import { CustomWebSocket } from '../../Outlets/Home/Edge/Edge';
import {
    IBridgeSource,
    IBridgeCamera,
} from '../../../views/Utilities/Forms/BridgeControls';

// Styles
import '../../../styles/components/Modals/BridgeControlsModal.scss';

export interface IBridgeControlsModalProps {
    bridgeSocket: CustomWebSocket;
    getSequence: () => number;
    show: boolean;
    selectedBridgeDevice: IBridgeSource;
    onClose: () => void;
}

const BridgeControlsModal: FC<IBridgeControlsModalProps> = ({
    bridgeSocket,
    getSequence,
    show,
    selectedBridgeDevice,
    onClose,
}) => {
    const [actionProperties, setActionProperties] = useState({
        actionButtonLabel: '',
        actionDescription: '',
        actionTitle: '',
        actionTarget: '',
        actionUniqueString: '',
    });
    const [loadingText, setLoadingText] = useState('');
    const [showConfirmActionModal, setShowConfirmActionModal] = useState(false);
    const [bridgeCameras, setBridgeCameras] = useState<IBridgeCamera[]>([]);
    const firstRender = useRef(true);

    // Log stuff
    const [lines, setLines] = useState<string[]>([]);
    const [logType, setLogType] = useState<'info' | 'error'>('info');
    const [nextRangeStart, setNextRangeStart] = useState(0);
    const [nextRangeEnd, setNextRangeEnd] = useState(0);
    const rangeStartRef = useRef<number>(0);
    const rangeEndRef = useRef<number>(0);
    const chunkSize = useRef<number>(0);

    const handleBridgeLogs = async ({
        target,
        rangeStart,
        rangeEnd,
    }: {
        target: 'info' | 'error';
        rangeStart: number;
        rangeEnd: number;
    }) => {
        try {
            const result = await getBridgeLogs({
                socket: bridgeSocket,
                sequence: getSequence(),
                source_id: selectedBridgeDevice.source_id,
                target,
                rangeStart,
                rangeEnd,
            });

            const logText = atob(result.data); // data is base 64
            let logLines = logText.split(/\r?\n/);

            if (result.rangeStart !== 0) {
                const firstLine = logLines.at(0);
                if (firstLine) {
                    result.rangeStart += firstLine.length + 1;
                }
                logLines = logLines.slice(1);
            }

            setNextRangeEnd(result.rangeStart - 400);
            setNextRangeStart(result.rangeStart - logText.length);

            logLines = logLines.reverse();
            setLines((oldList) => [...oldList, ...logLines]);

            console.log(result);
            toast.success('Bridge Command sent');
        } catch (error) {
            console.log(error);
            toast.error('Unable to send command to bridge.');
        }
    };

    const handleDeviceList = async () => {
        setLoadingText('Fetching bridge camera data...');
        try {
            const result = await getBridgeCameraList({
                socket: bridgeSocket,
                sequence: getSequence(),
                source_id: selectedBridgeDevice.source_id,
            });

            if (result.status === 200) {
                setBridgeCameras(result.data);
            }
        } catch (error) {
            console.log(error);
            toast.error('Unable to send command to bridge.');
        }

        setLoadingText('');
    };

    const sendBridgeCommand = (cmdObject: any, callback: any) => {
        if (callback) {
            console.log('sending bridge command: ', cmdObject);
            const sequence = getSequence();
            const updatedCmdObject = { ...cmdObject, sequence };

            bridgeSocket.sendAndGetResponse(
                sequence,
                updatedCmdObject,
                callback
            );
        }
    };

    const processLogData = (logDataObject: any) => {
        if (logDataObject) {
            if (logDataObject.error) {
                console.log(logDataObject.error);
            } else {
                let { rangeStart } = logDataObject;
                const b64 = logDataObject.data;
                if (b64) {
                    const logText = atob(b64);
                    let logLines = logText.split(/\r?\n/);
                    console.log(
                        'range: ',
                        logDataObject.rangeStart,
                        logDataObject.rangeEnd
                    );
                    if (rangeStart !== 0) {
                        const firstLine = logLines.at(0);
                        console.log('firstLine: ', firstLine);
                        if (firstLine) {
                            rangeStart += firstLine.length + 1;
                        }
                        logLines = logLines.slice(1);
                    }
                    logLines = logLines.reverse();
                    // const logParagraphs = groupByTenLines(logLines);
                    setLines((oldList) => [...oldList, ...logLines]);
                }

                if (rangeStart) {
                    rangeStartRef.current = rangeStart;
                } else {
                    rangeStartRef.current = 0;
                }

                rangeEndRef.current = logDataObject.rangeEnd;
                chunkSize.current =
                    logDataObject.rangeEnd - logDataObject.rangeStart;
            }
        }
    };

    const getLogs = (target: string, rangeStart: number, rangeEnd: number) => {
        const request = {
            type: 'command',
            source_id: selectedBridgeDevice.source_id,
            cmd: 'getLogs',
            target,
            rangeStart,
            rangeEnd,
        };
        sendBridgeCommand(request, (response: any) => {
            console.log('getLogs response: ', response.status);
            if (response.status === 200) {
                processLogData(response);
            }
        });
    };

    const nextLogChunk = () => {
        const rangeEnd = rangeStartRef.current;
        if (rangeEnd === 0) {
            return;
        }

        let rangeStart = rangeEnd - chunkSize.current;
        if (rangeStart < 0) {
            rangeStart = 0;
        }

        getLogs(logType, rangeStart, rangeEnd);
    };

    const handleBridgeAction = async (e: FormEvent) => {
        e.preventDefault();
        const { actionTarget, actionUniqueString } = actionProperties;

        const commandParams = {
            socket: bridgeSocket,
            sequence: getSequence(),
            source_id: selectedBridgeDevice.source_id,
            cameraUniqueId: actionUniqueString,
        };

        try {
            if (actionTarget === 'os') {
                const result = await restartBridgeOS(commandParams);
                console.log({ result });
                toast.success('Restarting bridge OS');
            } else if (actionTarget === 'bridge') {
                const result = await restartBridgeDevice(commandParams);
                console.log({ result });
                toast.success('Restarting bridge Device');
            } else if (actionTarget === 'edge') {
                console.log({ commandParams });
                const result = await restartBridgeCamera(commandParams);
                console.log({ result });
                toast.success('Restarting bridge camera');
            }
        } catch (error) {
            console.log(error);
            toast.error('Unable to send Bridge command.');
        }

        setShowConfirmActionModal(false);
    };

    useEffect(() => {
        // This is for development as the use effect is ran twice.  Hard to do cleanup with web sockets (cancel requests)
        if (show && firstRender.current) {
            firstRender.current = false;
            handleDeviceList();
        }
    }, [show]);

    console.log({
        rangeStart: rangeStartRef.current,
        rangeEnd: rangeEndRef.current,
    });

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    if (show) {
        return (
            <>
                <ModalBase
                    title={`Bridge Controls - ${selectedBridgeDevice.name}`}
                    className="bridge-controls-modal"
                    handleClose={handleClose}
                >
                    <TabPanel>
                        <TabPage label="Commands">
                            <div>
                                <div className="bridge-commands-container">
                                    <button
                                        className="btn primary outline"
                                        type="button"
                                        onClick={() => {
                                            setShowConfirmActionModal(true);
                                            setActionProperties({
                                                actionButtonLabel:
                                                    'Restart Machine OS',
                                                actionDescription:
                                                    'Are you sure you want to restart the bridge machines operating system?',
                                                actionTitle:
                                                    'Restart Bridge OS?',
                                                actionTarget: 'os',
                                                actionUniqueString: '',
                                            });
                                        }}
                                    >
                                        Restart Machine OS
                                    </button>

                                    <button
                                        className="btn primary outline"
                                        type="button"
                                        onClick={() => {
                                            setShowConfirmActionModal(true);
                                            setActionProperties({
                                                actionButtonLabel:
                                                    'Restart Bridge',
                                                actionDescription:
                                                    'Are you sure you want to restart the bridge?',
                                                actionTitle: 'Restart Bridge?',
                                                actionTarget: 'bridge',
                                                actionUniqueString: '',
                                            });
                                        }}
                                    >
                                        Restart Bridge
                                    </button>
                                </div>
                                <div className="bridge-camera-list">
                                    <p className="bridge-camera-list-title">
                                        Cameras
                                    </p>
                                    {bridgeCameras.map((camera) => {
                                        if (
                                            camera.enabled &&
                                            camera.sensorCount
                                        ) {
                                            return (
                                                <div
                                                    key={camera.urn}
                                                    className="bridge-camera-container"
                                                >
                                                    <p key={camera.urn}>
                                                        {camera.name}
                                                    </p>
                                                    <div className="restart-button-container">
                                                        {camera.sensorEnabled.map(
                                                            (value, index) => {
                                                                if (
                                                                    value ===
                                                                    false
                                                                ) {
                                                                    return null;
                                                                }

                                                                let cameraUniqueId =
                                                                    formatMacAddress(
                                                                        camera.macAddress
                                                                    );

                                                                if (
                                                                    camera.edge
                                                                        .length >
                                                                    1
                                                                ) {
                                                                    cameraUniqueId =
                                                                        formatMacAddress(
                                                                            camera.macAddress,
                                                                            index +
                                                                                1
                                                                        );
                                                                }

                                                                return (
                                                                    <button
                                                                        key={`edge-restart-${index}`}
                                                                        type="button"
                                                                        className="btn rounded sm primary"
                                                                        onClick={() => {
                                                                            console.log(
                                                                                'this ran'
                                                                            );
                                                                            setShowConfirmActionModal(
                                                                                true
                                                                            );
                                                                            setActionProperties(
                                                                                {
                                                                                    actionButtonLabel:
                                                                                        'Restart Camera',
                                                                                    actionDescription:
                                                                                        'Are you sure you want to restart this camera?',
                                                                                    actionTitle: `Restart Bridge Camera ${
                                                                                        camera.name
                                                                                    } ${
                                                                                        camera.sensorCount >
                                                                                        1
                                                                                            ? `(sensor - ${
                                                                                                  index +
                                                                                                  1
                                                                                              })`
                                                                                            : ''
                                                                                    }`,
                                                                                    actionTarget:
                                                                                        'edge',
                                                                                    actionUniqueString:
                                                                                        cameraUniqueId,
                                                                                }
                                                                            );
                                                                        }}
                                                                    >
                                                                        Restart
                                                                    </button>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            </div>
                        </TabPage>
                        <TabPage label="Logs">
                            <div className="log-button-container">
                                <button
                                    onClick={() => {
                                        setLines([]);
                                        setLogType('info');
                                        getLogs('info', -1, -1);
                                    }}
                                    className="btn primary outline"
                                    type="button"
                                >
                                    Get Bridge Info Logs
                                </button>
                                <button
                                    type="button"
                                    className="btn primary outline"
                                    onClick={() => {
                                        setLines([]);
                                        setLogType('error');
                                        getLogs('error', -1, -1);
                                    }}
                                >
                                    Get Bridge Error Logs
                                </button>
                            </div>
                            <div className="logsContainer">
                                {lines.map((line, index) => {
                                    return (
                                        <p key={`log-${index}`} className="log">
                                            {line}
                                        </p>
                                    );
                                })}
                            </div>

                            {lines.length > 0 &&
                                rangeStartRef.current !== 0 && (
                                    <div className="logActionsContainer">
                                        <button
                                            className="btn primary outline"
                                            type="button"
                                            onClick={() => {
                                                nextLogChunk();
                                            }}
                                        >
                                            Load More
                                        </button>
                                    </div>
                                )}
                        </TabPage>
                    </TabPanel>

                    <ButtonGroup alignment={ButtonGroupAlignment.middleright}>
                        <button
                            data-testid="bridge-controls-done-button"
                            className="btn neutral"
                            type="button"
                            onClick={handleClose}
                        >
                            Done
                        </button>
                    </ButtonGroup>
                </ModalBase>
                {showConfirmActionModal && (
                    <ModalBase
                        title={actionProperties.actionTitle}
                        handleClose={() => setShowConfirmActionModal(false)}
                    >
                        <form
                            onSubmit={handleBridgeAction}
                            className="DeleteAlertModal"
                        >
                            <p>{actionProperties.actionDescription}</p>

                            <div>
                                <button className="btn danger" type="submit">
                                    {actionProperties.actionButtonLabel}
                                </button>
                                <button
                                    className="btn neutral"
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmActionModal(false)
                                    }
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </ModalBase>
                )}

                {loadingText && <LoadingModal modalText={loadingText} />}
            </>
        );
    }
    return null;
};

export default BridgeControlsModal;
