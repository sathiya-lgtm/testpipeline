/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
// React
import { useEffect, RefObject, useRef, useState, useCallback } from 'react';

// Types
import { CustomWebSocket } from '../components/Outlets/Home/Edge/Edge';
import { IUser } from '../types/interfaces';

// We came up with a new sourcelist that does not use the thumbnail data.  It also doesn't update over time, just
// gets the data used for websocket messages.  This is more efficent and will be used on the camera config page.
interface ICameraLimitedSource {
    source_name: string;
    api_key: string;
    source_id: string;
    source_type: string;
    firmware_version: string;
    width: number;
    height: number;
    account_id: number;
    site_id: number;
    camera_id: number;
    site_name: string;
}

interface IProps {
    activeUser: IUser | null;
    liveViewControllerURL: string | undefined;
    videoRef: RefObject<HTMLVideoElement>;
}

const useLiveViewControllerConnection = ({
    activeUser,
    liveViewControllerURL,
    videoRef,
}: IProps) => {
    const sequenceRef = useRef(0);
    const socketRef = useRef<CustomWebSocket | null>(null);
    const [sourceList, setSourceList] = useState<ICameraLimitedSource[]>([]);

    const getSequence = useCallback(() => {
        const seq = sequenceRef.current;
        sequenceRef.current = seq + 1;
        return seq;
    }, []);

    const stopVideo = useCallback((sourceId: string) => {
        const request = {
            type: 'stop_stream',
            sequence: getSequence(),
            source_id: sourceId,
        };

        if (socketRef.current && videoRef.current) {
            socketRef.current.send(JSON.stringify(request));
            videoRef.current.srcObject = null;
        }
    }, []);

    const startVideo = useCallback((sourceId: string, hi_res?: boolean) => {
        if (sourceId) {
            stopVideo(sourceId);
        }
        // console.log('starting video for: ', item.source_id);
        const request = {
            type: 'start_stream',
            sequence: getSequence(),
            source_id: sourceId,
            hi_res: hi_res ?? false,
        };

        if (socketRef.current) {
            socketRef.current.send(JSON.stringify(request));
        }
    }, []);

    useEffect(() => {
        let intervalId: any = null;

        if (activeUser && liveViewControllerURL) {
            const socket = new WebSocket(
                `wss://${liveViewControllerURL}`
            ) as CustomWebSocket;
            let pongRecieved = true;

            const requestMapper: any = {};

            socket.sendAndGetResponse = (
                sequence: number,
                request: any,
                callback: any
            ) => {
                if (socket.readyState === 0) {
                    // console.log("waiting for connect on wss send: ",message);
                    setTimeout(() => {
                        socket.sendAndGetResponse(sequence, request, callback);
                    }, 300);
                } else if (socket.readyState !== 1) {
                    callback('ERROR');
                } else {
                    requestMapper[sequence] = callback;
                    socket.send(JSON.stringify(request));
                }
            };

            socket.onopen = () => {
                console.log('websocket to server connected');

                const request = {
                    type: 'announce',
                    sequence: getSequence(),
                    role: 'viewer',
                    insites_token: activeUser.accessToken,
                };

                socket.send(JSON.stringify(request));
            };

            const handleOffer = async (offer: any) => {
                // console.log('new offer', offer.sdp);
                const sourceId = offer.source_id;
                // console.log(`offer camera: ${sourceId}`);

                const updatedPeer = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
                    // sdpSemantics: 'unified-plan',
                });

                updatedPeer.onicecandidate = ({ candidate }) => {
                    if (candidate) {
                        console.log('new ice candidate: ', candidate);
                    } else {
                        console.log('end of ice candidates');

                        if (updatedPeer.localDescription) {
                            const answer =
                                updatedPeer.localDescription.toJSON();

                            answer['source_id'] = sourceId;
                            const sdp = JSON.stringify(answer);
                            // console.log(`answer: ${sdp}`);
                            socket.send(sdp);
                        }
                    }
                };

                updatedPeer.oniceconnectionstatechange = () => {
                    console.log(
                        'oniceconnectionstatechange',
                        updatedPeer.iceConnectionState
                    );
                };

                updatedPeer.ontrack = (e) => {
                    // console.log('ontrack', e);

                    if (videoRef.current) {
                        videoRef.current.srcObject = e.streams[0];
                    }
                };

                await updatedPeer.setRemoteDescription(offer);
                const answer = await updatedPeer.createAnswer();
                // console.log(`base answer: ${JSON.stringify(answer)}`);
                await updatedPeer.setLocalDescription(answer);
            };

            socket.onmessage = (ev) => {
                const messageData = JSON.parse(ev.data);

                if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'announce' &&
                    messageData.status === 200
                ) {
                    const request = {
                        type: 'source_snapshot',
                        sequence: getSequence(),
                    };
                    socket.send(JSON.stringify(request));
                } else if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'source_snapshot' &&
                    messageData.status === 200
                ) {
                    setSourceList(messageData.source_snapshot);
                } else if (messageData.type === 'offer') {
                    handleOffer(messageData);
                } else if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'pong'
                ) {
                    pongRecieved = true;
                } else if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'edge_update'
                ) {
                    const { sequence } = messageData;
                    const { message } = messageData;

                    if (sequence && message) {
                        const callback = requestMapper[sequence];

                        if (callback) {
                            delete requestMapper[sequence];
                            callback(message);
                        }
                    }
                }
            };

            socket.onclose = () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
                // console.log('socket on close');
            };

            socket.onerror = (ev) => {
                console.log(JSON.stringify(ev));
                console.log(`socket on error: ${ev}`);
            };

            socketRef.current = socket;

            intervalId = setInterval(() => {
                if (!pongRecieved) {
                    socket.close();
                } else {
                    const request = { type: 'ping', sequence: getSequence() };
                    socket.send(JSON.stringify(request));
                }
            }, 54000);
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                console.log('WebSocket connection closed');
            }

            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [activeUser, liveViewControllerURL]);

    return {
        socket: socketRef.current,
        sourceList,
        getSequence,
        startVideo,
        stopVideo,
    };
};

export default useLiveViewControllerConnection;
