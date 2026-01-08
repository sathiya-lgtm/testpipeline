// React
import { FC, Dispatch, SetStateAction } from 'react';

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
import { BrushType } from '../../../../types/interfaces';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/EdgeConfigurationMenu.scss';

interface IProps {
    streamDimensions: { height: number; width: number };
    captureResolution: CaptureResolution;
    setCaptureResolution: Dispatch<SetStateAction<CaptureResolution>>;
    activeMenuItem: 'aoe' | 'mask' | 'scaling';
    setActiveMenuItem: Dispatch<SetStateAction<'aoe' | 'mask' | 'scaling'>>;
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
}

const EdgeConfigurationMenu: FC<IProps> = ({
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
}) => {
    return (
        <>
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
                    activeMenuItem === 'aoe' ? 'open' : ''
                }`}
            >
                <div
                    className="collapsibleHeader"
                    onClick={() => setActiveMenuItem('aoe')}
                >
                    <h4 className="title">Area of Interest</h4>
                </div>

                <div className="collapsibleContent">
                    <AreaOfInterestEditor
                        captureResolution={captureResolution}
                        setCaptureResolution={setCaptureResolution}
                        aoeSizesAsPct={aoeSizesAsPct}
                        setAoeSizesAsPct={setAoeSizesAsPct}
                        originalAoeData={originalAoeData}
                        setOriginalAoeData={setOriginalAoeData}
                        socket={socket}
                        source_id={source_id}
                        getSequence={getSequence}
                        setLoadingText={setLoadingText}
                        activeMenuItem={activeMenuItem}
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

export default EdgeConfigurationMenu;
