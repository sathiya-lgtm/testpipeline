// React
import React, {
    ReactElement,
    FC,
    useRef,
    useEffect,
    useState,
    useCallback,
} from 'react';

// Custom
import { IDimensions } from '../../../types/interfaces';

// Controller
import {
    dispatchEventToDrawingLayer,
    displayCircularCursor,
    getCircularAffectedCoordinates,
    getMousePosition,
} from './MaskCanvas.controller';

interface IProps {
    parentContainerDimensions: IDimensions;
    streamDimensions: IDimensions;
    brushSize: number;
}

/**
 * Canvas for displaying a cursor over masking canvas when user hovers over canvas.
 * @returns {ReactElement}
 */
const CursorLayer: FC<IProps> = ({
    streamDimensions,
    parentContainerDimensions,
    brushSize,
}: IProps): ReactElement => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

    const paintCircle = (clientX: number, clientY: number) => {
        if (canvasRef.current && canvasContextRef.current) {
            const context = canvasContextRef.current;
            const { xCord, yCord } = getMousePosition(
                clientX,
                clientY,
                canvasRef.current,
                parentContainerDimensions,
                streamDimensions
            );
            const distanceToPerimeter = Math.floor(brushSize / 2);
            const affectedCoordinates = getCircularAffectedCoordinates(
                xCord,
                yCord,
                distanceToPerimeter,
                streamDimensions
            );

            if (isHovering) {
                displayCircularCursor(
                    context,
                    streamDimensions,
                    affectedCoordinates
                );
            }
        }
    };

    const handleMouseMove = (clientX: number, clientY: number) => {
        paintCircle(clientX, clientY);

        if (!isHovering) {
            dispatchEventToDrawingLayer(clientX, clientY, 'mousemove');
        }
    };

    const handleMouseUp = useCallback(() => {
        setIsMouseDown(false);
        setIsHovering(true);
    }, []);

    const handleMouseDown = (clientX: number, clientY: number) => {
        setIsHovering(false);
        setIsMouseDown(true);

        dispatchEventToDrawingLayer(clientX, clientY, 'mousedown');
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    const handleMouseEnter = () => {
        if (isMouseDown) {
            return;
        }

        setIsHovering(true);
    };

    useEffect(() => {
        const canvas = canvasRef.current;

        window.addEventListener('mouseup', handleMouseUp);

        if (canvas) {
            canvasContextRef.current = canvas.getContext('2d');
        }

        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            if (!isHovering) {
                // Removes hovering brush.
                canvasContextRef.current?.clearRect(
                    0,
                    0,
                    streamDimensions.width,
                    streamDimensions.height
                );
            }
        }
    }, [isHovering]);

    return (
        <canvas
            id="hover-layer-canvas"
            className="CursorLayer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={({ clientX, clientY }) =>
                handleMouseMove(clientX, clientY)
            }
            onMouseDown={({ clientX, clientY }) =>
                handleMouseDown(clientX, clientY)
            }
            ref={canvasRef}
            width={streamDimensions.width}
            height={streamDimensions.height}
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

export default CursorLayer;
