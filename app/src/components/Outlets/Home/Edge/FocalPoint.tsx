// React
import {
    useState,
    useRef,
    useEffect,
    useCallback,
    SetStateAction,
} from 'react';

// Icons
import FocalIcon from '../../../../images/icons/EV_focal.svg?react';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/FocalPoint.scss';

interface FocalPointPosition {
    top: number;
    left: number;
}

interface ContainerDimensions {
    height: number;
    width: number;
}

interface FocalPointProps {
    focalPosition: FocalPointPosition;
    setFocalPosition: React.Dispatch<SetStateAction<FocalPointPosition>>;
    containerDimensions: ContainerDimensions;
}

const FocalPoint = ({
    focalPosition,
    setFocalPosition,
    containerDimensions,
}: FocalPointProps) => {
    const [mouseStartingPos, setMouseStartingPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const rectRef = useRef<HTMLDivElement>(null);

    const handleDrag = (
        halfHeight: number,
        halfWidth: number,
        xDiffPct: number,
        yDiffPct: number
    ) => {
        const { height, width } = containerDimensions;
        let newTopPosition = focalPosition.top + yDiffPct;
        let newLeftPosition = focalPosition.left + xDiffPct;

        if (newTopPosition < 0) {
            newTopPosition = 0;
        }

        if (newLeftPosition < 0) {
            newLeftPosition = 0;
        }

        if ((newLeftPosition / 100) * width + halfWidth > width + 30) {
            newLeftPosition = 100;
        }

        if ((newTopPosition / 100) * height + halfHeight > height + 30) {
            newTopPosition = 100;
        }

        setFocalPosition({ top: newTopPosition, left: newLeftPosition });
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
                const xDiff = e.screenX - mouseStartingPos.x;
                const yDiff = e.screenY - mouseStartingPos.y;
                const xDiffPct =
                    Math.round((xDiff / containerDimensions.width) * 10000) /
                    100;
                const yDiffPct =
                    Math.round((yDiff / containerDimensions.height) * 10000) /
                    100;

                handleDrag(30, 30, xDiffPct, yDiffPct);
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

    const determinRectStyles: any = () => {
        const rectStyles: any = {
            position: 'absolute',
            // border: "1px solid black",
            // background: "rgba(0, 0, 0, 0.5)",
            height: '60px',
            width: '60px',
            cursor: isDragging ? 'grabbing' : 'grab',
        };

        rectStyles.top = `calc(${focalPosition.top}% - 30px)`;
        rectStyles.left = `calc(${focalPosition.left}% - 30px)`;

        return rectStyles;
    };

    return (
        <div
            ref={rectRef}
            style={determinRectStyles()}
            onMouseDown={handleMouseDown}
        >
            <FocalIcon className="focalIcon" />
        </div>
    );
};

export default FocalPoint;
