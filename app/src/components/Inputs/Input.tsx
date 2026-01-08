// React
import { ReactElement, FC } from 'react';

// Icons
import { GoEye, GoEyeClosed } from 'react-icons/go';
import HelpIcon from '../../images/icons/Help.svg?react';

// Styles
import '../../styles/components/Input.scss';

interface IProps {
    className: string;
    label: string;
    type: string;
    name: string;
    value: string | number;
    onChange: (e: any) => any;
    onBlur?: (e: any) => any;
    onFocus?: (e: any) => any;
    id?: string;
    placeholder?: string;
    autoComplete?: string;
    required?: boolean;
    showAsterisk?: boolean;
    disabled?: boolean;
    subText?: string;
    tooltip?: string;
    pattern?: string;
    title?: string;
    isPassword?: boolean;
    onClick?: (e: any) => any;
    isPasswordVisible?: boolean;
    minLength?: number;
    maxLength?: number;
}

const Input: FC<IProps> = ({
    className,
    label,
    type,
    name,
    value,
    onChange,
    onBlur,
    onFocus,
    id,
    placeholder,
    autoComplete,
    required,
    disabled,
    subText,
    showAsterisk = true,
    tooltip,
    pattern,
    title,
    isPassword = false,
    onClick,
    isPasswordVisible = false,
    minLength,
    maxLength,
}): ReactElement => {
    return (
        <label className="input-wrapper" htmlFor={name}>
            {tooltip ? (
                <div className="label">
                    <span
                        className="tooltip right data-tooltip wide-xl"
                        data-tooltip={tooltip}
                    >
                        <span className="label-text">{label}</span>
                        <HelpIcon className="help-icon" />
                    </span>
                </div>
            ) : (
                <span className="label-text">{label}</span>
            )}

            {required && showAsterisk && <span className="asterisk">*</span>}
            {subText && <div className="subText">{subText}</div>}

            <div className={`${isPassword ? 'password-field' : ''}`}>
                <input
                    id={id}
                    data-testid={id}
                    style={{ marginTop: 5 }}
                    className={`${className}`}
                    type={type}
                    placeholder={placeholder}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={(e) => onBlur?.(e.target.value)}
                    onFocus={(e) => onFocus?.(e.target.value)}
                    autoComplete={autoComplete}
                    required={required}
                    disabled={disabled}
                    pattern={pattern}
                    title={title}
                    minLength={minLength ? minLength : undefined}
                    maxLength={maxLength ? maxLength : undefined}
                />

                {isPassword ? (
                    <span
                        className="form-password-input-reveal"
                        onClick={onClick}
                    >
                        {isPasswordVisible ? <GoEyeClosed /> : <GoEye />}
                    </span>
                ) : (
                    ''
                )}
            </div>
        </label>
    );
};

export default Input;
