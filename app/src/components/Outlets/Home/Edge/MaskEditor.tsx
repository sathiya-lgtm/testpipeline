/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, { FC, Dispatch, SetStateAction } from 'react';

// React Toastify
import { toast } from 'react-toastify';

// Icons
import EraseIcon from '../../../../images/icons/EV_eraser_button.5.16.22.svg?react';
import BrushIcon from '../../../../images/icons/EV_brush_button.5.16.22.svg?react';

// components
import Button from '../../../Button';

// Types
import { BrushType } from '../../../../types/interfaces';
import Input from "../../../Inputs/Input";
import Toggle from "../../../Inputs/Toggle";

interface IProps {
    streamDimensions: { height: number; width: number };
    brushSize: number;
    setBrushSize: Dispatch<SetStateAction<number>>;
    brushType: BrushType;
    setBrushType: Dispatch<SetStateAction<BrushType>>;
    maskOpacity: number;
    setMaskOpacity: Dispatch<SetStateAction<number>>;
    saveMask: () => Promise<void>;
    resetMask: () => void;
    clearMask: () => void;
}

const MaskEditor: FC<IProps> = ({
    streamDimensions,
    brushSize,
    setBrushSize,
    brushType,
    setBrushType,
    maskOpacity,
    setMaskOpacity,
    saveMask,
    resetMask,
    clearMask,
}) => {
    return (
        <div className="maskEditor">
            <div className="brush-type-button-container">
                <button
                    id="mask-eraser-button"
                    type="button"
                    className={`brush-type ${
                        brushType === 'erase' ? 'selected' : ''
                    }`}
                    onClick={() => {
                        if (
                            streamDimensions?.height === 0 ||
                            streamDimensions?.width === 0
                        ) {
                            toast.error(
                                "Can't adjust mask to a camera with a resolution of 0 X 0."
                            );
                            return;
                        }

                        setBrushType('erase');
                    }}
                >
                    <EraseIcon className="icon" />
                </button>
                <button
                    id="mask-draw-button"
                    type="button"
                    className={`brush-type ${
                        brushType === 'draw' ? 'selected' : ''
                    }`}
                    onClick={() => {
                        if (
                            streamDimensions?.height === 0 ||
                            streamDimensions?.width === 0
                        ) {
                            toast.error(
                                "Can't adjust mask to a camera with a resolution of 0 X 0."
                            );
                            return;
                        }

                        setBrushType('draw');
                    }}
                >
                    <BrushIcon className="icon" />
                </button>
                <div className="clear-mask-container">
                    <Button
                        id="clear-mask"
                        type="button"
                        label="Clear Mask"
                        className="btn danger outline"
                        onClick={clearMask}
                    />
                </div>
            </div>
            <p className="subtext">Brush Size: {brushSize}px</p>
            <div className="slider-container">
                <input
                    id="brush-size-slider"
                    className="slider"
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                />
            </div>
            <p className="subtext">Mask Visibility: {maskOpacity}%</p>
            <div className="slider-container">
                <input
                    id="mask-visibility-slider"
                    className="slider"
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={maskOpacity}
                    onChange={(e) => setMaskOpacity(Number(e.target.value))}
                />
            </div>
            <br />
            <div className="button-container">
                <button
                    id="saveMaskDataBtn"
                    className="btn primary"
                    onClick={saveMask}
                    type="button"
                >
                    Save Mask
                </button>

                <button
                    id="cancelMaskDataChangesBtn"
                    className="btn neutral"
                    onClick={resetMask}
                    type="button"
                >
                    Reset Mask
                </button>
            </div>
        </div>
    );
};

export default MaskEditor;
