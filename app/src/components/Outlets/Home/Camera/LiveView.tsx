/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-destructuring */
import React, {
    useState,
    useRef,
    useEffect,
    FC,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react';

// Types
import { IUser } from '../../../../types/interfaces';

export interface ICameraSource {
    source_name: string; // 'Axis M1135'
    api_key: string;
    source_id: string;
    source_type: string;
    firmware_version: string;
    width: number;
    height: number;
    camera_id: number;
    site_id: number;
    site_name: string;
    thumb_data: string;
    thumb_type: string;
    thumb_rotate: number;
}

interface IProps {
    watchLive: boolean;
    setSourceList: Dispatch<SetStateAction<ICameraSource[]>>;
    liveStreamSourceId: string | undefined;
    activeUser: IUser;
}

const LiveView: FC<IProps> = ({
    watchLive,
    setSourceList,
    liveStreamSourceId,
    activeUser,
}) => {
    const [log, setLog] = useState([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const sequenceRef = useRef(0);
    const [peer, setPeer] = useState<RTCPeerConnection | null>(null);

    const getSequence = () => {
        const seq = sequenceRef.current;
        sequenceRef.current = seq + 1;
        return seq;
    };

    const stopVideo = (sourceId: string) => {
        // console.log('stopping video for: ', item.source_id);
        const request = {
            type: 'stop_stream',
            sequence: getSequence(),
            source_id: sourceId,
        };

        if (socketRef.current && videoRef.current) {
            socketRef.current.send(JSON.stringify(request));
            videoRef.current.srcObject = null;
        }
    };

    const startVideo = (sourceId: string) => {
        if (sourceId) {
            stopVideo(sourceId);
        }
        // console.log('starting video for: ', item.source_id);
        const request = {
            type: 'start_stream',
            sequence: getSequence(),
            source_id: sourceId,
        };

        if (socketRef.current) {
            socketRef.current.send(JSON.stringify(request));
        }
    };

    useEffect(() => {
        let intervalId: any = null;

        if (activeUser.live_view_controller_url) {
            const socket = new WebSocket(
                `wss://${activeUser.live_view_controller_url}`
            );
            let pongRecieved = true;

            socketRef.current = socket;

            socket.onopen = (ev) => {
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

                setPeer(updatedPeer);
            };

            socket.onmessage = (ev) => {
                const data = JSON.parse(ev.data);

                if (
                    data.type === 'response' &&
                    data.response_type === 'announce' &&
                    data.status === 200
                ) {
                    const request = {
                        type: 'source_list',
                        sequence: getSequence(),
                    };
                    socket.send(JSON.stringify(request));
                } else if (
                    data.type === 'response' &&
                    data.response_type === 'source_list' &&
                    data.status === 200
                ) {
                    setSourceList(data.source_list);
                } else if (data.type === 'offer') {
                    handleOffer(data);
                } else if (
                    data.type === 'response' &&
                    data.response_type === 'pong'
                ) {
                    pongRecieved = true;
                }
            };

            socket.onclose = (ev) => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
                // console.log('socket on close');
            };

            socket.onerror = (ev) => {
                console.log(JSON.stringify(ev));
                console.log(`socket on error: ${ev}`);
            };

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
    }, [activeUser.live_view_controller_url]);

    useEffect(() => {
        if (watchLive && liveStreamSourceId) {
            console.log('video started');
            startVideo(liveStreamSourceId);
        }

        return () => {
            if (liveStreamSourceId) {
                console.log('video stopped');
                stopVideo(liveStreamSourceId);
            }
        };
    }, [watchLive, liveStreamSourceId]);

    if (!watchLive) {
        return null;
    }

    return (
        <video
            style={{ background: '#000000' }}
            width="100%"
            ref={videoRef}
            autoPlay
            muted
        />
    );
};

export default LiveView;
