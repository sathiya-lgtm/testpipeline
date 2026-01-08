// React
import { FC } from 'react';

// Third Party
import { IoReload } from 'react-icons/io5';

// Styles
import '../../../../styles/components/Outlets/Home/ClipFailedToLoad.scss';

interface IProps {
    refetchClips: () => void;
}

const ClipFailedToLoad: FC<IProps> = ({ refetchClips }) => {
    return (
        <div className="clipFailedToLoad">
            <p className="title">Clip failed to load.</p>
            <div>
                <button
                    onClick={refetchClips}
                    type="button"
                    className="reloadBtn"
                >
                    <span>Reload Clip</span>
                    <IoReload size={24} />
                </button>
            </div>
        </div>
    );
};

export default ClipFailedToLoad;
