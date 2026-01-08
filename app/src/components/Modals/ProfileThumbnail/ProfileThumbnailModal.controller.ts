import React, { SetStateAction, Dispatch } from 'react';

export const readAndFormatImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    setImgBase64Str: Dispatch<SetStateAction<string>>,
    setUploadedFile: Dispatch<SetStateAction<File | null>>
) => {
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
                    const maxWidth = 150; // 800
                    const maxHeight = 150; // 600
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
                    const resizedImageData = canvas.toDataURL('image/png', 0.5);

                    setImgBase64Str(resizedImageData);
                };

                // Set the image source to the uploaded file
                if (event.target && typeof event.target.result === 'string') {
                    image.src = event.target.result || '';
                }
            }
        };
        fileReader.readAsDataURL(fileUploaded);
        setUploadedFile(fileUploaded);
    }
};
