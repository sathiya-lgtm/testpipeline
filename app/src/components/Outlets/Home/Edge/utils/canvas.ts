/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-globals */
// Types
import { CaptureResolution } from '../edgeTypes';

interface CanvasColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

export const getImageSize = (imgRef: React.RefObject<HTMLImageElement>) => {
    const imgWidth = imgRef?.current?.width;
    const imgHeight = imgRef?.current?.height;
    const orignalWidth = imgRef?.current?.naturalWidth;
    const orignalHeight = imgRef?.current?.naturalHeight;

    if (!imgWidth || !imgHeight || !orignalWidth || !orignalHeight) {
        return undefined;
    }

    const orginalRatio = Math.round((orignalWidth / orignalHeight) * 100) / 100;
    const imgRatio = Math.round((imgWidth / imgHeight) * 100) / 100;

    if (orginalRatio > imgRatio) {
        const calculatedHeight =
            Math.round((imgWidth / orginalRatio) * 100) / 100;
        return { height: calculatedHeight, width: imgWidth };
    }

    const calculatedwidth = Math.round(imgHeight * orginalRatio * 100) / 100;

    if (!isNaN(calculatedwidth)) {
        return { height: imgHeight, width: calculatedwidth };
    }

    return undefined;
};

export const calculateImgDisplacement = (
    imgContainer: React.RefObject<HTMLElement>,
    imgRef: React.RefObject<HTMLImageElement>
) => {
    if (imgContainer.current && imgRef.current) {
        const containerWidth = imgContainer.current.clientWidth;
        if (containerWidth > imgRef.current.width) {
            return (containerWidth - imgRef.current.width) / 2;
        }

        return 0;
    }

    return 0;
};

export const drawFromArray = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    inputDataArr: Uint8Array,
    color: CanvasColor,
    cameraAspectRatio: { height: number; width: number }
) => {
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context?.clearRect(
            0,
            0,
            cameraAspectRatio.width,
            cameraAspectRatio.height
        );

        if (context && inputDataArr.length > 0) {
            const myImageData = context.createImageData(
                cameraAspectRatio.width,
                cameraAspectRatio.height
            );

            inputDataArr.forEach((val, index) => {
                if (val === 0) {
                    myImageData.data[index * 4 + 0] = 0;
                    myImageData.data[index * 4 + 1] = 0;
                    myImageData.data[index * 4 + 2] = 0;
                    myImageData.data[index * 4 + 3] = 0;
                } else {
                    myImageData.data[index * 4 + 0] = color.r;
                    myImageData.data[index * 4 + 1] = color.g;
                    myImageData.data[index * 4 + 2] = color.b;
                    myImageData.data[index * 4 + 3] = color.a;
                }
            });

            context.putImageData(myImageData, 0, 0);
        }
    }
};

export const drawFromNumberArray = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    inputDataArr: number[],
    color: CanvasColor,
    cameraAspectRatio: { height: number; width: number },
    transparent: boolean
) => {
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!transparent) {
            context?.clearRect(
                0,
                0,
                cameraAspectRatio.width,
                cameraAspectRatio.height
            );
        }

        if (context && inputDataArr.length > 0) {
            const myImageData = context.getImageData(
                0,
                0,
                cameraAspectRatio.width,
                cameraAspectRatio.height
            );

            inputDataArr.forEach((val, index) => {
                if (val === 0) {
                    if (!transparent) {
                        myImageData.data[index * 4 + 0] = 0;
                        myImageData.data[index * 4 + 1] = 0;
                        myImageData.data[index * 4 + 2] = 0;
                        myImageData.data[index * 4 + 3] = 0;
                    }
                } else {
                    myImageData.data[index * 4 + 0] = color.r;
                    myImageData.data[index * 4 + 1] = color.g;
                    myImageData.data[index * 4 + 2] = color.b;
                    myImageData.data[index * 4 + 3] = color.a;
                }
            });

            context.putImageData(myImageData, 0, 0);
        }
    }
};

export const drawScaleLine = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    scaleLine: number[][],
    color: string,
    captureResolution: CaptureResolution
) => {
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context?.clearRect(
            0,
            0,
            captureResolution.width,
            captureResolution.height
        );

        if (context && scaleLine.length > 0) {
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = 3;

            context.moveTo(
                scaleLine[0][1],
                captureResolution.height - scaleLine[0][0]
            );
            for (let i = 1; i < scaleLine.length; i++) {
                context.lineTo(
                    scaleLine[i][1],
                    captureResolution.height - scaleLine[i][0]
                );
            }
            context.stroke();
        }
    }
};

export const drawLCLine = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    scaleLine: number[][],
    color: string,
    captureResolution: CaptureResolution
) => {
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context?.clearRect(
            0,
            0,
            captureResolution.width,
            captureResolution.height
        );

        if (context && scaleLine.length > 0) {
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = 3;

            context.moveTo(
                scaleLine[0][1],
                captureResolution.height - scaleLine[0][0]
            );
            for (let i = 1; i < scaleLine.length; i++) {
                context.lineTo(
                    scaleLine[i][1],
                    captureResolution.height - scaleLine[i][0]
                );
            }
            context.closePath();
            context.stroke();
        }
    }
};
export const drawAOI = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    scaleLine: number[][],
    color: string,
    captureResolution: CaptureResolution
) => {
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && scaleLine.length > 0) {
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = 3;

            context.moveTo(
                scaleLine[0][1],
                captureResolution.height - scaleLine[0][0]
            );
            for (let i = 1; i < scaleLine.length; i++) {
                context.lineTo(
                    scaleLine[i][1],
                    captureResolution.height - scaleLine[i][0]
                );
            }
            context.closePath();
            context.stroke();
        }
    }
};

export const clearCanvas = (
    canvas: HTMLCanvasElement,
    captureResolution: CaptureResolution
) => {
    const context = canvas?.getContext('2d');
    context?.clearRect(0, 0, captureResolution.width, captureResolution.height);
};

export const getShadedArea = (
    canvas: HTMLCanvasElement,
    captureResolution: CaptureResolution
) => {
    const context = canvas.getContext('2d');
    const imgData = context?.getImageData(
        0,
        0,
        captureResolution.width,
        captureResolution.height
    ).data;
    const imgArr = [];

    if (imgData) {
        for (
            let i = 0;
            i < captureResolution.width * captureResolution.height * 4;
            i += 4
        ) {
            let pixelDiff = 0;
            const pixel = Math.floor(i / 4);

            for (let color = 0; color < 3; color++) {
                pixelDiff += imgData[i + color];
                if (pixelDiff > 0) {
                    imgArr[pixel] = 1;
                } else {
                    imgArr[pixel] = 0;
                }
            }
        }
    }

    return imgArr;
};
