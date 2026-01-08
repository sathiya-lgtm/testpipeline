import React, { FC, ReactElement, ReactNode, Children, useState } from 'react';
import '../../styles/components/TabPanel/TabPanel.scss';

export interface ITabPageProps {
    label?: string;
    visible?: boolean;
    selected?: boolean;
    children?: string | ReactNode | Array<ReactNode> | null | undefined;
}

export const TabPage: FC<ITabPageProps> = ({
    label,
    visible,
    selected,
    children,
}: ITabPageProps) => {
    // Component Checks
    const isVisible = visible ?? true;
    const isSelected = selected ?? false;
    if (isVisible) {
        if (isSelected) {
            return (
                <div data-for={label} className="tab-page">
                    {children}
                </div>
            );
        }
    }
    return null;
};

export type TabPanelChild = ReactElement<typeof TabPage>;

export interface ITabPanelProps {
    children: TabPanelChild | Array<TabPanelChild>;
    defaultSelectedTabIndex?: number;
}

const TabPanel: FC<ITabPanelProps> = ({
    children,
    defaultSelectedTabIndex,
}: ITabPanelProps) => {
    // State
    const [selectedIndex, setSelectedIndex] = useState<number>(
        defaultSelectedTabIndex || 0
    );
    // Helpers
    const isTabSelected = (index: number) => {
        if (selectedIndex === index) return true;
        return false;
    };
    // Rendering
    const onRenderTabs = () => {
        return Children.map(children, (child: any, index: number) => {
            if (React.isValidElement(child)) {
                return (
                    <div
                        className={`tab-panel-button ${
                            isTabSelected(index) === true ? 'tab-selected' : ''
                        }`}
                        onClick={() => setSelectedIndex(index)}
                    >
                        <span className="tab-panel-button-label">
                            {(child.props as ITabPageProps).label}
                        </span>
                    </div>
                );
            }
            return null;
        });
    };

    const onRenderContent = () => {
        let content: any = null;
        Children.map(children, (child, index) => {
            if (isTabSelected(index)) {
                content = (child.props as ITabPageProps).children;
            }
            return child;
        });
        return content;
    };

    return (
        <div className="tab-panel">
            <div className="tab-panel-buttons">{onRenderTabs()}</div>
            <div className="tab-panel-content">{onRenderContent()}</div>
        </div>
    );
};

export default TabPanel;
