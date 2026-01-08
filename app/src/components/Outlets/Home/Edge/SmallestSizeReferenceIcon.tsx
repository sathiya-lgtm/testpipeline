// React
import {
    useState,
    useRef,
    useEffect,
    useCallback,
    SetStateAction,
} from 'react';

// Icons
import PersonIcon from '../../../../images/icons/EV_person_standing.svg?react';
import CarIcon from '../../../../images/icons/EV_vehicle.svg?react';

// Types
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

interface DragRectProps {
    rectHeight: number;
    rectWidth: number;
    rectPosition: RectPosition;
    setRectPosition: React.Dispatch<SetStateAction<RectPosition>>;
    containerDimensions: ContainerDimensions;
    smallestSizeIcon: string;
    smallestSize: string;
}

const SmallestSizeReferenceIcon = ({
    rectHeight,
    rectWidth,
    rectPosition,
    setRectPosition,
    containerDimensions,
    smallestSizeIcon,
    smallestSize,
}: DragRectProps) => {
    const [mouseStartingPos, setMouseStartingPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const rectRef = useRef<HTMLDivElement>(null);

    const handleDrag = (
        aoeHeight: number,
        aoeWidth: number,
        xDiffPct: number,
        yDiffPct: number
    ) => {
        const { height, width } = containerDimensions;
        let newTopPosition = rectPosition.top + yDiffPct;
        let newLeftPosition = rectPosition.left + xDiffPct;
        const rightPosition = null;
        const bottomPosition = null;

        if (newTopPosition < 0) {
            newTopPosition = 0;
        }

        if (newLeftPosition < 0) {
            newLeftPosition = 0;
        }

        if ((newLeftPosition / 100) * width + 1 > width) {
            newLeftPosition = Math.round(((width - 1) / width) * 10000) / 100;
        }

        if ((newTopPosition / 100) * height + 1 > height) {
            newTopPosition = Math.round(((height - 1) / height) * 10000) / 100;
        }

        setRectPosition({
            top: newTopPosition,
            left: newLeftPosition,
            right: rightPosition,
            bottom: bottomPosition,
        });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setMouseStartingPos({ x: e.screenX, y: e.screenY });
        setIsDragging(true);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleInteraction = useCallback(
        (e: MouseEvent) => {
            if (isDragging && rectRef && rectRef.current) {
                const aoeHeight = rectRef.current.clientHeight;
                const aoeWidth = rectRef.current.clientWidth;

                const xDiff = e.screenX - mouseStartingPos.x;
                const yDiff = e.screenY - mouseStartingPos.y;
                const xDiffPct =
                    Math.round((xDiff / containerDimensions.width) * 10000) /
                    100;
                const yDiffPct =
                    Math.round((yDiff / containerDimensions.height) * 10000) /
                    100;

                handleDrag(aoeHeight, aoeWidth, xDiffPct, yDiffPct);
            }
        },
        [mouseStartingPos.x, mouseStartingPos.y, isDragging]
    );

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);

        return () => window.addEventListener('mouseup', handleMouseUp);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleInteraction);

        return () => window.removeEventListener('mousemove', handleInteraction);
    }, [handleInteraction]);

    const determineRectColor = () => {
        if (smallestSizeIcon === 'rectangle') {
            if (Number(smallestSize) >= 200) {
                return 'rgba(0, 255, 0, 0.5)';
            }

            if (Number(smallestSize) <= 99) {
                return 'rgba(255, 0, 0, 0.5)';
            }
            return 'rgba(255, 255, 0, 0.5)';
        }

        return '';
    };

    const determineIconColor = () => {
        if (Number(smallestSize) >= 200) {
            return 'blue';
        }

        if (Number(smallestSize) <= 99) {
            return 'red';
        }

        return 'yellow';
    };

    const determineRectStyles: any = () => {
        const rectStyles: any = {
            position: 'absolute',
            height: `1px`,
            width: `1px`,
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

    const heightInPixels = containerDimensions.height * (rectHeight / 100);
    const widthInPixels = containerDimensions.width * (rectWidth / 100);
    const topPosition = heightInPixels / 2;
    const leftPosition = widthInPixels / 2;

    return (
        <div ref={rectRef} style={determineRectStyles()}>
            <div
                onMouseDown={handleMouseDown}
                style={{
                    background: determineRectColor(),
                    height: heightInPixels,
                    width: widthInPixels,
                    zIndex: 1,
                    position: 'absolute',
                    top: -topPosition,
                    left: -leftPosition,
                    overflow: 'visible',
                }}
            >
                {smallestSizeIcon === 'person' && (
                    <PersonIcon
                        style={{
                            height: heightInPixels,
                            width: widthInPixels,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                        }}
                        className={`smallestSizeReferenceIcon ${determineIconColor()}`}
                    />
                )}
                {smallestSizeIcon === 'car' && (
                    <CarIcon
                        style={{
                            height: heightInPixels,
                            width: widthInPixels,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                        }}
                        className={`smallestSizeReferenceIcon ${determineIconColor()}`}
                    />
                )}
            </div>
        </div>
    );
};

export default SmallestSizeReferenceIcon;
