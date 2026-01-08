/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
// React
import { useEffect, RefObject, useRef, useState, useCallback } from 'react';

// Types
import { CustomWebSocket } from '../components/Outlets/Home/Edge/Edge';
import { ICameraSource } from '../components/Outlets/Home/Camera/LiveView';

interface IProps {
    controllerURL: string | undefined | null;
    code: string | null;
    videoRef: RefObject<HTMLVideoElement>;
}

const useLiveViewLinkControllerConnection = ({
    controllerURL,
    code,
    videoRef,
}: IProps) => {
    const sequenceRef = useRef(0);
    const socketRef = useRef<CustomWebSocket | null>(null);
    const [sourceList, setSourceList] = useState<ICameraSource[]>([]);

    const getSequence = useCallback(() => {
        const seq = sequenceRef.current;
        sequenceRef.current = seq + 1;
        return seq;
    }, []);

    useEffect(() => {
        let intervalId: any = null;

        console.log({ controllerURL, code });

        if (controllerURL && code) {
            const socket = new WebSocket(
                `wss://${controllerURL}`
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
                    role: 'link_viewer',
                    link_code: code,
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

                            answer.source_id = sourceId;
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
                        type: 'source_list_v2',
                        sequence: getSequence(),
                    };
                    socket.send(JSON.stringify(request));
                } else if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'source_list_v2' &&
                    messageData.status === 200
                ) {
                    const updatedSourceList = messageData.source_list;
                    let newSourceList: any[] = [];
                    setSourceList((existingSourceList) => {
                        console.log(
                            'existing source list: ',
                            existingSourceList.length
                        );
                        if (messageData.verb === 'remove') {
                            // filter out members of existing list that match the incoming
                            console.log(
                                'removing source list: ',
                                updatedSourceList.length
                            );
                            newSourceList = existingSourceList.filter(
                                (source) => {
                                    const updatedSource =
                                        updatedSourceList.find(
                                            (us: any) =>
                                                us.source_id ===
                                                source.source_id
                                        );
                                    return updatedSource === undefined;
                                }
                            );
                        } else if (messageData.verb === 'add') {
                            // remove any duplicate members of existing list that match the incoming
                            console.log(
                                'adding source list: ',
                                updatedSourceList.length
                            );
                            newSourceList = existingSourceList.filter(
                                (source) => {
                                    const updatedSource =
                                        updatedSourceList.find(
                                            (us: any) =>
                                                us.source_id ===
                                                source.source_id
                                        );
                                    return updatedSource === undefined;
                                }
                            );
                            // now add the incoming
                            console.log(
                                'pruned source list: ',
                                newSourceList.length
                            );
                            newSourceList =
                                newSourceList.concat(updatedSourceList);
                        } else if (messageData.verb === 'update') {
                            // map or replace members of existing list that match the incoming
                            console.log(
                                'updating source list: ',
                                updatedSourceList.length
                            );
                            newSourceList = existingSourceList.map((source) => {
                                const updatedSource = updatedSourceList.find(
                                    (us: any) =>
                                        us.source_id === source.source_id
                                );
                                return updatedSource === undefined
                                    ? source
                                    : updatedSource;
                            });
                        }
                        console.log(
                            'updated source list: ',
                            newSourceList.length
                        );
                        return newSourceList;
                    });
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
    }, [controllerURL, code]);

    return {
        socket: socketRef.current,
        sourceList,
        getSequence,
    };
};

export default useLiveViewLinkControllerConnection;
