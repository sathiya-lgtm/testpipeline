/* eslint-disable jsx-a11y/control-has-associated-label */
// React
import {
    ReactElement,
    useContext,
    useEffect,
    useState,
    useRef,
    useMemo,
} from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';

// Third party
import Skeleton from 'react-loading-skeleton';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

// Custom
import handleHttpRequestError from '../../../../utils/handleHttpRequestError';
import stripTimeZoneFromClips from '../../../../utils/stripTimeZoneFromClips';
import sortByDate from '../../../../utils/sortByDate';

// API Calls
import getCameraData from '../../../../api_calls/getCameraData';
import getCameraClips from '../../../../api_calls/getCameraClips';
import ClipFailedToLoad from '../Camera/ClipFailedToLoad';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

// Controller
import {
    displayAutoClipDateTime,
    isEitherTrue,
    setAlertMenuClassName,
    handleJobTypeUpdate,
} from '../Camera/Camera.controller';

// Components

import LoadingModal from '../../../Modals/LoadingModal';
import NoData from '../../../NoData';
import AlertModal from '../../../Modals/AlertModal/AlertModal';

// Icons
import AlertIcon from '../../../../images/icons/EV_ENT_Alerts.7.6.22.svg?react';

// Types
import { IClip } from '../../../../types/tng-api.interfaces';
import { IUser } from '../../../../types/interfaces';
import { JobType, AccountTypeModifier } from '../../../../types/enums';

// Styles
import '../../../../styles/components/Outlets/Home/Camera.scss';
import '../../../../styles/components/Slider.scss';

// TODO a lot of the logic in this component should be moved into a controller + add automated tests.
const DeviceIO = (): ReactElement => {
    const params = useParams();
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const readOnlyUser = useMemo(() => {
        return (
            activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly) ||
            false
        );
    }, [activeUser]);

    // Video related refs.
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [useFallbackClip, setUseFallbackClip] = useState(false);
    const [clipFailedToLoad, setClipFailedToLoad] = useState(false);

    // Video related state.
    const [autoPlayClipData, setAutoPlayClipData] = useState<IClip | undefined>(
        undefined
    );
    const [videoSource, setVideoSource] = useState<string | null | undefined>(
        null
    );

    // Alert Modal
    const [showAlertModal, setShowAlertModal] = useState(false);

    // React Query.
    const { data, refetch, remove, isLoading } = useQuery({
        queryKey: ['camera-data', params.id],
        queryFn: () => getCameraData(activeUser as IUser, params.id as string),
        cacheTime: 30_000,
        staleTime: 30_000,
        enabled: false,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    const clipsQuery = useQuery({
        queryKey: ['clips', params.id],
        queryFn: () => getCameraClips(activeUser as IUser, Number(params.id)),
        cacheTime: 30_000,
        staleTime: 5_000,
        enabled: false,
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

    useEffect(() => {
        // We need to populate the camera types options before fetching the camera data
        if (params?.id && params.id !== '0') {
            refetch(); // Fetch or refetch camera data.
            clipsQuery.refetch(); // Fetch or refetch clips / events.
        }

        return () => {
            // Clear cache on unmount.
            remove();
            clipsQuery.remove();
        };
    }, [params?.id]);

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

    useEffect(() => {
        if (latestClipData && !useFallbackClip) {
            const clipJobType: JobType | undefined = latestClipData.job_type;
            setAutoPlayClipData(latestClipData);
            setVideoSource(
                clipJobType === JobType.Milestone
                    ? latestClipData.aws_pre_sign_annotated
                    : latestClipData.aws_pre_sign_origin
            );
        }

        if (fallbackClipData && useFallbackClip) {
            const clipJobType: JobType | undefined = fallbackClipData.job_type;
            setAutoPlayClipData(fallbackClipData);
            setVideoSource(
                clipJobType === JobType.Milestone
                    ? fallbackClipData.aws_pre_sign_annotated
                    : fallbackClipData.aws_pre_sign_origin
            );
        }
    }, [latestClipData, fallbackClipData, useFallbackClip]);

    useEffect(() => {
        setClipFailedToLoad(false);
        setVideoSource(undefined);
    }, [params.id]);

    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (video) {
            video.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
        }
    };

    // We decided customers should not view this page
    if (activeUser && activeUser.account_type === 'cl') {
        return <Navigate to="/home" />;
    }

    return (
        <div className="cameraView">
            {isEitherTrue(isLoading, clipsQuery.isLoading) &&
                params?.id !== '0' && (
                    <LoadingModal
                        modalText={
                            isLoading
                                ? 'Loading camera information...'
                                : 'Starting automatic playback...'
                        }
                        zIndex={96}
                    />
                )}
            <section className="cameraOverviewSection">
                <figure style={{ position: 'relative' }}>
                    {data?.camera_name && (
                        <h2 id="camera-name" className="camera-name">
                            {data?.camera_name}
                        </h2>
                    )}
                    {data?.camera_name === undefined && params?.id !== '0' && (
                        <h2 id="camera-name" className="camera-name">
                            <Skeleton
                                borderRadius={0}
                                baseColor="#ebebeb3b"
                                highlightColor="#f5f5f59b"
                                style={{ height: '25px', width: '20%' }}
                            />
                        </h2>
                    )}
                    {autoPlayClipData?.created_at && (
                        <p className="autoplay-clip-data">
                            <span>Last Event Processed:</span>{' '}
                            {displayAutoClipDateTime(
                                autoPlayClipData.created_at
                            )}
                        </p>
                    )}
                    <div className="video-container" ref={videoContainerRef}>
                        {videoSource && !clipFailedToLoad && (
                            <video
                                style={{
                                    aspectRatio: '1920 / 1080',
                                    background: 'black',
                                }}
                                key={videoSource}
                                width="100%"
                                controls
                                autoPlay
                                muted
                                playsInline
                                ref={videoRef}
                                onLoadedMetadata={handleLoadedMetadata}
                            >
                                <source
                                    src={videoSource}
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
                            {/* <p>
                                Resolution: {data?.height} X {data?.width}
                            </p> */}
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
                    <h2>Device IO</h2>

                    <div className="settingsButtonContainer">
                        <div
                            className={setAlertMenuClassName(
                                data,
                                readOnlyUser
                            )}
                        >
                            <div>
                                <button
                                    type="button"
                                    className="btn primary fluid"
                                    onClick={() => setShowAlertModal(true)}
                                    disabled={readOnlyUser}
                                >
                                    <div className="iconButtonInner">
                                        <span>Create Alert</span>
                                        <AlertIcon className="buttonIcon" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </ul>
            </section>

            {showAlertModal && (
                <AlertModal
                    selectedAlert={null}
                    handleClose={() => setShowAlertModal(false)}
                />
            )}
        </div>
    );
};

export default DeviceIO;
