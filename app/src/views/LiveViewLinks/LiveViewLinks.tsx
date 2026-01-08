/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable prefer-destructuring */
// React
import { useEffect, useMemo, useRef, useState } from 'react';

// React Router Dom
import { useSearchParams } from 'react-router-dom';

// UUID
import { v4 as uuidv4 } from 'uuid';

// Tan stack query
import { useQuery, useMutation } from '@tanstack/react-query';

// React Toastify
import { toast } from 'react-toastify';

// React Icons
import { FaSearch } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

// Edge Data Fetching
import { setAppParam } from '../../components/Outlets/Home/Edge/dataFetching';

// Api Calls
import { getAWSData } from '../../components/Modals/VideoAnnotator.controller';
import getControllerUrlFromCode from '../../api_calls/getControllerUrlFromCode';
import getLiveViewLinkActions, {
    ILiveViewAction,
} from '../../api_calls/getLiveViewLinkActions';
import logLiveViewLinkAction from '../../api_calls/logLiveViewLinkAction';
import logCameraAction from '../../api_calls/logCameraAction';

// Components
import NewVideoAnnotator from '../../components/Modals/NewVideoAnnotator';

// Hooks
import useLiveViewLinkControllerConnection from '../../hooks/useLiveViewLinkControllerConnection';

// Types
import { ICameraSource } from '../../components/Outlets/Home/Camera/LiveView';

// Utils
import formatAPITimeStampToLocalTimeStamp from '../../utils/formatApiTimeStampToLocalTimeStamp';

// Styles
import '../../styles/views/LiveViewLinks.scss';

export interface IAxisHornAction {
    device: string;
    ip: string;
    vendor: string;
    action: string;
    username: string;
    password: string;
    clip: number;
    volume: number;
}

const LiveViewLinks = () => {
    const [searchParams] = useSearchParams();

    const code = useMemo(() => {
        return searchParams.get('code');
    }, [searchParams]);

    const [activeSource, setActiveSource] = useState<ICameraSource | undefined>(
        undefined
    );
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraSearch, setCameraSearch] = useState('');

    const controllerURL = useQuery(
        ['getControllerUrlFromCode'],
        () => getControllerUrlFromCode(code as string),
        { enabled: !!code }
    );

    const liveViewLinkActions = useQuery(
        ['liveViewLinkActions'],
        () =>
            getLiveViewLinkActions(
                controllerURL.data?.camera_id || 0,
                code as string
            ),
        { enabled: !!(code && controllerURL.data?.camera_id) }
    );

    const messageQuery = useQuery({
        queryKey: ['message', controllerURL.data?.aws_pre_sign_message_url],
        queryFn: () =>
            getAWSData(controllerURL.data?.aws_pre_sign_message_url as string),
        enabled: !!controllerURL.data?.aws_pre_sign_message_url,
    });

    const alarmQuery = useQuery({
        queryKey: ['alarm', controllerURL.data?.aws_pre_sign_alarm_url],
        queryFn: () =>
            getAWSData(controllerURL.data?.aws_pre_sign_alarm_url as string),
        enabled: !!controllerURL.data?.aws_pre_sign_alarm_url,
    });

    const multiModalBoxQuery = useQuery({
        queryKey: [
            'multi-modal-boxes',
            controllerURL.data?.aws_pres_sign_multimodal_detections_url,
        ],
        queryFn: () =>
            getAWSData(
                controllerURL.data
                    ?.aws_pres_sign_multimodal_detections_url as string
            ),
        retry: 0,
        enabled: !!controllerURL.data?.aws_pres_sign_multimodal_detections_url,
    });

    const logLiveViewActionMutation = useMutation({
        mutationFn: logLiveViewLinkAction,
    });

    const logCameraActionMutation = useMutation({
        mutationFn: logCameraAction,
    });

    const { socket, sourceList, getSequence } =
        useLiveViewLinkControllerConnection({
            controllerURL: controllerURL.data?.url,
            code,
            videoRef,
        });

    const filteredSourceList = useMemo(() => {
        if (cameraSearch) {
            return sourceList
                .filter((source) => {
                    return source.source_name
                        .toLowerCase()
                        .includes(cameraSearch.toLowerCase());
                })
                .sort((a, b) => {
                    return a.source_name.localeCompare(b.source_name);
                });
        }

        return sourceList.sort((a, b) => {
            return a.source_name.localeCompare(b.source_name);
        });
    }, [cameraSearch, sourceList]);

    const eventSourceActive = useMemo(() => {
        if (activeSource && controllerURL.data) {
            return activeSource.camera_id === controllerURL.data.camera_id;
        }

        return false;
    }, [activeSource, sourceList, controllerURL]);

    const availableActions = useMemo(() => {
        const possibleCameraActions: { [key: string]: ILiveViewAction[] } = {};

        if (liveViewLinkActions.data && activeSource) {
            liveViewLinkActions.data.response.data.forEach((action) => {
                if (action.camera_id === activeSource.camera_id) {
                    const targetKey = `${action.camera_action_name}`;

                    if (possibleCameraActions[targetKey]) {
                        possibleCameraActions[targetKey].push(action);
                    } else {
                        possibleCameraActions[targetKey] = [action];
                    }
                }
            });
        }

        return Object.values(possibleCameraActions).map((value) => {
            return value;
        });
    }, [liveViewLinkActions.data, activeSource]);

    const stopVideo = (item: ICameraSource) => {
        const request = {
            type: 'stop_stream',
            sequence: getSequence(),
            source_id: item.source_id,
        };

        if (socket && videoRef.current) {
            socket.send(JSON.stringify(request));
            videoRef.current.srcObject = null;
        }
    };

    const startVideo = (item: ICameraSource) => {
        if (activeSource) {
            stopVideo(activeSource);
        }

        const request = {
            type: 'start_stream',
            sequence: getSequence(),
            source_id: item.source_id,
        };

        if (socket) {
            socket.send(JSON.stringify(request));
        }
    };

    // const playSiren = async () => {
    //     if (socket && activeSource && code) {
    //         const axisSirenAction = {
    //             device: 'siren',
    //             ip: '192.168.1.152',
    //             vendor: 'axis',
    //             action: 'start',
    //             username: 'root',
    //             password: 'pass',
    //             profile: 'T1',
    //         };

    //         console.log({ axisSirenAction });

    //         const result = await setAppParam({
    //             socket,
    //             sequence: getSequence(),
    //             source_id: activeSource.source_id,
    //             param: 'DeviceIO',
    //             value: JSON.stringify(axisSirenAction),
    //         });

    //         console.log(getValue(result));
    //     }
    // };

    // const playHornTest = async () => {
    //     if (socket && activeSource && code) {
    //         const axisHornAction = {
    //             device: 'speaker',
    //             ip: '192.168.1.81',
    //             vendor: 'axis',
    //             action: 'play',
    //             username: 'root',
    //             password: 'pass',
    //             clip: 0,
    //             volume: 250,
    //         };

    //         console.log({ axisHornAction });

    //         const result = await setAppParam({
    //             socket,
    //             sequence: getSequence(),
    //             source_id: activeSource.source_id,
    //             param: 'DeviceIO',
    //             value: JSON.stringify(axisHornAction),
    //         });

    //         console.log(getValue(result));
    //     }
    // };

    const playDevice = async (deviceAction: ILiveViewAction) => {
        if (socket && activeSource && code) {
            const socketMessageBody = {
                ...deviceAction.camera_action_properties,
                ...deviceAction.network_device_properties,
            };

            console.log({ socketMessageBody });

            // We use ip_address on the insites side but edge uses ip
            if (socketMessageBody.ip_address) {
                socketMessageBody.ip = socketMessageBody.ip_address;
                delete socketMessageBody.ip_address;
            }

            const request_id = uuidv4();

            await logLiveViewActionMutation.mutateAsync({
                camera_id: deviceAction.camera_id,
                device_id: deviceAction.network_device_id,
                live_view_link_token: code,
                request_id,
                action: 'send',
                details: `Sent ${deviceAction.camera_action_name} (id: ${deviceAction.camera_action_id}) to ${deviceAction.network_device_name} (id: ${deviceAction.network_device_id})`,
                properties: socketMessageBody,
            });

            const result = await setAppParam({
                socket,
                sequence: getSequence(),
                source_id: activeSource.source_id,
                param: 'DeviceIO',
                value: JSON.stringify(socketMessageBody),
            });

            await logLiveViewActionMutation.mutateAsync({
                camera_id: deviceAction.camera_id,
                device_id: deviceAction.network_device_id,
                live_view_link_token: code,
                request_id,
                action: 'response',
                details: result,
                properties: socketMessageBody,
            });

            if (!result.includes('200')) {
                await logLiveViewActionMutation.mutateAsync({
                    camera_id: deviceAction.camera_id,
                    device_id: deviceAction.network_device_id,
                    live_view_link_token: code,
                    request_id,
                    action: 'response',
                    details: 'Error occurred when trying to send horn message.',
                    properties: socketMessageBody,
                });

                const error = new Error(result) as any;
                error.action = deviceAction;
                throw error;
            }

            try {
                await logCameraActionMutation.mutateAsync({
                    camera_id: deviceAction.camera_id,
                    camera_action_id: deviceAction.camera_action_id,
                    token: code,
                });
            } catch (err) {
                console.log(err);
                toast.error('Unabled to log camera action.');
            }

            return deviceAction;
        }

        return undefined;
    };

    const playHornActions = async (actions: ILiveViewAction[]) => {
        console.log({ actions });

        const actionsToCall = actions.map((action) => {
            return playDevice(action);
        });

        console.log({ actionsToCall });

        let successMessage = '';

        if (actions.length === 1) {
            successMessage = `Action sent to ${actions[0].network_device_name}`;
        } else {
            successMessage = `Actions sent to ${actions.length} devices: `;
            actions.forEach((action, index) => {
                if (index !== actions.length - 1) {
                    successMessage += `${action.network_device_name}, `;
                } else {
                    successMessage += `${action.network_device_name}`;
                }
            });
        }

        const results = await Promise.allSettled(actionsToCall);
        const allMessagesSent = results.every(
            (result) => result.status === 'fulfilled'
        );

        if (allMessagesSent) {
            toast.success(successMessage);
        } else {
            results.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                    toast.success(
                        `Audio message sent to ${result.value.network_device_name}`
                    );
                } else if (
                    result.status === 'rejected' &&
                    result.reason.message
                ) {
                    toast.error(result.reason.message);
                }
            });
        }
    };

    useEffect(() => {
        if (!activeSource && sourceList.length > 0 && controllerURL.data) {
            const targetCameraId = controllerURL.data.camera_id;

            const targetSourceListItem = sourceList.find(
                (source) => source.camera_id === targetCameraId
            );

            if (targetSourceListItem) {
                setActiveSource(targetSourceListItem);
            } else {
                setActiveSource(sourceList[0]);
            }
        }
    }, [activeSource, sourceList, controllerURL.data]);

    useEffect(() => {
        if (activeSource) {
            startVideo(activeSource);
        }

        return () => {
            if (activeSource) {
                stopVideo(activeSource);
            }
        };
    }, [activeSource]);

    return (
        <div className="LiveViewLinks">
            <div className="siteContainer">
                <h1>
                    <span>Site:</span> {activeSource?.site_name}
                </h1>
            </div>
            <div className="viewContainer">
                <div className="liveViewLinkTitleContainer">
                    <h2 className="liveFeedLabel">
                        Live Feed {eventSourceActive ? '(Event Source)' : ''}
                    </h2>
                    <div className="liveFeedInfoContainer">
                        <h2 className="cameraLabel">
                            <span>Camera:</span> {activeSource?.source_name}
                        </h2>
                    </div>
                </div>

                <div className="liveViewLinkTitleContainer">
                    <h2 className="liveFeedLabel">Alert Clip</h2>
                    <div className="liveFeedInfoContainer">
                        <h2 className="cameraLabel">
                            <span>Camera:</span>{' '}
                            {controllerURL.data?.camera_name}
                        </h2>
                    </div>
                    {controllerURL.data?.clip_created_at &&
                        controllerURL.data.clip_created_at && (
                            <div className="liveFeedInfoContainer">
                                <h2 className="cameraLabel">
                                    <span>Generated At:</span>{' '}
                                    {formatAPITimeStampToLocalTimeStamp(
                                        controllerURL.data.clip_created_at
                                    )}
                                </h2>
                            </div>
                        )}
                </div>

                <div className="liveViewLinkVideoContainer">
                    <video
                        style={{
                            width: '100%',
                            height: 'auto',
                        }}
                        width="100%"
                        ref={videoRef}
                        autoPlay
                        muted
                    />
                </div>

                <div className="clipVideoContainer">
                    {controllerURL.data &&
                        controllerURL.data.aws_pre_sign_alarm_url &&
                        controllerURL.data
                            .aws_pre_sign_cleaned_detections_url && (
                            <NewVideoAnnotator
                                aws_pre_sign_origin_url={
                                    controllerURL.data.clip_url
                                }
                                aws_pre_sign_cleaned_detections_url={
                                    controllerURL.data
                                        .aws_pre_sign_cleaned_detections_url
                                }
                                showMask
                                showBoundingBoxes
                                showAILabels
                                multiModalBoxQuery={multiModalBoxQuery}
                                messageQuery={messageQuery}
                                alarmQuery={alarmQuery}
                                loadingText=""
                            />
                        )}

                    {/* {controllerURL.data?.clip_url && (
                        <video
                            width="100%"
                            height="auto"
                            controls
                            autoPlay
                            muted
                            playsInline
                        >
                            <source
                                src={controllerURL.data?.clip_url}
                                type="video/mp4"
                            />
                        </video>
                    )} */}

                    {controllerURL.data?.clip_url === '' && (
                        <div className="noData">
                            <p>Clip not found</p>
                            <p>There is no clip associated with this event.</p>
                        </div>
                    )}
                </div>

                <div className="actionButtonsContainer">
                    {availableActions.map((actions) => {
                        return (
                            <button
                                onClick={() => {
                                    if (socket && activeSource) {
                                        playHornActions(actions);
                                    }
                                }}
                                className="btn primary"
                                type="button"
                                key={actions[0].camera_action_id}
                            >
                                {actions[0].camera_action_name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="cameraSearchContainer">
                <div className="search-bar-input">
                    <div className="search-bar-icon">
                        <FaSearch />
                    </div>
                    <input
                        className="search-bar-text"
                        placeholder="Search cameras"
                        type="text"
                        value={cameraSearch}
                        onChange={(e) => setCameraSearch(e.target.value)}
                    />
                    <div
                        className="search-bar-clear"
                        onClick={() => setCameraSearch('')}
                    >
                        <IoMdClose />
                    </div>
                </div>
            </div>

            <ul className="sourceList">
                {filteredSourceList.map((item, index) => {
                    return (
                        <li
                            className={`cameraSourceCard ${
                                item.camera_id === activeSource?.camera_id
                                    ? 'active'
                                    : ''
                            }`}
                            key={item.source_id}
                            onClick={() => setActiveSource(item)}
                        >
                            {item.thumb_data && (
                                <img
                                    className="streamThumbnail"
                                    style={{
                                        transform: item.thumb_rotate
                                            ? `rotate(${item.thumb_rotate}deg)`
                                            : '',
                                    }}
                                    alt="stream view"
                                    src={`data:image/${item.thumb_type};base64,${item.thumb_data}`}
                                />
                            )}

                            <div className="cardBody">
                                <p>
                                    <span className="label">Camera:</span>{' '}
                                    {item.source_name}
                                </p>

                                {index === 0 && <p>Event Source</p>}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default LiveViewLinks;
