// React
import { RefObject } from 'react';

// Axios
import axios from 'axios';

export const getAWSData = async (awsURL: string) => {
    const { data } = await axios.get(awsURL);
    return data;
};

// This function did no work when called in the function below
// Couldn't figure out why
// const drawObjectDetectionBox = (
//     ctx: CanvasRenderingContext2D,
//     boundingBox: number[]
// ) => {
//     ctx.fillStyle = 'blue'; // Box color
//     const x = boundingBox[0]; // X-coordinate
//     const y = boundingBox[1]; // Y-coordinate
//     const width = boundingBox[2] - boundingBox[0]; // Box width
//     const height = boundingBox[3] - boundingBox[1]; // Box height
//     const borderRadius = 6;

//     ctx.beginPath();
//     ctx.moveTo(x + borderRadius, y); // Start at top-left corner with radius
//     ctx.lineTo(x + width - borderRadius, y); // Top edge
//     ctx.arcTo(x + width, y, x + width, y + borderRadius, borderRadius); // Top-right corner
//     ctx.lineTo(x + width, y + height - borderRadius); // Right edge
//     ctx.arcTo(
//         x + width,
//         y + height,
//         x + width - borderRadius,
//         y + height,
//         borderRadius
//     ); // Bottom-right corner
//     ctx.lineTo(x + borderRadius, y + height); // Bottom edge
//     ctx.arcTo(x, y + height, x, y + height - borderRadius, borderRadius); // Bottom-left corner
//     ctx.lineTo(x, y + borderRadius); // Left edge
//     ctx.arcTo(x, y, x + borderRadius, y, borderRadius); // Top-left corner
//     ctx.closePath();

//     // Set stroke style
//     ctx.strokeStyle = 'blue'; // Outline color
//     ctx.lineWidth = 3; // Outline thickness
//     ctx.stroke();
// };

export const clearCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
};

export const setBoxesFromDetections = (
    canvasRef: RefObject<HTMLCanvasElement>,
    detections: any[],
    showTags: boolean,
    showBoundingBoxes: boolean
) => {
    const filteredDetections = detections.filter((detection: any) => {
        const moving =
            detection.moving === undefined || detection.moving === true;
        const notFiltered =
            detection.filtered === undefined || detection.filtered === false;
        const notMasked =
            detection.masked === undefined || detection.masked === false;
        return moving && notFiltered && notMasked;
    });

    const canvas = canvasRef.current;
    if (canvas && filteredDetections.length > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            filteredDetections.forEach((detection) => {
                const boundingBox = detection.bounding_box;

                const width = boundingBox[2] - boundingBox[0]; // Box width
                const height = boundingBox[3] - boundingBox[1]; // Box height
                const x = boundingBox[0]; // X-coordinate
                const y = boundingBox[1]; // Y-coordinate
                const borderRadius = 6;

                if (showBoundingBoxes) {
                    ctx.beginPath();
                    ctx.moveTo(x + borderRadius, y); // Start at top-left corner with radius
                    ctx.lineTo(x + width - borderRadius, y); // Top edge
                    ctx.arcTo(
                        x + width,
                        y,
                        x + width,
                        y + borderRadius,
                        borderRadius
                    ); // Top-right corner
                    ctx.lineTo(x + width, y + height - borderRadius); // Right edge
                    ctx.arcTo(
                        x + width,
                        y + height,
                        x + width - borderRadius,
                        y + height,
                        borderRadius
                    ); // Bottom-right corner
                    ctx.lineTo(x + borderRadius, y + height); // Bottom edge
                    ctx.arcTo(
                        x,
                        y + height,
                        x,
                        y + height - borderRadius,
                        borderRadius
                    ); // Bottom-left corner
                    ctx.lineTo(x, y + borderRadius); // Left edge
                    ctx.arcTo(x, y, x + borderRadius, y, borderRadius); // Top-left corner
                    ctx.closePath();

                    // Set stroke style
                    ctx.strokeStyle =
                        detection.detected_class === 'person'
                            ? '#ff3278'
                            : '#14ffdc'; // Outline color
                    ctx.lineWidth = 3; // Outline thickness
                    ctx.stroke();
                }

                if (showTags) {
                    const detectedClass = detection.detected_class;

                    const person_attributes = [
                        'clothing-color',
                        'clothing',
                        'sex',
                    ];
                    const vehicle_attributes = ['make', 'type', 'color'];

                    const applicableAttributes = [];

                    if (detectedClass === 'person') {
                        applicableAttributes.push(...person_attributes);
                    } else if (detectedClass === 'vehicle') {
                        applicableAttributes.push(...vehicle_attributes);
                    }

                    const foundAttributes: string[] = [];
                    applicableAttributes.forEach((item) => {
                        if (detection[item] !== undefined) {
                            let stringLabel = `${item}:`;
                            detection[item].forEach((value: string) => {
                                stringLabel += ` ${value}`;
                            });
                            foundAttributes.push(stringLabel);
                        }
                    });

                    if (foundAttributes.length === 0) {
                        console.log('noFound attributes');
                    }

                    foundAttributes.forEach((attribute: string, index) => {
                        const labelText = attribute;
                        ctx.font = 'bold 30px sans-serif'; // Font style
                        ctx.lineWidth = 4;
                        ctx.fillStyle =
                            detection.detected_class === 'person'
                                ? '#ff3278'
                                : '#14ffdc';

                        const textX = x; // Center text above the box
                        const textY = y - (index + 1) * 30 + 15; // Position text 10px above the box
                        ctx.fillText(labelText, textX, textY);
                    });
                }
            });
        }
    } else if (canvas && filteredDetections.length === 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
};
