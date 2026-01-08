/* eslint-disable no-restricted-syntax */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
// React
import {
    FC,
    SetStateAction,
    useEffect,
    useRef,
    useState,
    Dispatch,
    useMemo,
} from 'react';

// Third Party
import { useQuery, UseQueryResult } from '@tanstack/react-query';

// Api Calls
import reformatVideo, { IReformatProps } from '../../api_calls/reformatVideo';
import triggerAnnotateVideo from '../../api_calls/triggerAnnotateVideo';

// Controller
import {
    setBoxesFromDetections,
    getAWSData,
    clearCanvas,
} from './VideoAnnotator.controller';
import { maskColorChannels } from '../Canvases/MaskCanvas/DrawingLayer';

// Types
import { IClip } from '../../types/tng-api.interfaces';
import { IUser } from '../../types/interfaces';

interface IProps {
    selectedClip: IClip;
    setClips: Dispatch<SetStateAction<IClip[]>>;
    showMask: boolean;
    showBoundingBoxes: boolean;
    showAILabels: boolean;
    multiModalBoxQuery: UseQueryResult<any, unknown>;
    messageQuery: UseQueryResult<any, unknown>;
    alarmQuery: UseQueryResult<any, unknown>;
    activeUser: IUser;
    loadingText: string;
}

const VideoAnnotator: FC<IProps> = ({
    selectedClip,
    setClips,
    showMask,
    showBoundingBoxes,
    showAILabels,
    multiModalBoxQuery,
    messageQuery,
    alarmQuery,
    activeUser,
    loadingText,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const [currentTime, setCurrentTime] = useState(0);

    const validVideo = useMemo(() => {
        if (alarmQuery.data) {
            const numberOfFrames =
                alarmQuery.data?.video_metadata?.video_number_of_frames;
            return numberOfFrames > 0;
        }

        return false;
    }, [alarmQuery.data]);

    const boundingBoxQuery = useQuery({
        queryKey: ['bounding-box', selectedClip.aws_pre_sign_detection_boxes],
        queryFn: () => getAWSData(selectedClip.aws_pre_sign_detection_boxes),
    });

    useEffect(() => {
        const video = videoRef.current;
        let animationFrameId: number;
        let lastTime = 0;

        const checkFrame = () => {
            if (video && !video.paused && !video.ended) {
                const newTime = video.currentTime;

                // If the time has updated, a new frame is played
                if (newTime !== lastTime) {
                    setCurrentTime(newTime);
                    lastTime = newTime;
                }

                animationFrameId = requestAnimationFrame(checkFrame);
            }
        };

        const startTracking = () => {
            if (video && !video.paused) {
                animationFrameId = requestAnimationFrame(checkFrame);
            }
        };

        const stopTracking = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };

        const handleSeeking = () => {
            if (video) {
                const newTime = video.currentTime;

                // If the time has updated, a new frame is played
                if (newTime !== lastTime) {
                    setCurrentTime(newTime);
                    lastTime = newTime;
                }
            }
        };

        if (video) {
            video.addEventListener('play', startTracking);
            video.addEventListener('pause', stopTracking);
            video.addEventListener('ended', stopTracking);
            video.addEventListener('seeking', handleSeeking);
        }

        return () => {
            if (video) {
                video.removeEventListener('play', startTracking);
                video.removeEventListener('pause', stopTracking);
                video.removeEventListener('ended', stopTracking);
                video.removeEventListener('seeking', handleSeeking);
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, [selectedClip, validVideo]);

    useEffect(() => {
        console.log(alarmQuery.data);
    }, [alarmQuery.data]);

    useEffect(() => {
        if (alarmQuery.data && validVideo) {
            const { video_fps, video_number_of_frames } =
                alarmQuery.data.video_metadata;
            const { time_index } = alarmQuery.data;

            // const currentVideoDuration = Number.isFinite(videoDuration)
            //     ? videoDuration
            //     : frames_processed / video_fps;
            const currentVideoDuration = video_number_of_frames / video_fps;

            const frameDuration = currentVideoDuration / video_number_of_frames;
            // const frameDuration = currentVideoDuration / frames_processed;
            const frameNumber = Math.round(currentTime / frameDuration);

            const multiModalDetections = multiModalBoxQuery.data;
            const detectionBoxes = boundingBoxQuery.data;
            const maskData = messageQuery.data;

            const mask = maskData?.mask as string;
            const maskCanvas = maskCanvasRef.current;

            if (maskCanvas && showMask) {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = `data:image/png;base64,${mask}`;

                img.onload = () => {
                    const ctx = maskCanvas.getContext('2d');
                    if (!ctx) return;

                    // Set canvas size to image size
                    maskCanvas.width = img.width;
                    maskCanvas.height = img.height;

                    // Draw the image off-screen
                    ctx.drawImage(img, 0, 0);

                    // Extract pixel data (RGBA)
                    const imageData = ctx.getImageData(
                        0,
                        0,
                        img.width,
                        img.height
                    );
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
                            newPixels[i * 4 + 3] = 60;
                        }
                    }

                    ctx?.clearRect(0, 0, img.width, img.height);
                    ctx.putImageData(
                        new ImageData(newPixels, img.width, img.height),
                        0,
                        0
                    );
                };
            } else if (maskCanvas && !showMask) {
                clearCanvas(maskCanvasRef.current);
            }

            /** There was a case where broken videos had a single time_index value so we need to check for that */
            if (
                time_index &&
                canvasRef.current &&
                Object.entries(time_index).length > 1
            ) {
                const entries = Object.entries(time_index);
                for (const [key, value] of entries) {
                    const timeVals = value as Array<string>;
                    const startSeconds = parseFloat(timeVals[0] as string);
                    const endSeconds = parseFloat(timeVals[1] as string);

                    if (
                        currentTime >= startSeconds &&
                        currentTime < endSeconds
                    ) {
                        if (multiModalDetections) {
                            const frameDetections = multiModalDetections[key];
                            if (frameDetections) {
                                setBoxesFromDetections(
                                    canvasRef,
                                    frameDetections,
                                    showAILabels,
                                    showBoundingBoxes
                                );
                            } else {
                                clearCanvas(canvasRef.current);
                            }
                        } else if (detectionBoxes) {
                            const frameDetections = detectionBoxes[key];
                            if (frameDetections) {
                                setBoxesFromDetections(
                                    canvasRef,
                                    frameDetections,
                                    showAILabels,
                                    showBoundingBoxes
                                );
                            } else {
                                clearCanvas(canvasRef.current);
                            }
                        }
                        break;
                    } else {
                        clearCanvas(canvasRef.current);
                    }
                }

                return;
            }

            if (
                multiModalDetections &&
                showBoundingBoxes &&
                canvasRef.current
            ) {
                const frameDetections =
                    multiModalDetections[frameNumber.toString()];
                if (frameDetections) {
                    setBoxesFromDetections(
                        canvasRef,
                        frameDetections,
                        showAILabels,
                        showBoundingBoxes
                    );
                } else {
                    clearCanvas(canvasRef.current);
                }
            } else if (
                detectionBoxes &&
                showBoundingBoxes &&
                canvasRef.current
            ) {
                const frameDetections = detectionBoxes[frameNumber.toString()];
                if (frameDetections) {
                    setBoxesFromDetections(
                        canvasRef,
                        frameDetections,
                        showAILabels,
                        showBoundingBoxes
                    );
                } else {
                    clearCanvas(canvasRef.current);
                }
            } else if (canvasRef.current) {
                clearCanvas(canvasRef.current);
            }
        }
    }, [
        alarmQuery.data,
        multiModalBoxQuery.data,
        messageQuery.data,
        boundingBoxQuery.data,
        currentTime,
        showMask,
        showBoundingBoxes,
        showAILabels,
        validVideo,
        canvasRef.current,
        maskCanvasRef.current,
        loadingText,
    ]);

    useEffect(() => {
        const reformatVideoRequest = async (
            user: IUser,
            params: IReformatProps
        ) => {
            try {
                const result = await reformatVideo({ user, params });
                setClips((currentClips) => {
                    const clipsCopy = [...currentClips];
                    const targetIndex = clipsCopy.findIndex(
                        (clip) =>
                            clip.aws_pre_sign_origin ===
                            selectedClip.aws_pre_sign_origin
                    );

                    if (targetIndex >= 0) {
                        clipsCopy[targetIndex].aws_pre_sign_origin =
                            result.aws_presigned_video;
                        clipsCopy[targetIndex].aws_pre_sign_alarm =
                            result.aws_presigned_alarm;
                    }

                    return clipsCopy;
                });

                // alarmQuery.refetch();
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (alarmQuery.data) {
            const frameCount =
                alarmQuery.data?.video_metadata?.video_number_of_frames;

            if (frameCount < 0) {
                const clipUri = new URL(selectedClip.aws_pre_sign_origin);
                const pathParts = clipUri.pathname.split('/').reverse();
                reformatVideoRequest(activeUser, {
                    file_uuid: pathParts[1],
                    file_name: pathParts[0],
                    // todo: get this key from portal api
                    api_key: 'hH5DTSIEcieRhZN49gwkrLvDcCyNkB5HSQwpxA2wqzdjktQL',
                });
            }
        }
    }, [alarmQuery.data]);

    return (
        <div style={{ position: 'relative' }}>
            {validVideo && (
                <video
                    key={selectedClip.aws_pre_sign_origin}
                    width="100%"
                    controls
                    autoPlay
                    muted
                    playsInline
                    ref={videoRef}
                >
                    <source
                        src={selectedClip.aws_pre_sign_origin}
                        type="video/mp4"
                    />
                </video>
            )}

            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    textAlign: 'center',
                    pointerEvents: 'none',
                }}
            >
                <canvas
                    ref={canvasRef}
                    id="canvas"
                    height={videoRef?.current?.videoHeight || 450}
                    width={videoRef?.current?.videoWidth || 800}
                    style={{
                        height: 'calc(100% - 4px)',
                        width: 'auto',
                        margin: 'auto',
                        pointerEvents: 'none',
                    }}
                />
            </div>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    textAlign: 'center',
                    pointerEvents: 'none',
                }}
            >
                <canvas
                    ref={maskCanvasRef}
                    id="canvas"
                    height={videoRef?.current?.videoHeight || 450}
                    width={videoRef?.current?.videoWidth || 800}
                    style={{
                        height: 'calc(100% - 4px)',
                        width: 'auto',
                        margin: 'auto',
                        pointerEvents: 'none',
                    }}
                />
            </div>
        </div>
    );
};

export default VideoAnnotator;
