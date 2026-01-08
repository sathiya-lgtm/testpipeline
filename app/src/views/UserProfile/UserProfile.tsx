// react
import React, { useContext, useRef, useState } from 'react';

// third party
import { useMutation } from '@tanstack/react-query';

// Custom
import extractErrorMessage from '../../utils/extractErrorMessage';

// api calls
import uploadProfilePicture from '../../api_calls/uploadProfilePicture';

// context
import { AuthContext } from '../../contexts/AuthProvider';

// styles
import '../../styles/views/UserProfile.scss';

const UserProfile = () => {
    const { activeUser } = useContext(AuthContext);

    // File Upload
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [imgBase64Str, setImgBase64Str] = useState('');

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

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target && e.target.files && e.target.files.length > 0) {
            const fileUploaded = e.target.files[0];
            const fileReader = new FileReader();

            fileReader.onload = function (event) {
                const canvas = canvasRef.current;
                if (canvas) {
                    const context = canvas.getContext('2d');

                    if (!context) return;

                    const image = new Image();

                    // Set up the image's onload event
                    image.onload = function () {
                        // Calculate the new width and height for resizing
                        const maxWidth = 400; // 800
                        const maxHeight = 300; // 600
                        let newWidth = image.width;
                        let newHeight = image.height;

                        if (newWidth > maxWidth) {
                            newHeight *= maxWidth / newWidth;
                            newWidth = maxWidth;
                        }

                        if (newHeight > maxHeight) {
                            newWidth *= maxHeight / newHeight;
                            newHeight = maxHeight;
                        }

                        // Set the canvas dimensions to the new width and height
                        canvas.width = newWidth;
                        canvas.height = newHeight;

                        // Draw the image on the canvas with the new dimensions
                        // Clear the canvas and set background to transparent
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        context.fillStyle = 'rgba(0, 0, 0, 0)';
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        context.drawImage(image, 0, 0, newWidth, newHeight);

                        // Access the resized image data from the canvas
                        const resizedImageData = canvas.toDataURL(
                            'image/png',
                            0.7
                        );

                        setImgBase64Str(resizedImageData);
                    };

                    // Set the image source to the uploaded file
                    if (
                        event.target &&
                        typeof event.target.result === 'string'
                    ) {
                        image.src = event.target.result || '';
                    }
                }
            };
            fileReader.readAsDataURL(fileUploaded);
            setUploadedFile(fileUploaded);
        }
    };

    const uploadPhotoClick = async () => {
        if (!activeUser) {
            return;
        }

        try {
            await profilePictureMutation.mutateAsync({
                user: activeUser,
                profilePictureData: imgBase64Str,
            });
        } catch (err) {
            console.error(extractErrorMessage(err));
        }
    };

    return (
        <div className="userProfile">
            <h1>User Profile</h1>
            <div style={{ textAlign: 'center' }}>
                <div className="selectFileBtn">
                    <button
                        type="button"
                        className="btn primary"
                        onClick={handleUploadFileBtn}
                        style={{ marginBottom: 15 }}
                    >
                        Choose File
                    </button>

                    <input
                        id="axisKeyFileInput"
                        type="file"
                        ref={hiddenFileInput}
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                    />
                </div>
                {uploadedFile && <div>Selected File: {uploadedFile.name} </div>}{' '}
                <button type="button" onClick={uploadPhotoClick}>
                    Upload Picture
                </button>
                <div>
                    <canvas ref={canvasRef} />
                </div>
                <div
                    style={{
                        margin: 'auto',
                        height: 170,
                        width: 170,
                        borderRadius: '100%',
                        background: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <img
                        src={imgBase64Str}
                        alt="profile-thumbnail"
                        style={{
                            height: 150,
                            width: 150,
                            borderRadius: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
