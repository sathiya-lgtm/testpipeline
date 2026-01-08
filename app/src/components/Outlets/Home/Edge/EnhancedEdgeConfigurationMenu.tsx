// React
import React, { FC, Dispatch, SetStateAction } from 'react';

// Components
import AreaOfInterestEditor from './AreaOfInterestMenu';
import MaskEditor from './MaskEditor';
import ScalingEditor from './ScalingEditor';

// Types
import { CustomWebSocket } from './Edge';
import {
    SmallestSizeIconType,
    PointAsPct,
    CaptureResolution,
    AOESizesAsPct,
    IScaleData,
    FocalPointPosition,
} from './edgeTypes';
import { BrushType, SelectOption } from '../../../../types/interfaces';

import PersonIcon from '../../../../images/icons/EV_person_standing.svg?react';
import CarIcon from '../../../../images/icons/EV_vehicle.svg?react';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/EdgeConfigurationMenu.scss';
import MultiSelect from '../../../Inputs/MultiSelect';
import { eventTypeOptions } from '../../../Filters/ForensicSearch/ForensicSearchFilter.controller';
import SingleSelect from '../../../Inputs/Select';
import Button from '../../../Button';
import Toggle from '../../../Inputs/Toggle';
import Input from '../../../Inputs/Input';
import { toast } from 'react-toastify';
import {
    FaArrowsAltH,
    FaLongArrowAltLeft,
    FaLongArrowAltRight,
    FaSquare,
} from 'react-icons/fa';
import Select from 'react-select';

interface IProps {
    streamDimensions: { height: number; width: number };
    captureResolution: CaptureResolution;
    setCaptureResolution: Dispatch<SetStateAction<CaptureResolution>>;
    activeMenuItem: 'aoe' | 'mask' | 'scaling' | 'detection';
    setActiveMenuItem: Dispatch<
        SetStateAction<'aoe' | 'mask' | 'scaling' | 'detection'>
    >;
    aoeSizesAsPct: AOESizesAsPct;
    setAoeSizesAsPct: Dispatch<SetStateAction<AOESizesAsPct>>;
    // setDetectionBox: Dispatch<SetStateAction<DetectionBox>>;
    originalAoeData: AOESizesAsPct;
    setOriginalAoeData: Dispatch<SetStateAction<AOESizesAsPct>>;
    socket: CustomWebSocket | null;
    source_id: string | undefined;
    getSequence: () => number;
    brushSize: number;
    setBrushSize: Dispatch<SetStateAction<number>>;
    brushType: BrushType;
    setBrushType: Dispatch<SetStateAction<BrushType>>;
    maskOpacity: number;
    setMaskOpacity: Dispatch<SetStateAction<number>>;
    saveMask: () => Promise<void>;
    resetMask: () => void;
    clearMask: () => void;
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
    focalPoint: number[];
    setFocalPoint: Dispatch<SetStateAction<number[]>>;
    maxAutoScale: string;
    setMaxAutoScale: Dispatch<SetStateAction<string>>;
    scaledSize: number;
    largestFilterEnabled: boolean;
    setLargestFilterEnabled: Dispatch<SetStateAction<boolean>>;
    largestSize: string;
    setLargestSize: Dispatch<SetStateAction<string>>;
    scaleLine: number[][];
    setScaleLine: Dispatch<SetStateAction<number[][]>>;
    scaleLineAsPcts: PointAsPct[];
    setScaleLinePcts: Dispatch<SetStateAction<PointAsPct[]>>;
    setMidPointsAsPcts: Dispatch<SetStateAction<PointAsPct[]>>;
    setFocalPointPosition: Dispatch<SetStateAction<FocalPointPosition>>;
    setAutoScaleEnabled: Dispatch<SetStateAction<boolean>>;
    setLoadingText: Dispatch<SetStateAction<string>>;
    originalScaleData: IScaleData;
    setOriginalScaleData: Dispatch<SetStateAction<IScaleData>>;
    selectedBehavior: SelectOption | null;
    setSelectedBehavior: Dispatch<SetStateAction<SelectOption | null>>;
    behaviorOptions: SelectOption[];
    personDetectionToggle: boolean;
    setPersonDetectionToggle: Dispatch<SetStateAction<boolean>>;
    vehicleDetectionToggle: boolean;
    setVehicleDetectionToggle: Dispatch<SetStateAction<boolean>>;
    personMotionConfidence: number;
    setPersonMotionConfidence: Dispatch<SetStateAction<number>>;
    vehicleMotionConfidence: number;
    setVehicleMotionConfidence: Dispatch<SetStateAction<number>>;
    personConfidenceThreshold: number;
    setPersonConfidenceThreshold: Dispatch<SetStateAction<number>>;
    vehicleConfidenceThreshold: number;
    setVehicleConfidenceThreshold: Dispatch<SetStateAction<number>>;
    personDwell: number;
    setPersonDwell: Dispatch<SetStateAction<number>>;
    vehicleDwell: number;
    setVehicleDwell: Dispatch<SetStateAction<number>>;
    loiteringEnabled: boolean;
    setLoiteringEnabled: Dispatch<SetStateAction<boolean>>;
    isPersonAiEnabled: boolean;
    setIsPersonAiEnabled: Dispatch<SetStateAction<boolean>>;
    isVehicleAiEnabled: boolean;
    setIsVehicleAiEnabled: Dispatch<SetStateAction<boolean>>;
    selectedDirection: '0' | '1' | '2';
    setSelectedDirection: Dispatch<SetStateAction<'0' | '1' | '2'>>;
    zoneNumber: string;
    setZoneNumber: Dispatch<SetStateAction<string>>;
    zoneOptions: SelectOption[];
    selectedZone: SelectOption | null;
    setSelectedZone: Dispatch<SetStateAction<SelectOption | null>>;
    saveZone: () => Promise<void>;
    removeZone: () => Promise<void>;
    deleteZone: () => Promise<void>;
    zoneCount: number;
    activeColor: string;
}

const EnhancedEdgeConfigurationMenu: FC<IProps> = ({
    streamDimensions,
    captureResolution,
    setCaptureResolution,
    activeMenuItem,
    setActiveMenuItem,
    aoeSizesAsPct,
    setAoeSizesAsPct,
    originalAoeData,
    setOriginalAoeData,
    socket,
    source_id,
    getSequence,
    brushSize,
    setBrushSize,
    brushType,
    setBrushType,
    maskOpacity,
    setMaskOpacity,
    saveMask,
    resetMask,
    clearMask,
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
    focalPoint,
    setFocalPoint,
    maxAutoScale,
    setMaxAutoScale,
    scaledSize,
    largestFilterEnabled,
    setLargestFilterEnabled,
    largestSize,
    setLargestSize,
    scaleLine,
    setScaleLine,
    scaleLineAsPcts,
    setScaleLinePcts,
    setMidPointsAsPcts,
    setFocalPointPosition,
    setAutoScaleEnabled,
    setLoadingText,
    originalScaleData,
    setOriginalScaleData,
    selectedBehavior,
    setSelectedBehavior,
    behaviorOptions,
    personDetectionToggle,
    setPersonDetectionToggle,
    vehicleDetectionToggle,
    setVehicleDetectionToggle,
    personMotionConfidence,
    setPersonMotionConfidence,
    vehicleMotionConfidence,
    setVehicleMotionConfidence,
    personConfidenceThreshold,
    setPersonConfidenceThreshold,
    vehicleConfidenceThreshold,
    setVehicleConfidenceThreshold,
    isPersonAiEnabled,
    setIsPersonAiEnabled,
    isVehicleAiEnabled,
    setIsVehicleAiEnabled,
    personDwell,
    setPersonDwell,
    vehicleDwell,
    setVehicleDwell,
    loiteringEnabled,
    setLoiteringEnabled,
    selectedDirection,
    setSelectedDirection,
    zoneOptions,
    selectedZone,
    setSelectedZone,
    zoneNumber,
    setZoneNumber,
    saveZone,
    removeZone,
    deleteZone,
    zoneCount,
    activeColor,
}: {
    streamDimensions: any;
    captureResolution: any;
    setCaptureResolution: any;
    activeMenuItem: any;
    setActiveMenuItem: any;
    aoeSizesAsPct: any;
    setAoeSizesAsPct: any;
    originalAoeData: any;
    setOriginalAoeData: any;
    socket: any;
    source_id: any;
    getSequence: any;
    brushSize: any;
    setBrushSize: any;
    brushType: any;
    setBrushType: any;
    maskOpacity: any;
    setMaskOpacity: any;
    saveMask: any;
    resetMask: any;
    clearMask: any;
    smallestSize: any;
    setSmallestSize: any;
    smallestRangeSelector: any;
    setSmallestRangeSelector: any;
    smallestSizeIcon: any;
    setSmallestSizeIcon: any;
    autoScale: any;
    setAutoScale: any;
    scaleMode: any;
    setScaleMode: any;
    focalPoint: any;
    setFocalPoint: any;
    maxAutoScale: any;
    setMaxAutoScale: any;
    scaledSize: any;
    largestFilterEnabled: any;
    setLargestFilterEnabled: any;
    largestSize: any;
    setLargestSize: any;
    scaleLine: any;
    setScaleLine: any;
    scaleLineAsPcts: any;
    setScaleLinePcts: any;
    setMidPointsAsPcts: any;
    setFocalPointPosition: any;
    setAutoScaleEnabled: any;
    setLoadingText: any;
    originalScaleData: any;
    setOriginalScaleData: any;
    selectedBehavior: any;
    setSelectedBehavior: any;
    behaviorOptions: any;
    personDetectionToggle: any;
    setPersonDetectionToggle: any;
    vehicleDetectionToggle: any;
    setVehicleDetectionToggle: any;
    personMotionConfidence: any;
    setPersonMotionConfidence: any;
    vehicleMotionConfidence: any;
    setVehicleMotionConfidence: any;
    personConfidenceThreshold: any;
    setPersonConfidenceThreshold: any;
    vehicleConfidenceThreshold: any;
    setVehicleConfidenceThreshold: any;
    personDwell: any;
    setPersonDwell: any;
    vehicleDwell: any;
    setVehicleDwell: any;
    loiteringEnabled: any;
    setLoiteringEnabled: any;
    isPersonAiEnabled: any;
    setIsPersonAiEnabled: any;
    isVehicleAiEnabled: any;
    setIsVehicleAiEnabled: any;
    selectedDirection: any;
    setSelectedDirection: any;
    zoneNumber: any;
    setZoneNumber: any;
    zoneOptions: any;
    selectedZone: any;
    setSelectedZone: any;
    saveZone: any;
    removeZone: any;
    deleteZone: any;
    zoneCount: any;
    activeColor: any;
}) => {
    return (
        <>
            <div
                className={`collapsibleEditor ${
                    activeMenuItem === 'detection' ? 'open' : ''
                }`}
            >
                <div
                    className="collapsibleHeader"
                    onClick={() => setActiveMenuItem('detection')}
                >
                    <h4 className="title">Zone Configuration</h4>
                </div>
                {selectedBehavior?.value === 'Detection' && (
                    <div className="collapsibleContent">
                        <p className="label">Zone</p>
                        <Select
                            id="behavior-select"
                            value={selectedZone}
                            isClearable={false}
                            onChange={(value) => setSelectedZone(value!)}
                            options={zoneOptions}
                            styles={{
                                control: (provided, { isDisabled }) => ({
                                    ...provided,
                                    borderRadius: '0px',
                                    background: 'none',
                                    border: '1px solid #6a737b',
                                    opacity: isDisabled ? '0.5' : '1',
                                    cursor: isDisabled
                                        ? 'not-allowed'
                                        : 'pointer',
                                }),

                                singleValue: (provided) => {
                                    return {
                                        ...provided,
                                        color: 'white',
                                    };
                                },
                                multiValueLabel: (provided) => ({
                                    ...provided,
                                    color: 'white',
                                }),
                                menu: (provided) => {
                                    return {
                                        ...provided,
                                        background: 'rgba(0, 0, 0, 1)',
                                        zIndex: 10,
                                    };
                                },
                                option: (provided, state) => {
                                    return {
                                        ...provided,
                                        background: state.isFocused
                                            ? 'rgba(50, 50, 50, 0.9)'
                                            : '',
                                        textDecoration: state.isDisabled
                                            ? 'line-through'
                                            : 'none',
                                        cursor: state.isDisabled
                                            ? 'not-allowed'
                                            : 'default',
                                    };
                                },

                                placeholder: (provided) => ({
                                    ...provided,
                                    marginBottom: 5,
                                    color: 'white',
                                }),
                                input: (provided) => ({
                                    ...provided,
                                    margin: 0,
                                    marginBottom: 0,
                                    padding: 0,
                                    color: 'white',
                                }),
                                valueContainer: (provided) => ({
                                    ...provided,
                                    paddingTop: '0.5rem',
                                    paddingLeft: '0.625rem',
                                    paddingRight: '0.6rem',
                                    paddingBottom: 'calc(0.63rem - 5px)',
                                }),
                            }}
                            formatOptionLabel={({ label, color }) => {
                                return (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {label !== 'Add Zone' && (
                                            <FaSquare
                                                style={{
                                                    color: color
                                                        ? color
                                                        : activeColor,
                                                    marginRight: '8px',
                                                }}
                                            />
                                        )}
                                        {label}
                                    </div>
                                );
                            }}
                        />
                        <p className="label">Objects</p>
                        <div className="detection-button-container">
                            <button
                                id="person"
                                type="button"
                                className={`detectionBtn ${
                                    personDetectionToggle ? 'selected' : ''
                                }`}
                                onClick={() => {
                                    if (!personDetectionToggle) {
                                        setPersonDetectionToggle(true);
                                    } else if (personDetectionToggle) {
                                        setPersonDetectionToggle(false);
                                    }
                                }}
                            >
                                <PersonIcon className="icon" />
                            </button>
                            <button
                                id="vehicle"
                                type="button"
                                className={`detectionBtn ${
                                    vehicleDetectionToggle ? 'selected' : ''
                                }`}
                                onClick={() => {
                                    if (!vehicleDetectionToggle) {
                                        setVehicleDetectionToggle(true);
                                    } else if (vehicleDetectionToggle) {
                                        setVehicleDetectionToggle(false);
                                    }
                                }}
                            >
                                <CarIcon className="icon" />
                            </button>
                        </div>
                        <br />
                        <SingleSelect
                            id="behavior-select"
                            value={selectedBehavior}
                            isClearable={false}
                            onChange={(value) => setSelectedBehavior(value!)}
                            options={behaviorOptions}
                            noOptionsMessage="A valid behavior option must be selected"
                        />
                        <br />
                        <div className="toggleContainer">
                            <label id="loiteringContainer" className="label">
                                Loitering
                            </label>
                            <Toggle
                                id="loiteringToggle"
                                value={loiteringEnabled}
                                onToggleChange={() => {
                                    setLoiteringEnabled(!loiteringEnabled);
                                }}
                                toggleOnText="ON"
                                toggleOffText="OFF"
                            />
                        </div>
                        {loiteringEnabled &&
                            <div>
                                <div>
                                <label className="label">Person Dwell:</label>
                                <input
                                    className="input"
                                    type="number"
                                    inputMode="numeric"
                                    id="personDwell"
                                    value={personDwell}
                                    onChange={(e) =>
                                {
                                    setPersonDwell(e.target.value)
                                }}
                                    min={10} // Optional: set a minimum value
                                    max={120}
                                />
                            </div>
                            <br />
                            <div>
                                <label className="label">Vehicle Dwell:</label>
                                <input
                                    className="input"
                                    type="number"
                                    inputMode="numeric"
                                    id="vehicleDwell"
                                    value={vehicleDwell}
                                    onChange={(e) =>
                                    {
                                        setVehicleDwell(e.target.value)
                                    }}
                                    min={10} // Optional: set a minimum value
                                    max={120}
                                />
                            </div>
                        </div>
                }
                        <br />
                        <div className="button-container">
                            <button
                                id="saveMaskDataBtn"
                                className="btn primary small"
                                onClick={saveZone}
                                type="button"
                            >
                                Save Zone Configuration
                            </button>
                            <button
                                id="saveMaskDataBtn"
                                className="btn neutral small"
                                onClick={removeZone}
                                type="button"
                            >
                                Reset Zone Configuration
                            </button>
                        </div>
                        {selectedZone.value !== '01' && (
                            <div
                                className="button-container"
                                style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <button
                                    style={{
                                        marginLeft: 10,
                                        marginTop: 10,
                                        backgroundColor:
                                            zoneCount === 1
                                                ? 'gray'
                                                : '#ba2125',
                                        borderColor:
                                            zoneCount === 1
                                                ? 'gray'
                                                : '#ba2125',
                                    }}
                                    id="saveMaskDataBtn"
                                    disabled={zoneCount === 1}
                                    onClick={deleteZone}
                                    className="btn danger"
                                    type="button"
                                >
                                    Delete Zone Configuration
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {selectedBehavior?.value === 'line crossing' && (
                    <div className="collapsibleContent">
                        <p className="label">Zone</p>
                        <Select
                            id="behavior-select"
                            value={selectedZone}
                            isClearable={false}
                            onChange={(value) => setSelectedZone(value!)}
                            options={zoneOptions}
                            styles={{
                                control: (provided, { isDisabled }) => ({
                                    ...provided,
                                    borderRadius: '0px',
                                    background: 'none',
                                    border: '1px solid #6a737b',
                                    opacity: isDisabled ? '0.5' : '1',
                                    cursor: isDisabled
                                        ? 'not-allowed'
                                        : 'pointer',
                                }),

                                singleValue: (provided) => {
                                    return {
                                        ...provided,
                                        color: 'white',
                                    };
                                },
                                multiValueLabel: (provided) => ({
                                    ...provided,
                                    color: 'white',
                                }),
                                menu: (provided) => {
                                    return {
                                        ...provided,
                                        background: 'rgba(0, 0, 0, 1)',
                                        zIndex: 10,
                                    };
                                },
                                option: (provided, state) => {
                                    return {
                                        ...provided,
                                        background: state.isFocused
                                            ? 'rgba(50, 50, 50, 0.9)'
                                            : '',
                                        textDecoration: state.isDisabled
                                            ? 'line-through'
                                            : 'none',
                                        cursor: state.isDisabled
                                            ? 'not-allowed'
                                            : 'default',
                                    };
                                },

                                placeholder: (provided) => ({
                                    ...provided,
                                    marginBottom: 5,
                                    color: 'white',
                                }),
                                input: (provided) => ({
                                    ...provided,
                                    margin: 0,
                                    marginBottom: 0,
                                    padding: 0,
                                    color: 'white',
                                }),
                                valueContainer: (provided) => ({
                                    ...provided,
                                    paddingTop: '0.5rem',
                                    paddingLeft: '0.625rem',
                                    paddingRight: '0.6rem',
                                    paddingBottom: 'calc(0.63rem - 5px)',
                                }),
                            }}
                            formatOptionLabel={({ label, color }) => {
                                return (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {label !== 'Add Zone' && (
                                            <FaSquare
                                                style={{
                                                    color: color
                                                        ? color
                                                        : activeColor,
                                                    marginRight: '8px',
                                                }}
                                            />
                                        )}
                                        {label}
                                    </div>
                                );
                            }}
                        />
                        <p className="label">Detection</p>
                        <div className="detection-button-container">
                            <button
                                id="person"
                                type="button"
                                className={`detectionBtn ${
                                    personDetectionToggle ? 'selected' : ''
                                }`}
                                onClick={() => {
                                    if (!personDetectionToggle) {
                                        setPersonDetectionToggle(true);
                                    } else if (personDetectionToggle) {
                                        setPersonDetectionToggle(false);
                                    }
                                }}
                            >
                                <PersonIcon className="icon" />
                            </button>
                            <button
                                id="vehicle"
                                type="button"
                                className={`detectionBtn ${
                                    vehicleDetectionToggle ? 'selected' : ''
                                }`}
                                onClick={() => {
                                    if (!vehicleDetectionToggle) {
                                        setVehicleDetectionToggle(true);
                                    } else if (vehicleDetectionToggle) {
                                        setVehicleDetectionToggle(false);
                                    }
                                }}
                            >
                                <CarIcon className="icon" />
                            </button>
                        </div>
                        <br />
                        <SingleSelect
                            id="behavior-select"
                            value={selectedBehavior}
                            isClearable={false}
                            onChange={(value) => setSelectedBehavior(value!)}
                            options={behaviorOptions}
                            noOptionsMessage="A Customer with registered sites must be selected first."
                        />
                        <br />
                        <div className="radioContainer">
                            <span className="label">Mode</span>
                            <div className="radioGroup">
                                <br />
                                <div className="radioBtn primary">
                                    <input
                                        type="radio"
                                        id="a"
                                        name="direction"
                                        value="0"
                                        checked={selectedDirection === '0'}
                                        onChange={(e) =>
                                            setSelectedDirection(
                                                e.target.value as '0'
                                            )
                                        }
                                    />
                                    <label htmlFor="a">A</label>
                                    <FaLongArrowAltRight />
                                    <span>B</span>
                                </div>
                                <div className="radioBtn primary">
                                    <input
                                        type="radio"
                                        id="b"
                                        name="direction"
                                        value="1"
                                        checked={selectedDirection === '1'}
                                        onChange={(e) =>
                                            setSelectedDirection(
                                                e.target.value as '1'
                                            )
                                        }
                                    />
                                    <label htmlFor="b">A</label>
                                    <FaLongArrowAltLeft />
                                    <span>B</span>
                                </div>
                                <div className="radioBtn primary">
                                    <input
                                        type="radio"
                                        id="ab"
                                        name="direction"
                                        value="2"
                                        checked={selectedDirection === '2'}
                                        onChange={(e) =>
                                            setSelectedDirection(
                                                e.target.value as '2'
                                            )
                                        }
                                    />
                                    <label htmlFor="ab">A</label>
                                    <FaArrowsAltH />
                                    <span>B</span>
                                </div>
                            </div>
                        </div>
                        <br />
                        <div
                            className="button-container"
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <button
                                id="saveMaskDataBtn"
                                className="btn primary small"
                                onClick={saveZone}
                                type="button"
                            >
                                Save Zone Configuration
                            </button>
                            <button
                                style={{
                                    marginLeft: 10,
                                }}
                                id="cancelMaskDataChangesBtn"
                                className="btn neutral small"
                                onClick={removeZone}
                                type="button"
                            >
                                Reset Zone Configuration
                            </button>
                        </div>
                        {selectedZone.value !== '01' && (
                            <div
                                className="button-container"
                                style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <button
                                    style={{
                                        marginLeft: 10,
                                        marginTop: 10,
                                        backgroundColor:
                                            zoneCount === 1
                                                ? 'gray'
                                                : '#ba2125',
                                        borderColor:
                                            zoneCount === 1
                                                ? 'gray'
                                                : '#ba2125',
                                    }}
                                    id="saveMaskDataBtn"
                                    disabled={zoneCount === 1}
                                    onClick={deleteZone}
                                    className="btn danger"
                                    type="button"
                                >
                                    Delete Zone Configuration
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div
                className={`collapsibleEditor ${
                    activeMenuItem === 'mask' ? 'open' : ''
                }`}
            >
                <div
                    className="collapsibleHeader"
                    onClick={() => setActiveMenuItem('mask')}
                >
                    <h4 className="title">Masking</h4>
                </div>

                <div className="collapsibleContent">
                    <MaskEditor
                        streamDimensions={streamDimensions}
                        brushSize={brushSize}
                        setBrushSize={setBrushSize}
                        brushType={brushType}
                        setBrushType={setBrushType}
                        maskOpacity={maskOpacity}
                        setMaskOpacity={setMaskOpacity}
                        saveMask={saveMask}
                        resetMask={resetMask}
                        clearMask={clearMask}
                    />
                </div>
            </div>
            <div
                className={`collapsibleEditor ${
                    activeMenuItem === 'scaling' ? 'open' : ''
                }`}
            >
                <div
                    className="collapsibleHeader"
                    onClick={() => setActiveMenuItem('scaling')}
                >
                    <h4 className="title">Scaling</h4>
                </div>

                <div className="collapsibleContent">
                    <ScalingEditor
                        captureResolution={captureResolution}
                        setCaptureResolution={setCaptureResolution}
                        socket={socket}
                        source_id={source_id}
                        getSequence={getSequence}
                        smallestSize={smallestSize}
                        setSmallestSize={setSmallestSize}
                        smallestRangeSelector={smallestRangeSelector}
                        setSmallestRangeSelector={setSmallestRangeSelector}
                        smallestSizeIcon={smallestSizeIcon}
                        setSmallestSizeIcon={setSmallestSizeIcon}
                        autoScale={autoScale}
                        setAutoScale={setAutoScale}
                        scaleMode={scaleMode}
                        setScaleMode={setScaleMode}
                        maxAutoScale={maxAutoScale}
                        setMaxAutoScale={setMaxAutoScale}
                        scaledSize={scaledSize}
                        focalPoint={focalPoint}
                        setFocalPoint={setFocalPoint}
                        largestFilterEnabled={largestFilterEnabled}
                        setLargestFilterEnabled={setLargestFilterEnabled}
                        largestSize={largestSize}
                        setLargestSize={setLargestSize}
                        scaleLine={scaleLine}
                        setScaleLine={setScaleLine}
                        scaleLineAsPcts={scaleLineAsPcts}
                        setScaleLineAsPcts={setScaleLinePcts}
                        setMidPointsAsPcts={setMidPointsAsPcts}
                        setFocalPointPosition={setFocalPointPosition}
                        setAutoScaleEnabled={setAutoScaleEnabled}
                        originalScaleData={originalScaleData}
                        setOriginalScaleData={setOriginalScaleData}
                        setLoadingText={setLoadingText}
                        activeMenuItem={activeMenuItem}
                    />
                </div>
            </div>
        </>
    );
};

export default EnhancedEdgeConfigurationMenu;
