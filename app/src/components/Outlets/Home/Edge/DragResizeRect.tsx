// React
import { useState, useRef, useCallback, useEffect, FC } from 'react';

// Hooks
import { usePrevious } from '../../../../hooks';

// Utils
import { roundToHundredths } from './utils/generalUtils';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/DragResizeRect.scss';

interface RectPosition {
    top: number;
    left: number;
    right: number | null;
    bottom: number | null;
}

interface ContainerDimensions {
    height: number;
    width: number;
}

interface DragResizeRectProps {
    startingHeight: number;
    startingWidth: number;
    startingPosition: RectPosition;
    containerDimensions: ContainerDimensions;
    afterResizeDragCallback: Function;
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

const DragResizeRect: FC<DragResizeRectProps> = ({
    startingHeight,
    startingWidth,
    startingPosition,
    containerDimensions,
    afterResizeDragCallback,
}) => {
    const [rectDimensions, setRectDimensions] = useState({
        height: startingHeight,
        width: startingWidth,
    });
    const [rectPosition, setRectPosition] = useState(startingPosition);
    const [mouseStartingPos, setMouseStartingPos] = useState({ x: 0, y: 0 });
    const [resizeType, setResizeType] = useState('');
    const lastResizeType = usePrevious(resizeType);
    const [isDragging, setIsDragging] = useState(false);
    const wasDragging = usePrevious(isDragging);

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
        let newTopPosition = rectPosition.top + yDiffPct;
        let newLeftPosition = rectPosition.left + xDiffPct;
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

        setRectPosition({
            top: newTopPosition,
            left: newLeftPosition,
            right: rightPosition,
            bottom: bottomPosition,
        });
    };

    const resizeBottomRight = (xDiffPct: number, yDiffPct: number) => {
        let newHeight = rectDimensions.height + yDiffPct;
        let newWidth = rectDimensions.width + xDiffPct;
        const topPosition = rectPosition.top;
        const leftPosition = rectPosition.left;
        let newRightPosition = rectPosition.right;
        let newBottomPosition = rectPosition.bottom;

        if (newHeight + rectPosition.top > 100) {
            newHeight = 100 - rectPosition.top;
            newBottomPosition = 0;
        }

        if (newWidth + rectPosition.left > 100) {
            newWidth = 100 - rectPosition.left;
            newRightPosition = 0;
        }

        if (topPosition + newHeight < 100) {
            newBottomPosition = null;
        }

        if (leftPosition + newWidth < 100) {
            newRightPosition = null;
        }

        setRectDimensions({
            height: roundToHundredths(newHeight),
            width: roundToHundredths(newWidth),
        });
        setRectPosition({
            top: topPosition,
            left: leftPosition,
            right: newRightPosition,
            bottom: newBottomPosition,
        });
    };

    const resizeTopLeft = (xDiffPct: number, yDiffPct: number) => {
        let newHeight = rectDimensions.height - yDiffPct;
        let newWidth = rectDimensions.width - xDiffPct;
        let newTopPosition = rectPosition.top + yDiffPct;
        let newLeftPosition = rectPosition.left + xDiffPct;

        if (newTopPosition <= 0) {
            newTopPosition = 0;
            newHeight = rectDimensions.height + rectPosition.top;
        }

        if (newLeftPosition <= 0) {
            newLeftPosition = 0;
            newWidth = rectDimensions.width + rectPosition.left;
        }

        setRectDimensions({
            height: roundToHundredths(newHeight),
            width: roundToHundredths(newWidth),
        });
        setRectPosition({
            top: roundToHundredths(newTopPosition),
            left: roundToHundredths(newLeftPosition),
            right: null,
            bottom: null,
        });
    };

    const resizeTopRight = (xDiffPct: number, yDiffPct: number) => {
        let newHeight = rectDimensions.height - yDiffPct;
        let newWidth = rectDimensions.width + xDiffPct;
        let newTopPosition = rectPosition.top + yDiffPct;

        if (newTopPosition <= 0) {
            newTopPosition = 0;
            newHeight = rectDimensions.height + rectPosition.top;
        }

        if (newWidth + rectPosition.left > 100) {
            newWidth = 100 - rectPosition.left;
        }

        setRectDimensions({
            height: roundToHundredths(newHeight),
            width: roundToHundredths(newWidth),
        });
        setRectPosition({
            top: roundToHundredths(newTopPosition),
            left: rectPosition.left,
            right: null,
            bottom: null,
        });
    };

    const resizeBottomLeft = (xDiffPct: number, yDiffPct: number) => {
        let newHeight = rectDimensions.height + yDiffPct;
        let newWidth = rectDimensions.width - xDiffPct;
        let newLeftPosition = rectPosition.left + xDiffPct;

        if (newHeight + rectPosition.top >= 100) {
            newHeight = 100 - rectPosition.top;
        }

        if (newLeftPosition <= 0) {
            newLeftPosition = 0;
            newWidth = rectDimensions.width + rectPosition.left;
        }

        setRectDimensions({
            height: roundToHundredths(newHeight),
            width: roundToHundredths(newWidth),
        });
        setRectPosition({
            top: rectPosition.top,
            left: roundToHundredths(newLeftPosition),
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

        return () => window.addEventListener('mouseup', handleMouseUp);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleInteraction);

        return () => window.removeEventListener('mousemove', handleInteraction);
    }, [handleInteraction]);

    useEffect(() => {
        if ((wasDragging && !isDragging) || (lastResizeType && !resizeType)) {
            const { height, width } = rectDimensions;
            const { top, right, bottom, left } = rectPosition;

            afterResizeDragCallback({
                height,
                width,
                top,
                right,
                bottom,
                left,
            });
        }
    }, [isDragging, resizeType]);

    const determinRectStyles: any = () => {
        const rectStyles: RectStyles = {
            position: 'absolute',
            border: '1px solid white',
            background: 'rgba(255, 255, 255, 0.5)',
            height: `${rectDimensions.height}%`,
            width: `${rectDimensions.width}%`,
            cursor: isDragging ? 'grabbing' : 'grab',
        };

        if (rectPosition.bottom === 0 && rectPosition.right === 0) {
            rectStyles.bottom = 0;
            rectStyles.right = 0;
        } else if (rectPosition.bottom === 0 && rectPosition.right !== 0) {
            rectStyles.bottom = 0;
            rectStyles.left = `${rectPosition.left}%`;
        } else if (rectPosition.bottom !== 0 && rectPosition.right === 0) {
            rectStyles.top = `${rectPosition.top}%`;
            rectStyles.right = 0;
        } else {
            rectStyles.top = `${rectPosition.top}%`;
            rectStyles.left = `${rectPosition.left}%`;
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

export default DragResizeRect;
