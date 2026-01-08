/* eslint-disable react/no-array-index-key */
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
import { Table } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FaCircleInfo } from 'react-icons/fa6';

// Components
import Toggle from '../Inputs/Toggle';
import NoData from '../NoData';
import NewVideoAnnotator from './NewVideoAnnotator';
import triggerAnnotateVideo from '../../api_calls/triggerAnnotateVideo';
import LoadingModal from './LoadingModal';
import AIInfoModal from './AIInfoModal';

// Custom
import getForensicSearchModalData from '../../api_calls/getForensicSearchModalData';
import { getAWSData } from './VideoAnnotator.controller';
import { handleJobTypeUpdate } from '../Outlets/Home/Camera/Camera.controller';
import getAccountType from '../../utils/getAccountType';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Images
import PersonIcon from '../../images/icons/EV_person.svg?react';
import VehicleIcon from '../../images/icons/EV_vehicle.svg?react';
import ChevronIcon from '../../images/icons/EV_dropdown-arrow.5.12.22.svg?react';
import FlagIcon from '../../images/icons/flagged.svg?react';
import DeviceIOIcon from '../../images/icons/deviceIO.svg?react';

// Types
import { INewForensicClip } from '../../types/tng-api.interfaces';
import { ViewedClips } from '../Tables/ClipTable.controller';
import { AccountType, AccountTypeModifier } from '../../types/enums';

// Styles
import '../../styles/components/Modals/ClipModal.scss';
import { IUser } from '../../types/interfaces';

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

const renderDateTime = (value: string) => {
    const utcDate = parseISO(`${value}Z`);
    const formattedDate = format(utcDate, 'MM/dd/yyyy h:mm:ss a');
    return formattedDate;
};

interface IProps {
    /** Should be filtered based on Audit Mode. */
    table: Table<INewForensicClip>;
    selectedRowIndex: number;
    setSelectedRowIndex: Dispatch<SetStateAction<number | undefined>>;
    setSelectedRowId: Dispatch<SetStateAction<number | undefined>>;
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

const ForensicSearchClipModal: FC<IProps> = ({
    table,
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

    const accountType = useMemo(() => getAccountType(activeUser), [activeUser]);

    const [loadingText, setLoadingText] = useState('');
    const [showAIInfoModal, setShowAIInfoModal] = useState(false);

    const selectedRow = useMemo(() => {
        const { rows } = table.getRowModel();
        const selectedRowCopy = rows[selectedRowIndex];
        return selectedRowCopy;
    }, [table, selectedRowIndex]);

    const classifications = useMemo(() => {
        const result = selectedRow.getValue('classifications');

        if (result) {
            return result as string[];
        }

        return [];
    }, [selectedRow]);

    const forensicSearchClipModalQuery = useQuery({
        queryFn: () =>
            getForensicSearchModalData({
                user: activeUser as IUser,
                file_id: selectedRow.original.file_id,
            }),
        queryKey: ['forensicSearchClipModalData', selectedRow.original.file_id],
        enabled: !!selectedRow,
    });

    const messageQuery = useQuery({
        queryKey: [
            'message',
            forensicSearchClipModalQuery.data?.aws_pre_sign_message_url,
        ],
        queryFn: () =>
            getAWSData(
                forensicSearchClipModalQuery.data
                    ?.aws_pre_sign_message_url as string
            ),
        enabled: !!forensicSearchClipModalQuery.data,
    });

    const alarmQuery = useQuery({
        queryKey: [
            'alarm',
            forensicSearchClipModalQuery.data?.aws_pre_sign_alarm_url,
        ],
        queryFn: () =>
            getAWSData(
                forensicSearchClipModalQuery.data
                    ?.aws_pre_sign_alarm_url as string
            ),
        enabled:
            !!forensicSearchClipModalQuery.data &&
            forensicSearchClipModalQuery?.data?.job_type !== 'verify',
    });

    const multiModalBoxQuery = useQuery({
        queryKey: [
            'multi-modal-boxes',
            forensicSearchClipModalQuery.data
                ?.aws_pres_sign_multimodal_detections_url,
        ],
        queryFn: () =>
            getAWSData(
                forensicSearchClipModalQuery.data
                    ?.aws_pres_sign_multimodal_detections_url as string
            ),
        retry: 0,
        enabled: !!forensicSearchClipModalQuery.data,
    });

    const goToPreviousClip = () => {
        setSelectedRowIndex(selectedRowIndex - 1);
    };

    const goToNextClip = () => {
        setSelectedRowIndex(selectedRowIndex + 1);
    };

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
        if (!forensicSearchClipModalQuery.data) {
            toast.error('Unable to get clip link.');
            return;
        }

        setLoadingText('Downloading Video...');

        const result = await triggerAnnotateVideo({
            params: {
                api_key: 'hH5DTSIEcieRhZN49gwkrLvDcCyNkB5HSQwpxA2wqzdjktQL',
                annotated_video_url:
                    forensicSearchClipModalQuery.data
                        ?.aws_pre_sign_annotated_url,
            },
        });

        if (result.exists) {
            await downloadVideo(
                forensicSearchClipModalQuery.data?.aws_pre_sign_annotated_url,
                result.file_uuid,
                result.file_name
            );
        }

        if (result.exists === false) {
            await new Promise((resolve) => {
                setTimeout(resolve, 6000);
            });
            await downloadVideo(
                forensicSearchClipModalQuery.data?.aws_pre_sign_annotated_url,
                result.file_uuid,
                result.file_name
            );
        }

        setLoadingText('');
    };

    useEffect(() => {
        if (selectedRow) {
            setSelectedRowId(selectedRow.original.file_id);
            setViewedClips((previousState) => {
                const newViewedClips = {
                    ...previousState,
                    [selectedRow.original.file_id]: Date.now(),
                };
                localStorage.setItem(
                    'viewedClips',
                    JSON.stringify(newViewedClips)
                );
                return newViewedClips;
            });
        }
    }, [selectedRow?.original.file_id]);

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
                <header style={{ position: 'relative' }}>
                    {accountType === AccountType.Evolon && (
                        <div
                            style={{
                                position: 'absolute',
                                top: -20,
                                left: 8,
                            }}
                        >
                            <FaCircleInfo
                                className="control-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAIInfoModal(true);
                                }}
                                data-tooltip-id="ai-info-tooltip"
                                size={26}
                            />
                        </div>
                    )}

                    <h2>
                        {selectedRow.getValue('customer')}
                        {' / '}
                        {selectedRow.getValue('site')}
                        {' / '} {selectedRow.getValue('camera')}
                    </h2>
                    <button
                        type="button"
                        id="x-button"
                        onClick={() => setIsVideoModalOpen(false)}
                    >
                        X
                    </button>
                </header>
                <div className="ClipModal">
                    <h3 className="subtitle">
                        {renderDateTime(selectedRow.getValue('event_dt'))}
                    </h3>
                    {forensicSearchClipModalQuery.isLoading && (
                        <div
                            style={{
                                aspectRatio: '1920 / 1080',
                                background: '#1A1A1A',
                                width: '100%',
                                maxWidth: '1920px',
                                margin: '0 auto',
                            }}
                        />
                    )}

                    {forensicSearchClipModalQuery.data &&
                        forensicSearchClipModalQuery.data.job_type !==
                            'verify' && (
                            <NewVideoAnnotator
                                aws_pre_sign_origin_url={
                                    forensicSearchClipModalQuery.data
                                        .aws_pre_sign_origin_url
                                }
                                aws_pre_sign_cleaned_detections_url={
                                    forensicSearchClipModalQuery.data
                                        .aws_pre_sign_cleaned_detections_url
                                }
                                showMask={showMask}
                                showBoundingBoxes={showBoundingBoxes}
                                showAILabels={showAILabels}
                                multiModalBoxQuery={multiModalBoxQuery}
                                messageQuery={messageQuery}
                                alarmQuery={alarmQuery}
                                loadingText={loadingText}
                            />
                        )}
                    {forensicSearchClipModalQuery.data &&
                        forensicSearchClipModalQuery.data.job_type ===
                            'verify' && (
                            <video
                                width="100%"
                                controls
                                autoPlay
                                muted
                                playsInline
                            >
                                <source
                                    src={
                                        forensicSearchClipModalQuery.data
                                            ?.aws_pre_sign_annotated_url
                                    }
                                    type="video/mp4"
                                />
                            </video>
                        )}
                    {!forensicSearchClipModalQuery.data === undefined && (
                        <NoData
                            id="video-not-found"
                            noDataText="Clip not found"
                            subText="No alerts have been processed for this camera."
                        />
                    )}
                    <ul className="addendum">
                        {selectedRowIndex === 0 ? (
                            <li className="arrow-container" />
                        ) : (
                            <>
                                <li
                                    className="arrow-container"
                                    role="presentation"
                                    onClick={() => goToPreviousClip()}
                                >
                                    <ChevronIcon className="previous icon" />
                                </li>
                                <div className="divider" />
                            </>
                        )}
                        <li className="job-type-container">
                            <p className="job-type">
                                {handleJobTypeUpdate(
                                    forensicSearchClipModalQuery.data?.job_type
                                )}
                            </p>
                        </li>
                        <div className="divider" />
                        <li className="classification-container">
                            {classifications.includes('Device') && (
                                <DeviceIOIcon className="device icon" />
                            )}

                            {!classifications.includes('Device') && (
                                <>
                                    <PersonIcon
                                        className={`person icon ${
                                            classifications.includes('Person')
                                                ? 'active'
                                                : ''
                                        }`}
                                    />

                                    <VehicleIcon
                                        className={`vehicle icon ${
                                            classifications.includes('Vehicle')
                                                ? 'active'
                                                : ''
                                        }`}
                                    />
                                </>
                            )}
                        </li>
                        <div className="divider small" />
                        <li
                            data-tooltip="Report AI error"
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
                                        selectedRow.original
                                            .ai_classification_error_id !== 0
                                            ? 'reported'
                                            : ''
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
                                    disabled={
                                        forensicSearchClipModalQuery.data
                                            ?.job_type === 'verify'
                                    }
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
                                    disabled={
                                        forensicSearchClipModalQuery.data
                                            ?.job_type === 'verify'
                                    }
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
                                        disabled={
                                            forensicSearchClipModalQuery.data
                                                ?.job_type === 'verify'
                                        }
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
                        {selectedRowIndex ===
                        table.getRowModel().rows.length - 1 ? (
                            <li className="arrow-container" />
                        ) : (
                            <>
                                <div className="divider" />
                                <li
                                    className="arrow-container"
                                    role="presentation"
                                    onClick={() => goToNextClip()}
                                >
                                    <ChevronIcon className="next icon" />
                                </li>
                            </>
                        )}
                    </ul>

                    {loadingText && <LoadingModal modalText={loadingText} />}
                    {forensicSearchClipModalQuery.data && showAIInfoModal && (
                        <AIInfoModal
                            handleClose={() => setShowAIInfoModal(false)}
                            clipPayload={
                                forensicSearchClipModalQuery.data
                                    ?.ai_classification_payload
                            }
                            messageData={messageQuery.data}
                            standardVideoAWSUrl={
                                forensicSearchClipModalQuery.data
                                    .aws_pre_sign_origin_url
                            }
                            unformattedVideoAWSUrl={
                                forensicSearchClipModalQuery.data
                                    .aws_pre_sign_origin_unformatted_url
                            }
                            messageDataURL={
                                forensicSearchClipModalQuery.data
                                    .aws_pre_sign_message_url
                            }
                        />
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ForensicSearchClipModal;
