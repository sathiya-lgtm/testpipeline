import React, { ChangeEventHandler, FC } from 'react';

// Styles
import '../../styles/components/Toggle.scss';

interface ToggleProps {
    value: boolean;
    onToggleChange?: ChangeEventHandler<HTMLInputElement>;
    toggleOnText: string;
    toggleOffText: string;
    id?: string;
    disabled?: boolean;
}

const Toggle: FC<ToggleProps> = ({
    value,
    onToggleChange,
    toggleOnText,
    toggleOffText,
    id,
    disabled,
}) => {
    return (
        <label className={`Toggle ${disabled ? 'disabled' : ''}`} htmlFor={id}>
            <input
                type="checkbox"
                checked={value}
                onChange={onToggleChange}
                id={id}
                disabled={disabled}
            />
            <span className="slider round">
                <span className="toggleText">
                    {value ? toggleOnText : toggleOffText}
                </span>
            </span>
        </label>
    );
};

export default Toggle;
