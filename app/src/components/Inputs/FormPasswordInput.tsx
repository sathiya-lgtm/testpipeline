import { FC, ChangeEvent, useState, useEffect } from 'react';
import {
    FaRegQuestionCircle,
    FaCheck,
    FaTimes,
} from 'react-icons/fa';
import { GoEye, GoEyeClosed } from 'react-icons/go';
import '../../styles/components/Input.scss';

export interface IFormInputElement {
    columnMap: string;
    value?: string | null | undefined;
}

interface IProps {
    id?: string; 
    placeholder?: string;
    label: string;
    tooltip?: string;
    columnMap: string;
    value?: string | undefined | null;
    initialValue?: string | undefined | null;
    required?: boolean;
    disabled?: boolean;
    pattern?: string;
    title?: string;
    showConfirm?: boolean;
    onPasswordsMatched?: (
        matched: boolean,
        property: IFormInputElement
    ) => void;
    onChange: (property: IFormInputElement) => void;
}

const FormPasswordInput: FC<IProps> = ({
    id,
    placeholder,
    label,
    tooltip,
    columnMap,
    value,
    initialValue,
    required,
    disabled,
    pattern,
    title,
    showConfirm,
    onPasswordsMatched,
    onChange,
}: IProps) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [passwordValue, setPasswordValue] = useState<
        string | undefined | null
    >(initialValue);
    const [confirmValue, setConfirmValue] = useState<string | undefined | null>(
        initialValue
    );

    const onHandleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange({ columnMap, value: e.target.value });
        }
        setPasswordValue(e.target.value);
    };

    const onHandleConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (showConfirm && onPasswordsMatched) {
            onPasswordsMatched(e.target.value === passwordValue, {
                columnMap,
                value: passwordValue,
            });
        }
        setConfirmValue(e.target.value);
    };

    const onRenderPasswordCheck = () => {
        if (passwordValue === confirmValue) {
            return (
                <div className="passwords-match">
                    <span>Password match</span>
                    <FaCheck />
                </div>
            );
        }
        return (
            <div className="passwords-no-match">
                <span className="password-no-match-label">
                    Password do not match
                </span>
                <span className="password-no-match-icon">
                    <FaTimes />
                </span>
            </div>
        );
    };

    useEffect(() => {
        const matched = passwordValue === confirmValue;
        if (onPasswordsMatched) {
            onPasswordsMatched(matched, { columnMap, value: passwordValue });
        }
    }, []);

    return (
        <div id={id} className="form-password-input">
            {tooltip && label && (
                <span className="tooltip right" data-tooltip={tooltip}>
                    <span className="form-password-input-label">{label}</span>
                    <span className="form-password-input-icon">
                        <FaRegQuestionCircle className="form-password-input-icon" />
                    </span>
                </span>
            )}
            {!tooltip && label && (
                <span className="form-password-input-label">{label}</span>
            )}
            <div className="form-password-input-row">
                <input
                    className="form-password-input-field"
                    placeholder={placeholder}
                    type={showPassword === true ? 'text' : 'password'}
                    value={value as string}
                    onChange={onHandleChange}
                    required={required}
                    disabled={disabled}
                    pattern={pattern}
                    title={title}
                />
                <span
                    className="form-password-input-reveal"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword === true ? <GoEyeClosed /> : <GoEye />}
                </span>
            </div>
            {/* Show the confirmation password input */}
            {showConfirm && (
                <>
                    <span
                        className="tooltip right"
                        data-tooltip="Enter Confirmation Password"
                    >
                        <span className="form-password-input-label">
                            Confirm Password
                        </span>
                        <span className="form-password-input-icon">
                            <FaRegQuestionCircle className="form-password-input-icon" />
                        </span>
                    </span>
                    <div className="form-password-input-row">
                        <input
                            className="form-password-input-field"
                            placeholder="Enter Confirmation Password"
                            type={showPassword === true ? 'text' : 'password'}
                            value={confirmValue as string}
                            onChange={onHandleConfirmChange}
                            required
                            title="Enter Confirmation Password"
                        />
                    </div>
                    <div className="form-password-input-password-check">
                        {onRenderPasswordCheck()}
                    </div>
                </>
            )}
        </div>
    );
};

export default FormPasswordInput;
