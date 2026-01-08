/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/no-array-index-key */
// React
import { FC, useEffect, useMemo, useState } from 'react';

// Third party
import { toast } from 'react-toastify';
import axios, { isAxiosError } from 'axios';

// Components
import ModalBase from '../../ModalBase';

// Utils
import { extractAISettingsValues } from '../../Tables/PaginatedClipsTableTooltip';

// Types
import { IClipPayload } from '../../../types/tng-api.interfaces';

// Styles
import '../../../styles/components/Modals/AIInfoModal.scss';

interface IProps {
    handleClose: () => void;
    clipPayload: IClipPayload | {};
    messageData: any;
    standardVideoAWSUrl: string;
    unformattedVideoAWSUrl: string;
    messageDataURL: string;
}

const AIInfoModal: FC<IProps> = ({
    handleClose,
    clipPayload,
    messageData,
    standardVideoAWSUrl,
    unformattedVideoAWSUrl,
    messageDataURL,
}) => {
    const [targetVideoURL, setTargetVideoURL] = useState('');

    const formattedAISettings = useMemo(() => {
        const result: { label: string; value: string }[] = [];

        if (messageData) {
            result.push({ label: 'camera_id', value: messageData.camera_id });
            result.push({ label: 'video_path', value: messageData.video_path });
        }

        if (clipPayload !== undefined && 'is_armed' in clipPayload) {
            return [...result, ...extractAISettingsValues(clipPayload)];
        }

        return null;
    }, [clipPayload, messageData]);

    const copyAISettingsToClipboard = () => {
        if (clipPayload !== undefined && 'is_armed' in clipPayload) {
            const formattedObject: Record<string, String> = {};
            const aiSettingsData = extractAISettingsValues(clipPayload);

            aiSettingsData.forEach(({ label, value }) => {
                formattedObject[label] = value;
            });

            const settingsString = JSON.stringify(formattedObject, null, 2);

            navigator.clipboard.writeText(settingsString);
            toast.success('AI Settings copied!');
        }
    };

    const copyMaskToClipboard = () => {
        if (messageData?.mask) {
            navigator.clipboard.writeText(messageData.mask);
            toast.success('Mask copied!');
        } else {
            toast.warn('No mask avaiable to copy');
        }
    };

    useEffect(() => {
        const checkForUnformattedVideoURL = async () => {
            try {
                const response = await axios.get(unformattedVideoAWSUrl, {
                    responseType: 'blob', // Ensure we get a Blob response
                });

                console.log(response.data);

                setTargetVideoURL(unformattedVideoAWSUrl);
            } catch (error) {
                // setLoadingText('');
                if (isAxiosError(error)) {
                    if (error.status === 404) {
                        setTargetVideoURL(standardVideoAWSUrl);
                    }
                } else {
                    console.error('Error downloading video:', error);
                    setTargetVideoURL(unformattedVideoAWSUrl);
                }
            }
        };

        checkForUnformattedVideoURL();
    }, [standardVideoAWSUrl, unformattedVideoAWSUrl]);

    return (
        <ModalBase title="Clip AI Metadata" handleClose={handleClose}>
            <div className="about-modal">
                <div
                    style={{
                        margin: 'auto',
                    }}
                >
                    <div style={{ marginBottom: '2rem' }}>
                        {formattedAISettings &&
                            formattedAISettings.map((item, index) => {
                                return (
                                    <p
                                        key={`paylod-${index}`}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns:
                                                'minmax(0, 1fr) minmax(0, 1fr)',
                                            gap: '10px',
                                            marginTop: 0,
                                            marginBottom: '0.5rem',
                                        }}
                                    >
                                        <span style={{ textAlign: 'right' }}>
                                            {item.label}:
                                        </span>
                                        <span>{item.value.toString()}</span>
                                    </p>
                                );
                            })}
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <button
                        className="btn primary"
                        type="button"
                        onClick={copyAISettingsToClipboard}
                    >
                        Copy AI Settings
                    </button>
                    <button
                        className="btn primary"
                        type="button"
                        onClick={copyMaskToClipboard}
                    >
                        Copy Mask
                    </button>
                    <div>
                        {targetVideoURL && (
                            <a
                                className="btn primary"
                                href={targetVideoURL}
                                download
                            >
                                Download Original Video
                            </a>
                        )}
                    </div>
                    <a
                        href={messageDataURL}
                        download="messageData.json"
                        className="btn primary"
                    >
                        Message Data
                    </a>
                </div>
            </div>
        </ModalBase>
    );
};

export default AIInfoModal;
