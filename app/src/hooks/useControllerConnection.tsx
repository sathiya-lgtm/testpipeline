/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
// React
import { useEffect, useRef, useState, useCallback } from 'react';

// Types
import { CustomWebSocket } from '../components/Outlets/Home/Edge/Edge';
import { IUser } from '../types/interfaces';
import { ICameraSource } from '../components/Outlets/Home/Camera/LiveView';

interface IProps {
    activeUser: IUser | null;
    liveViewControllerURL: string | undefined;
}

const useControllerConnection = ({
    activeUser,
    liveViewControllerURL,
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

            socket.onmessage = (ev) => {
                const messageData = JSON.parse(ev.data);

                if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'announce' &&
                    messageData.status === 200
                ) {
                    const request = {
                        type: 'source_list',
                        sequence: getSequence(),
                    };
                    socket.send(JSON.stringify(request));
                } else if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'source_list' &&
                    messageData.status === 200
                ) {
                    setSourceList(messageData.source_list);
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
    };
};

export default useControllerConnection;
