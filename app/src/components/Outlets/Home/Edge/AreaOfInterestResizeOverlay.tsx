// React
import { Dispatch, SetStateAction } from 'react';

// Components
import AreaOfInterestRectangle from './AreaOfInterestRectangle';

// Types
import { AOESizesAsPct } from './edgeTypes';

interface ContainerDimensions {
    height: number;
    width: number;
}

interface DraggingOverlayProps {
    containerDimensions: ContainerDimensions;
    aoeSizesAsPct: AOESizesAsPct;
    setAoeSizesAsPct: Dispatch<SetStateAction<AOESizesAsPct>>;
}

const AreaOfInterestResizeOverlay = ({
    containerDimensions,
    aoeSizesAsPct,
    setAoeSizesAsPct,
}: DraggingOverlayProps) => {
    return (
        <div
            style={{
                position: 'absolute',
                height: '100%',
                width: '100%',
                top: 0,
                left: 0,
            }}
        >
            <AreaOfInterestRectangle
                containerDimensions={containerDimensions}
                aoeSizesAsPct={aoeSizesAsPct}
                setAoeSizesAsPct={setAoeSizesAsPct}
            />
        </div>
    );
};

export default AreaOfInterestResizeOverlay;
