/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/anchor-has-content */
// React
import {
    Dispatch,
    FC,
    ReactElement,
    SetStateAction,
    useState,
    useEffect,
    useMemo,
    useContext,
    useRef,
} from 'react';

// Third party
import axios from 'axios';
import { Row } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

// Components
import Toggle from '../Inputs/Toggle';
import NoData from '../NoData';
import VideoAnnotator from './VideoAnnotator';
import triggerAnnotateVideo from '../../api_calls/triggerAnnotateVideo';
import LoadingModal from './LoadingModal';

// Custom
import { getAWSData } from './VideoAnnotator.controller';
import formatApiTimeToLocalTime from '../../utils/formatApiTimeToLocalTime';
import formatApiDateToLocalDate from '../../utils/formatApiDateToLocalDate';
import {
    handleBoundingBoxToggle,
    handleJobTypeUpdate,
} from '../Outlets/Home/Camera/Camera.controller';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Images
import PersonIcon from '../../images/icons/EV_person.svg?react';
import VehicleIcon from '../../images/icons/EV_vehicle.svg?react';
import ChevronIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import FlagIcon from '../../images/icons/flagged.svg?react';

// Types
import { IClip } from '../../types/tng-api.interfaces';
import { ViewedClips } from '../Tables/ClipTable.controller';
import { AccountTypeModifier } from '../../types/enums';

// Styles
import '../../styles/components/Modals/ClipModal.scss';

export const changeVideoIndex = (
    dir: -1 | 1,
    currentIndex: number,
    clipCount: number
): number => {
    const minIndex: number = 0;
    const maxIndex: number = clipCount - 1;
    const resultingIndex: number = currentIndex + dir;

    return resultingIndex <= maxIndex && resultingIndex >= minIndex
        ? resultingIndex
        : currentIndex;
};

interface IProps {
    /** Should be filtered based on Audit Mode. */
    rows: Row<IClip>[];
    setClips: Dispatch<SetStateAction<IClip[]>>;
    selectedRowIndex: number;
    setSelectedRowIndex: Dispatch<SetStateAction<number | undefined>>;
    setSelectedRowId: Dispatch<SetStateAction<string | undefined>>;
    setIsVideoModalOpen: Dispatch<SetStateAction<boolean>>;
    setViewedClips: Dispatch<SetStateAction<ViewedClips>>;
    setIsFlagModalOpen: Dispatch<SetStateAction<boolean>>;
    showBoundingBoxes: boolean;
    setShowBoundingBoxes: Dispatch<SetStateAction<boolean>>;
    showMask: boolean;
    setShowMask: Dispatch<SetStateAction<boolean>>;
    showAILabels: boolean;
    setShowAILabels: Dispatch<SetStateAction<boolean>>;
}

const ClipModal: FC<IProps> = ({
    rows,
    setClips,
    selectedRowIndex,
    setSelectedRowIndex,
    setSelectedRowId,
    setIsVideoModalOpen,
    setViewedClips,
    setIsFlagModalOpen,
    showBoundingBoxes,
    setShowBoundingBoxes,
    showMask,
    setShowMask,
    showAILabels,
    setShowAILabels,
}: IProps): ReactElement => {
    const { activeUser } = useContext(AuthContext);
    const linkRef = useRef<HTMLAnchorElement | null>(null);

    const selectedRow: Row<IClip> = rows[selectedRowIndex];
    const selectedClip: IClip = selectedRow.original;
    const aiErrorEvent: string | null = selectedClip.ai_error_event || null;
    const customer: string = selectedRow.getValue('customer');
    const site: string = selectedRow.getValue('site');
    const camera: string = selectedRow.getValue('camera');
    const date: string = formatApiDateToLocalDate(selectedRow.getValue('date'));
    const time: string = formatApiTimeToLocalTime(selectedRow.getValue('time'));
    const title: string = `${customer} / ${site} / ${camera}`;
    const subtitle: string = `${date} - ${time}`;
    const annotatedVideoPath: string = selectedRow.getValue(
        'annotated-video-path'
    );

    const [loadingText, setLoadingText] = useState('');
    const [hasBoundingBox, setHasBoundingBox] = useState(true);
    const [videoSource, setVideoSource] = useState<string | null | undefined>(
        annotatedVideoPath
    );

    const multiModalBoxQuery = useQuery({
        queryKey: [
            'multi-modal-boxes',
            selectedClip.aws_pres_sign_multimodal_detections,
        ],
        queryFn: () =>
            getAWSData(selectedClip.aws_pres_sign_multimodal_detections),
        retry: 0,
    });

    const messageQuery = useQuery({
        queryKey: ['message', selectedClip.aws_pre_sign_message],
        queryFn: () => getAWSData(selectedClip.aws_pre_sign_message),
    });

    const alarmQuery = useQuery({
        queryKey: ['alarm', selectedClip.aws_pre_sign_alarm],
        queryFn: () => getAWSData(selectedClip.aws_pre_sign_alarm),
    });

    const downloadVideo = async (
        presignedUrl: string,
        fileUUID: string,
        fileName: string
    ) => {
        try {
            const response = await axios.get(presignedUrl, {
                responseType: 'blob', // Ensure we get a Blob response
            });

            const url = URL.createObjectURL(response.data);

            if (linkRef.current) {
                linkRef.current.href = url;
                linkRef.current.download = `${fileUUID}${fileName}`;
                linkRef.current.click();
            }

            URL.revokeObjectURL(url);
        } catch (error) {
            // setLoadingText('');
            console.error('Error downloading video:', error);
        }
    };

    const handleDownloadVideoClick = async () => {
        setLoadingText('Downloading Video...');

        const result = await triggerAnnotateVideo({
            params: {
                api_key: 'hH5DTSIEcieRhZN49gwkrLvDcCyNkB5HSQwpxA2wqzdjktQL',
                annotated_video_url: selectedClip.aws_pre_sign_annotated,
            },
        });

        if (result.exists) {
            await downloadVideo(
                selectedClip.aws_pre_sign_annotated,
                result.file_uuid,
                result.file_name
            );
        }

        if (result.exists === false) {
            await new Promise((resolve) => {
                setTimeout(resolve, 6000);
            });
            await downloadVideo(
                selectedClip.aws_pre_sign_annotated,
                result.file_uuid,
                result.file_name
            );
        }

        setLoadingText('');
    };

    useEffect(() => {
        setVideoSource(annotatedVideoPath);
        // Reset bounding box whenever video source changes.
        setHasBoundingBox(true);
    }, [annotatedVideoPath]);

    useEffect(() => {
        if (selectedClip) {
            handleBoundingBoxToggle(
                hasBoundingBox,
                selectedClip,
                setVideoSource
            );
        }
    }, [hasBoundingBox]);

    useEffect(() => {
        if (selectedRow) {
            setSelectedRowId(selectedRow.id);
            setViewedClips((previousState: ViewedClips) => {
                const newViewedClips = {
                    ...previousState,
                    [selectedRow.original.clip_id]: Date.now(),
                };
                localStorage.setItem(
                    'viewedClips',
                    JSON.stringify(newViewedClips)
                );
                return newViewedClips;
            });
        }
    }, [selectedRow.id]);

    const formattedJobType = useMemo(() => {
        const data = selectedClip.job_type;
        return handleJobTypeUpdate(data);
    }, [selectedClip]);

    if (!selectedClip) {
        return <div />;
    }

    return (
        <motion.div
            key="backdrop"
            className="clipModalBackdrop"
            onClick={() => setIsVideoModalOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 1 }}
        >
            <motion.div
                key="modal"
                className="clipModalBase"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.2 } }}
                transition={{ duration: 1 }}
            >
                <header>
                    <h2>{title}</h2>
                    <button
                        type="button"
                        id="x-button"
                        onClick={() => setIsVideoModalOpen(false)}
                    >
                        X
                    </button>
                </header>
                <div className="ClipModal">
                    <h3 className="subtitle">{subtitle}</h3>
                    {videoSource && activeUser && (
                        <VideoAnnotator
                            selectedClip={selectedClip}
                            setClips={setClips}
                            showMask={showMask}
                            showBoundingBoxes={showBoundingBoxes}
                            showAILabels={showAILabels}
                            multiModalBoxQuery={multiModalBoxQuery}
                            messageQuery={messageQuery}
                            alarmQuery={alarmQuery}
                            activeUser={activeUser}
                            loadingText={loadingText}
                        />
                    )}
                    {/* {videoSource && (
                        <video
                            key={videoSource}
                            width="100%"
                            controls
                            autoPlay
                            muted
                            playsInline
                        >
                            <source src={videoSource} type="video/mp4" />
                        </video>
                    )} */}
                    {videoSource === undefined && (
                        <NoData
                            id="video-not-found"
                            noDataText="Clip not found"
                            subText="No alerts have been processed for this camera."
                        />
                    )}
                    <ul className="addendum">
                        {selectedRowIndex !== 0 ? (
                            <>
                                <li
                                    className="arrow-container"
                                    role="presentation"
                                    onClick={() => {
                                        const newIndex = changeVideoIndex(
                                            -1,
                                            selectedRowIndex,
                                            rows.length
                                        );

                                        setSelectedRowIndex(newIndex);
                                    }}
                                >
                                    <ChevronIcon className="previous icon" />
                                </li>
                                <div className="divider" />
                            </>
                        ) : (
                            <li className="arrow-container" />
                        )}
                        <li className="job-type-container">
                            <p className="job-type">{formattedJobType}</p>
                        </li>
                        <div className="divider" />
                        <li className="classification-container">
                            <PersonIcon
                                className={`person icon ${
                                    selectedClip.results.alarm_info.person
                                        ? 'active'
                                        : ''
                                }`}
                            />

                            <VehicleIcon
                                className={`vehicle icon ${
                                    selectedClip.results.alarm_info.vehicle
                                        ? 'active'
                                        : ''
                                }`}
                            />
                        </li>
                        <div className="divider small" />
                        <li
                            data-tooltip={aiErrorEvent || 'Report AI error'}
                            className="flag-container tooltip top"
                        >
                            <button
                                id="report-classification-error-button"
                                type="button"
                                onClick={() => setIsFlagModalOpen(true)}
                                disabled={activeUser?.modifier?.includes(
                                    AccountTypeModifier.ReadOnly
                                )}
                            >
                                <FlagIcon
                                    className={`flag icon ${
                                        aiErrorEvent ? 'reported' : ''
                                    }`}
                                />
                            </button>
                        </li>
                        <div className="divider" />
                        <div className="annotations-container">
                            <li className="annotation-toggle-container">
                                <p id="bounding-box">Bounding Box</p>
                                <Toggle
                                    id="bounding-box-toggle"
                                    value={showBoundingBoxes}
                                    onToggleChange={() =>
                                        setShowBoundingBoxes(!showBoundingBoxes)
                                    }
                                    toggleOnText="ON"
                                    toggleOffText="OFF"
                                />
                            </li>
                            <li className="annotation-toggle-container">
                                <p id="show-mask">Mask</p>
                                <Toggle
                                    id="show-max-toggle-toggle"
                                    value={showMask}
                                    onToggleChange={() =>
                                        setShowMask(!showMask)
                                    }
                                    toggleOnText="ON"
                                    toggleOffText="OFF"
                                />
                            </li>
                            {multiModalBoxQuery.data && (
                                <li className="annotation-toggle-container">
                                    <p id="show-ai-labels">AI Labels</p>
                                    <Toggle
                                        id="show-ai-labels-toggle"
                                        value={showAILabels}
                                        onToggleChange={() =>
                                            setShowAILabels(!showAILabels)
                                        }
                                        toggleOnText="ON"
                                        toggleOffText="OFF"
                                    />
                                </li>
                            )}
                        </div>

                        <div className="divider" />
                        <li className="watch-live-container">
                            <button
                                id="watch-live-button"
                                type="button"
                                onClick={handleDownloadVideoClick}
                            >
                                Download Clip
                            </button>
                            <a ref={linkRef} style={{ display: 'none' }} />
                        </li>
                        {/* <li className="watch-live-container">
                            <button id="watch-live-button" type="button">
                                Watch Live
                            </button>
                        </li> */}
                        {selectedRowIndex + 1 !== rows.length ? (
                            <>
                                <div className="divider" />
                                <li
                                    className="arrow-container"
                                    role="presentation"
                                    onClick={() => {
                                        const newIndex = changeVideoIndex(
                                            1,
                                            selectedRowIndex,
                                            rows.length
                                        );

                                        setSelectedRowIndex(newIndex);
                                    }}
                                >
                                    <ChevronIcon className="next icon" />
                                </li>
                            </>
                        ) : (
                            <li className="arrow-container" />
                        )}
                    </ul>

                    {loadingText && <LoadingModal modalText={loadingText} />}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ClipModal;
