import {
    FC,
    ReactElement,
    useState,
    useEffect,
    MouseEvent,
    Children,
} from 'react';
import { IconType } from 'react-icons';
import { FaPlus, FaChevronRight, FaTimes } from 'react-icons/fa';
import '../../styles/components/Tree/Tree.scss';
import '../../styles/tooltip.scss';

export interface ITreeToolbarButton {
    Icon: IconType;
    tooltip?: string | null | undefined;
    data?: any | undefined | null;
    onClick: (data: any) => void;
    onMouseHover?: (tooltip: string) => void;
    onMouseLeave?: () => void;
}

export const TreeToolbarButton: FC<ITreeToolbarButton> = ({
    Icon,
    tooltip,
    data,
    onClick,
    onMouseHover,
    onMouseLeave,
}: ITreeToolbarButton) => {
    // Events
    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        if (onClick) {
            onClick(data);
        }
    };

    const handleMouseHover = () => {
        if (onMouseHover) {
            onMouseHover(tooltip ?? '');
        }
    };

    const handleMouseLeave = () => {
        if (onMouseLeave) {
            onMouseLeave();
        }
    };

    // Render
    return (
        <div
            className="tree-node-toolbar-button"
            onClick={handleClick}
            onMouseEnter={handleMouseHover}
            onMouseLeave={handleMouseLeave}
        >
            <Icon />
        </div>
    );
};

export interface IMultiSelectOption {
    Icon?: IconType;
    label: string;
    value?: any | undefined | null;
    active: boolean;
    onClick?: (active: boolean, value: any | undefined | null) => void;
}

export const MultiSelectOption: FC<IMultiSelectOption> = ({
    Icon,
    label,
    value,
    active,
    onClick,
}: IMultiSelectOption) => {
    // State
    const [optionActive, setOptionActive] = useState<boolean>(active);

    // Events
    const handleClick = () => {
        if (onClick) {
            onClick(!optionActive, value);
        }
        setOptionActive(!optionActive);
    };

    useEffect(() => {
        setOptionActive(active);
    }, [active]);

    // Render
    return (
        <div
            className={`toolbar-multi-select-button-option${
                optionActive ? '-active' : ''
            }`}
        >
            <span className="toolbar-multi-select-button-option-icon">
                {Icon && (
                    <>
                        <span className="toolbar-multi-select-button-option-label">
                            {label}
                        </span>
                        <Icon />
                    </>
                )}
            </span>
            <span
                className="toolbar-multi-select-button-option-label"
                onClick={handleClick}
            >
                {label}
            </span>
        </div>
    );
};

export type TreeToolbarMultiSelectButtonChildren = ReactElement<
    typeof MultiSelectOption
>;

export interface ITreeToolbarMultiSelectButton {
    tooltip?: string | undefined | null;
    children:
        | TreeToolbarMultiSelectButtonChildren[]
        | TreeToolbarMultiSelectButtonChildren
        | undefined
        | null;
    onMouseHover: (tooltip: string) => void;
    onMouseLeave: () => void;
}

export const TreeToolbarMultiSelectButton: FC<
    ITreeToolbarMultiSelectButton
> = ({
    tooltip,
    children,
    onMouseHover,
    onMouseLeave,
}: ITreeToolbarMultiSelectButton) => {
    // State
    const [expanded, toggleExpanded] = useState<boolean>(false);

    // Events
    const handleMouseEnter = () => {
        if (onMouseHover && tooltip) {
            onMouseHover(tooltip);
        }
    };

    const handleMouseLeave = () => {
        if (onMouseLeave) {
            onMouseLeave();
        }
    };

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`toolbar-multi-select-button${
                expanded ? '-expanded' : ''
            }`}
        >
            <div className="toolbar-multi-select-button-options">
                {children}
            </div>
            <div
                className="toolbar-multi-select-button-icon"
                onClick={() => toggleExpanded(!expanded)}
            >
                {(expanded && <FaTimes />) || <FaPlus />}
            </div>
        </div>
    );
};

export type TreeToolbarChildren = ReactElement<
    typeof TreeToolbarButton | typeof TreeToolbarMultiSelectButton
>;

export interface ITreeNode {
    Icon?: IconType;
    caption?: string;
    tooltip?: string;
    isExpanded?: boolean | null | undefined;
    onRenderToolbar: () =>
        | TreeToolbarChildren
        | TreeToolbarChildren[]
        | null
        | undefined;
    children?: any | any[] | undefined | null;
}

export const TreeNode: FC<ITreeNode> = ({
    Icon,
    caption,
    tooltip,
    isExpanded,
    onRenderToolbar,
    children,
}) => {
    // State
    const [expanded, toggleNode] = useState<boolean>(isExpanded ?? false);

    // Functions
    const showContent = () => {
        if (!children) return false;
        if (!expanded) return false;
        return true;
    };

    const getToggleIcon = () => {
        if (!expanded) return 'tree-node-toggle toggle-expand-all';
        return 'tree-node-toggle toggle-collapse-all';
    };

    // Render Functions
    const renderToolbar = (): any => {
        if (onRenderToolbar) {
            return onRenderToolbar();
        }
        return null;
    };

    // Effects
    useEffect(() => {
        toggleNode(isExpanded ?? expanded);
    }, [isExpanded]);

    return (
        <>
            <div className="tree-node" onClick={() => toggleNode(!expanded)}>
                {Icon && (
                    <div className="tree-node-icon">
                        <Icon />
                    </div>
                )}
                {(tooltip && (
                    <div className="tree-node-caption">
                        <span className="tooltip right" data-tooltip={tooltip}>
                            {caption}
                        </span>
                    </div>
                )) || <div className="tree-node-caption">{caption}</div>}

                <div className="tree-node-toolbar">{renderToolbar()}</div>
                {children && (
                    <div
                        className={getToggleIcon()}
                        onClick={() => toggleNode(!expanded)}
                    >
                        <FaChevronRight />
                    </div>
                )}
            </div>
            {showContent() && (
                <div className="tree-node-content">{children}</div>
            )}
        </>
    );
};

export type TreeChildren = ReactElement<typeof TreeNode>;

export interface ITreeContainerProps {
    filter?: string | null | undefined;
    children?: TreeChildren | TreeChildren[] | null | undefined;
    onExpandChanged?: (expanded: boolean) => void;
    onRenderHeader?: () => any | any[] | undefined | null;
    onRenderHeaderToolbar?: () => any | any[] | undefined | null;
}

const TreeContainer: FC<ITreeContainerProps> = ({
    filter,
    children,
    onExpandChanged,
    onRenderHeader,
    onRenderHeaderToolbar,
}) => {
    // State
    const [expanded, setExpanded] = useState<boolean>(false);

    // Renders
    const renderHeader = (): any | any[] | null | undefined => {
        if (onRenderHeader) {
            return onRenderHeader();
        }
        return null;
    };

    // Effects
    useEffect(() => {
        if (onExpandChanged) {
            onExpandChanged(!expanded);
        }
    }, [expanded]);

    const renderToolbar = (): any | any[] | null | undefined => {
        if (onRenderHeaderToolbar) {
            return onRenderHeaderToolbar();
        }
        return null;
    };

    const renderChildren = () => {
        if (filter) {
            const filteredChildren: TreeChildren[] = [];
            Children.forEach(children, (child: any) => {
                const captionValue = (child?.props as ITreeNode).caption ?? '';
                const filterValue = filter.toLowerCase();
                const compareValue = captionValue.toLowerCase();
                if (compareValue.indexOf(filterValue) >= 0) {
                    filteredChildren.push(child);
                }
            });
            if (filteredChildren.length === 0) {
                return (
                    <span className="tree-no-data">
                        No data was found with current filter criteria
                    </span>
                );
            }
            return filteredChildren;
        }
        return children;
    };

    return (
        <div className="tree-container">
            <div className="tree-container-header">
                <div className="tree-container-header-caption">
                    {renderHeader()}
                </div>
                <div className="tree-container-header-toolbar">
                    {renderToolbar()}
                </div>
                {(expanded && (
                    <div
                        className="tree-container-header-toggle toggle-expand-all"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <span>Expand All</span>
                        <FaChevronRight />
                    </div>
                )) || (
                    <div
                        className="tree-container-header-toggle toggle-collapse-all"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <span>Collapse All</span>
                        <FaChevronRight />
                    </div>
                )}
            </div>
            <div className="tree-container-body">{renderChildren()}</div>
        </div>
    );
};

export default TreeContainer;
