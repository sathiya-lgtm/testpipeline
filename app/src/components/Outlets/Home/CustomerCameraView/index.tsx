/* eslint-disable no-underscore-dangle */
// React
import { useEffect, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Third Party
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

// Components
import NoData from '../../../NoData';
import ClipFailedToLoad from '../Camera/ClipFailedToLoad';

// Api Calls
import getCameraData from '../../../../api_calls/getCameraData';
import getCameraClips from '../../../../api_calls/getCameraClips';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

// Controller
import {
    displayAutoClipDateTime,
    handleJobTypeUpdate,
} from '../Camera/Camera.controller';

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

const CustomerCameraView = () => {
    const navigate = useNavigate();
    const params = useParams();

    const { activeUser, setActiveUser } = useContext(AuthContext);

    // Live Stream Stuff
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [useFallbackClip, setUseFallbackClip] = useState(false);
    const [clipFailedToLoad, setClipFailedToLoad] = useState(false);

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
                        {latestClipVideoSource && !clipFailedToLoad && (
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
                            <p>
                                Resolution: {data?.height} X {data?.width}
                            </p>
                            {data?.camera_properties.email && (
                                <div className="smtp-email-display">
                                    <span>
                                        To: {data.camera_properties?.email}
                                    </span>

                                    <button
                                        type="button"
                                        className="btn primary copyEmailBtn"
                                        data-toggle="tooltip"
                                        data-placement="bottom"
                                        title="Copy to clipboard"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                data.camera_properties?.email ||
                                                    ''
                                            );
                                            toast.success(
                                                'Email address copied!'
                                            );
                                        }}
                                    >
                                        <svg
                                            className="icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlnsXlink="http://www.w3.org/1999/xlink"
                                            version="1.1"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </li>
                    </div>
                </figure>
                <ul className="side-items">
                    <h2>Camera</h2>
                </ul>
            </section>
        </div>
    );
};

export default CustomerCameraView;
