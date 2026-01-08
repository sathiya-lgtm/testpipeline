/* eslint-disable no-underscore-dangle */
// React
import { useEffect, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

// Third Party
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

// Components
import Toggle from '../../../Inputs/Toggle';
import NoData from '../../../NoData';
import ClipFailedToLoad from '../Camera/ClipFailedToLoad';

// Api Calls
import getCameraData from '../../../../api_calls/getCameraData';
import getCameraClips from '../../../../api_calls/getCameraClips';
import getControllerURLByCameraId from '../../../../api_calls/getControllerURLByCameraId';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

// Controller
import {
    displayAutoClipDateTime,
    handleJobTypeUpdate,
} from '../Camera/Camera.controller';

// Hooks
import useLiveViewControllerConnection from '../../../../hooks/useLiveViewControllerConnection';

// Utils
import handleHttpRequestError from '../../../../utils/handleHttpRequestError';
import stripTimeZoneFromClips from '../../../../utils/stripTimeZoneFromClips';
import sortByDate from '../../../../utils/sortByDate';

// Types
import { IClip } from '../../../../types/tng-api.interfaces';
import { IUser } from '../../../../types/interfaces';
import { JobType } from '../../../../types/enums';

// Styles
import '../../../../styles/components/Outlets/Home/Camera.scss';
import '../../../../styles/components/Slider.scss';

export interface CustomWebSocket extends WebSocket {
    sendAndGetResponse: any;
}

const CustomerEdgeView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const { activeUser, setActiveUser } = useContext(AuthContext);

    const defaultLiveViewActiveValue = useMemo(() => {
        if (activeUser) {
            const data = localStorage.getItem(
                `customer-live-view-${activeUser.id}`
            );

            if (data) {
                return data === 'true';
            }
        }

        return false;
    }, [activeUser]);

    const liveViewRestricted = useMemo(() => {
        if (location.pathname.includes('/home/camera')) {
            return true;
        }

        return false;
    }, [location]);

    console.log({ liveViewRestricted });

    // Live Stream Stuff
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [liveViewActive, setLiveViewActive] = useState(
        defaultLiveViewActiveValue
    );
    const [useFallbackClip, setUseFallbackClip] = useState(false);
    const [clipFailedToLoad, setClipFailedToLoad] = useState(false);

    // On each config page, we need to check if the user has changed the live stream value
    useEffect(() => {
        if (activeUser) {
            const data = localStorage.getItem(
                `customer-live-view-${activeUser.id}`
            );

            if (data === 'true') {
                setLiveViewActive(true);
                return;
            }
        }

        setLiveViewActive(false);
    }, [params.id]);

    const liveViewQuery = useQuery({
        queryKey: ['live-view', params.id],
        queryFn: () =>
            getControllerURLByCameraId({
                user: activeUser as IUser,
                camera_id: params.id as string,
            }),
        enabled: activeUser?.id === 1 && !!params.id,
    });

    const liveViewControllerURL = useMemo(() => {
        if (activeUser && activeUser.id === 1 && liveViewQuery.data) {
            return liveViewQuery.data;
        }

        if (activeUser) {
            return activeUser.live_view_controller_url;
        }

        return '';
    }, [liveViewQuery.data, activeUser]);

    const { socket, sourceList, startVideo, stopVideo } =
        useLiveViewControllerConnection({
            activeUser,
            liveViewControllerURL,
            videoRef,
        });

    // Since we are polling, we need to user a ref to get the latest activeUser tokens when the tokens are refreshed
    const activeUserRef = useRef(activeUser);
    useEffect(() => {
        activeUserRef.current = activeUser;
    }, [activeUser]);

    // React Query.
    const { data } = useQuery({
        queryKey: ['camera-data', params.id],
        queryFn: () =>
            getCameraData(activeUserRef.current as IUser, params.id as string),
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    const edgeStatusQuery = useQuery({
        queryKey: ['edge-status', params.id],
        queryFn: () => getCameraData(activeUser as IUser, params.id as string),
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    const clipsQuery = useQuery({
        queryKey: ['clips', params.id],
        queryFn: () => getCameraClips(activeUser as IUser, Number(params.id)),
        cacheTime: 30_000,
        staleTime: 5_000,
        onError: (err: any) => {
            handleHttpRequestError(err, setActiveUser, navigate);
        },
    });

    const refetchClips = () => {
        setUseFallbackClip(false);
        setClipFailedToLoad(false);
        clipsQuery.refetch();
    };

    const edgeStatusData = useMemo(() => {
        const edgeData = edgeStatusQuery.data;

        if (edgeData && edgeData._edge_status.length > 0) {
            return edgeData._edge_status[0];
        }

        return null;
    }, [edgeStatusQuery.data]);

    const formattedJobType = useMemo(() => {
        const givenJobType = data?.camera_properties?.job_type;
        return handleJobTypeUpdate(givenJobType);
    }, [data]);

    const { latestClipData, fallbackClipData, clipsFound } = useMemo(() => {
        if (clipsQuery.data) {
            const aClips = Object.values({
                ...clipsQuery.data.audit,
                ...clipsQuery.data.standard, // ! The clip ids should always be unique and thus should not overwrite each other.
            });

            stripTimeZoneFromClips(aClips);
            const sortedClips: IClip[] = aClips.sort(sortByDate);

            /**
             * 12-12-2024 - Sometimes the clip in s3 has not been finished annotating so the video src is unable to load. In this
             * case we decided to fall back to the previous clip so that the video clip actually loads on the camera config screen.
             */
            return {
                latestClipData: sortedClips[0],
                fallbackClipData: sortedClips[1],
                clipsFound: sortedClips.length,
            };
        }

        return {
            latestClipData: undefined,
            fallbackClipData: undefined,
            clipsFound: null,
        };
    }, [clipsQuery.data]);

    const displayedClipData = useMemo(() => {
        if (latestClipData && !useFallbackClip) {
            return latestClipData;
        }

        if (fallbackClipData && useFallbackClip) {
            return fallbackClipData;
        }

        return undefined;
    }, [latestClipData, fallbackClipData, useFallbackClip]);

    const latestClipVideoSource = useMemo(() => {
        if (latestClipData && !useFallbackClip) {
            return latestClipData.job_type === JobType.Milestone
                ? latestClipData.aws_pre_sign_annotated
                : latestClipData.aws_pre_sign_origin;
        }

        if (fallbackClipData && useFallbackClip) {
            return fallbackClipData.job_type === JobType.Milestone
                ? fallbackClipData.aws_pre_sign_annotated
                : fallbackClipData.aws_pre_sign_origin;
        }

        return undefined;
    }, [latestClipData, fallbackClipData, useFallbackClip]);

    const cameraSource = useMemo(() => {
        if (sourceList.length > 0 && params.id) {
            return sourceList.find(
                (source) => source.camera_id === Number(params.id)
            );
        }

        return undefined;
    }, [sourceList, params]);

    useEffect(() => {
        if (
            cameraSource?.source_id &&
            !liveViewQuery.isFetching &&
            socket?.readyState === 1 &&
            liveViewActive
        ) {
            startVideo(cameraSource.source_id);
        }

        return () => {
            if (cameraSource?.source_id && socket?.readyState === 1) {
                stopVideo(cameraSource.source_id);
            }
        };
    }, [
        cameraSource?.source_id,
        liveViewQuery.isFetching,
        socket?.readyState,
        liveViewActive,
    ]);

    useEffect(() => {
        // This polls for edge camera status
        const interval = setInterval(() => {
            if (edgeStatusQuery.data) {
                edgeStatusQuery.refetch();
            }
        }, 20000); // Poll every 20 seconds

        return () => clearInterval(interval);
    }, [edgeStatusQuery.data, edgeStatusQuery.refetch]);

    useEffect(() => {
        setClipFailedToLoad(false);
    }, [params.id]);

    return (
        <div className="cameraView">
            <section className="cameraOverviewSection">
                <figure style={{ position: 'relative' }}>
                    {data?.camera_properties?.version && edgeStatusData && (
                        <div className="edgeVersionAndStatusContainer">
                            <span
                                className={`status-badge ${edgeStatusData.status}`}
                            >
                                {edgeStatusData.status}
                            </span>
                            <p>{data.camera_properties.version}</p>
                        </div>
                    )}
                    {data?.camera_name && (
                        <h2
                            id="camera-name"
                            className="camera-name"
                            style={{
                                paddingLeft: edgeStatusQuery?.data
                                    ?.camera_properties?.version
                                    ? 110
                                    : 0,
                            }}
                        >
                            {edgeStatusQuery?.data?.camera_name}
                        </h2>
                    )}

                    <p
                        className="autoplay-clip-data"
                        style={{
                            paddingLeft: data?.camera_properties?.version
                                ? 110
                                : 0,
                        }}
                    >
                        <span>Last Event Processed:</span>{' '}
                        {displayedClipData?.created_at
                            ? displayAutoClipDateTime(
                                  displayedClipData.created_at
                              )
                            : 'N/A'}
                    </p>

                    <div className="video-container" ref={videoContainerRef}>
                        {liveViewActive && (
                            <video
                                style={{ background: '#000000' }}
                                width="100%"
                                ref={videoRef}
                                autoPlay
                                muted
                            />
                        )}

                        {latestClipVideoSource &&
                            !liveViewActive &&
                            !clipFailedToLoad && (
                                <video
                                    key={latestClipVideoSource}
                                    width="100%"
                                    controls={false}
                                    muted
                                    playsInline
                                    ref={videoRef}
                                >
                                    <source
                                        src={`${latestClipVideoSource}`}
                                        type="video/mp4"
                                        onError={() => {
                                            if (
                                                clipsFound === 2 &&
                                                !useFallbackClip
                                            ) {
                                                setUseFallbackClip(true);
                                            }

                                            if (
                                                useFallbackClip ||
                                                clipsFound === 1
                                            ) {
                                                setClipFailedToLoad(true);
                                                toast.error(
                                                    'Video clip failed to load'
                                                );
                                            }
                                        }}
                                    />
                                </video>
                            )}

                        {clipFailedToLoad && (
                            <ClipFailedToLoad refetchClips={refetchClips} />
                        )}

                        {(clipsFound === 0 || params?.id === '0') &&
                            !clipFailedToLoad && (
                                <NoData
                                    id="video-not-found"
                                    noDataText={
                                        params?.id === '0'
                                            ? 'No camera selected'
                                            : 'Unable to load clip'
                                    }
                                    subText={
                                        params?.id === '0'
                                            ? 'Please select a Camera from the Menu'
                                            : 'No events have been processed for this camera.'
                                    }
                                />
                            )}
                    </div>
                    <div className="camera-config-footer">
                        <li className="event-type-menu">
                            <p>Event Type: {formattedJobType}</p>
                            <div className="live-view-toggle-container">
                                <p className="live-view-toggle-label">
                                    Live View
                                </p>
                                <Toggle
                                    id="live-view-toggle"
                                    value={liveViewActive}
                                    onToggleChange={() => {
                                        if (activeUser) {
                                            localStorage.setItem(
                                                `customer-live-view-${activeUser.id}`,
                                                JSON.stringify(!liveViewActive)
                                            );
                                        }

                                        setLiveViewActive(!liveViewActive);
                                    }}
                                    toggleOnText="ON"
                                    toggleOffText="OFF"
                                />
                            </div>
                            <div>
                                <p>
                                    Resolution:{' '}
                                    {cameraSource?.height || data?.height} X{' '}
                                    {cameraSource?.width || data?.width}
                                </p>
                            </div>
                        </li>
                    </div>
                </figure>
                <ul className="side-items">
                    <h2>Edge Camera</h2>
                </ul>
            </section>
        </div>
    );
};

export default CustomerEdgeView;
