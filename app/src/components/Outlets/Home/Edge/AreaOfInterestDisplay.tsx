// React
import { useEffect, useRef, FC } from 'react';

// Types
import { CaptureResolution, DetectionBox } from './edgeTypes';

interface IProps {
    captureResolution: CaptureResolution;
    detectionBox: DetectionBox;
}

const AreaOfInterestDisplay: FC<IProps> = ({
    captureResolution,
    detectionBox,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            context?.clearRect(
                0,
                0,
                captureResolution.width,
                captureResolution.height
            );

            if (context) {
                const { top, bottom, left, right } = detectionBox;

                const height = bottom - top;
                const width = right - left;

                context.beginPath();
                context.rect(left, top, width, height);
                context.strokeStyle = 'white';
                context.stroke();
            }
        }
    }, [detectionBox]);

    return (
        <canvas
            width={captureResolution.width}
            height={captureResolution.height}
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
            }}
        />
    );
};

export default AreaOfInterestDisplay;
