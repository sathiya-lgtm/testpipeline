import React from 'react';

// Third party
import { Buffer } from 'buffer';
import { ungzip, deflate } from 'pako';

// Custom types
import {
    BrushType,
    BitMask,
    IColorChannel,
    IDimensions,
} from '../../../types/interfaces';

/** Represent numeric values for each channel of an RGBA pixel image. */
interface IColorChannels {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface ICanvasCoordinate {
    x: number;
    y: number;
}

interface IPaintData {
    affectedCoordinates: ICanvasCoordinate[];
    brushType: BrushType;
    colorChannels: IColorChannel;
    context: CanvasRenderingContext2D;
}

/** Will trigger either "mousemove" or "mousedown" event on "Drawing Layer". */
export const dispatchEventToDrawingLayer = (
    clientX: number,
    clientY: number,
    mouseEvent: 'mousemove' | 'mousedown'
) => {
    const event = new MouseEvent(mouseEvent, {
        clientX,
        clientY,
        bubbles: true,
        cancelable: true,
        view: window,
    });

    const drawingLayer = document.getElementById('drawing-layer-canvas');

    if (drawingLayer) {
        drawingLayer.dispatchEvent(event);
    }
};

export const getMousePosition = (
    clientX: number,
    clientY: number,
    canvasRef: HTMLCanvasElement,
    parentContainerDimensions: IDimensions,
    streamDimensions: IDimensions
) => {
    const border = canvasRef.getBoundingClientRect();
    const displacementX =
        streamDimensions.width / parentContainerDimensions.width;
    const displacementY =
        streamDimensions.height / parentContainerDimensions.height;
    const xCord = (clientX - border.left) * displacementX;
    const yCord = (clientY - border.top) * displacementY;

    return { xCord, yCord };
};

/** Returns the coordinates of the user's mouse plus a circular area surrounding it.  */
export const getCircularAffectedCoordinates = (
    xCord: number,
    yCord: number,
    distanceToPerimeter: number,
    streamDimensions: IDimensions
): ICanvasCoordinate[] => {
    const hypot = distanceToPerimeter * distanceToPerimeter;
    const affectedCoordinates: ICanvasCoordinate[] = []; // list of coordinates

    // for each column behind and the clicked cell based on size
    for (
        let i = xCord - distanceToPerimeter;
        i <= xCord + distanceToPerimeter;
        i += 1
    ) {
        // if value out of range, try next value
        if (!(i < 0 || i >= streamDimensions.width))
            // for each row above and below the clicked cell based on size
            for (
                let j = yCord - distanceToPerimeter;
                j <= yCord + distanceToPerimeter;
                j += 1
            ) {
                // if value out of range, try next value
                if (!(j < 0 || j >= streamDimensions.height)) {
                    if (
                        (i - xCord) * (i - xCord) + (j - yCord) * (j - yCord) <=
                        hypot
                    )
                        affectedCoordinates.push({ x: i, y: j });
                }
            }
    }

    return affectedCoordinates;
};

export const displayCircularCursor = (
    context: CanvasRenderingContext2D,
    streamDimensions: IDimensions,
    affectedCoordinates: ICanvasCoordinate[]
): void => {
    context.clearRect(0, 0, streamDimensions.width, streamDimensions.height);

    // Draws brush to indicate hovering location.
    context.fillStyle = 'rgba(255,255,0,0.6)';

    affectedCoordinates.forEach((point) =>
        context.fillRect(point.x, point.y, 1, 1)
    );
};

export const paintAffectedCoordinates = ({
    affectedCoordinates,
    brushType,
    colorChannels,
    context,
}: IPaintData) => {
    affectedCoordinates.forEach((point: ICanvasCoordinate) => {
        const imgData: ImageData = context.createImageData(1, 1);

        imgData.data[0] = brushType === 'draw' ? colorChannels.r : 0;
        imgData.data[1] = brushType === 'draw' ? colorChannels.g : 0;
        imgData.data[2] = brushType === 'draw' ? colorChannels.b : 0;
        imgData.data[3] = brushType === 'draw' ? colorChannels.a : 0;

        context.putImageData(imgData, point.x, point.y);
    });
};

/**
 * Function for clearing drawing on given canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {IDimensions} streamDimensions
 * @returns {CanvasRenderingContext2D | null}
 */
export const clearCanvas = (
    canvas: HTMLCanvasElement,
    streamDimensions: IDimensions
) => {
    const context = canvas?.getContext('2d');
    context?.clearRect(0, 0, streamDimensions.width, streamDimensions.height);

    return context;
};

// TODO the below function might be unnecessary, considering there might be a built-in method that
// TODO accomplishes the same goal. See (createImageBitmap): https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap
/**
 * Converts data from ImageData object into an array of bits.
 * This is done by representing each set of RGBA values as one value (either 0 or 1).
 * @param {ImageData} imageData - ImageData object from HTML Element.
 * @returns {BitMask}
 */
export const convertImageDataToBitMask = (
    imageData: ImageData | undefined
): BitMask => {
    // Array where all 4 channel values (RGBA) are regarded as one value, either 1 or 0.
    const bits: BitMask = [];

    if (imageData) {
        // Converts each RGBA channel value to either a 1 or 0.
        const imageDataChannelsAsBinary = imageData.data.map(
            (channelValue: number) => (channelValue > 2 ? 1 : 0)
        );

        for (let i = 0; i < imageDataChannelsAsBinary.length; i += 4) {
            // Grabs a set of 4 channel binaries (RGBA) and formats as a string (e.g. "0001" or "0011", etc).
            const rgbaBinaryComposite: string = imageDataChannelsAsBinary
                .slice(i, i + 4)
                .join('');
            const isPixelPresentInComposite: boolean =
                rgbaBinaryComposite !== '0000';
            const bit: 0 | 1 = isPixelPresentInComposite ? 1 : 0;

            bits.push(bit);
        }
    }

    return bits;
};

/**
 * Takes an array of bits and packs them into an array of bytes.
 * @param {BitMask} bits
 * @returns {number[]} An array of bytes.
 */
export const packBitsIntoBytes = (bits: BitMask): number[] => {
    const bytes: number[] = [];

    for (let i = 0; i < bits.length; i += 8) {
        // Concats 8 bits to a string in reverse order.
        // > "00000001"
        const byteString: string = bits
            .slice(i, i + 8)
            .reverse()
            .join('');

        // Converts byte string to number (0-255);
        const byte: number = parseInt(byteString, 2);

        bytes.push(byte);
    }

    return bytes;
};

/**
 * Uses an array of bits (i.e. 0s and 1s) to replace image on given canvas with a mask.
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef
 * @param {BitMask} bitMask - Array of 0s and 1s wherein each element represents a pixel of the image to be drawn.
 * @param {IColorChannels} colorChannels - Object featuring values for each of the four color channels for pixels to be drawn.
 * @param {IDimensions} streamDimensions
 * @returns {void}
 */
export const drawFromBitMask = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    bitMask: BitMask,
    colorChannels: IColorChannels,
    streamDimensions: IDimensions
): void => {
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = clearCanvas(canvas, streamDimensions);

        if (
            context &&
            bitMask.length > 0 &&
            streamDimensions.width &&
            streamDimensions.height
        ) {
            const myImageData = context.createImageData(
                streamDimensions.width,
                streamDimensions.height
            );

            bitMask.forEach((bit, index) => {
                if (bit === 0) {
                    // Each 4 consecutive values represents 1 pixel, wherein each value is a color channel for said pixel.
                    // If the bit is 0, set each channel to a value of 0 (i.e. transparent / no color).
                    myImageData.data[index * 4 + 0] = 0;
                    myImageData.data[index * 4 + 1] = 0;
                    myImageData.data[index * 4 + 2] = 0;
                    myImageData.data[index * 4 + 3] = 0;
                } else {
                    myImageData.data[index * 4 + 0] = colorChannels.r;
                    myImageData.data[index * 4 + 1] = colorChannels.g;
                    myImageData.data[index * 4 + 2] = colorChannels.b;
                    myImageData.data[index * 4 + 3] = colorChannels.a;
                }
            });

            context.putImageData(myImageData, 0, 0);
        }
    }
};

/**
 * Performs various operations to decode and convert Base 64 encoded pixel data to an array wherein each element
 * represents a pixel of the image in the form of either 1 or 0.
 * @param {string | undefined} base64EncodedString - A "binary string" encoded in Base 64 format representing pixel data.
 * @returns {BitMask} An array of 1 and 0s representing which pixels in the overlay are colored vs transparent.
 */
export const decodeAndDecompressBase64EncodedBitMask = (
    base64EncodedString: string | undefined
): BitMask => {
    // An array where each element represents a pixel as either 1 (colored) or 0 (transparent).
    const bits: BitMask = [];

    if (base64EncodedString) {
        // Decode base64 encoded ASCII string to "binary string".
        const decodedString: string = window.atob(base64EncodedString || '');

        // Convert "binary string" to Uint8Array of compressed pixel data in the form of bytes.
        const compressedBits: Uint8Array = Uint8Array.from(decodedString, (c) =>
            c.charCodeAt(0)
        );

        // Decompress bytes.
        const decompressedBits: Uint8Array = ungzip(compressedBits);

        // The decompressed bits should already be just 1s and 0s, the forEach is merely for extracting values from Uint8Array for casting.
        decompressedBits.forEach((bit) => bits.push(bit > 0 ? 1 : 0));
    }

    return bits;
};

/**
 * Compresses bitmask then converts to a Base 64 encoded string.
 * @param {BitMask} bitMask - An array wherein each element represents a pixel of ImageData that is either unmasked (i.e. 0) or masked (i.e. 1).
 * @returns {string} Base 64 encoded string of compressed bit mask.
 */
export const compressAndBase64EncodeBitMask = (bitMask: BitMask): string => {
    const compressedBitMask: Uint8Array = deflate(Uint8Array.from(bitMask));
    const binaryString: string = String.fromCharCode(...compressedBitMask);
    const base64EncodedCompressedBitMask: string = Buffer.from(
        binaryString,
        'binary'
    ).toString('base64');

    return base64EncodedCompressedBitMask;
};
