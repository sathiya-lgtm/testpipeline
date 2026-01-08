/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-template */
// React
import {
    useCallback,
    useEffect,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';

// Lodash
import { debounce } from 'lodash';

// Third Party
import { toast } from 'react-toastify';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tooltip } from 'react-tooltip';

// Components
import AreaOfInterestResizeOverlay from './AreaOfInterestResizeOverlay';
import EdgeConfigurationMenu from './EdgeConfigurationMenu';
import AdvancedSettingsModal from './AdvancedSettingsModal';
import ScalingOverlay from './ScalingOverlay';
import LoadingModal from '../../../Modals/LoadingModal';
import MaskCanvas from '../../../Canvases/MaskCanvas/MaskCanvas';
import AlertModal from '../../../Modals/AlertModal/AlertModal';
import EditCameraModal from '../../../Modals/Camera/EditCameraModal';
import EdgeLogsModal from './EdgeLogsModal';
import Toggle from '../../../Inputs/Toggle';
import NoData from '../../../NoData';
import ClipFailedToLoad from '../Camera/ClipFailedToLoad';

// Api Calls
import getCameraData from '../../../../api_calls/getCameraData';
import updateMask from '../../../../api_calls/updateMask';
import getCameraClips from '../../../../api_calls/getCameraClips';
import getControllerURLByCameraId from '../../../../api_calls/getControllerURLByCameraId';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

// Controller
import {
    defaultConfidenceThreshold,
    edgeLicenseTypeOptions,
    setAlertMenuClassName,
    displayAutoClipDateTime,
    handleJobTypeUpdate,
} from '../Camera/Camera.controller';

// Hooks
import useLiveViewControllerConnection from '../../../../hooks/useLiveViewControllerConnection';

// Utils
import {
    convertScaleLineToPercents,
    generateAOIMidPoints,
    generateLCMidPoints,
    generateMidPoints,
} from './utils/scaleLine';
import {
    convertLCCoordinateToPercent,
    convertPercentToCoordinate,
    logPosition,
} from './utils/generalUtils';
import handleHttpRequestError from '../../../../utils/handleHttpRequestError';
import {
    decodeAndDecompressBase64EncodedBitMask,
    compressAndBase64EncodeBitMask,
    convertImageDataToBitMask,
} from '../../../Canvases/MaskCanvas/MaskCanvas.controller';
import stripTimeZoneFromClips from '../../../../utils/stripTimeZoneFromClips';
import sortByDate from '../../../../utils/sortByDate';
import {
    deleteZoneData,
    getLineCrossingData,
    getZonesData,
    setLineCrossingData,
    setPolyZoneData,
} from './dataFetching';

// Icons
import AlertIcon from '../../../../images/icons/EV_ENT_Alerts.7.6.22.svg?react';
import SettingsIcon from '../../../../images/icons/EV.settings.svg?react';
import EditIcon from '../../../../images/icons/EV.edit.svg?react';
import BlockIcon from '../../../../images/icons/mask.svg?react';
import AreaIcon from '../../../../images/icons/EV.area.svg?react';

// Types
import { IClip } from '../../../../types/tng-api.interfaces';
import {
    IDimensions,
    BrushType,
    BitMask,
    IUser,
    SelectOption,
} from '../../../../types/interfaces';
import {
    PointAsPct,
    SmallestSizeIconType,
    AOESizesAsPct,
    IScaleData,
    CaptureResolution,
} from './edgeTypes';
import { AccountTypeModifier, JobType } from '../../../../types/enums';

// Styles
import '../../../../styles/components/Outlets/Home/Camera.scss';
import '../../../../styles/components/Slider.scss';
import LCOverlay from './LCOverlay';

import getEdgeVersionInfo, {
    IEdgeVersionRequest,
    IEdgeVersionResponse,
} from '../../../../api_calls/getEdgeVersion';
import EnhancedEdgeConfigurationMenu from './EnhancedEdgeConfigurationMenu';
import EnhancedAdvancedSettingsModal from './EnhancedAdvancedSettingsModal';
import EnhancedEditCameraModal from '../../../Modals/Camera/EnhancedEditCameraModal';
import AOIResizePolygon from './AOIResizePolygon';
import updateCamera, {
    IUpdateCameraConfig,
} from '../../../../api_calls/updateCamera';
import AOIAllzones from './AOIAllzones';

export interface CustomWebSocket extends WebSocket {
    sendAndGetResponse: any;
}

const Edge = () => {
    const navigate = useNavigate();
    const params = useParams();

    const { activeUser, setActiveUser } = useContext(AuthContext);
    const readOnlyUser = useMemo(() => {
        return (
            activeUser?.modifier?.includes(AccountTypeModifier.ReadOnly) ||
            false
        );
    }, [activeUser]);

    const defaultLiveViewActiveValue = useMemo(() => {
        const data = localStorage.getItem(`live-view-${params.id}`);

        if (data) {
            return data === 'true';
        }

        return false;
    }, [params.id]);

    // Loading State
    const [loadingText, setLoadingText] = useState('');

    // Live Stream Stuff
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [liveViewActive, setLiveViewActive] = useState(
        defaultLiveViewActiveValue
    );
    const [useFallbackClip, setUseFallbackClip] = useState(false);
    const [clipFailedToLoad, setClipFailedToLoad] = useState(false);

    // Masking
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // On each config page, we need to check if the user has changed the live stream value
    useEffect(() => {
        const data = localStorage.getItem(`live-view-${params.id}`);

        if (data === 'true') {
            setLiveViewActive(true);
        } else {
            setLiveViewActive(false);
        }
    }, [params.id]);

    // Alert Modal
    const [showAlertModal, setShowAlertModal] = useState(false);

    // Camera Modal
    const [showCameraModal, setShowCameraModal] = useState(false);

    // Video State
    const [videoContainerDimensions, setVideoContainerDimensions] =
        useState<IDimensions>();

    // Menu State
    const [activeMenuItem, setActiveMenuItem] = useState<
        'aoe' | 'mask' | 'scaling' | 'detection'
    >('detection');
    const [showZones, setShowZones] = useState(false);
    const [showMask, setShowMask] = useState(false);

    // Advanced Settings
    const [showAdvancedSettingsModal, setShowAdvancedSettingsModal] =
        useState(false);
    const [showEdgeLogsModal, setShowEdgeLogsModal] = useState(false);

    const [edgeLicenseType, setEdgeLicenseType] = useState<SelectOption>(
        edgeLicenseTypeOptions[0]
    );
    const [personMotionConfidence, setPersonMotionConfidence] = useState(4);
    const [vehicleMotionConfidence, setVehicleMotionConfidence] = useState(30);
    const [personConfidenceThreshold, setPersonConfidenceThreshold] =
        useState<number>(defaultConfidenceThreshold);
    const [vehicleConfidenceThreshold, setVehicleConfidenceThreshold] =
        useState<number>(defaultConfidenceThreshold);
    const [preEventSeconds, setPreEventSeconds] = useState<number>(5);
    const [postEventSeconds, setPostEventSeconds] = useState<number>(5);
    const [isPersonAiEnabled, setIsPersonAiEnabled] = useState<boolean>(true);
    const [isVehicleAiEnabled, setIsVehicleAiEnabled] = useState<boolean>(true);

    // Area Of Interest
    const [captureResolution, setCaptureResolution] =
        useState<CaptureResolution>({ height: 450, width: 800 });
    const [aoeSizesAsPct, setAoeSizesAsPct] = useState<AOESizesAsPct>({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
        height: 80,
        width: 80,
    });
    const [activeAoeSizesAsPct, setActiveAoeSizesAsPct] =
        useState<AOESizesAsPct>({
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            height: 0,
            width: 0,
        });

    // const [detectionBox, setDetectionBox] = useState<DetectionBox>({
    //     top: 0,
    //     left: 0,
    //     right: 0,
    //     bottom: 0,
    // });

    const [originalAoeData, setOriginalAoeData] =
        useState<AOESizesAsPct>(aoeSizesAsPct);

    // Masking
    const [maskOpacity, setMaskOpacity] = useState<number>(45);
    const [brushType, setBrushType] = useState<BrushType>('draw');
    const [brushSize, setBrushSize] = useState<number>(30);
    const [bitMask, setBitMask] = useState<BitMask>([]);

    // Scaling
    const [originalScaleData, setOriginalScaleData] = useState<IScaleData>({
        scaleLine: [],
        scaleLineAsPcts: [],
        midPointsAsPcts: [],
        smallestSize: '200',
        focalPoint: [],
        focalPointPosition: { top: 0, left: 0 },
        scaleMode: '0',
        autoScaleEnabled: false,
        largestFilterEnabled: false,
        largestSize: '1000',
        maxAutoScale: '10',
    });

    const [scaleLine, setScaleLine] = useState([
        [5, 1],
        [225, 400],
        [5, 798],
    ]);
    const [lineCrossingLine, setLineCrossingLine] = useState([
        [400, 100],
        [400, 400],
    ]);
    const [activeLineCrossingLine, setActiveLineCrossingLine] = useState([
        [100, 400],
        [400, 400],
    ]);
    const [AOI, setAOI] = useState([
        [100, 100],
        [400, 100],
        [400, 400],
        [100, 400],
    ]);
    const [activeAOI, setActiveAOI] = useState([
        [100, 100],
        [400, 100],
        [400, 400],
        [100, 400],
    ]);
    const [scaleLineAsPcts, setScaleLineAsPcts] = useState<PointAsPct[]>(
        convertScaleLineToPercents(scaleLine, captureResolution)
    );
    const [LCAsPcts, setLCAsPcts] = useState<PointAsPct[]>(
        convertScaleLineToPercents(lineCrossingLine, captureResolution)
    );
    const [AOIAsPcts, setAOIAsPcts] = useState<PointAsPct[]>(
        convertScaleLineToPercents(AOI, captureResolution)
    );
    const [midPointsAsPcts, setMidPointsAsPcts] = useState<PointAsPct[]>(
        generateMidPoints(scaleLineAsPcts)
    );
    const [LCMidPointsAsPcts, setLCMidPointsAsPcts] = useState<PointAsPct[]>(
        generateLCMidPoints(LCAsPcts)
    );
    const [AOIMidPointsAsPcts, setAOIMidPointsAsPcts] = useState<PointAsPct[]>(
        generateAOIMidPoints(AOIAsPcts)
    );
    const [smallestSize, setSmallestSize] = useState('200');
    const [smallestRangeSelector, setSmallestRangeSelector] = useState(
        JSON.stringify(Math.round(logPosition(Number('200'))))
    );
    const [smallestSizeIcon, setSmallestSizeIcon] =
        useState<SmallestSizeIconType>('person');
    const [focalPoint, setFocalPoint] = useState([0, 0]);
    const [focalPointPosition, setFocalPointPosition] = useState({
        top: 50,
        left: 50,
    });
    const [scaleMode, setScaleMode] = useState<'0' | '1'>('1');
    const [autoScaleEnabled, setAutoScaleEnabled] = useState(true);
    const [scaledSize, setScaledSize] = useState(0);
    const [largestSize, setLargestSize] = useState('1000');
    const [largestFilterEnabled, setLargestFilterEnabled] = useState(false);
    const [maxAutoScale, setMaxAutoScale] = useState('10');
    // Behavior
    const [behaviorOptions] = useState([
        { label: 'Detection', value: 'Detection' },
        { label: 'Line Crossing', value: 'line crossing' },
        // { label: 'Loitering', value: 'loitering' },
    ]);
    const [selectedBehavior, setSelectedBehavior] =
        useState<SelectOption | null>({
            label: 'Detection',
            value: 'Detection',
        });
    const [zoneOptions, setZoneOptions] = useState([
        { label: '01', value: '01', color: '#00aadc' },
        { label: 'Add Zone', value: 'Add Zone' },
    ]);
    const [selectedZone, setSelectedZone] = useState<SelectOption | null>({
        label: '01',
        value: '01',
    });
    const [activeColor, setActiveColor] = useState<string>('#00aadc');
    const [zoneCount, setZoneCount] = useState(1);
    const [zones, setZones] = useState<any[]>([]);
    const [personDetectionToggle, setPersonDetectionToggle] = useState(true);
    const [vehicleDetectionToggle, setVehicleDetectionToggle] = useState(true);
    const [personDwell, setPersonDwell] = useState(10);
    const [vehicleDwell, setVehicleDwell] = useState(10);
    const [loiteringEnabled, setLoiteringEnabled] = useState(false);
    // line crossing
    const [selectedDirection, setSelectedDirection] = useState<'0' | '1' | '2'>(
        '0'
    );
    // Zones
    const [zoneNumber, setZoneNumber] = useState('501');
    const queryIds = ['01', '02', '03', '04'];
    const [activeZone, setActiveZone] = useState('01');
    const [avZoneIndex, setAvZoneIndex] = useState<number>(0);
    const [usedZones, setUsedZones] = useState<string[]>([]);
    const [zoneInfo, setZoneInfo] = useState<any[]>([]);
    const zoneColorArray = [
        { color: '#00aadc', id: '01' },
        { color: '#65BC7B', id: '02' },
        { color: '#F7941D', id: '03' },
        { color: '#C00ECE', id: '04' },
    ];
    const [isAlarmVision, setIsAlarmVision] = useState(false);
    const [rotationAngle, setRotationAngle] = useState(270);
    const [supportsEnhancedFeatures, setSupportsEnhancedFeatures] =
        useState(false);
    const [getZones, setGetZones] = useState(false);
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

    const { socket, sourceList, getSequence, startVideo, stopVideo } =
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
    const { data, refetch } = useQuery({
        queryKey: ['camera-data', params.id],
        queryFn: () =>
            getCameraData(activeUserRef.current as IUser, params.id as string),
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    const streamDimensions = useMemo(() => {
        if (data?.height && data?.width) {
            return {
                height: data.height,
                width: data.width,
            };
        }

        return {
            height: videoRef.current?.videoHeight || 0,
            width: videoRef.current?.videoWidth || 0,
        };
    }, [videoRef.current?.videoHeight, videoRef.current?.videoWidth, data]);

    const edgeStatusQuery = useQuery({
        queryKey: ['edge-status', params.id],
        queryFn: () => getCameraData(activeUser as IUser, params.id as string),
        refetchOnWindowFocus: true,
        onError: (err: any) =>
            console.log(
                'Error retreiving camera data',
                err,
                setActiveUser,
                navigate
            ),
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

    const editCameraMutation = useMutation({
        mutationFn: updateCamera,
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

    const maskMutation = useMutation({
        mutationFn: updateMask,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    const saveMask = useCallback(async () => {
        if (!videoRef.current || !activeUser || !data) {
            return;
        }

        const canvas = canvasRef.current;

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
            setLoadingText('Updating mask...');
            try {
                await maskMutation.mutateAsync({
                    user: activeUser,
                    maskData: {
                        camera_id: data.camera_id,
                        mask: compressAndBase64EncodeBitMask(aBitMask),
                    },
                });
                toast.success('Updated mask');
            } catch (error) {
                console.log(error);
                toast.error('Unable to save mask data');
            }
            setLoadingText('');
        }
    }, [
        data,
        activeUser,
        canvasRef.current,
        videoRef.current,
        streamDimensions,
    ]);

    const resetMask = useCallback((): void => {
        if (data) {
            const { mask } = data;

            if (mask && mask !== '') {
                setBitMask(decodeAndDecompressBase64EncodedBitMask(mask));

                return;
            }
        }

        setBitMask([]);
    }, [data]);

    const clearMask = useCallback(() => {
        if (data?.height === 0 || data?.width === 0) {
            toast.error(
                "Can't adjust mask to a camera with a resolution of 0 X 0."
            );
            return;
        }

        setBrushType(undefined);
        setBitMask([]);
    }, [data]);

    const cameraSource = useMemo(() => {
        if (sourceList.length > 0 && params.id) {
            return sourceList.find(
                (source) => source.camera_id === Number(params.id)
            );
        }

        return undefined;
    }, [sourceList, params]);

    const edgeStatusData = useMemo(() => {
        const edgeData = edgeStatusQuery.data;

        if (edgeData && edgeData._edge_status.length > 0) {
            return edgeData._edge_status[0];
        }
        return null;
    }, [edgeStatusQuery.data]);

    const saveZone = async () => {
        if (!socket || !cameraSource?.source_id) {
            return;
        }

        setLoadingText('Saving Zone settings...');
        const source_id = cameraSource?.source_id;
        const avZoneSelected = zoneOptions.findIndex(
            (option) => option.value === selectedZone?.value
        );

        if (selectedBehavior?.value === 'line crossing') {
            try {
                // @ts-ignore
                await setLineCrossingData({
                    socket,
                    source_id,
                    getSequence,
                    lineCrossingData: {
                        id: !isAlarmVision
                            ? selectedZone!.value
                            : queryIds[avZoneSelected],
                        shape: 'line',
                        vertices: [
                            {
                                x: convertLCCoordinateToPercent(
                                    lineCrossingLine[1][1],
                                    captureResolution.width
                                ),
                                y:
                                    1 -
                                    convertLCCoordinateToPercent(
                                        lineCrossingLine[1][0],
                                        captureResolution.height
                                    ),
                            },
                            {
                                x: convertLCCoordinateToPercent(
                                    lineCrossingLine[0][1],
                                    captureResolution.width
                                ),
                                y:
                                    1 -
                                    convertLCCoordinateToPercent(
                                        lineCrossingLine[0][0],
                                        captureResolution.height
                                    ),
                            },
                        ],
                        direction:
                            selectedDirection === '0'
                                ? 'R'
                                : selectedDirection === '1'
                                ? 'L'
                                : 'B',
                        classify_confidence: {
                            vehicle: vehicleDetectionToggle
                                ? Number(
                                      (
                                          vehicleConfidenceThreshold / 100
                                      ).toFixed(5)
                                  )
                                : 0,
                            person: personDetectionToggle
                                ? Number(
                                      (personConfidenceThreshold / 100).toFixed(
                                          5
                                      )
                                  )
                                : 0,
                        },
                        motion_confidence: {
                            vehicle: vehicleDetectionToggle
                                ? vehicleMotionConfidence
                                : 0,
                            person: personDetectionToggle
                                ? personMotionConfidence
                                : 0,
                        },
                        dwell: {
                            vehicle: 0,
                            person: 0,
                        },
                    },
                });
                zones.push({
                    id: !isAlarmVision
                        ? selectedZone!.value
                        : queryIds[avZoneSelected],
                    shape: 'line',
                    vertices: [
                        {
                            x: convertLCCoordinateToPercent(
                                lineCrossingLine[1][1],
                                captureResolution.width
                            ),
                            y:
                                1 -
                                convertLCCoordinateToPercent(
                                    lineCrossingLine[1][0],
                                    captureResolution.height
                                ),
                        },
                        {
                            x: convertLCCoordinateToPercent(
                                lineCrossingLine[0][1],
                                captureResolution.width
                            ),
                            y:
                                1 -
                                convertLCCoordinateToPercent(
                                    lineCrossingLine[0][0],
                                    captureResolution.height
                                ),
                        },
                    ],
                    direction:
                        selectedDirection === '0'
                            ? 'R'
                            : selectedDirection === '1'
                            ? 'L'
                            : 'B',
                    classify_confidence: {
                        vehicle: vehicleDetectionToggle
                            ? Number(
                                  (vehicleConfidenceThreshold / 100).toFixed(5)
                              )
                            : 0,
                        person: personDetectionToggle
                            ? Number(
                                  (personConfidenceThreshold / 100).toFixed(5)
                              )
                            : 0,
                    },
                    motion_confidence: {
                        vehicle: vehicleDetectionToggle
                            ? vehicleMotionConfidence
                            : 0,
                        person: personDetectionToggle
                            ? personMotionConfidence
                            : 0,
                    },
                    dwell: {
                        vehicle: 0,
                        person: 0,
                    },
                });

                const cameraConfig: IUpdateCameraConfig = {
                    camera_id: cameraSource.camera_id,
                    camera_properties: {
                        zone_shape: 'line',
                    },
                };

                await editCameraMutation.mutateAsync({
                    user: activeUser!,
                    cameraConfig,
                });
            } catch (err) {
                console.log(err);
                toast.error('There was an issue saving your changes.');
                setLoadingText('');
                return;
            }
            toast.success('Zone configuration settings updated.');
            setLoadingText('');
        } else if (selectedBehavior?.value === 'Detection') {
            const verticies = [];
            for (const vertex of AOI) {
                verticies.push({
                    x: convertLCCoordinateToPercent(
                        vertex[1],
                        captureResolution.width
                    ),
                    y:
                        1 -
                        convertLCCoordinateToPercent(
                            vertex[0],
                            captureResolution.height
                        ),
                });
            }
            try {
                // @ts-ignore
                console.log('Dwell Values', personDwell, vehicleDwell);
                await setPolyZoneData({
                    socket,
                    source_id,
                    getSequence,
                    polyZoneData: {
                        id: !isAlarmVision
                            ? selectedZone!.value
                            : queryIds[avZoneSelected],
                        shape: 'polygon',
                        vertices: verticies,
                        classify_confidence: {
                            vehicle: vehicleDetectionToggle
                                ? Number(
                                      (
                                          vehicleConfidenceThreshold / 100
                                      ).toFixed(5)
                                  )
                                : 0,
                            person: personDetectionToggle
                                ? Number(
                                      (personConfidenceThreshold / 100).toFixed(
                                          5
                                      )
                                  )
                                : 0,
                        },
                        motion_confidence: {
                            vehicle: vehicleDetectionToggle
                                ? vehicleMotionConfidence
                                : 0,
                            person: personDetectionToggle
                                ? personMotionConfidence
                                : 0,
                        },
                        dwell: {
                            person: loiteringEnabled ? Number(personDwell) : 0,
                            vehicle: loiteringEnabled ? Number(vehicleDwell) : 0,
                        },
                    },
                });
                zones.push({
                    id: !isAlarmVision
                        ? selectedZone!.value
                        : queryIds[avZoneSelected],
                    shape: 'polygon',
                    vertices: verticies,
                    classify_confidence: {
                        vehicle: vehicleDetectionToggle
                            ? Number(
                                  (vehicleConfidenceThreshold / 100).toFixed(5)
                              )
                            : 0,
                        person: personDetectionToggle
                            ? Number(
                                  (personConfidenceThreshold / 100).toFixed(5)
                              )
                            : 0,
                    },
                    motion_confidence: {
                        vehicle: vehicleDetectionToggle
                            ? vehicleMotionConfidence
                            : 0,
                        person: personDetectionToggle
                            ? personMotionConfidence
                            : 0,
                    },
                    dwell: {
                        person: loiteringEnabled ? Number(personDwell) : 0,
                        vehicle: loiteringEnabled ? Number(vehicleDwell) : 0,
                    },
                });
                const cameraConfig: IUpdateCameraConfig = {
                    camera_name: cameraSource.source_name,
                    camera_id: cameraSource.camera_id,
                    camera_properties: {
                        zone_shape: 'polygon',
                    },
                };
                await editCameraMutation.mutateAsync({
                    user: activeUser!,
                    cameraConfig,
                });
            } catch (err) {
                console.log(err);
                toast.error('There was an issue saving your changes.');

                return;
            }
            toast.success('Zone Configuration settings updated.');
            setLoadingText('');
        }
    };

    const translateZoneData = async () => {
        if (!socket || !cameraSource?.source_id) {
            return;
        }

        const verticies = [];
        const source_id = cameraSource?.source_id;
        const avZoneSelected = zoneOptions.findIndex(
            (option) => option.value === selectedZone?.value
        );
        let avID = '01';

        if (queryIds[avZoneSelected] !== undefined) {
            avID = queryIds[avZoneSelected];
        }
        setAvZoneIndex(selectedZone?.value);
        setLoadingText('Loading Zone Data');
        setActiveZone(!isAlarmVision ? selectedZone!.value : avID);

        if (selectedZone?.value !== 'Add Zone') {
            try {
                setLoadingText('Loading Zone Data');
                const zoneData = await getLineCrossingData({
                    socket,
                    source_id,
                    getSequence,
                    id: selectedZone!.value,
                });
                const trimmedStrZones = zoneData.split(';;;')[0];
                const parser = new DOMParser();
                const xmlDocZones = parser.parseFromString(
                    trimmedStrZones,
                    'text/xml'
                );
                const parsedZonesResponse =
                    xmlDocZones.getElementsByTagName('Response')[0]
                        .childNodes[0].nodeValue;
                const parsedZoneData = JSON.parse(parsedZonesResponse!);

                const zone = parsedZoneData;
                console.log('zone', zone);
                if (zone.length === 0) {
                    setActiveLineCrossingLine([
                        [100, 400],
                        [400, 400],
                    ]);
                    setActiveAoeSizesAsPct({
                        top: 10,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        height: 100,
                        width: 100,
                    });
                }
                if (zone.shape === 'line') {
                    setSelectedBehavior({
                        label: 'Line Crossing',
                        value: 'line crossing',
                    });
                    if (zone.direction === 'R') {
                        setSelectedDirection('0');
                    } else if (zone.direction === 'L') {
                        setSelectedDirection('1');
                    } else if (zone.direction === 'B') {
                        setSelectedDirection('2');
                    }
                    setPersonDetectionToggle(true);
                    setVehicleDetectionToggle(true);
                    if (zone.classify_confidence.person === 0) {
                        setPersonDetectionToggle(false);
                    }
                    if (zone.classify_confidence.vehicle === 0) {
                        setVehicleDetectionToggle(false);
                    }
                    setActiveLineCrossingLine([
                        [
                            convertPercentToCoordinate(
                                1 - zone.vertices[1].y,
                                captureResolution.height
                            ),
                            convertPercentToCoordinate(
                                zone.vertices[1].x,
                                captureResolution.width
                            ),
                        ],
                        [
                            convertPercentToCoordinate(
                                1 - zone.vertices[0].y,
                                captureResolution.height
                            ),
                            convertPercentToCoordinate(
                                zone.vertices[0].x,
                                captureResolution.width
                            ),
                        ],
                    ]);
                } else if (zone.shape === 'polygon') {
                    setSelectedBehavior({
                        label: 'Detection',
                        value: 'Detection',
                    });
                    setPersonDetectionToggle(true);
                    setVehicleDetectionToggle(true);
                    if (zone.classify_confidence.person === 0) {
                        setPersonDetectionToggle(false);
                    }
                    if (zone.classify_confidence.vehicle === 0) {
                        setVehicleDetectionToggle(false);
                    }
                    if (zone.dwell.person === 0 || 1 && zone.dwell.vehicle === 0 || 1) {
                        setLoiteringEnabled(false);
                    }
                    if (zone.dwell.person > 1 || zone.dwell.vehicle > 1)
                    {
                        setLoiteringEnabled(true);
                        setPersonDwell(zone.dwell.person);
                        setVehicleDwell(zone.dwell.vehicle)
                    }
                    for (const vertex of zone.vertices) {
                        if (vertex.x > 1) {
                            vertex.x = 1;
                        }
                        if (vertex.y > 1) {
                            vertex.y = 1;
                        }
                        verticies.push([
                            convertPercentToCoordinate(
                                1 - vertex.y,
                                captureResolution.height
                            ),
                            convertPercentToCoordinate(
                                vertex.x,
                                captureResolution.width
                            ),
                        ]);
                    }

                    setActiveAOI(verticies);
                }
                setLoadingText('');
                /*
                setLineCrossingLine([
                    [parsedZoneData.vertices[0].x, parsedZoneData.vertices[0].y],
                    [parsedZoneData.vertices[1].x, parsedZoneData.vertices[1].y],
                ]);
                setLCAsPcts(
                    convertScaleLineToPercents(lineCrossingLine, captureResolution)
                );
                setLCMidPointsAsPcts(generateLCMidPoints(LCAsPcts));
                if (parsedZoneData.direction === 'R') {
                    setSelectedDirection('0');
                } else if (parsedZoneData.direction === 'L') {
                    setSelectedDirection('1');
                } else if (parsedZoneData.direction === 'B') {
                    setSelectedDirection('2');
                }
                console.log('response', response);
                console.log('parsed string: ', parsedZoneData.id);
                setLoadingText('');
                 */
            } catch (err) {
                console.log(err);
                setActiveLineCrossingLine([
                    [100, 400],
                    [400, 400],
                ]);
                setActiveAOI([
                    [
                        convertPercentToCoordinate(0, captureResolution.height),
                        convertPercentToCoordinate(0, captureResolution.width),
                    ],
                    [
                        convertPercentToCoordinate(0, captureResolution.height),
                        convertPercentToCoordinate(1, captureResolution.width),
                    ],
                    [
                        convertPercentToCoordinate(1, captureResolution.height),
                        convertPercentToCoordinate(1, captureResolution.width),
                    ],
                    [
                        convertPercentToCoordinate(1, captureResolution.height),
                        convertPercentToCoordinate(0, captureResolution.width),
                    ],
                ]);
                setLoadingText('');
            }
        }
    };
    const translateZonesData = async () => {
        if (!socket || !cameraSource?.source_id) {
            return;
        }

        const verticies = [];
        const tempUsedZones = [];
        const tempZoneInfo = [];
        const source_id = cameraSource?.source_id;
        if (getZones) {
            try {
                const zoneData = await getZonesData({
                    socket,
                    source_id,
                    getSequence,
                });
                const trimmedStrZones = zoneData.split(';;;')[0];
                const parser = new DOMParser();
                const xmlDocZones = parser.parseFromString(
                    trimmedStrZones,
                    'text/xml'
                );
                const parsedZonesResponse =
                    xmlDocZones.getElementsByTagName('Response')[0]
                        .childNodes[0].nodeValue;
                const parsedZonesData = JSON.parse(parsedZonesResponse!);

                setZoneCount(parsedZonesData.zones.length);
                setZones(parsedZonesData.zones);
                let detectionArray = [];
                for (const zone of parsedZonesData.zones) {
                    if (!isAlarmVision) {
                        tempUsedZones.push(zone.id);
                        if (zone.classify_confidence.vehicle > 0) {
                            detectionArray.push('vehicle');
                        }
                        if (zone.classify_confidence.person > 0) {
                            detectionArray.push('person');
                        }
                        tempZoneInfo.push({
                            id: zone.id,
                            detection: detectionArray,
                            shape: zone.shape,
                        });

                        detectionArray = [];
                    } else {
                        if (zone.id === '01') {
                            if (zone.classify_confidence.vehicle > 0) {
                                detectionArray.push('vehicle');
                            }
                            if (zone.classify_confidence.person > 0) {
                                detectionArray.push('person');
                            }
                            tempZoneInfo.push({
                                id: data?.configuration.alarm_vision
                                    .available_zones[0],
                                detection: detectionArray,
                                shape: zone.shape,
                            });
                        }
                        if (zone.id === '02') {
                            if (zone.classify_confidence.vehicle > 0) {
                                detectionArray.push('vehicle');
                            }
                            if (zone.classify_confidence.person > 0) {
                                detectionArray.push('person');
                            }
                            tempZoneInfo.push({
                                id: data?.configuration.alarm_vision
                                    .available_zones[1],
                                detection: detectionArray,
                                shape: zone.shape,
                            });
                        }
                        if (zone.id === '03') {
                            if (zone.classify_confidence.vehicle > 0) {
                                detectionArray.push('vehicle');
                            }
                            if (zone.classify_confidence.person > 0) {
                                detectionArray.push('person');
                            }
                            tempZoneInfo.push({
                                id: data?.configuration.alarm_vision
                                    .available_zones[2],
                                detection: detectionArray,
                                shape: zone.shape,
                            });
                        }
                        if (zone.id === '04') {
                            if (zone.classify_confidence.vehicle > 0) {
                                detectionArray.push('vehicle');
                            }
                            if (zone.classify_confidence.person > 0) {
                                detectionArray.push('person');
                            }
                            tempZoneInfo.push({
                                id: data?.configuration.alarm_vision
                                    .available_zones[3],
                                detection: detectionArray,
                                shape: zone.shape,
                            });
                        }
                        tempUsedZones.push(zone.id);
                        detectionArray = [];
                    }
                }
                setUsedZones(tempUsedZones);
                setZoneInfo(tempZoneInfo);
                if (!isAlarmVision) {
                    setSelectedZone({
                        label: parsedZonesData.zones[0].id,
                        value: parsedZonesData.zones[0].id,
                    });
                    setActiveColor('#00aadc');
                    if (parsedZonesData.zones.length === 1 || 0) {
                        setZoneOptions([
                            {
                                label: parsedZonesData.zones[0].id,
                                value: parsedZonesData.zones[0].id,
                                color: '#00aadc',
                            },
                            { label: 'Add Zone', value: 'Add Zone' },
                        ]);
                    } else if (parsedZonesData.zones.length === 2) {
                        setZoneOptions([
                            {
                                label: parsedZonesData.zones[0].id,
                                value: parsedZonesData.zones[0].id,
                                color: '#00aadc',
                            },
                            {
                                label: parsedZonesData.zones[1].id,
                                value: parsedZonesData.zones[1].id,
                                color:
                                    parsedZonesData.zones[1].id === '02'
                                        ? '#65BC7B'
                                        : parsedZonesData.zones[1].id === '03'
                                        ? '#F7941D'
                                        : '#C00ECE',
                            },
                            { label: 'Add Zone', value: 'Add Zone' },
                        ]);
                    } else if (parsedZonesData.zones.length === 3) {
                        setZoneOptions([
                            {
                                label: parsedZonesData.zones[0].id,
                                value: parsedZonesData.zones[0].id,
                                color: '#00aadc',
                            },
                            {
                                label: parsedZonesData.zones[1].id,
                                value: parsedZonesData.zones[1].id,
                                color:
                                    parsedZonesData.zones[1].id === '02'
                                        ? '#65BC7B'
                                        : parsedZonesData.zones[1].id === '03'
                                        ? '#F7941D'
                                        : '#C00ECE',
                            },
                            {
                                label: parsedZonesData.zones[2].id,
                                value: parsedZonesData.zones[2].id,
                                color:
                                    parsedZonesData.zones[2].id === '02'
                                        ? '#65BC7B'
                                        : parsedZonesData.zones[2].id === '03'
                                        ? '#F7941D'
                                        : '#C00ECE',
                            },
                            { label: 'Add Zone', value: 'Add Zone' },
                        ]);
                    } else if (parsedZonesData.zones.length === 4) {
                        setZoneOptions([
                            { label: '01', value: '01', color: '#00aadc' },
                            { label: '02', value: '02', color: '#65BC7B' },
                            { label: '03', value: '03', color: '#F7941D' },
                            { label: '04', value: '04', color: '#C00ECE' },
                        ]);
                    }
                } else {
                    const availableAvZones = [
                        {
                            label: data!.configuration.alarm_vision
                                .available_zones[0],
                            id: '01',
                        },
                        {
                            label: data!.configuration.alarm_vision
                                .available_zones[1],
                            id: '02',
                        },
                        {
                            label: data!.configuration.alarm_vision
                                .available_zones[2],
                            id: '03',
                        },
                        {
                            label: data!.configuration.alarm_vision
                                .available_zones[3],
                            id: '04',
                        },
                    ];

                    if (parsedZonesData.zones.length === 1 || 0) {
                        setZoneOptions([
                            {
                                label: data!.configuration.alarm_vision.available_zones[0].toString(),
                                value: '01',
                                color: '#00aadc',
                            },
                            { label: 'Add Zone', value: 'Add Zone' },
                        ]);
                    } else if (parsedZonesData.zones.length === 2) {
                        setZoneOptions([
                            {
                                label: data!.configuration.alarm_vision.available_zones[0].toString(),
                                value: '01',
                                color: '#00aadc',
                            },
                            {
                                label:
                                    parsedZonesData.zones[1].id === '02'
                                        ? data!.configuration.alarm_vision.available_zones[1].toString()
                                        : parsedZonesData.zones[1] === '03'
                                        ? data!.configuration.alarm_vision.available_zones[2].toString()
                                        : data!.configuration.alarm_vision.available_zones[3].toString(),
                                value:
                                    parsedZonesData.zones[1].id === '02'
                                        ? '02'
                                        : parsedZonesData.zones[1] === '03'
                                        ? '03'
                                        : '04',
                                color:
                                    parsedZonesData.zones[1].id === '02'
                                        ? '#65BC7B'
                                        : parsedZonesData.zones[1] === '03'
                                        ? '#F7941D'
                                        : '#C00ECE',
                            },
                            { label: 'Add Zone', value: 'Add Zone' },
                        ]);
                    } else if (parsedZonesData.zones.length === 3) {
                        setZoneOptions([
                            {
                                label: data!.configuration.alarm_vision.available_zones[0].toString(),
                                value: '01',
                                color: '#00aadc',
                            },
                            {
                                label:
                                    parsedZonesData.zones[1].id === '02'
                                        ? data!.configuration.alarm_vision.available_zones[1].toString()
                                        : data!.configuration.alarm_vision.available_zones[2].toString(),
                                value:
                                    parsedZonesData.zones[1].id === '02'
                                        ? '02'
                                        : '03',
                                color:
                                    parsedZonesData.zones[1].id === '02'
                                        ? '#65BC7B'
                                        : '#F7941D',
                            },
                            {
                                label:
                                    parsedZonesData.zones[2].id === '03'
                                        ? data!.configuration.alarm_vision.available_zones[2].toString()
                                        : data!.configuration.alarm_vision.available_zones[3].toString(),
                                value:
                                    parsedZonesData.zones[2].id === '03'
                                        ? '03'
                                        : '04',
                                color:
                                    parsedZonesData.zones[2].id === '03'
                                        ? '#F7941D'
                                        : '#C00ECE',
                            },
                            { label: 'Add Zone', value: 'Add Zone' },
                        ]);
                    } else if (parsedZonesData.zones.length === 4) {
                        setZoneOptions([
                            {
                                label: data!.configuration.alarm_vision.available_zones[0].toString(),
                                value: '01',
                                color: '#00aadc',
                            },
                            {
                                label: data!.configuration.alarm_vision.available_zones[1].toString(),
                                value: '02',
                                color: '#65BC7B',
                            },
                            {
                                label: data!.configuration.alarm_vision.available_zones[2].toString(),
                                value: '03',
                                color: '#F7941D',
                            },
                            {
                                label: data!.configuration.alarm_vision.available_zones[3].toString(),
                                value: '04',
                                color: '#C00ECE',
                            },
                        ]);
                    }
                    setSelectedZone({
                        label: data!.configuration.alarm_vision.available_zones[0].toString(),
                        value: '01',
                    });
                    setActiveColor('#00aadc');
                }
                for (const zone of parsedZonesData.zones) {
                    if (zone.shape === 'line') {
                        setSelectedBehavior({
                            label: 'Line Crossing',
                            value: 'line crossing',
                        });
                        if (zone.direction === 'R') {
                            setSelectedDirection('0');
                        } else if (zone.direction === 'L') {
                            setSelectedDirection('1');
                        } else if (zone.direction === 'B') {
                            setSelectedDirection('2');
                        }
                        setPersonDetectionToggle(true);
                        setVehicleDetectionToggle(true);
                        if (zone.classify_confidence.person === 0) {
                            setPersonDetectionToggle(false);
                        }
                        if (zone.classify_confidence.vehicle === 0) {
                            setVehicleDetectionToggle(false);
                        }
                    } else if (zone.shape === 'polygon') {
                        setSelectedBehavior({
                            label: 'Detection',
                            value: 'Detection',
                        });
                        setPersonDetectionToggle(true);
                        setVehicleDetectionToggle(true);
                        if (zone.classify_confidence.person === 0) {
                            setPersonDetectionToggle(false);
                        }
                        if (zone.classify_confidence.vehicle === 0) {
                            setVehicleDetectionToggle(false);
                        }
                    }
                }
                /*
                setLineCrossingLine([
                    [parsedZoneData.vertices[0].x, parsedZoneData.vertices[0].y],
                    [parsedZoneData.vertices[1].x, parsedZoneData.vertices[1].y],
                ]);
                setLCAsPcts(
                    convertScaleLineToPercents(lineCrossingLine, captureResolution)
                );
                setLCMidPointsAsPcts(generateLCMidPoints(LCAsPcts));
                if (parsedZoneData.direction === 'R') {
                    setSelectedDirection('0');
                } else if (parsedZoneData.direction === 'L') {
                    setSelectedDirection('1');
                } else if (parsedZoneData.direction === 'B') {
                    setSelectedDirection('2');
                }
                console.log('response', response);
                console.log('parsed string: ', parsedZoneData.id);
                setLoadingText('');
                 */
            } catch (err) {
                console.log(err);
                setActiveLineCrossingLine([
                    [100, 400],
                    [400, 400],
                ]);
                setActiveAOI([
                    [
                        convertPercentToCoordinate(0, captureResolution.height),
                        convertPercentToCoordinate(0, captureResolution.width),
                    ],
                    [
                        convertPercentToCoordinate(0, captureResolution.height),
                        convertPercentToCoordinate(1, captureResolution.width),
                    ],
                    [
                        convertPercentToCoordinate(1, captureResolution.height),
                        convertPercentToCoordinate(1, captureResolution.width),
                    ],
                    [
                        convertPercentToCoordinate(1, captureResolution.height),
                        convertPercentToCoordinate(0, captureResolution.width),
                    ],
                ]);
                toast.error('There was an issue loading zone information.');
            }
        }
        setGetZones(false);
    };
    const removeZone = async () => {
        if (!socket || !cameraSource?.source_id) {
            return;
        }
        setLoadingText('Deleting Zone settings...');
        setPersonDetectionToggle(true);
        setVehicleDetectionToggle(true);

        setActiveAOI([
            [
                convertPercentToCoordinate(0, captureResolution.height),
                convertPercentToCoordinate(0, captureResolution.width),
            ],
            [
                convertPercentToCoordinate(0, captureResolution.height),
                convertPercentToCoordinate(1, captureResolution.width),
            ],
            [
                convertPercentToCoordinate(1, captureResolution.height),
                convertPercentToCoordinate(1, captureResolution.width),
            ],
            [
                convertPercentToCoordinate(1, captureResolution.height),
                convertPercentToCoordinate(0, captureResolution.width),
            ],
        ]);
        const source_id = cameraSource?.source_id;
        try {
            // @ts-ignore
            await setPolyZoneData({
                socket,
                source_id,
                getSequence,
                polyZoneData: {
                    id: selectedZone!.value,
                    shape: 'polygon',
                    vertices: [
                        { x: 0, y: 0 },
                        { x: 1, y: 0 },
                        { x: 1, y: 1 },
                        { x: 0, y: 1 },
                    ],
                    classify_confidence: {
                        vehicle: 0.75,
                        person: 0.75,
                    },
                    motion_confidence: {
                        vehicle: 30,
                        person: 4,
                    },
                    dwell: {
                        vehicle: 0,
                        person: 0,
                    },
                },
            });
        } catch (err) {
            console.log(err);
            toast.error('There was an issue saving your changes.');
            setLoadingText('');
            return;
        }
        toast.success('Zone configuration settings updated.');
        setActiveLineCrossingLine([
            [100, 400],
            [400, 400],
        ]);
        setLoadingText('');
    };

    const deleteZone = async () => {
        if (!socket || !cameraSource?.source_id) {
            return;
        }
        setLoadingText('Deleting Zone settings...');
        const source_id = cameraSource?.source_id;
        const addZone = { label: 'Add Zone', value: 'Add Zone' };
        setShowZones(false);
        setUsedZones(usedZones.filter((zone) => zone !== selectedZone!.value));
        try {
            // @ts-ignore
            await deleteZoneData({
                socket,
                source_id,
                getSequence,
                id: selectedZone!.value,
            });
            const filterKey = selectedZone!.value;
            setZoneCount((prevState) => prevState - 1);
            setZones((prevState) =>
                prevState.filter((zone) => zone.value !== filterKey)
            );
        } catch (err) {
            console.log(err);
            toast.error('There was an issue deleting your zone.');
            setLoadingText('');
            return;
        }
        toast.success('Zone configuration deleted.');
        const newZoneOptions = zoneOptions.filter(
            (zoneOption) => zoneOption.value !== selectedZone?.value
        );
        const newOption = { value: 'Add Zone', label: 'Add Zone' };
        const exists = zoneOptions.some(
            (option) => option.value === newOption.value
        );
        if (newZoneOptions.length !== 4 && !exists) {
            newZoneOptions.push(addZone);
        }
        setZoneOptions(newZoneOptions);
        if (!isAlarmVision) {
            setSelectedZone({ label: '01', value: '01' });
            setActiveColor('#00aadc');
        } else if (isAlarmVision) {
            setSelectedZone({
                label: data!.configuration.alarm_vision.available_zones[0].toString(),
                value: '01',
            });
            setActiveColor('#00aadc');
        }
        setLoadingText('');
        translateZonesData();
    };
    const updateZoneInfo = async () => {
        try {
            const cameraConfig: IUpdateCameraConfig = {
                camera_id: cameraSource.camera_id,
                used_zones: usedZones,
                zones: zoneInfo,
            };
            await editCameraMutation.mutateAsync({
                user: activeUser!,
                cameraConfig,
            });
        } catch (error) {
            console.log('error updating camera zone information', error);
        }
    };
    const updateDMPZoneInfo = async () => {
        const usedDMPZones: number[] = [];
        for (const zone of usedZones) {
            if (zone === '01') {
                usedDMPZones.push(
                    data!.configuration.alarm_vision.available_zones[0]
                );
            } else if (zone === '02') {
                usedDMPZones.push(
                    data!.configuration.alarm_vision.available_zones[1]
                );
            } else if (zone === '03') {
                usedDMPZones.push(
                    data!.configuration.alarm_vision.available_zones[2]
                );
            } else if (zone === '04') {
                usedDMPZones.push(
                    data!.configuration.alarm_vision.available_zones[3]
                );
            }
        }
        try {
            const cameraConfig: IUpdateCameraConfig = {
                camera_id: cameraSource.camera_id,
                used_zones: usedDMPZones,
                zones: zoneInfo,
            };
            await editCameraMutation.mutateAsync({
                user: activeUser!,
                cameraConfig,
            });
        } catch (error) {
            console.log('error updating camera zone information', error);
        }
    };
    const getEdgeVersion = async (props: IEdgeVersionRequest) => {
        if (cameraSource?.camera_id === null) {
            setGetZones(false);
            return;
        }
        setLoadingText('Getting Edge Information');
        try {
            const route = getEdgeVersionInfo(activeUser!);
            const results = (await route.get(props)) as IEdgeVersionResponse;
            if (results.supports_enhanced_features) {
                setGetZones(true);
                setSupportsEnhancedFeatures(results.supports_enhanced_features);
            } else {
                setGetZones(false);
                setSupportsEnhancedFeatures(results.supports_enhanced_features);
            }
            setLoadingText('');
        } catch (error: any) {
            setLoadingText('');
            const { reason } = error.response.data.details;
            if (reason) {
                toast.error(reason);
            } else toast.error('Unable to retrieve edge information');
            setGetZones(false);
        }
    };

    useEffect(() => {
        if (cameraSource?.camera_id === undefined) {
            setActiveLineCrossingLine([
                [100, 400],
                [400, 400],
            ]);
            setActiveAOI([
                [
                    convertPercentToCoordinate(0, captureResolution.height),
                    convertPercentToCoordinate(0, captureResolution.width),
                ],
                [
                    convertPercentToCoordinate(0, captureResolution.height),
                    convertPercentToCoordinate(1, captureResolution.width),
                ],
                [
                    convertPercentToCoordinate(1, captureResolution.height),
                    convertPercentToCoordinate(1, captureResolution.width),
                ],
                [
                    convertPercentToCoordinate(1, captureResolution.height),
                    convertPercentToCoordinate(0, captureResolution.width),
                ],
            ]);
        }
    }, [cameraSource?.camera_id]);

    useEffect(() => {
        if (
            cameraSource?.source_id &&
            !liveViewQuery.isFetching &&
            socket?.readyState === 1 &&
            liveViewActive
        ) {
            startVideo(cameraSource.source_id, true);
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
        // Only want to set the mask value once.  Data is polled to get status updates and this was resetting
        // the mask.

        if (data) {
            const { mask } = data;

            if (mask && mask !== '') {
                setBitMask(decodeAndDecompressBase64EncodedBitMask(mask));
            } else {
                setBitMask([]);
            }
        }
    }, [data]);

    useEffect(() => {
        if (data)
            if (cameraSource?.camera_id !== undefined) {
                const camera = data;
                setIsAlarmVision(
                    camera?.camera_properties.is_alarm_vision ?? false
                );
            }
    }, [data, cameraSource?.source_id]);

    useEffect(() => {
        const cameraId = cameraSource?.camera_id;
        if (cameraId !== undefined) {
            getEdgeVersion({ camera_id: cameraId?.toString()! });
        }
    }, [cameraSource?.source_id]);

    useEffect(() => {
        if (data !== undefined) {
            if (getZones) {
                translateZonesData();
            }
        } else {
            edgeStatusQuery.refetch();
        }
    }, [
        isAlarmVision,
        data,
        cameraSource?.source_id,
        supportsEnhancedFeatures,
        getZones,
    ]);

    useEffect(() => {
        translateZoneData();
    }, [selectedZone, isAlarmVision]);

    useEffect(() => {
        setClipFailedToLoad(false);
    }, [params.id]);

    useEffect(() => {
        setLCAsPcts(
            convertScaleLineToPercents(
                activeLineCrossingLine,
                captureResolution
            )
        );
        setLCMidPointsAsPcts(generateMidPoints(LCAsPcts));
    }, [activeLineCrossingLine]);

    useEffect(() => {
        setAOIAsPcts(convertScaleLineToPercents(activeAOI, captureResolution));
        setAOIMidPointsAsPcts(generateMidPoints(AOIAsPcts));
        setAOI(activeAOI);
    }, [activeAOI]);

    useEffect(() => {
        if (selectedZone?.value === 'Add Zone') {
            if (!isAlarmVision) {
                if (zoneOptions.length === 2) {
                    const updatedOptions = [
                        ...zoneOptions.slice(0, zoneOptions.length - 1), // All elements except the last one
                        { value: '02', label: '02', color: '#65BC7B' }, // The new option
                        zoneOptions[zoneOptions.length - 1], // The original last element
                    ];
                    setZoneOptions(updatedOptions);
                    usedZones.push('02');
                    setSelectedZone({ value: '02', label: '02' });
                    setActiveColor('#65BC7B');
                    setZoneCount(zoneCount + 1);
                } else if (zoneOptions.length === 3) {
                    const newOption = {
                        value: '02',
                        label: '02',
                        color: '#65BC7B',
                    };
                    const exists = zoneOptions.some(
                        (option) => option.value === newOption.value
                    );
                    if (exists) {
                        const newOption = {
                            value: '03',
                            label: '03',
                            color: '#F7941D',
                        };
                        const exists = zoneOptions.some(
                            (option) => option.value === newOption.value
                        );
                        if (!exists) {
                            const updatedOptions = [...zoneOptions];
                            if (usedZones.some((zone) => zone === '04')) {
                                updatedOptions.splice(1, 0, newOption);
                            } else {
                                updatedOptions.splice(2, 0, newOption);
                            }

                            setZoneOptions(updatedOptions);
                            setSelectedZone(newOption);
                            usedZones.push('03');
                            setActiveColor('#F7941D');
                            setZoneCount(zoneCount + 1);
                        }
                    } else if (!exists) {
                        const updatedOptions = [...zoneOptions];
                        updatedOptions.splice(1, 0, newOption);
                        setZoneOptions(updatedOptions);
                        setSelectedZone({ value: '02', label: '02' });
                        usedZones.push('02');
                        setActiveColor('#65BC7B');
                        setZoneCount(zoneCount + 1);
                    }
                } else {
                    setZoneOptions([
                        { label: '01', value: '01', color: '#00aadc' },
                        { label: '02', value: '02', color: '#65BC7B' },
                        { label: '03', value: '03', color: '#F7941D' },
                        { label: '04', value: '04', color: '#C00ECE' },
                    ]);

                    for (const zone of zoneOptions) {
                        const exists = usedZones.some(
                            (option) => option === zone.value
                        );

                        if (!exists) {
                            setSelectedZone({
                                label: zone.value,
                                value: zone.value,
                            });
                            setActiveColor(
                                zone.value === '01'
                                    ? '#00aadc'
                                    : zone.value === '02'
                                    ? '#65BC7B'
                                    : zone.value === '03'
                                    ? '#F7941D'
                                    : '#C00ECE'
                            );
                            usedZones.push(zone.value);
                        }
                    }
                    setZoneCount(zoneCount + 1);
                }
            } else if (isAlarmVision) {
                if (zoneOptions.length === 2) {
                    const updatedOptions = [
                        ...zoneOptions.slice(0, zoneOptions.length - 1), // All elements except the last one
                        {
                            value: '02',
                            label: data!.configuration.alarm_vision.available_zones[1].toString(),
                            color: '#65BC7B',
                        }, // The new option
                        zoneOptions[zoneOptions.length - 1], // The original last element
                    ];
                    setZoneOptions(updatedOptions);
                    usedZones.push('02');
                    setSelectedZone({
                        value: '02',
                        label: data!.configuration.alarm_vision.available_zones[1].toString(),
                    });
                    setActiveColor('#65BC7B');
                    setZoneCount(zoneCount + 1);
                } else if (zoneOptions.length === 3) {
                    const newOption = {
                        value: '02',
                        label: data!.configuration.alarm_vision.available_zones[1].toString(),
                        color: '#65BC7B',
                    };
                    const exists = zoneOptions.some(
                        (option) => option.value === newOption.value
                    );
                    if (exists) {
                        const newOption = {
                            value: '03',
                            label: data!.configuration.alarm_vision.available_zones[2].toString(),
                            color: '#F7941D',
                        };
                        const exists = zoneOptions.some(
                            (option) => option.value === newOption.value
                        );
                        if (!exists) {
                            const updatedOptions = [...zoneOptions];
                            if (usedZones.some((zone) => zone === '04')) {
                                updatedOptions.splice(1, 0, newOption);
                            } else {
                                updatedOptions.splice(2, 0, newOption);
                            }

                            setZoneOptions(updatedOptions);
                            setSelectedZone(newOption);
                            usedZones.push('03');
                            setActiveColor('#F7941D');
                            setZoneCount(zoneCount + 1);
                        }
                    } else if (!exists) {
                        const updatedOptions = [...zoneOptions];
                        updatedOptions.splice(1, 0, newOption);
                        setZoneOptions(updatedOptions);
                        setSelectedZone({
                            value: '02',
                            label: data!.configuration.alarm_vision.available_zones[1].toString(),
                        });
                        usedZones.push('02');
                        setActiveColor('#65BC7B');
                        setZoneCount(zoneCount + 1);
                    }
                } else {
                    setZoneOptions([
                        {
                            label: data!.configuration.alarm_vision.available_zones[0].toString(),
                            value: '01',
                            color: '#00aadc',
                        },
                        {
                            label: data!.configuration.alarm_vision.available_zones[1].toString(),
                            value: '02',
                            color: '#65BC7B',
                        },
                        {
                            label: data!.configuration.alarm_vision.available_zones[2].toString(),
                            value: '03',
                            color: '#F7941D',
                        },
                        {
                            label: data!.configuration.alarm_vision.available_zones[3].toString(),
                            value: '04',
                            color: '#C00ECE',
                        },
                    ]);

                    for (const zone of zoneOptions) {
                        const exists = usedZones.some(
                            (option) => option === zone.value
                        );

                        if (!exists) {
                            const addedZone = zoneOptions.filter(
                                (zoneOption) => zoneOption.value === zone.value
                            );
                            setSelectedZone({
                                label: addedZone[0].label,
                                value: zone.value,
                            });
                            setActiveColor(
                                zone.value === '01'
                                    ? '#00aadc'
                                    : zone.value === '02'
                                    ? '#65BC7B'
                                    : zone.value === '03'
                                    ? '#F7941D'
                                    : '#C00ECE'
                            );
                            usedZones.push(zone.value);
                        }
                    }
                    setZoneCount(zoneCount + 1);
                }
            }
        }
    }, [selectedZone]);

    useEffect(() => {
        if (data) {
            if (isAlarmVision) {
                setSelectedZone({
                    value: '01',
                    label: data!.configuration.alarm_vision.available_zones[0].toString(),
                });
                setActiveColor('#00aadc');
                setZoneOptions([
                    {
                        value: '01',
                        label: data!.configuration.alarm_vision.available_zones[0].toString(),
                        color: '#00aadc',
                    },
                    {
                        value: 'Add Zone',
                        label: 'Add Zone',
                    },
                ]);
            }
        }
    }, [isAlarmVision, data, cameraSource?.source_id]);

    useEffect(() => {
        setShowZones(false);
    }, [selectedZone]);

    useEffect(() => {
        if (cameraSource?.source_id) {
            if (!isAlarmVision) {
                updateZoneInfo();
            } else {
                updateDMPZoneInfo();
            }
        }
    }, [usedZones]);

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
            {supportsEnhancedFeatures ? (
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
                                    paddingLeft: 110,
                                    paddingRight: 110,
                                }}
                            >
                                {data?.camera_name}
                            </h2>
                        )}

                        {data?.monitor_mode && (
                            <div className="monitorModeContainer">
                                <span className="status-badge">
                                    {data.monitor_mode}
                                </span>
                            </div>
                        )}

                        <p
                            className="autoplay-clip-data"
                            style={{
                                paddingLeft: 110,
                                paddingRight: 110,
                            }}
                        >
                            <span>Last Event Processed:</span>{' '}
                            {displayedClipData?.created_at
                                ? displayAutoClipDateTime(
                                      displayedClipData.created_at
                                  )
                                : 'N/A'}
                        </p>

                        <div
                            className="video-container"
                            ref={videoContainerRef}
                        >
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
                                        style={{
                                            aspectRatio: '1920 / 1080',
                                            background: 'black',
                                        }}
                                        key={latestClipVideoSource}
                                        width="100%"
                                        controls={false}
                                        muted
                                        playsInline
                                        ref={videoRef}
                                        onLoadedMetadata={handleLoadedMetadata}
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

                            {clipFailedToLoad && !liveViewActive && (
                                <ClipFailedToLoad refetchClips={refetchClips} />
                            )}

                            {(clipsFound === 0 || params?.id === '0') &&
                                !clipFailedToLoad &&
                                !liveViewActive && (
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

                            {videoContainerRef.current &&
                                activeMenuItem === 'detection' &&
                                selectedBehavior?.value === 'Detection' && (
                                    <AOIResizePolygon
                                        containerDimensions={
                                            videoContainerDimensions!
                                        }
                                        captureResolution={captureResolution}
                                        AOI={AOI}
                                        setAOI={setAOI}
                                        AOIAsPcts={AOIAsPcts}
                                        setAOIAsPcts={setAOIAsPcts}
                                        AOIMidPointsAsPcts={AOIMidPointsAsPcts}
                                        setAOIMidPointsAsPcts={
                                            setAOIMidPointsAsPcts
                                        }
                                        selectedZone={selectedZone!}
                                        zoneColorArray={zoneColorArray}
                                        isAlarmVision={isAlarmVision}
                                        avZoneIndex={avZoneIndex}
                                    />
                                )}
                            {/** This is used to show a readonly version of the mask */}
                            {videoContainerRef.current &&
                                videoContainerDimensions &&
                                videoRef.current &&
                                streamDimensions.height !== 0 &&
                                streamDimensions.width !== 0 &&
                                activeMenuItem === 'detection' &&
                                showMask &&
                                !clipFailedToLoad && (
                                    <MaskCanvas
                                        bitMask={bitMask}
                                        setBitMask={setBitMask}
                                        brushSize={brushSize}
                                        maskOpacity={maskOpacity}
                                        brushType={undefined}
                                        streamDimensions={streamDimensions}
                                        parentContainerDimensions={
                                            videoContainerDimensions
                                        }
                                        canvasRef={canvasRef}
                                    />
                                )}

                            {videoContainerRef.current &&
                                videoContainerDimensions &&
                                videoRef.current &&
                                streamDimensions.height !== 0 &&
                                streamDimensions.width !== 0 &&
                                activeMenuItem === 'mask' &&
                                !clipFailedToLoad && (
                                    <MaskCanvas
                                        bitMask={bitMask}
                                        setBitMask={setBitMask}
                                        brushSize={brushSize}
                                        maskOpacity={maskOpacity}
                                        brushType={brushType}
                                        streamDimensions={streamDimensions}
                                        parentContainerDimensions={
                                            videoContainerDimensions
                                        }
                                        canvasRef={canvasRef}
                                    />
                                )}
                            {videoContainerRef.current &&
                                videoContainerDimensions &&
                                videoRef.current &&
                                streamDimensions.height !== 0 &&
                                streamDimensions.width !== 0 &&
                                activeMenuItem === 'detection' &&
                                showZones &&
                                zoneCount > 1 &&
                                !clipFailedToLoad && (
                                    <AOIAllzones
                                        containerDimensions={
                                            videoContainerDimensions
                                        }
                                        captureResolution={captureResolution}
                                        zones={zones}
                                        activeZone={activeZone}
                                        activeMenuItem={activeMenuItem}
                                        selectedZone={selectedZone!}
                                        zoneColorArray={zoneColorArray}
                                    />
                                )}
                            {videoContainerRef.current &&
                                videoContainerDimensions &&
                                videoRef.current &&
                                streamDimensions.height !== 0 &&
                                streamDimensions.width !== 0 &&
                                activeMenuItem === 'mask' &&
                                showZones &&
                                !clipFailedToLoad && (
                                    <AOIAllzones
                                        containerDimensions={
                                            videoContainerDimensions
                                        }
                                        captureResolution={captureResolution}
                                        zones={zones}
                                        activeZone={activeZone}
                                        activeMenuItem={activeMenuItem}
                                        selectedZone={selectedZone!}
                                        zoneColorArray={zoneColorArray}
                                    />
                                )}

                            {videoContainerDimensions &&
                                activeMenuItem === 'detection' &&
                                selectedBehavior?.value === 'line crossing' && (
                                    <LCOverlay
                                        containerDimensions={
                                            videoContainerDimensions
                                        }
                                        captureResolution={captureResolution}
                                        lineCrossingLine={lineCrossingLine}
                                        setLineCrossingLine={
                                            setLineCrossingLine
                                        }
                                        LCAsPcts={LCAsPcts}
                                        setLCAsPcts={setLCAsPcts}
                                        LCMidPointsAsPcts={LCMidPointsAsPcts}
                                        setLCMidPointsAsPcts={
                                            setLCMidPointsAsPcts
                                        }
                                        selectedDirection={selectedDirection}
                                        setSelectedDirection={
                                            setSelectedDirection
                                        }
                                        rotationAngle={rotationAngle}
                                        setRotationAngle={setRotationAngle}
                                        selectedZone={selectedZone!}
                                        zoneColorArray={zoneColorArray}
                                        isAlarmVision={isAlarmVision}
                                        avZoneIndex={avZoneIndex}
                                    />
                                )}
                            {videoContainerDimensions &&
                                activeMenuItem === 'scaling' && (
                                    <ScalingOverlay
                                        containerDimensions={
                                            videoContainerDimensions
                                        }
                                        captureResolution={captureResolution}
                                        scaleLine={scaleLine}
                                        setScaleLine={setScaleLine}
                                        scaleLineAsPcts={scaleLineAsPcts}
                                        setScaleLinePcts={setScaleLineAsPcts}
                                        midPointsAsPcts={midPointsAsPcts}
                                        setMidPointsAsPcts={setMidPointsAsPcts}
                                        smallestSizeIcon={smallestSizeIcon}
                                        smallestSize={smallestSize}
                                        focalPoint={focalPoint}
                                        setFocalPoint={setFocalPoint}
                                        scaleMode={scaleMode}
                                        autoScaleEnabled={autoScaleEnabled}
                                        scaledSize={scaledSize}
                                        setScaledSize={setScaledSize}
                                        largestSize={largestSize}
                                        setLargestSize={setLargestSize}
                                        largestFilterEnabled={
                                            largestFilterEnabled
                                        }
                                        maxAutoScale={maxAutoScale}
                                        focalPointPosition={focalPointPosition}
                                        setFocalPointPosition={
                                            setFocalPointPosition
                                        }
                                    />
                                )}
                        </div>
                        <div className="camera-config-footer">
                            <li className="event-type-menu">
                                <div className="globalToggleContainer">
                                    {((activeMenuItem === 'detection' &&
                                        zoneCount > 1) ||
                                        (activeMenuItem === 'mask' &&
                                            zoneCount >= 1)) && (
                                        <div
                                            className="icon-container"
                                            onClick={() => {
                                                setShowZones(!showZones);
                                            }}
                                        >
                                            <Tooltip
                                                id="zonesToggleTooltip"
                                                content="Toggle Zones"
                                                style={{
                                                    backgroundColor: '#000',
                                                    opacity: 1,
                                                    color: '#fff',
                                                }}
                                            />
                                            <AreaIcon
                                                data-tooltip-id="zonesToggleTooltip"
                                                className={`icon ${
                                                    showZones ? 'active' : ''
                                                }`}
                                            />
                                        </div>
                                    )}

                                    {activeMenuItem === 'detection' && (
                                        <div
                                            className="icon-container"
                                            onClick={() =>
                                                setShowMask(!showMask)
                                            }
                                        >
                                            <Tooltip
                                                id="maskToggleTooltip"
                                                content="Toggle Mask"
                                                style={{
                                                    backgroundColor: '#000',
                                                    opacity: 1,
                                                    color: '#fff',
                                                }}
                                            />
                                            <BlockIcon
                                                data-tooltip-id="maskToggleTooltip"
                                                className={`icon mask ${
                                                    showMask ? 'active' : ''
                                                }`}
                                            />
                                        </div>
                                    )}
                                </div>
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
                            </li>
                        </div>
                    </figure>
                    <ul className="side-items">
                        <EnhancedEdgeConfigurationMenu
                            streamDimensions={streamDimensions}
                            captureResolution={captureResolution}
                            setCaptureResolution={setCaptureResolution}
                            activeMenuItem={activeMenuItem}
                            setActiveMenuItem={setActiveMenuItem}
                            aoeSizesAsPct={aoeSizesAsPct}
                            setAoeSizesAsPct={setAoeSizesAsPct}
                            originalAoeData={originalAoeData}
                            setOriginalAoeData={setOriginalAoeData}
                            socket={socket}
                            source_id={cameraSource?.source_id}
                            getSequence={getSequence}
                            brushSize={brushSize}
                            setBrushSize={setBrushSize}
                            brushType={brushType}
                            setBrushType={setBrushType}
                            maskOpacity={maskOpacity}
                            setMaskOpacity={setMaskOpacity}
                            saveMask={saveMask}
                            resetMask={resetMask}
                            clearMask={clearMask}
                            smallestSize={smallestSize}
                            setSmallestSize={setSmallestSize}
                            smallestRangeSelector={smallestRangeSelector}
                            setSmallestRangeSelector={setSmallestRangeSelector}
                            smallestSizeIcon={smallestSizeIcon}
                            setSmallestSizeIcon={setSmallestSizeIcon}
                            autoScale={autoScaleEnabled}
                            setAutoScale={setAutoScaleEnabled}
                            scaleMode={scaleMode}
                            setScaleMode={setScaleMode}
                            focalPoint={focalPoint}
                            setFocalPoint={setFocalPoint}
                            maxAutoScale={maxAutoScale}
                            setMaxAutoScale={setMaxAutoScale}
                            scaledSize={scaledSize}
                            largestFilterEnabled={largestFilterEnabled}
                            setLargestFilterEnabled={setLargestFilterEnabled}
                            largestSize={largestSize}
                            setLargestSize={setLargestSize}
                            scaleLine={scaleLine}
                            setScaleLine={setScaleLine}
                            scaleLineAsPcts={scaleLineAsPcts}
                            setScaleLinePcts={setScaleLineAsPcts}
                            setMidPointsAsPcts={setMidPointsAsPcts}
                            setFocalPointPosition={setFocalPointPosition}
                            setAutoScaleEnabled={setAutoScaleEnabled}
                            setLoadingText={setLoadingText}
                            originalScaleData={originalScaleData}
                            setOriginalScaleData={setOriginalScaleData}
                            selectedBehavior={selectedBehavior}
                            setSelectedBehavior={setSelectedBehavior}
                            behaviorOptions={behaviorOptions}
                            personDetectionToggle={personDetectionToggle}
                            setPersonDetectionToggle={setPersonDetectionToggle}
                            vehicleDetectionToggle={vehicleDetectionToggle}
                            setVehicleDetectionToggle={
                                setVehicleDetectionToggle
                            }
                            personMotionConfidence={personMotionConfidence}
                            setPersonMotionConfidence={
                                setPersonMotionConfidence
                            }
                            vehicleMotionConfidence={vehicleMotionConfidence}
                            setVehicleMotionConfidence={
                                setVehicleMotionConfidence
                            }
                            personConfidenceThreshold={
                                personConfidenceThreshold
                            }
                            setPersonConfidenceThreshold={
                                setPersonConfidenceThreshold
                            }
                            vehicleConfidenceThreshold={
                                vehicleConfidenceThreshold
                            }
                            setVehicleConfidenceThreshold={
                                setVehicleConfidenceThreshold
                            }
                            personDwell={personDwell}
                            setPersonDwell={setPersonDwell}
                            vehicleDwell={vehicleDwell}
                            setVehicleDwell={setVehicleDwell}
                            loiteringEnabled={loiteringEnabled}
                            setLoiteringEnabled={setLoiteringEnabled}
                            selectedDirection={selectedDirection}
                            setSelectedDirection={setSelectedDirection}
                            zoneOptions={zoneOptions}
                            selectedZone={selectedZone}
                            setSelectedZone={setSelectedZone}
                            zoneNumber={zoneNumber}
                            setZoneNumber={setZoneNumber}
                            saveZone={saveZone}
                            removeZone={removeZone}
                            deleteZone={deleteZone}
                            zoneCount={zoneCount}
                            activeColor={activeColor}
                        />

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
                                        onClick={() =>
                                            setShowAdvancedSettingsModal(true)
                                        }
                                        disabled={
                                            readOnlyUser ||
                                            cameraSource?.source_id ===
                                                undefined
                                        }
                                    >
                                        <div className="iconButtonInner">
                                            <span>Advanced Settings</span>
                                            <SettingsIcon className="buttonIcon" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                            {activeUser?.id === 1 && (
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
                                            onClick={() =>
                                                setShowEdgeLogsModal(true)
                                            }
                                            disabled={
                                                readOnlyUser ||
                                                cameraSource?.source_id ===
                                                    undefined
                                            }
                                        >
                                            <div className="iconButtonInner">
                                                <span>Edge Logs</span>
                                                <SettingsIcon className="buttonIcon" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {(data?.camera_properties?.job_type === 'email' ||
                                data?.camera_properties?.job_type ===
                                    'verify' ||
                                data?.camera_properties?.job_type === 'edge' ||
                                data?.camera_properties.license_type) && (
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
                                            onClick={() =>
                                                setShowCameraModal(true)
                                            }
                                            disabled={readOnlyUser}
                                        >
                                            <div className="iconButtonInner">
                                                <span>Camera Settings</span>
                                                <EditIcon className="buttonIcon" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

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
            ) : (
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
                                    paddingLeft: 110,
                                    paddingRight: 110,
                                }}
                            >
                                {edgeStatusQuery?.data?.camera_name}
                            </h2>
                        )}

                        {data?.monitor_mode && (
                            <div className="monitorModeContainer">
                                <span className="status-badge">
                                    {data.monitor_mode}
                                </span>
                            </div>
                        )}

                        <p
                            className="autoplay-clip-data"
                            style={{
                                paddingLeft: 110,
                                paddingRight: 110,
                            }}
                        >
                            <span>Last Event Processed:</span>{' '}
                            {displayedClipData?.created_at
                                ? displayAutoClipDateTime(
                                      displayedClipData.created_at
                                  )
                                : 'N/A'}
                        </p>

                        <div
                            className="video-container"
                            ref={videoContainerRef}
                        >
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
                                        style={{
                                            aspectRatio: '1920 / 1080',
                                            background: 'black',
                                        }}
                                        key={latestClipVideoSource}
                                        width="100%"
                                        controls={false}
                                        muted
                                        playsInline
                                        ref={videoRef}
                                        onLoadedMetadata={handleLoadedMetadata}
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

                            {clipFailedToLoad && !liveViewActive && (
                                <ClipFailedToLoad refetchClips={refetchClips} />
                            )}

                            {(clipsFound === 0 || params?.id === '0') &&
                                !clipFailedToLoad &&
                                !liveViewActive && (
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

                            {videoContainerRef.current &&
                                activeMenuItem === 'aoe' && (
                                    <AreaOfInterestResizeOverlay
                                        containerDimensions={{
                                            height: videoContainerRef.current
                                                .clientHeight,
                                            width: videoContainerRef.current
                                                .clientWidth,
                                        }}
                                        aoeSizesAsPct={aoeSizesAsPct}
                                        setAoeSizesAsPct={setAoeSizesAsPct}
                                    />
                                )}

                            {/* activeMenuItem === 'mask' && (
                            <AreaOfInterestDisplay
                                captureResolution={captureResolution}
                                detectionBox={detectionBox}
                            />
                        ) */}

                            {videoContainerRef.current &&
                                videoContainerDimensions &&
                                videoRef.current &&
                                streamDimensions.height !== 0 &&
                                streamDimensions.width !== 0 &&
                                activeMenuItem === 'mask' &&
                                !clipFailedToLoad && (
                                    <MaskCanvas
                                        bitMask={bitMask}
                                        setBitMask={setBitMask}
                                        brushSize={brushSize}
                                        maskOpacity={maskOpacity}
                                        brushType={brushType}
                                        streamDimensions={streamDimensions}
                                        parentContainerDimensions={
                                            videoContainerDimensions
                                        }
                                        canvasRef={canvasRef}
                                    />
                                )}

                            {videoContainerDimensions &&
                                activeMenuItem === 'scaling' && (
                                    <ScalingOverlay
                                        containerDimensions={
                                            videoContainerDimensions
                                        }
                                        captureResolution={captureResolution}
                                        scaleLine={scaleLine}
                                        setScaleLine={setScaleLine}
                                        scaleLineAsPcts={scaleLineAsPcts}
                                        setScaleLinePcts={setScaleLineAsPcts}
                                        midPointsAsPcts={midPointsAsPcts}
                                        setMidPointsAsPcts={setMidPointsAsPcts}
                                        smallestSizeIcon={smallestSizeIcon}
                                        smallestSize={smallestSize}
                                        focalPoint={focalPoint}
                                        setFocalPoint={setFocalPoint}
                                        scaleMode={scaleMode}
                                        autoScaleEnabled={autoScaleEnabled}
                                        scaledSize={scaledSize}
                                        setScaledSize={setScaledSize}
                                        largestSize={largestSize}
                                        setLargestSize={setLargestSize}
                                        largestFilterEnabled={
                                            largestFilterEnabled
                                        }
                                        maxAutoScale={maxAutoScale}
                                        focalPointPosition={focalPointPosition}
                                        setFocalPointPosition={
                                            setFocalPointPosition
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
                        <h2>Edge Configuration</h2>
                        <EdgeConfigurationMenu
                            streamDimensions={streamDimensions}
                            captureResolution={captureResolution}
                            setCaptureResolution={setCaptureResolution}
                            activeMenuItem={activeMenuItem}
                            setActiveMenuItem={setActiveMenuItem}
                            aoeSizesAsPct={aoeSizesAsPct}
                            setAoeSizesAsPct={setAoeSizesAsPct}
                            originalAoeData={originalAoeData}
                            setOriginalAoeData={setOriginalAoeData}
                            socket={socket}
                            source_id={cameraSource?.source_id}
                            getSequence={getSequence}
                            brushSize={brushSize}
                            setBrushSize={setBrushSize}
                            brushType={brushType}
                            setBrushType={setBrushType}
                            maskOpacity={maskOpacity}
                            setMaskOpacity={setMaskOpacity}
                            saveMask={saveMask}
                            resetMask={resetMask}
                            clearMask={clearMask}
                            smallestSize={smallestSize}
                            setSmallestSize={setSmallestSize}
                            smallestRangeSelector={smallestRangeSelector}
                            setSmallestRangeSelector={setSmallestRangeSelector}
                            smallestSizeIcon={smallestSizeIcon}
                            setSmallestSizeIcon={setSmallestSizeIcon}
                            autoScale={autoScaleEnabled}
                            setAutoScale={setAutoScaleEnabled}
                            scaleMode={scaleMode}
                            setScaleMode={setScaleMode}
                            focalPoint={focalPoint}
                            setFocalPoint={setFocalPoint}
                            maxAutoScale={maxAutoScale}
                            setMaxAutoScale={setMaxAutoScale}
                            scaledSize={scaledSize}
                            largestFilterEnabled={largestFilterEnabled}
                            setLargestFilterEnabled={setLargestFilterEnabled}
                            largestSize={largestSize}
                            setLargestSize={setLargestSize}
                            scaleLine={scaleLine}
                            setScaleLine={setScaleLine}
                            scaleLineAsPcts={scaleLineAsPcts}
                            setScaleLinePcts={setScaleLineAsPcts}
                            setMidPointsAsPcts={setMidPointsAsPcts}
                            setFocalPointPosition={setFocalPointPosition}
                            setAutoScaleEnabled={setAutoScaleEnabled}
                            setLoadingText={setLoadingText}
                            originalScaleData={originalScaleData}
                            setOriginalScaleData={setOriginalScaleData}
                        />

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
                                        onClick={() =>
                                            setShowAdvancedSettingsModal(true)
                                        }
                                        disabled={readOnlyUser}
                                    >
                                        <div className="iconButtonInner">
                                            <span>Advanced Settings</span>
                                            <SettingsIcon className="buttonIcon" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                            {activeUser?.id === 1 && (
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
                                            onClick={() =>
                                                setShowEdgeLogsModal(true)
                                            }
                                        >
                                            <div className="iconButtonInner">
                                                <span>Edge Logs</span>
                                                <SettingsIcon className="buttonIcon" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {(data?.camera_properties?.job_type === 'email' ||
                                data?.camera_properties?.job_type ===
                                    'verify' ||
                                data?.camera_properties?.job_type === 'edge' ||
                                data?.camera_properties.license_type) && (
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
                                            onClick={() =>
                                                setShowCameraModal(true)
                                            }
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
            )}
            {showEdgeLogsModal && socket && cameraSource?.source_id && (
                <EdgeLogsModal
                    handleClose={() => setShowEdgeLogsModal(false)}
                    socket={socket}
                    source_id={cameraSource.source_id}
                    getSequence={getSequence}
                />
            )}
            {showAdvancedSettingsModal &&
                data &&
                socket &&
                cameraSource?.source_id &&
                !supportsEnhancedFeatures && (
                    <AdvancedSettingsModal
                        handleClose={() => setShowAdvancedSettingsModal(false)}
                        cameraData={data}
                        personMotionConfidence={personMotionConfidence}
                        setPersonMotionConfidence={setPersonMotionConfidence}
                        vehicleMotionConfidence={vehicleMotionConfidence}
                        setVehicleMotionConfidence={setVehicleMotionConfidence}
                        personConfidenceThreshold={personConfidenceThreshold}
                        setPersonConfidenceThreshold={
                            setPersonConfidenceThreshold
                        }
                        vehicleConfidenceThreshold={vehicleConfidenceThreshold}
                        setVehicleConfidenceThreshold={
                            setVehicleConfidenceThreshold
                        }
                        isPersonAiEnabled={isPersonAiEnabled}
                        setIsPersonAiEnabled={setIsPersonAiEnabled}
                        isVehicleAiEnabled={isVehicleAiEnabled}
                        setIsVehicleAiEnabled={setIsVehicleAiEnabled}
                        edgeLicenseType={edgeLicenseType}
                        setEdgeLicenseType={setEdgeLicenseType}
                        setLoadingText={setLoadingText}
                        refetch={refetch}
                        socket={socket}
                        source_id={cameraSource.source_id}
                        getSequence={getSequence}
                    />
                )}

            {showAdvancedSettingsModal &&
                data &&
                socket &&
                cameraSource?.source_id &&
                supportsEnhancedFeatures && (
                    <EnhancedAdvancedSettingsModal
                        handleClose={() => setShowAdvancedSettingsModal(false)}
                        cameraData={data}
                        personMotionConfidence={personMotionConfidence}
                        setPersonMotionConfidence={setPersonMotionConfidence}
                        vehicleMotionConfidence={vehicleMotionConfidence}
                        setVehicleMotionConfidence={setVehicleMotionConfidence}
                        personConfidenceThreshold={personConfidenceThreshold}
                        setPersonConfidenceThreshold={
                            setPersonConfidenceThreshold
                        }
                        vehicleConfidenceThreshold={vehicleConfidenceThreshold}
                        setVehicleConfidenceThreshold={
                            setVehicleConfidenceThreshold
                        }
                        isPersonAiEnabled={isPersonAiEnabled}
                        setIsPersonAiEnabled={setIsPersonAiEnabled}
                        isVehicleAiEnabled={isVehicleAiEnabled}
                        setIsVehicleAiEnabled={setIsVehicleAiEnabled}
                        personDetectionToggle={personDetectionToggle}
                        setPersonDetectionToggle={setPersonDetectionToggle}
                        vehicleDetectionToggle={vehicleDetectionToggle}
                        setVehicleDetectionToggle={setVehicleDetectionToggle}
                        edgeLicenseType={edgeLicenseType}
                        setEdgeLicenseType={setEdgeLicenseType}
                        preEventSeconds={preEventSeconds}
                        setPreEventSeconds={setPreEventSeconds}
                        postEventSeconds={postEventSeconds}
                        setPostEventSeconds={setPostEventSeconds}
                        setLoadingText={setLoadingText}
                        refetch={refetch}
                        socket={socket}
                        source_id={cameraSource.source_id}
                        getSequence={getSequence}
                    />
                )}

            {showAlertModal && (
                <AlertModal
                    selectedAlert={null}
                    handleClose={() => setShowAlertModal(false)}
                />
            )}
            {showCameraModal && data && !supportsEnhancedFeatures && (
                <EditCameraModal
                    cameraData={data}
                    handleClose={() => setShowCameraModal(false)}
                    refetchCameraData={refetch}
                />
            )}
            {showCameraModal && data && supportsEnhancedFeatures && (
                <EnhancedEditCameraModal
                    cameraData={data}
                    handleClose={() => setShowCameraModal(false)}
                    refetchCameraData={refetch}
                />
            )}

            {loadingText && <LoadingModal modalText={loadingText} />}
        </div>
    );
};

export default Edge;
