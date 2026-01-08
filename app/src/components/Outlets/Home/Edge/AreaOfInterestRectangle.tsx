// React
import {
    FC,
    Dispatch,
    SetStateAction,
    useState,
    useRef,
    useCallback,
    useEffect,
} from 'react';

// Types
import { AOESizesAsPct } from './edgeTypes';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/AreaOfInterestRectangle.scss';

export const roundToHundreths = (inputNum: number) => {
    return Math.round(inputNum * 100) / 100;
};

interface ContainerDimensions {
    height: number;
    width: number;
}

interface AOERectProps {
    containerDimensions: ContainerDimensions;
    aoeSizesAsPct: AOESizesAsPct;
    setAoeSizesAsPct: Dispatch<SetStateAction<AOESizesAsPct>>;
}

interface RectStyles {
    position: string;
    border: string;
    background: string;
    height: string;
    width: string;
    cursor: string;
    top?: string | number;
    left?: string | number;
    bottom?: string | number;
    right?: string | number;
}

const AreaOfInterestRectangle: FC<AOERectProps> = ({
    containerDimensions,
    aoeSizesAsPct,
    setAoeSizesAsPct,
}) => {
    const [mouseStartingPos, setMouseStartingPos] = useState({ x: 0, y: 0 });
    const [resizeType, setResizeType] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const rectRef = useRef<HTMLDivElement>(null);

    const startResize = (
        e: React.MouseEvent<HTMLDivElement>,
        resizeName: string
    ) => {
        e.stopPropagation();
        setMouseStartingPos({ x: e.clientX, y: e.clientY });
        setResizeType(resizeName);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setMouseStartingPos({ x: e.clientX, y: e.clientY });
        setIsDragging(true);
    };

    const handleDrag = (
        aoeHeight: number,
        aoeWidth: number,
        xDiffPct: number,
        yDiffPct: number
    ) => {
        const { height, width } = containerDimensions;
        let newTopPosition = aoeSizesAsPct.top + yDiffPct;
        let newLeftPosition = aoeSizesAsPct.left + xDiffPct;
        let rightPosition = null;
        let bottomPosition = null;

        if (newTopPosition < 0) {
            newTopPosition = 0;
        }

        if (newLeftPosition < 0) {
            newLeftPosition = 0;
        }

        if ((newLeftPosition / 100) * width + aoeWidth > width) {
            newLeftPosition =
                Math.round(((width - aoeWidth) / width) * 10000) / 100;
            rightPosition = 0;
        }

        if ((newTopPosition / 100) * height + aoeHeight > height) {
            newTopPosition =
                Math.round(((height - aoeHeight) / height) * 10000) / 100;
            bottomPosition = 0;
        }

        setAoeSizesAsPct({
            top: newTopPosition,
            left: newLeftPosition,
            right: rightPosition,
            bottom: bottomPosition,
            height: aoeSizesAsPct.height,
            width: aoeSizesAsPct.width,
        });
    };

    const resizeBottomRight = (xDiffPct: number, yDiffPct: number) => {
        let newHeight = aoeSizesAsPct.height + yDiffPct;
        let newWidth = aoeSizesAsPct.width + xDiffPct;
        const topPosition = aoeSizesAsPct.top;
        const leftPosition = aoeSizesAsPct.left;
        let newRightPosition = aoeSizesAsPct.right;
        let newBottomPosition = aoeSizesAsPct.bottom;

        if (newHeight + aoeSizesAsPct.top > 100) {
            newHeight = 100 - aoeSizesAsPct.top;
            newBottomPosition = 0;
        }

        if (newWidth + aoeSizesAsPct.left > 100) {
            newWidth = 100 - aoeSizesAsPct.left;
            newRightPosition = 0;
        }

        if (topPosition + newHeight < 100) {
            newBottomPosition = null;
        }

        if (leftPosition + newWidth < 100) {
            newRightPosition = null;
        }

        setAoeSizesAsPct({
            height: roundToHundreths(newHeight),
            width: roundToHundreths(newWidth),
            top: topPosition,
            left: leftPosition,
            right: newRightPosition,
            bottom: newBottomPosition,
        });
    };

    const resizeTopLeft = (xDiffPct: number, yDiffPct: number) => {
        let newHeight = aoeSizesAsPct.height - yDiffPct;
        let newWidth = aoeSizesAsPct.width - xDiffPct;
        let newTopPosition = aoeSizesAsPct.top + yDiffPct;
        let newLeftPosition = aoeSizesAsPct.left + xDiffPct;

        if (newTopPosition <= 0) {
            newTopPosition = 0;
            newHeight = aoeSizesAsPct.height + aoeSizesAsPct.top;
        }

        if (newLeftPosition <= 0) {
            newLeftPosition = 0;
            newWidth = aoeSizesAsPct.width + aoeSizesAsPct.left;
        }

        if (newTopPosition >= 98) {
            newTopPosition = 98;
        }

        if (newLeftPosition >= 98) {
            newLeftPosition = 98;
        }

        if (newHeight <= 2) {
            newHeight = 2;
        }

        if (newWidth <= 2) {
            newWidth = 2;
        }

        setAoeSizesAsPct({
            height: roundToHundreths(newHeight),
            width: roundToHundreths(newWidth),
            top: roundToHundreths(newTopPosition),
            left: roundToHundreths(newLeftPosition),
            right: null,
            bottom: null,
        });
    };

    const resizeTopRight = (xDiffPct: number, yDiffPct: number) => {
        let newHeight = aoeSizesAsPct.height - yDiffPct;
        let newWidth = aoeSizesAsPct.width + xDiffPct;
        let newTopPosition = aoeSizesAsPct.top + yDiffPct;

        if (newTopPosition <= 0) {
            newTopPosition = 0;
            newHeight = aoeSizesAsPct.height + aoeSizesAsPct.top;
        }

        if (newWidth + aoeSizesAsPct.left > 100) {
            newWidth = 100 - aoeSizesAsPct.left;
        }

        if (newTopPosition >= 98) {
            newTopPosition = 98;
        }

        if (newHeight <= 2) {
            newHeight = 2;
        }

        if (newWidth <= 2) {
            newWidth = 2;
        }

        setAoeSizesAsPct({
            height: roundToHundreths(newHeight),
            width: roundToHundreths(newWidth),
            top: roundToHundreths(newTopPosition),
            left: aoeSizesAsPct.left,
            right: null,
            bottom: null,
        });
    };

    const resizeBottomLeft = (xDiffPct: number, yDiffPct: number) => {
        let newHeight = aoeSizesAsPct.height + yDiffPct;
        let newWidth = aoeSizesAsPct.width - xDiffPct;
        let newLeftPosition = aoeSizesAsPct.left + xDiffPct;

        if (newHeight + aoeSizesAsPct.top >= 100) {
            newHeight = 100 - aoeSizesAsPct.top;
        }

        if (newLeftPosition <= 0) {
            newLeftPosition = 0;
            newWidth = aoeSizesAsPct.width + aoeSizesAsPct.left;
        }

        if (newLeftPosition >= 98) {
            newLeftPosition = 98;
        }

        if (newHeight <= 2) {
            newHeight = 2;
        }

        if (newWidth <= 2) {
            newWidth = 2;
        }

        setAoeSizesAsPct({
            height: roundToHundreths(newHeight),
            width: roundToHundreths(newWidth),
            top: aoeSizesAsPct.top,
            left: roundToHundreths(newLeftPosition),
            right: null,
            bottom: null,
        });
    };

    const handleResize = (xDiffPct: number, yDiffPct: number) => {
        if (resizeType === 'bottomRight') {
            resizeBottomRight(xDiffPct, yDiffPct);
        } else if (resizeType === 'topLeft') {
            resizeTopLeft(xDiffPct, yDiffPct);
        } else if (resizeType === 'topRight') {
            resizeTopRight(xDiffPct, yDiffPct);
        } else if (resizeType === 'bottomLeft') {
            resizeBottomLeft(xDiffPct, yDiffPct);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setResizeType('');
    };

    const handleInteraction = useCallback(
        (e: MouseEvent) => {
            if ((isDragging || resizeType) && rectRef && rectRef.current) {
                const aoeHeight = rectRef.current.clientHeight;
                const aoeWidth = rectRef.current.clientWidth;

                const xDiff = e.clientX - mouseStartingPos.x;
                const yDiff = e.clientY - mouseStartingPos.y;
                const xDiffPct =
                    Math.round((xDiff / containerDimensions.width) * 10000) /
                    100;
                const yDiffPct =
                    Math.round((yDiff / containerDimensions.height) * 10000) /
                    100;

                if (isDragging) {
                    handleDrag(aoeHeight, aoeWidth, xDiffPct, yDiffPct);
                } else if (resizeType) {
                    handleResize(xDiffPct, yDiffPct);
                }
            }
        },
        [mouseStartingPos.x, mouseStartingPos.y, isDragging, resizeType]
    );

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);

        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleInteraction);

        return () => window.removeEventListener('mousemove', handleInteraction);
    }, [handleInteraction]);

    const determinRectStyles: any = () => {
        const rectStyles: RectStyles = {
            position: 'absolute',
            border: '1px solid white',
            background: 'rgba(255, 255, 255, 0.5)',
            height: `${aoeSizesAsPct.height}%`,
            width: `${aoeSizesAsPct.width}%`,
            cursor: isDragging ? 'grabbing' : 'grab',
        };

        if (aoeSizesAsPct.bottom === 0 && aoeSizesAsPct.right === 0) {
            rectStyles.bottom = 0;
            rectStyles.right = 0;
        } else if (aoeSizesAsPct.bottom === 0 && aoeSizesAsPct.right !== 0) {
            rectStyles.bottom = 0;
            rectStyles.left = `${aoeSizesAsPct.left}%`;
        } else if (aoeSizesAsPct.bottom !== 0 && aoeSizesAsPct.right === 0) {
            rectStyles.top = `${aoeSizesAsPct.top}%`;
            rectStyles.right = 0;
        } else {
            rectStyles.top = `${aoeSizesAsPct.top}%`;
            rectStyles.left = `${aoeSizesAsPct.left}%`;
        }

        return rectStyles;
    };

    return (
        <div
            ref={rectRef}
            style={determinRectStyles()}
            onMouseDown={handleMouseDown}
        >
            <div
                onMouseDown={(e) => startResize(e, 'topLeft')}
                className="resizeCorner topLeftCorner"
            />
            <div
                onMouseDown={(e) => startResize(e, 'topRight')}
                className="resizeCorner topRightCorner"
            />
            <div
                onMouseDown={(e) => startResize(e, 'bottomLeft')}
                className="resizeCorner bottomLeftCorner"
            />
            <div
                onMouseDown={(e) => startResize(e, 'bottomRight')}
                className="resizeCorner bottomRightCorner"
            />
        </div>
    );
};

export default AreaOfInterestRectangle;
