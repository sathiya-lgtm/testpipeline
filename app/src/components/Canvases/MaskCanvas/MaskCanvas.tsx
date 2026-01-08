// React
import { ReactElement, FC, Dispatch, SetStateAction, RefObject } from 'react';

// Components
import CursorLayer from './CursorLayer';
import DrawingLayer from './DrawingLayer';

// Custom types
import { BitMask, IDimensions, BrushType } from '../../../types/interfaces';

// Styles
import '../../../styles/components/MaskCanvas.scss';

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

/**
 * Mask Canvas that features two layers. Cursor and Drawing.
 * @returns {ReactElement}
 */
const MaskCanvas: FC<IProps> = ({
    streamDimensions,
    parentContainerDimensions,
    brushType,
    brushSize,
    maskOpacity,
    bitMask,
    setBitMask,
    canvasRef,
}: IProps): ReactElement => {
    return (
        <div className={`MaskCanvas ${brushType ? 'active' : 'inactive'}`}>
            {brushType && (
                <span id="drawing-mode-indicator">
                    {brushType === 'draw' ? 'Drawing' : 'Eraser'} mode active
                </span>
            )}
            <CursorLayer
                brushSize={brushSize}
                streamDimensions={streamDimensions}
                parentContainerDimensions={parentContainerDimensions}
            />
            <DrawingLayer
                bitMask={bitMask}
                setBitMask={setBitMask}
                brushSize={brushSize}
                maskOpacity={maskOpacity}
                brushType={brushType}
                streamDimensions={streamDimensions}
                parentContainerDimensions={parentContainerDimensions}
                canvasRef={canvasRef}
            />
        </div>
    );
};

export default MaskCanvas;
