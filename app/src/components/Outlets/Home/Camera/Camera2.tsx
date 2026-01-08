/* eslint-disable jsx-a11y/control-has-associated-label */
// React
import {
    ReactElement,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';

// Third party
import Skeleton from 'react-loading-skeleton';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import { useMutation, useQuery } from '@tanstack/react-query';

// Custom
import { useCameraData } from '../../../../hooks';
import {
    compressAndBase64EncodeBitMask,
    decodeAndDecompressBase64EncodedBitMask,
    convertImageDataToBitMask,
} from '../../../Canvases/MaskCanvas/MaskCanvas.controller';
import handleHttpRequestError from '../../../../utils/handleHttpRequestError';
import stripTimeZoneFromClips from '../../../../utils/stripTimeZoneFromClips';
import sortByDate from '../../../../utils/sortByDate';
import { maskColorChannels } from '../../../Canvases/MaskCanvas/DrawingLayer';
import getAccountType from '../../../../utils/getAccountType';

// API Calls
import getCameraClips from '../../../../api_calls/getCameraClips';
import updateMask from '../../../../api_calls/updateMask';
import getCameraTypes from '../../../../api_calls/getCameraTypes';
import updateLoitering from '../../../../api_calls/updateLoitering';
import getControllerURLByCameraId from '../../../../api_calls/getControllerURLByCameraId';
import ClipFailedToLoad from './ClipFailedToLoad';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

// Controller
import {
    displayAutoClipDateTime,
    handleBrushTypeToggle,
    isEitherTrue,
    setMaskingControlClassName,
    setAlertMenuClassName,
    handleJobTypeUpdate,
} from './Camera.controller';

// Hooks
import useLiveViewControllerConnection from '../../../../hooks/useLiveViewControllerConnection';

// Components
import Button from '../../../Button';
import MaskCanvas from '../../../Canvases/MaskCanvas/MaskCanvas';
import LoadingModal from '../../../Modals/LoadingModal';
import NoData from '../../../NoData';
import AlertModal from '../../../Modals/AlertModal/AlertModal';
import EditCameraModal from '../../../Modals/Camera/EditCameraModal';
import TooltipModal from '../../../Modals/TooltipModal';
import PremiumFeaturesModal from '../../../Modals/PremiumFeaturesModal';
import AISettingsModal from './AISettingsModal';
import Toggle from '../../../Inputs/Toggle';

// Icons
import EditIcon from '../../../../images/icons/EV.edit.svg?react';
import SettingsIcon from '../../../../images/icons/EV.settings.svg?react';
import BrushIcon from '../../../../images/icons/EV_brush_button.5.16.22.svg?react';
import EraseIcon from '../../../../images/icons/EV_eraser_button.5.16.22.svg?react';
import AlertIcon from '../../../../images/icons/EV_ENT_Alerts.7.6.22.svg?react';

// Types
import { IClip } from '../../../../types/tng-api.interfaces';
import {
    IUser,
    BitMask,
    IDimensions,
    BrushType,
    SelectOption,
} from '../../../../types/interfaces';
import {
    JobType,
    AccountTypeModifier,
    AccountType,
} from '../../../../types/enums';

// Styles
import '../../../../styles/components/Outlets/Home/Camera.scss';
import '../../../../styles/components/Slider.scss';

// TODO a lot of the logic in this component should be moved into a controller + add automated tests.
const Camera2 = (): ReactElement => {
    const params = useParams();
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const readOnlyUser = useMemo(() => {
        return (
            activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly) ||
            false
        );
    }, [activeUser]);

    const accountType: AccountType = useMemo(
        () => getAccountType(activeUser),
        [activeUser]
    );

    // Video related refs.
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [useFallbackClip, setUseFallbackClip] = useState(false);
    const [clipFailedToLoad, setClipFailedToLoad] = useState(false);

    // Video related state.
    const [videoDimensions, setVideoDimensions] = useState<IDimensions>();
    const [videoContainerDimensions, setVideoContainerDimensions] =
        useState<IDimensions>();
    const [autoPlayClipData, setAutoPlayClipData] = useState<IClip | undefined>(
        undefined
    );
    const [videoSource, setVideoSource] = useState<string | null | undefined>(
        null
    );

    // Live View (Network Optics)
    const defaultLiveViewActiveValue = useMemo(() => {
        const data = localStorage.getItem(`live-view-${params.id}`);

        if (data) {
            return data === 'true';
        }

        return false;
    }, [params.id]);

    const [liveViewActive, setLiveViewActive] = useState(
        defaultLiveViewActiveValue
    );

    // Camera Color Model
    const [cameraTypeOptions, setCameraTypeOptions] = useState<SelectOption[]>(
        []
    );

    // A.I. Mask state.
    const [updatingMask, setUpdatingMask] = useState(false);
    const [showAISettingsModal, setShowAISettingsModal] = useState(false);
    const [maskOpacity, setMaskOpacity] = useState<number>(45);
    const [brushType, setBrushType] = useState<BrushType>(undefined);
    const [brushSize, setBrushSize] = useState<number>(30);
    const [bitMask, setBitMask] = useState<BitMask>([]);
    const [maskString, setMaskString] = useState('');
    const [showImportMask, setShowImportMask] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (maskString && canvas) {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = `data:image/png;base64,${maskString}`;

            img.onload = () => {
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Set canvas size to image size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw the image off-screen
                ctx.drawImage(img, 0, 0);

                // Extract pixel data (RGBA)
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const { data } = imageData;

                // Create new pixel array for the alpha mask
                const newPixels = new Uint8ClampedArray(
                    img.width * img.height * 4
                );

                for (let i = 0; i < img.width * img.height; i += 1) {
                    const alpha = data[i * 4]; // Assuming alpha data is stored in Red channel
                    const maskValue = alpha > 0 ? 255 : 0; // Convert to 255 (white) or 0 (black)

                    if (maskValue === 0) {
                        // Each 4 consecutive values represents 1 pixel, wherein each value is a color channel for said pixel.
                        // If the bit is 0, set each channel to a value of 0 (i.e. transparent / no color).
                        newPixels[i * 4 + 0] = 0;
                        newPixels[i * 4 + 1] = 0;
                        newPixels[i * 4 + 2] = 0;
                        newPixels[i * 4 + 3] = 0;
                    } else {
                        newPixels[i * 4 + 0] = maskColorChannels.r;
                        newPixels[i * 4 + 1] = maskColorChannels.g;
                        newPixels[i * 4 + 2] = maskColorChannels.b;
                        newPixels[i * 4 + 3] = 255;
                    }
                }

                ctx?.clearRect(0, 0, img.width, img.height);
                ctx.putImageData(
                    new ImageData(newPixels, img.width, img.height),
                    0,
                    0
                );
            };
        }
    }, [maskString]);

    // Alert Modal
    const [showAlertModal, setShowAlertModal] = useState(false);

    // Motion Confidence tooltip modal
    const [isMotionSensitivityModalOpen, setIsMotionSensitivityModalOpen] =
        useState<boolean>(false);

    // Camera Modal
    const [showCameraModal, setShowCameraModal] = useState(false);

    // Premium features modals
    const [isPremiumFeaturesModalOpen, setIsPremiumFeaturesModalOpen] =
        useState(false);

    const cameraDataQuery = useCameraData({
        cameraId: Number(params.id),
        activeUser: activeUser as IUser,
        enabled: false,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    // React Query.
    // const { data, refetch, remove, isLoading } = useQuery({
    //     queryKey: ['camera-data', params.id],
    //     queryFn: () => getCameraData(activeUser as IUser, params.id as string),
    //     cacheTime: 30_000,
    //     staleTime: 30_000,
    //     enabled: false,
    //     onError: (err: any) =>
    //         handleHttpRequestError(err, setActiveUser, navigate),
    // });

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

    // Get the list of camera Types
    const cameraTypesData = useQuery({
        queryKey: ['camera-types'],
        queryFn: () => getCameraTypes(activeUser as IUser),
        cacheTime: 30_000,
        staleTime: 30_000,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

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
        if (!cameraDataQuery.data) {
            return '';
        }

        if (
            cameraDataQuery.data.camera_properties?.job_type !== 'network-optix'
        ) {
            return '';
        }

        if (activeUser && activeUser.id === 1 && liveViewQuery.data) {
            return liveViewQuery.data;
        }

        if (activeUser) {
            return activeUser.live_view_controller_url;
        }

        return '';
    }, [liveViewQuery.data, activeUser, cameraDataQuery.data]);

    const { socket, sourceList, startVideo, stopVideo } =
        useLiveViewControllerConnection({
            activeUser,
            liveViewControllerURL,
            videoRef,
        });

    const onSuccessfulMaskUpdate = (): void => {
        toast.success('Mask successfully updated.');
    };

    const onSuccessfulLoiteringUpdate = (): void => {
        toast.success('Loitering settings successfully updated.');
        cameraDataQuery.refetch();
    };

    const maskMutation = useMutation({
        mutationFn: updateMask,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: onSuccessfulMaskUpdate,
    });

    const loiteringMutation = useMutation({
        mutationFn: updateLoitering,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: onSuccessfulLoiteringUpdate,
    });

    const formattedJobType = useMemo(() => {
        const givenJobType = cameraDataQuery.data?.camera_properties?.job_type;
        return handleJobTypeUpdate(givenJobType);
    }, [cameraDataQuery.data]);

    const saveMask = useCallback((): void => {
        if (!videoRef.current || !activeUser || !cameraDataQuery.data) {
            return;
        }

        setUpdatingMask(true);

        const canvas = canvasRef.current;
        const streamDimensions = {
            width: cameraDataQuery.data?.width || videoRef.current.videoWidth,
            height:
                cameraDataQuery.data?.height || videoRef.current.videoHeight,
        };

        if (canvas) {
            // We pull the current canvas data to set the new mask.
            const context = canvas.getContext('2d');
            const myImageData = context?.getImageData(
                0,
                0,
                streamDimensions.width,
                streamDimensions.height
            );

            const aBitMask: BitMask = convertImageDataToBitMask(myImageData);
            setBitMask(aBitMask);
            maskMutation.mutate({
                user: activeUser,
                maskData: {
                    camera_id: cameraDataQuery.data.camera_id,
                    mask: compressAndBase64EncodeBitMask(aBitMask),
                },
            });
        }

        setUpdatingMask(false);
    }, [cameraDataQuery.data, activeUser, bitMask]);

    /**
     * Reset brushType and bitMask.
     * @returns {void}
     */
    const resetMask = useCallback((): void => {
        setBrushType(undefined);

        if (cameraDataQuery.data) {
            const { mask } = cameraDataQuery.data;

            if (mask && mask !== '') {
                setBitMask(decodeAndDecompressBase64EncodedBitMask(mask));

                return;
            }
        }

        setBitMask([]);
    }, [cameraDataQuery.data]);

    const clearMask = useCallback(() => {
        if (
            cameraDataQuery.data?.height === 0 ||
            cameraDataQuery.data?.width === 0
        ) {
            toast.error(
                "Can't adjust mask to a camera with a resolution of 0 X 0."
            );
            return;
        }

        setBrushType(undefined);
        setBitMask([]);
    }, [cameraDataQuery.data]);

    /**
     * Callback for reassigning the videoContainerDimensions whenever the window resizes.
     * The is expected to force MaskCanvas to recalculate where it thinks the user's mouse position
     * is relative to the canvas such that the user's drawing still works as intended even after
     * resizing the window. The debounce will prevent the setState hook from
     * executing until we expect the user to finish resizing their browser (300ms, give or take).
     */
    const handleWindowResize = useCallback(
        debounce(() => {
            if (videoContainerRef.current) {
                setVideoContainerDimensions({
                    height: videoContainerRef.current.clientHeight,
                    width: videoContainerRef.current.clientWidth,
                });
            }
        }, 300),
        [videoContainerRef.current]
    );

    useEffect(() => {
        window.addEventListener('resize', handleWindowResize);

        return () => window.removeEventListener('resize', handleWindowResize);
    }, []);

    useEffect(() => {
        if (cameraTypesData.data) {
            setCameraTypeOptions(cameraTypesData.data);
        }
    }, [cameraTypesData]);

    useEffect(() => {
        // We need to populate the camera types options before fetching the camera data
        if (params?.id && params.id !== '0' && cameraTypeOptions.length > 0) {
            cameraDataQuery.refetch(); // Fetch or refetch camera data.
            clipsQuery.refetch(); // Fetch or refetch clips / events.
        }

        return () => {
            // Clear cache on unmount.
            cameraDataQuery.remove();
            clipsQuery.remove();
        };
    }, [params?.id, cameraTypeOptions]);

    useEffect(() => {
        if (cameraDataQuery.data) {
            const { mask }: { mask: string } = cameraDataQuery.data;

            if (mask && mask !== '') {
                setBitMask(decodeAndDecompressBase64EncodedBitMask(mask));
            } else {
                setBitMask([]);
            }
        }
    }, [cameraDataQuery.data]);

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

    /**
     * Sets dimensions of video once video is loaded.
     */
    useEffect(() => {
        if (cameraDataQuery.data?.height && cameraDataQuery.data?.width) {
            setVideoDimensions({
                height: cameraDataQuery.data.height,
                width: cameraDataQuery.data.width,
            });
        } else if (videoRef.current) {
            setVideoDimensions({
                height: videoRef.current.videoHeight,
                width: videoRef.current.videoWidth,
            });
        }
    }, [videoSource, videoRef.current, cameraDataQuery.data]);

    /**
     * Initializes value of videoContainerDimensions with the current value of the
     * container.
     */
    useEffect(() => {
        if (videoContainerRef.current) {
            const dimensions = {
                height: videoContainerRef.current.clientHeight,
                width: videoContainerRef.current.clientWidth,
            };

            setVideoContainerDimensions(dimensions);
        }
    }, [
        videoContainerRef.current,
        videoContainerRef?.current?.clientHeight,
        videoContainerRef.current?.clientWidth,
    ]);

    useEffect(() => {
        setClipFailedToLoad(false);
        setVideoSource(undefined);
    }, [params.id]);

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
                console.log('video stopped');
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
        if (cameraDataQuery?.data?.camera_properties.job_type === 'panel') {
            navigate(`/home/panel/${params.id}`);
        }
    }, [cameraDataQuery]);

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
            {(maskMutation.isLoading || updatingMask) && (
                <LoadingModal modalText="Updating mask..." zIndex={96} />
            )}
            {isPremiumFeaturesModalOpen && cameraDataQuery.data && (
                <PremiumFeaturesModal
                    user={activeUser as IUser}
                    loiteringMutation={loiteringMutation}
                    data={cameraDataQuery.data}
                    handleClose={() => setIsPremiumFeaturesModalOpen(false)}
                />
            )}
            {isEitherTrue(cameraDataQuery.isLoading, clipsQuery.isLoading) &&
                params?.id !== '0' && (
                    <LoadingModal
                        modalText={
                            cameraDataQuery.isLoading
                                ? 'Loading camera information...'
                                : 'Starting automatic playback...'
                        }
                        zIndex={96}
                    />
                )}
            <section className="cameraOverviewSection">
                <figure style={{ position: 'relative' }}>
                    {cameraDataQuery.data?.camera_name && (
                        <h2 id="camera-name" className="camera-name">
                            {cameraDataQuery.data?.camera_name}
                        </h2>
                    )}
                    {cameraDataQuery.data?.camera_name === undefined &&
                        params?.id !== '0' && (
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
                        {videoContainerDimensions &&
                            videoDimensions &&
                            videoDimensions.height !== 0 &&
                            videoDimensions.width !== 0 &&
                            cameraDataQuery.data &&
                            cameraDataQuery.data.camera_properties
                                .allow_masking && (
                                <MaskCanvas
                                    bitMask={bitMask}
                                    setBitMask={setBitMask}
                                    brushSize={brushSize}
                                    maskOpacity={maskOpacity}
                                    brushType={brushType}
                                    streamDimensions={videoDimensions}
                                    parentContainerDimensions={
                                        videoContainerDimensions
                                    }
                                    canvasRef={canvasRef}
                                />
                            )}

                        {videoSource &&
                            !clipFailedToLoad &&
                            !liveViewActive && (
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
                            {cameraDataQuery.data?.camera_properties
                                ?.job_type === 'network-optix' && (
                                <div className="live-view-toggle-container">
                                    <p className="live-view-toggle-label">
                                        Live View
                                    </p>

                                    <Toggle
                                        id="live-view-toggle"
                                        value={liveViewActive}
                                        onToggleChange={() => {
                                            localStorage.setItem(
                                                `live-view-${params.id}`,
                                                JSON.stringify(!liveViewActive)
                                            );
                                            setLiveViewActive(!liveViewActive);
                                        }}
                                        toggleOnText="ON"
                                        toggleOffText="OFF"
                                    />
                                </div>
                            )}

                            <p>
                                Resolution: {cameraDataQuery.data?.height} X{' '}
                                {cameraDataQuery.data?.width}
                            </p>
                            {cameraDataQuery.data?.camera_properties.email && (
                                <div className="smtp-email-display">
                                    <span>
                                        To:{' '}
                                        {
                                            cameraDataQuery.data
                                                .camera_properties?.email
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        className="btn primary copyEmailBtn"
                                        data-toggle="tooltip"
                                        data-placement="bottom"
                                        title="Copy to clipboard"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                cameraDataQuery.data
                                                    .camera_properties?.email ||
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
                    <h2>Camera Configuration</h2>

                    <li
                        className={setMaskingControlClassName(
                            cameraDataQuery.data,
                            readOnlyUser
                        )}
                    >
                        <p>AI Mask</p>
                        <div className="brush-type-button-container">
                            <button
                                id="mask-eraser-button"
                                type="button"
                                className={`brush-type ${
                                    brushType === 'erase' ? 'selected' : ''
                                }`}
                                onClick={() => {
                                    if (
                                        cameraDataQuery.data?.height === 0 ||
                                        cameraDataQuery.data?.width === 0
                                    ) {
                                        toast.error(
                                            "Can't adjust mask to a camera with a resolution of 0 X 0."
                                        );
                                        return;
                                    }

                                    handleBrushTypeToggle(
                                        brushType,
                                        'erase',
                                        setBrushType,
                                        videoRef
                                    );
                                }}
                                disabled={readOnlyUser}
                            >
                                <EraseIcon className="icon" />
                            </button>
                            <button
                                id="mask-draw-button"
                                type="button"
                                className={`brush-type ${
                                    brushType === 'draw' ? 'selected' : ''
                                }`}
                                onClick={() => {
                                    if (
                                        cameraDataQuery.data?.height === 0 ||
                                        cameraDataQuery.data?.width === 0
                                    ) {
                                        toast.error(
                                            "Can't adjust mask to a camera with a resolution of 0 X 0."
                                        );
                                        return;
                                    }

                                    handleBrushTypeToggle(
                                        brushType,
                                        'draw',
                                        setBrushType,
                                        videoRef
                                    );
                                }}
                                disabled={readOnlyUser}
                            >
                                <BrushIcon className="icon" />
                            </button>
                        </div>
                        <p className="subtext">Brush Size: {brushSize}px</p>
                        <div className="slider-container">
                            <input
                                id="brush-size-slider"
                                className="slider"
                                type="range"
                                min="10"
                                max="100"
                                step="1"
                                value={brushSize}
                                onChange={(e) =>
                                    setBrushSize(Number(e.target.value))
                                }
                            />
                        </div>
                        <p className="subtext">
                            Mask Visibility: {maskOpacity}%
                        </p>
                        <div className="slider-container">
                            <input
                                id="mask-visibility-slider"
                                className="slider"
                                type="range"
                                min="1"
                                max="100"
                                step="1"
                                value={maskOpacity}
                                onChange={(e) =>
                                    setMaskOpacity(Number(e.target.value))
                                }
                            />
                        </div>

                        <div
                            className={
                                accountType === AccountType.Evolon
                                    ? 'clear-mask-container-2'
                                    : 'clear-mask-container'
                            }
                        >
                            {accountType === AccountType.Evolon && (
                                <Button
                                    id="import-mask"
                                    type="button"
                                    label="Import"
                                    className="btn primary outline"
                                    onClick={() =>
                                        setShowImportMask(!showImportMask)
                                    }
                                />
                            )}

                            <Button
                                id="clear-mask"
                                type="button"
                                label="Clear Mask"
                                className="btn danger outline"
                                onClick={clearMask}
                                disabled={readOnlyUser}
                            />
                        </div>

                        {accountType === AccountType.Evolon &&
                            showImportMask && (
                                <div>
                                    <textarea
                                        style={{ width: '100%' }}
                                        rows={6}
                                        value={maskString}
                                        onChange={(e) =>
                                            setMaskString(e.target.value)
                                        }
                                    />
                                </div>
                            )}

                        <div className="button-container">
                            <Button
                                id="mask-apply-button"
                                type="button"
                                label="Apply"
                                className="btn primary"
                                onClick={saveMask}
                                disabled={readOnlyUser}
                            />
                            <Button
                                id="mask-cancel-button"
                                type="button"
                                label="Cancel"
                                className="btn neutral"
                                onClick={() => resetMask()}
                                disabled={readOnlyUser}
                            />
                        </div>
                    </li>
                    <div className="settingsButtonContainer">
                        <div
                            className={setAlertMenuClassName(
                                cameraDataQuery.data,
                                readOnlyUser
                            )}
                        >
                            <div>
                                <button
                                    type="button"
                                    className="btn primary fluid"
                                    onClick={() => setShowAISettingsModal(true)}
                                    disabled={readOnlyUser}
                                >
                                    <div className="iconButtonInner">
                                        <span>AI Settings</span>
                                        <SettingsIcon className="buttonIcon" />
                                    </div>
                                </button>
                            </div>
                        </div>
                        {(cameraDataQuery.data?.camera_properties?.job_type ===
                            'email' ||
                            cameraDataQuery.data?.camera_properties
                                ?.job_type === 'verify' ||
                            cameraDataQuery.data?.camera_properties
                                ?.job_type === 'edge' ||
                            cameraDataQuery.data?.camera_properties
                                ?.job_type === 'network-optix' ||
                            cameraDataQuery.data?.camera_properties
                                ?.job_type === 'email-nvr' ||
                            cameraDataQuery.data?.camera_properties
                                .license_type) && (
                            <div
                                className={setAlertMenuClassName(
                                    cameraDataQuery.data,
                                    readOnlyUser
                                )}
                            >
                                <div>
                                    <button
                                        type="button"
                                        className="btn primary fluid"
                                        onClick={() => setShowCameraModal(true)}
                                        disabled={readOnlyUser}
                                    >
                                        <div className="iconButtonInner">
                                            <span>Edit Camera</span>
                                            <EditIcon className="buttonIcon" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div
                            className={setAlertMenuClassName(
                                cameraDataQuery.data,
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

                        <Button
                            id="premium-features-button"
                            label="Premium Features"
                            className="btn neutral"
                            onClick={() => setIsPremiumFeaturesModalOpen(true)}
                            disabled={readOnlyUser}
                        />
                    </div>
                </ul>
            </section>
            {showCameraModal && cameraDataQuery.data && (
                <EditCameraModal
                    cameraData={cameraDataQuery.data}
                    handleClose={() => setShowCameraModal(false)}
                    refetchCameraData={cameraDataQuery.refetch}
                />
            )}

            {showAISettingsModal && cameraDataQuery.data && (
                <AISettingsModal
                    handleClose={() => setShowAISettingsModal(false)}
                    cameraData={cameraDataQuery.data}
                    refetch={cameraDataQuery.refetch}
                />
            )}

            {isMotionSensitivityModalOpen && (
                <TooltipModal
                    tooltipTitle="Motion Confidence"
                    tooltipText="Adjusts confidence threshold for vehicle motion. A higher confidence threshold reduces the likelihood of tracking stationary vehicles."
                    handleClose={() => setIsMotionSensitivityModalOpen(false)}
                />
            )}
            {showAlertModal && (
                <AlertModal
                    selectedAlert={null}
                    handleClose={() => setShowAlertModal(false)}
                />
            )}
        </div>
    );
};

export default Camera2;
