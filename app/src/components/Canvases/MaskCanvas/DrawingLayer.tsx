// React
import {
    ReactElement,
    FC,
    useRef,
    useEffect,
    useState,
    Dispatch,
    SetStateAction,
    RefObject,
} from 'react';

// Custom
import { usePrevious } from '../../../hooks';
import { BitMask, IDimensions, BrushType } from '../../../types/interfaces';

// Controller
import {
    getMousePosition,
    convertImageDataToBitMask,
    drawFromBitMask,
} from './MaskCanvas.controller';

interface IProps {
    parentContainerDimensions: IDimensions;
    streamDimensions: IDimensions;
    brushType: BrushType;
    brushSize: number;
    maskOpacity: number;
    bitMask: BitMask;
    setBitMask: Dispatch<SetStateAction<BitMask>>;
    canvasRef: RefObject<HTMLCanvasElement>;
}

export const maskColorChannels = {
    r: 255,
    g: 0,
    b: 50,
    a: 255,
};

/**
 * Drawing layer for MaskCanvas. The Canvas that actually draws on the canvas as the user
 * drags their mouse.
 * @returns {ReactElement}
 */
const DrawingLayer: FC<IProps> = ({
    streamDimensions,
    parentContainerDimensions,
    brushType,
    brushSize,
    maskOpacity,
    bitMask,
    setBitMask,
    canvasRef,
}: IProps): ReactElement => {
    // const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isPainting, setIsPainting] = useState(false);
    const wasPainting = usePrevious(isPainting);

    const startDrawing = (xCord: number, yCord: number) => {
        setIsPainting(true);

        const canvas = canvasRef.current;
        const context = canvasContextRef.current;

        if (canvas && context) {
            const mousePosition = getMousePosition(
                xCord,
                yCord,
                canvas,
                parentContainerDimensions,
                streamDimensions
            );

            context.globalCompositeOperation =
                brushType === 'draw' ? 'source-over' : 'destination-out';
            context.beginPath();

            context.strokeStyle = `rgb(${maskColorChannels.r},${maskColorChannels.g},${maskColorChannels.b})`;
            context.lineWidth = brushSize;
            context.lineJoin = 'round';
            context.lineCap = 'round';
            context.moveTo(
                mousePosition.xCord - canvas.offsetLeft,
                mousePosition.yCord - canvas.offsetTop
            );
        }
    };

    const draw = (xCord: number, yCord: number) => {
        if (isPainting) {
            const canvas = canvasRef.current;
            const context = canvasContextRef.current;

            if (canvas && context) {
                const mousePosition = getMousePosition(
                    xCord,
                    yCord,
                    canvas,
                    parentContainerDimensions,
                    streamDimensions
                );
                const targetX = mousePosition.xCord - canvas.offsetLeft;
                const targetY = mousePosition.yCord - canvas.offsetTop;

                context.lineTo(targetX, targetY);
                context.stroke();
            }
        }
    };

    const handleMouseDown = (clientX: number, clientY: number) => {
        startDrawing(clientX, clientY);
    };

    const handleMouseMove = (clientX: number, clientY: number) => {
        draw(clientX, clientY);
    };

    useEffect(() => {
        const handleMouseUp = () => {
            setIsPainting(false);
        };

        window.addEventListener('mouseup', handleMouseUp);

        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            canvasContextRef.current = canvas.getContext('2d', {
                willReadFrequently: true,
            });

            drawFromBitMask(canvasRef, bitMask, maskColorChannels, {
                height: streamDimensions.height,
                width: streamDimensions.width,
            });
        }
    }, [bitMask]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            // This is what actually sets the bitMask to state thus giving permanence.
            // Without the following code-block, the mask would not save after drawing.
            if (wasPainting) {
                const context = canvas.getContext('2d', {
                    willReadFrequently: true,
                });
                const myImageData = context?.getImageData(
                    0,
                    0,
                    streamDimensions.width,
                    streamDimensions.height
                );

                const aBitMask: BitMask =
                    convertImageDataToBitMask(myImageData);

                setBitMask(aBitMask);
            }
        }
    }, [wasPainting]);

    /** Updates opacity of canvas when user changes Mask Visibility. */
    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            const newOpacity = maskOpacity / 100;

            canvas.style.opacity = String(newOpacity);
        }
    }, [maskOpacity]);

    /**
     * Updates canvas drawing whenever parentContainer state is updated.
     */
    useEffect(() => {
        drawFromBitMask(canvasRef, bitMask, maskColorChannels, {
            height: streamDimensions.height,
            width: streamDimensions.width,
        });
    }, [parentContainerDimensions, streamDimensions]);

    return (
        <canvas
            id="drawing-layer-canvas"
            className="DrawingLayer"
            onMouseDown={({ clientX, clientY }) =>
                handleMouseDown(clientX, clientY)
            }
            onMouseMove={({ clientX, clientY }) =>
                handleMouseMove(clientX, clientY)
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

export default DrawingLayer;
