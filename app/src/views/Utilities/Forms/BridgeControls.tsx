/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
    FC,
    useRef,
    useState,
    useCallback,
    useEffect,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react';

// Third Party
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SingleValue } from 'react-select';

// Api Calls
import getControllerURLBySpId from '../../../api_calls/getControllerURLBySpId';

// Components
import Select from '../../../components/Inputs/Select';
import BridgeDeviceTable from '../../../components/Tables/BridgeDeviceTable';
import BridgeControlsModal from '../../../components/Modals/BridgeControlsModal';

// Custom
import { useServiceProviders } from '../../../hooks';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';

// Utils
import handleHttpRequestError from '../../../utils/handleHttpRequestError';

// Types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType } from '../../../types/enums';
import { IServiceProvider } from '../../../types/tng-api.interfaces';
import { CustomWebSocket } from '../../../components/Outlets/Home/Edge/Edge';

// Styles
import '../../../styles/views/Utilities/BridgeControls.scss';

export interface IBridgeSource {
    account_id: number;
    bridge_id: number;
    source_id: string;
    name: string;
}

export interface IBridgeCamera {
    urn: string;
    enabled: boolean;
    model: string;
    onvifServiceUrl: string;
    ip: string;
    name: string;
    user: string;
    pass: string;
    macAddress: string;
    rtspUrls: string[];
    sensorEnabled: boolean[];
    lastFrame: string[];
    lastDiscovery: number;
    edge: boolean[];
    sensorCount: number;
    videoEncoderConfiguration: string[];
    timeDiff: number;
    loginError: string;
}

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
}

const BridgeControls: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
}) => {
    const navigate = useNavigate();

    const sequenceRef = useRef(0);
    const socketRef = useRef<CustomWebSocket | null>(null);
    const [bridgeList, setBridgeList] = useState<IBridgeSource[]>([]);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);
    const [selectedBridgeDevice, setSelectedBridgeDevice] =
        useState<IBridgeSource | null>(null);
    const [showBridgeControlModal, setShowBridgeControlModal] = useState(false);

    const liveViewQuery = useQuery({
        queryKey: ['live-view', selectedServiceProvider?.value],
        queryFn: () =>
            getControllerURLBySpId({
                user: activeUser as IUser,
                sp_id: selectedServiceProvider?.value as string,
            }),
        enabled: activeUser?.id === 1 && !!selectedServiceProvider?.value,
    });

    const liveViewControllerURL = useMemo(() => {
        if (activeUser && activeUser.id === 1 && liveViewQuery.data) {
            return liveViewQuery.data;
        }

        if (activeUser && activeUser.id !== 1) {
            return activeUser.live_view_controller_url;
        }

        return '';
    }, [liveViewQuery.data, activeUser]);

    const serviceProvidersQuery = useServiceProviders({
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Evolon,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const serviceProviderOptions = useMemo(() => {
        if (serviceProvidersQuery.data) {
            const serviceProvidersSorted: IServiceProvider[] =
                serviceProvidersQuery.data.sort(sortByName);

            return OptionsConverter.convertServiceProvidersToOptions(
                serviceProvidersSorted
            );
        }

        return [];
    }, [serviceProvidersQuery.data]);

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
                        type: 'bridge_list',
                        sequence: getSequence(),
                    };
                    socket.send(JSON.stringify(request));
                } else if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'bridge_list' &&
                    messageData.status === 200
                ) {
                    setBridgeList(messageData.bridge_list);
                } else if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'pong'
                ) {
                    pongRecieved = true;
                } else if (
                    messageData.type === 'response' &&
                    messageData.response_type === 'command'
                ) {
                    const { sequence, status, data, rangeStart, rangeEnd } =
                        messageData;

                    if (sequence) {
                        const callback = requestMapper[sequence];

                        if (callback) {
                            delete requestMapper[sequence];
                            const resObj: { [key: string]: any } = { status };

                            if (data) {
                                resObj.data = data;
                            }

                            if (rangeStart) {
                                resObj.rangeStart = rangeStart;
                            }

                            if (rangeEnd) {
                                resObj.rangeEnd = rangeEnd;
                            }

                            callback(resObj);
                        }
                    }
                }
            };

            socket.onclose = () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }

                setBridgeList([]);
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

    useEffect(() => {
        console.log({ bridgeList });
    }, [bridgeList]);

    return (
        <motion.div
            id="CreateSite"
            key="CreateSite"
            className="bridge-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <div className="headerContainer">
                <div className="titleContainer">
                    <h3>
                        <span>Bridge</span>
                    </h3>
                </div>
            </div>

            {accountType === AccountType.Evolon && (
                <div
                    className="select-container form-item"
                    style={{ marginBottom: '2rem' }}
                >
                    <label htmlFor="service-providers">
                        <span>Under SP Account</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="service-providers"
                        value={selectedServiceProvider}
                        onChange={(option) => {
                            if (
                                option?.value === selectedServiceProvider?.value
                            ) {
                                return;
                            }

                            setSelectedServiceProvider(
                                option as SingleValue<SelectOption>
                            );
                        }}
                        options={serviceProviderOptions}
                        isClearable={false}
                        disabled={defaultServiceProvider !== null}
                        required
                    />
                </div>
            )}

            <BridgeDeviceTable
                data={bridgeList}
                onControlOptions={(bridgeData) => {
                    setSelectedBridgeDevice(bridgeData);
                    setShowBridgeControlModal(true);
                }}
            />

            {selectedBridgeDevice && socketRef.current && (
                <BridgeControlsModal
                    bridgeSocket={socketRef.current}
                    getSequence={getSequence}
                    show={showBridgeControlModal}
                    selectedBridgeDevice={selectedBridgeDevice}
                    onClose={() => {
                        setShowBridgeControlModal(false);
                        setSelectedBridgeDevice(null);
                    }}
                />
            )}
        </motion.div>
    );
};

export default BridgeControls;
