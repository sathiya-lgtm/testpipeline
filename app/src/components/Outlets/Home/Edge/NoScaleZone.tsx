// React
import { useEffect, useRef, FC } from 'react';

// Utils
import { updateShading } from './utils/FilterAndScaling';

// Types
import { CaptureResolution } from './edgeTypes';

interface IProps {
    scaleLine: number[][];
    focalPoint: number[];
    captureResolution: CaptureResolution;
}

const NoScaleZone: FC<IProps> = ({
    scaleLine,
    focalPoint,
    captureResolution,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const shadowCords = updateShading(
            captureResolution,
            scaleLine,
            focalPoint
        );

        if (shadowCords && canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            context?.clearRect(
                0,
                0,
                captureResolution.width,
                captureResolution.height
            );

            if (context) {
                context.beginPath();

                shadowCords.forEach((cord, index) => {
                    if (cord[0] && cord[1] && index === 0) {
                        context.moveTo(
                            cord[1],
                            captureResolution.height - cord[0]
                        );
                    } else if (cord[0] && cord[1]) {
                        context.lineTo(
                            cord[1],
                            captureResolution.height - cord[0]
                        );
                    }
                });

                context.closePath();
                context.fillStyle = 'rgba(180, 153, 48, 0.3)';
                context.fill();
            }
        }
    }, [scaleLine, focalPoint]);

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

export default NoScaleZone;
