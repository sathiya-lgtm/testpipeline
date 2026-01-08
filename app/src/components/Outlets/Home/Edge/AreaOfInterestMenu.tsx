// React
import { FC, Dispatch, SetStateAction, useEffect } from 'react';

// Third Party
import { toast } from 'react-toastify';

// Utils
import {
    calculateDetectionBoxRight,
    calculateDetectionBoxBottom,
} from './utils/areaOfInterest';

// Edge Data Fetching
import {
    setAreaOfInterest,
    getAreaOfInterest,
    getCaptureResolution,
} from './dataFetching';

// Types
import { CustomWebSocket } from './Edge';
import { AOESizesAsPct, CaptureResolution } from './edgeTypes';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/AreaOfInterestEditor.scss';

interface IProps {
    captureResolution: CaptureResolution;
    setCaptureResolution: Dispatch<SetStateAction<CaptureResolution>>;
    aoeSizesAsPct: AOESizesAsPct;
    setAoeSizesAsPct: Dispatch<SetStateAction<AOESizesAsPct>>;
    // setDetectionBox: Dispatch<SetStateAction<DetectionBox>>;
    originalAoeData: AOESizesAsPct;
    setOriginalAoeData: Dispatch<SetStateAction<AOESizesAsPct>>;
    socket: CustomWebSocket | null;
    source_id: string | undefined;
    getSequence: () => number;
    setLoadingText: Dispatch<SetStateAction<string>>;
    activeMenuItem: 'aoe' | 'mask' | 'scaling';
}

const AreaOfInterestEditor: FC<IProps> = ({
    aoeSizesAsPct,
    setAoeSizesAsPct,
    originalAoeData,
    setOriginalAoeData,
    captureResolution,
    setCaptureResolution,
    socket,
    source_id,
    getSequence,
    setLoadingText,
    activeMenuItem,
}) => {
    const handleAOESave = async () => {
        if (!source_id) {
            toast.error('No camera connected.');
            return;
        }

        if (!socket) {
            toast.error('Unable to connect to server.');
            return;
        }

        setLoadingText('Updating Area of Interest...');

        const { top, right, left, bottom, height, width } = aoeSizesAsPct;
        const boxLeft = Math.round((captureResolution.width * left) / 100);
        const boxRight = calculateDetectionBoxRight(
            right,
            left,
            width,
            captureResolution.width
        );
        const boxTop = Math.round((captureResolution.height * top) / 100);
        const boxBottom = calculateDetectionBoxBottom(
            bottom,
            top,
            height,
            captureResolution.height
        );

        // setDetectionBox({
        //     top: boxTop,
        //     right: boxRight,
        //     bottom: boxBottom,
        //     left: boxLeft,
        // });

        try {
            await setAreaOfInterest({
                getSequence,
                socket,
                source_id,
                detectionBox: {
                    top: boxTop,
                    left: boxLeft,
                    right: boxRight,
                    bottom: boxBottom,
                },
            });
        } catch (err) {
            toast.error('Unable to update Area of Interest.');
            setLoadingText('');
            return;
        }

        toast.success('Area of Interest Updated.');
        setOriginalAoeData(aoeSizesAsPct);
        setLoadingText('');
    };

    const handleCancel = () => {
        setAoeSizesAsPct(originalAoeData);
    };

    const fetchAreaOfInterest = async (customSocket: CustomWebSocket) => {
        if (!source_id) {
            toast.error('Camera not found in source list.');
            return;
        }

        setLoadingText('Fetching area of interest...');

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

        try {
            const result = await getAreaOfInterest({
                socket: customSocket,
                source_id,
                getSequence,
            });

            setAoeSizesAsPct(result.aoeSizesAsPct);
            setOriginalAoeData(result.aoeSizesAsPct);
            // setDetectionBox(result.detectionBox);
        } catch (error) {
            console.log(error);
            toast.error('Unable to get Area of Interest data from camera.');
        }

        setLoadingText('');
    };

    useEffect(() => {
        if (socket && source_id && activeMenuItem === 'aoe') {
            fetchAreaOfInterest(socket);
        }
    }, [socket, source_id, activeMenuItem]);

    return (
        <div className="areaOfInterestEditor">
            <div className="buttonContainer">
                <button
                    className="btn primary"
                    type="button"
                    onClick={handleAOESave}
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

export default AreaOfInterestEditor;
