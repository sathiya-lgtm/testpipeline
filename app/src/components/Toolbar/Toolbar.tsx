// Imports
import { CSSProperties, FC, ReactElement } from 'react';
import { IconType } from 'react-icons';
import DownloadCSV from '../DownloadCSV/DownloadCSV';

// Scss
import '../../styles/components/Toolbar/Toolbar.scss';

export enum ToolbarAlignment {
    left,
    center,
    right,
}

export interface IToolbarButton {
    tooltip?: string;
    Icon: IconType;
}

export const ToolbarButton: FC<IToolbarButton> = ({
    tooltip,
    Icon,
}: IToolbarButton) => {
    if (tooltip) {
        return (
            <span className="label tooltip bottom" data-tooltip={tooltip}>
                <div className="toolbar-button">
                    <Icon />
                </div>
            </span>
        );
    }
    return (
        <div className="toolbar-button">
            <Icon />
        </div>
    );
};

export type ToolbarChildren = ReactElement<
    typeof ToolbarButton | typeof DownloadCSV
>;

export interface IToolbar {
    alignment?: ToolbarAlignment | undefined;
    children?: ToolbarChildren | ToolbarChildren[] | undefined;
}

const Toolbar: FC<IToolbar> = ({ alignment, children }) => {
    const style: CSSProperties = { justifyContent: 'flex-start' };
    if (alignment === ToolbarAlignment.left) {
        style.justifyContent = 'flex-start';
    }
    if (alignment === ToolbarAlignment.center) {
        style.justifyContent = 'center';
    }
    if (alignment === ToolbarAlignment.right) {
        style.justifyContent = 'flex-end';
    }
    return (
        <div style={style} className="toolbar">
            {children}
        </div>
    );
};

export default Toolbar;
