// React
import React, { FC, useContext, useState, useRef } from 'react';

// Third Party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Api Calls
import uploadProfilePicture from '../../../api_calls/uploadProfilePicture';

// Components
import ModalBase from '../../ModalBase';
import LoadingModal from '../LoadingModal';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';

// Controller
import { readAndFormatImage } from './ProfileThumbnailModal.controller';

// Styles
import '../../../styles/components/Modals/ProfileThumbnailModal.scss';

interface IProps {
    handleClose: () => void;
}

const ProfileThumbnailModal: FC<IProps> = ({ handleClose }) => {
    const { activeUser, setActiveUser } = useContext(AuthContext);

    // File Upload
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [imgBase64Str, setImgBase64Str] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const profilePictureMutation = useMutation({
        mutationFn: uploadProfilePicture,
    });

    const handleUploadFileBtn = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    };

    const uploadPhotoClick = async () => {
        if (!activeUser) {
            return;
        }

        if (!imgBase64Str) {
            toast.error('Must upload a picture.');
            return;
        }

        setIsLoading(true);

        try {
            const { thumbnail } = await profilePictureMutation.mutateAsync({
                user: activeUser,
                profilePictureData: imgBase64Str,
            });

            const newProperties = activeUser.properties
                ? { ...activeUser.properties, thumbnail }
                : { thumbnail };

            const newUserData = { ...activeUser, properties: newProperties };
            setActiveUser(newUserData);
            sessionStorage.setItem('user', JSON.stringify(newUserData));
            toast.success('Profile logo updated!');
            setIsLoading(false);
            handleClose();
        } catch (err) {
            toast.error('Unable to upload logo.');
            setIsLoading(false);
        }
    };

    return (
        <ModalBase
            title="Edit Thumbnail"
            handleClose={handleClose}
            className="sm"
        >
            <div className="profileThumbnailModal">
                <div className="thumbnail-container">
                    {!imgBase64Str && activeUser?.properties?.thumbnail && (
                        <img src={activeUser.properties.thumbnail} alt="" />
                    )}
                    {imgBase64Str && <img src={imgBase64Str} alt="" />}
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div className="selectFileBtn">
                        <button
                            type="button"
                            className="btn primary outline"
                            onClick={handleUploadFileBtn}
                            style={{ marginBottom: 15 }}
                        >
                            Upload New Logo
                        </button>

                        <input
                            id="axisKeyFileInput"
                            type="file"
                            ref={hiddenFileInput}
                            onChange={(e) =>
                                readAndFormatImage(
                                    e,
                                    canvasRef,
                                    setImgBase64Str,
                                    setUploadedFile
                                )
                            }
                            style={{ display: 'none' }}
                        />
                    </div>
                    {uploadedFile && (
                        <div style={{ marginBottom: '2rem' }}>
                            Selected File: {uploadedFile.name}{' '}
                        </div>
                    )}
                    <hr className="separator" />
                    <div className="action-btns-container">
                        <button
                            type="button"
                            className="btn primary"
                            onClick={uploadPhotoClick}
                        >
                            Update Logo
                        </button>
                        <button
                            className="btn danger"
                            type="button"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>

                    <div style={{ display: 'none' }}>
                        <canvas ref={canvasRef} />
                    </div>
                    {isLoading && (
                        <LoadingModal modalText="Updating thumbnail..." />
                    )}
                </div>
            </div>
        </ModalBase>
    );
};

export default ProfileThumbnailModal;
