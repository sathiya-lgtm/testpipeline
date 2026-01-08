// React
import React, { FC } from 'react';

// Icons
import EvolonIcon from '../../images/icons/EV.evolonicon.svg?react';

// Styles
import '../../styles/components/Modals/LoadingModal.scss';

interface IProps {
    /** Text displayed above animating logo. */
    modalText: string;
    /** Determines whether modal backdrop covers entire screen as opposed to fitting inside nearest
     * positioned parent (i.e. sets backdrop position to "absolute"). Default is true.
     */
    shouldCoverEntireScreen?: boolean;
    /** Determines whether modal backdrop is invisible. Default is false. */
    transparentBackground?: boolean;
    /** Determines whether or not the user can click on elements behind loading modal. User can
     * click on elements behind modal if set to true. Default is false.
     */
    disablePointerEvents?: boolean;
    logoSize?: 'md' | 'lg';
    /** Defines a specific z-index for loading modal. Default is 102. */
    zIndex?: number;
}

const LoadingModal: FC<IProps> = ({
    modalText,
    shouldCoverEntireScreen = true,
    transparentBackground = false,
    disablePointerEvents = false,
    logoSize = 'md',
    zIndex = 102,
}) => {
    return (
        <div
            className={`loadingModalBackground ${
                shouldCoverEntireScreen === false ? 'fit-inside-parent' : ''
            } ${transparentBackground ? 'transparent' : ''} ${
                disablePointerEvents ? 'disable-pointer-events' : ''
            } ${logoSize}`}
            style={{ zIndex }}
        >
            <div className="loadingModal">
                <p>{modalText}</p>
                <EvolonIcon className="companyIcon" />
            </div>
        </div>
    );
};

export default LoadingModal;
