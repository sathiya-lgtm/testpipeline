/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import { FC, Dispatch, SetStateAction, useEffect } from 'react';

// React Icons
import { BsFillFileFill } from 'react-icons/bs';

// Toast
import { toast } from 'react-toastify';

// Components
import Toggle from '../../../Inputs/Toggle';

// Icons
import PersonIcon from '../../../../images/icons/EV_person_standing.svg?react';
import CarIcon from '../../../../images/icons/EV_vehicle.svg?react';

// Utils
import {
    logValue,
    logPosition,
    convertCoordinateToPercent,
} from './utils/generalUtils';
import {
    convertScaleLineToPercents,
    generateMidPoints,
} from './utils/scaleLine';

// Edge Data Fetching
import {
    setScaleLineData,
    getScaleLineEditorData,
    getCaptureResolution,
} from './dataFetching';

// Types
import {
    SmallestSizeIconType,
    CaptureResolution,
    PointAsPct,
    IScaleData,
} from './edgeTypes';
import { CustomWebSocket } from './Edge';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/ScalingEditor.scss';
import {debug} from "util";

interface IProps {
    captureResolution: CaptureResolution;
    setCaptureResolution: Dispatch<SetStateAction<CaptureResolution>>;
    socket: CustomWebSocket | null;
    source_id: string | undefined;
    getSequence: () => number;
    smallestSize: string;
    setSmallestSize: Dispatch<SetStateAction<string>>;
    smallestRangeSelector: string;
    setSmallestRangeSelector: React.Dispatch<SetStateAction<string>>;
    smallestSizeIcon: SmallestSizeIconType;
    setSmallestSizeIcon: Dispatch<SetStateAction<SmallestSizeIconType>>;
    autoScale: boolean;
    setAutoScale: Dispatch<SetStateAction<boolean>>;
    scaleMode: '0' | '1';
    setScaleMode: Dispatch<SetStateAction<'0' | '1'>>;
    maxAutoScale: string;
    setMaxAutoScale: Dispatch<SetStateAction<string>>;
    scaledSize: number;
    focalPoint: number[];
    setFocalPoint: Dispatch<SetStateAction<number[]>>;
    largestFilterEnabled: boolean;
    setLargestFilterEnabled: Dispatch<SetStateAction<boolean>>;
    largestSize: string;
    setLargestSize: Dispatch<SetStateAction<string>>;
    scaleLine: number[][];
    setScaleLine: Dispatch<SetStateAction<number[][]>>;
    scaleLineAsPcts: PointAsPct[];
    setScaleLineAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
    setMidPointsAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
    setFocalPointPosition: Dispatch<
        SetStateAction<{ top: number; left: number }>
    >;
    setAutoScaleEnabled: Dispatch<SetStateAction<boolean>>;
    originalScaleData: IScaleData;
    setOriginalScaleData: Dispatch<SetStateAction<IScaleData>>;
    setLoadingText: Dispatch<SetStateAction<string>>;
    activeMenuItem: 'aoe' | 'mask' | 'scaling';
}

const ScalingEditor: FC<IProps> = ({
    captureResolution,
    setCaptureResolution,
    socket,
    source_id,
    getSequence,
    smallestSize,
    setSmallestSize,
    smallestRangeSelector,
    setSmallestRangeSelector,
    smallestSizeIcon,
    setSmallestSizeIcon,
    autoScale,
    setAutoScale,
    scaleMode,
    setScaleMode,
    maxAutoScale,
    setMaxAutoScale,
    scaledSize,
    focalPoint,
    setFocalPoint,
    largestFilterEnabled,
    setLargestFilterEnabled,
    largestSize,
    setLargestSize,
    scaleLine,
    setScaleLine,
    scaleLineAsPcts,
    setScaleLineAsPcts,
    setAutoScaleEnabled,
    setMidPointsAsPcts,
    setFocalPointPosition,
    originalScaleData,
    setOriginalScaleData,
    setLoadingText,
    activeMenuItem,
}) => {
    const resetScaleLine = () => {
        const newScaleLine = [
            [5, 1],
            [captureResolution.height / 2, captureResolution.width / 2],
            [5, captureResolution.width - 3],
        ];

        setScaleLine(newScaleLine);
        setScaleLineAsPcts(
            convertScaleLineToPercents(newScaleLine, captureResolution)
        );
    };
    const convertSmallestPixelsToPercent = (value) => {
        return ((value / (captureResolution.width * captureResolution.height)) * 100).toFixed(3).toString();

    };
    const convertLargestPixelsToPercent = (value) => {
        const pixelPercent = Math.round(value / (captureResolution.width * captureResolution.height)) * 100
        setLargestSize(pixelPercent.toString());
    };

    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const scaleInputVal = Number(e.target.value);
        const pixelSize = Math.round(logValue(scaleInputVal));
        setSmallestSize(JSON.stringify(pixelSize));
        convertSmallestPixelsToPercent(pixelSize);
        setSmallestRangeSelector(e.target.value);
    };

    const handleSmallestSizeInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const numsOnly = /^\d+$/;
        const onlyNumbers = numsOnly.test(e.target.value);

        setSmallestSize(e.target.value);
        convertSmallestPixelsToPercent(e.target.value);

        if (onlyNumbers || e.target.value === '') {
            const scaleInputVal = JSON.stringify(
                logPosition(Number(e.target.value))
            );
            setSmallestRangeSelector(scaleInputVal);
        }
    };

    const handleCancel = () => {
        setSmallestSize(originalScaleData.smallestSize);
        const scaleInputVal = logPosition(
            Number(originalScaleData.smallestSize)
        );
        setSmallestRangeSelector(scaleInputVal.toString());
        setLargestFilterEnabled(originalScaleData.largestFilterEnabled);
        setLargestSize(originalScaleData.largestSize);
        setAutoScale(originalScaleData.autoScaleEnabled);
        setScaleMode(originalScaleData.scaleMode);
        setScaleLine(originalScaleData.scaleLine);
        setFocalPoint(originalScaleData.focalPoint);
        setMaxAutoScale(originalScaleData.maxAutoScale);
    };

    const handleSave = async () => {
        if (!socket || !source_id) {
            return;
        }

        setLoadingText('Saving Scaling settings...');

        try {
            await setScaleLineData({
                socket,
                source_id,
                getSequence,
                scaleLineData: {
                    scaleLine,
                    scaleMode,
                    smallestSize,
                    largestFilterEnabled,
                    largestSize,
                    maxAutoScale,
                    focalPoint,
                    autoScale,
                },
            });
        } catch (err) {
            console.log(err);
            toast.error('There was an issue saving your changes.');

            return;
        }

        const newScaleLinePcts = convertScaleLineToPercents(
            scaleLine,
            captureResolution
        );
        const newMidPoints = generateMidPoints(newScaleLinePcts);

        const newFocalPointPosition = {
            top: convertCoordinateToPercent(
                captureResolution.height - focalPoint[0],
                captureResolution.height
            ),
            left: convertCoordinateToPercent(
                focalPoint[1],
                captureResolution.width
            ),
        };

        setOriginalScaleData({
            scaleLine,
            scaleLineAsPcts: newScaleLinePcts,
            midPointsAsPcts: newMidPoints,
            autoScaleEnabled: autoScale,
            scaleMode,
            largestSize,
            largestFilterEnabled,
            maxAutoScale,
            smallestSize,
            focalPoint,
            focalPointPosition: newFocalPointPosition,
        });

        toast.success('Scaling settings updated.');
        setLoadingText('');
    };

    const fetchScaleLineData = async (customSocket: CustomWebSocket) => {
        if (!source_id) {
            toast.error('Camera not found in source list.');
            return;
        }

        setLoadingText('Fetching scale line data...');

        try {
            const resolution = await getCaptureResolution({
                socket: customSocket,
                getSequence,
                source_id,
            });
            setCaptureResolution(resolution);
        } catch (error) {
            toast.error('Unable to get Capture Resolution from camera.');
        }

        const result = await getScaleLineEditorData({
            socket: customSocket,
            source_id,
            getSequence,
        });

        const newScaleLinePcts = convertScaleLineToPercents(
            result.scaleLine,
            result.captureResolution
        );
        const newMidPoints = generateMidPoints(scaleLineAsPcts);

        const newFocalPointPosition = {
            top: convertCoordinateToPercent(
                result.captureResolution.height - result.focalPointArr[0],
                result.captureResolution.height
            ),
            left: convertCoordinateToPercent(
                result.focalPointArr[1],
                result.captureResolution.width
            ),
        };

        setScaleLine(result.scaleLine);
        setScaleLineAsPcts(newScaleLinePcts);
        setMidPointsAsPcts(newMidPoints);
        setAutoScaleEnabled(result.autoScaleEnabled === '1');
        setScaleMode(result.scaleMode);
        setLargestSize(result.largestSize);
        setLargestFilterEnabled(result.largestFilterEnabled);
        setMaxAutoScale(result.maxAutoScale);
        setSmallestSize(result.smallestSize);
        setFocalPoint(result.focalPointArr);
        setFocalPointPosition(newFocalPointPosition);

        setOriginalScaleData({
            scaleLine: result.scaleLine,
            scaleLineAsPcts: newScaleLinePcts,
            midPointsAsPcts: newMidPoints,
            autoScaleEnabled: result.autoScaleEnabled === '1',
            scaleMode: result.scaleMode,
            largestSize: result.largestSize,
            largestFilterEnabled: result.largestFilterEnabled,
            maxAutoScale: result.maxAutoScale,
            smallestSize: result.smallestSize,
            focalPoint: result.focalPointArr,
            focalPointPosition: newFocalPointPosition,
        });
        convertSmallestPixelsToPercent(smallestSize);
        convertLargestPixelsToPercent(largestSize);
        setLoadingText('');
    };

    useEffect(() => {
        if (socket && source_id && activeMenuItem === 'scaling') {
            fetchScaleLineData(socket);
        }
    }, [socket, source_id, activeMenuItem]);

    return (
        <div className="scalingEditor">
            <div className="objectScaleContainer">
                <p className="label">Object Scale Icon</p>
                <div className="objectScaleIconBtnsContainer">
                    <button
                        type="button"
                        id="setSizeIconToPersonBtn"
                        className={`iconBtn mr-30 ${
                            smallestSizeIcon === 'person' ? 'active' : ''
                        }`}
                        onClick={() => setSmallestSizeIcon('person')}
                    >
                        <PersonIcon className="iconBtnIcon" />
                    </button>
                    <button
                        type="button"
                        id="setSizeIconToPersonBtn"
                        className={`iconBtn mr-30 ${
                            smallestSizeIcon === 'rectangle' ? 'active' : ''
                        }`}
                        onClick={() => setSmallestSizeIcon('rectangle')}
                    >
                        <BsFillFileFill className="iconBtnIcon" />
                    </button>
                    <button
                        type="button"
                        id="setSizeIconToPersonBtn"
                        className={`iconBtn mr-30 ${
                            smallestSizeIcon === 'car' ? 'active' : ''
                        }`}
                        onClick={() => setSmallestSizeIcon('car')}
                    >
                        <CarIcon className="iconBtnIcon" />
                    </button>
                </div>
            </div>
            <div className="smallestObjectSizeContainer">
                <label className="label" htmlFor="smallestObjectSize">
                    Smallest Object Size:{' '}
                </label>
                <label>
                    {convertSmallestPixelsToPercent(smallestSize)}%
                </label>
                <div
                    className="minMaxSliderContainer"
                    style={{ marginTop: '1rem' }}
                >
                    <span className="minLabel">Min</span>
                    <input
                        id="smallestSizeRangeSelector"
                        className="minMaxSlider"
                        type="range"
                        min="0"
                        max="100"
                        value={smallestRangeSelector}
                        onChange={handleRangeChange}
                    />

                    <span className="maxLabel">Max</span>
                </div>
            </div>

            <div className="toggleContainer">
                <p id="autoScaleContainer" className="label">
                    Auto Scale
                </p>
                <Toggle
                    id="autoScaleToggle"
                    value={autoScale}
                    onToggleChange={() => {
                        setAutoScale(!autoScale);
                    }}
                    toggleOnText="ON"
                    toggleOffText="OFF"
                />
            </div>

            {autoScale && (
                <>
                    <div className="radioContainer">
                        <span className="label">Mode</span>
                        <div className="radioGroup">
                            <div className="radioBtn primary">
                                <input
                                    type="radio"
                                    id="focalScaling"
                                    name="focalScaling"
                                    value="0"
                                    checked={scaleMode === '0'}
                                    onChange={(e) =>
                                        setScaleMode(
                                            e.target.value as '0' | '1'
                                        )
                                    }
                                />
                                <label htmlFor="focalScaling">Focal</label>
                            </div>
                            <div className="radioBtn primary">
                                <input
                                    type="radio"
                                    id="verticalScaling"
                                    name="verticalScaling"
                                    value="1"
                                    checked={scaleMode === '1'}
                                    onChange={(e) =>
                                        setScaleMode(
                                            e.target.value as '0' | '1'
                                        )
                                    }
                                />
                                <label htmlFor="verticalScaling">
                                    Vertical
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="sliderContainer">
                        <label className="label">Rate of Scale</label>
                        <div
                            className="minMaxSliderContainer"
                            style={{ marginTop: '0.5rem' }}
                        >
                            <span className="minLabel">Min</span>
                            <input
                                id="maxAutoScaleRangeSelector"
                                className="minMaxSlider"
                                type="range"
                                min="1"
                                max="500"
                                step="1"
                                value={maxAutoScale}
                                onChange={(e) =>
                                    setMaxAutoScale(e.target.value)
                                }
                            />
                            <span className="maxLabel">Max</span>
                        </div>
                    </div>

                    <div className="toggleContainer">
                        <p className="label">Scaled Size</p>
                        <p>{convertSmallestPixelsToPercent(scaledSize)} %</p>
                    </div>

                    <div className="toggleContainer">
                        <p className="label">Reset Scale Line</p>
                        <button
                            className="btn primary"
                            type="button"
                            onClick={resetScaleLine}
                        >
                            Reset
                        </button>
                    </div>
                </>
            )}

            <div className="toggleContainer">
                <p className="label">Largest Filter</p>
                <Toggle
                    id="largestScaleToggle"
                    value={largestFilterEnabled}
                    onToggleChange={() => {
                        setLargestFilterEnabled(!largestFilterEnabled);
                    }}
                    toggleOnText="ON"
                    toggleOffText="OFF"
                />
            </div>
            {largestFilterEnabled && (
                <div className="toggleContainer">
                    <p className="label">Largest Object Size</p>
                    <p>{largestSize} %</p>
                </div>
            )}

            <div className="divider" />

            <div className="buttonContainer">
                <button
                    className="btn primary"
                    type="button"
                    onClick={handleSave}
                >
                    Save
                </button>
                <button
                    className="btn neutral"
                    type="button"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default ScalingEditor;
