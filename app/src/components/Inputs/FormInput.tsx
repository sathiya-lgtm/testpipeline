import { FC, ChangeEvent, useState, useEffect } from 'react';
import { FaRegQuestionCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

import '../../styles/components/Input.scss';

export interface IFormInputElement {
    columnMap: string;
    value?: string | undefined | null;
}

interface IProps {
    id: string;
    placeholder?: string;
    type?: string;
    tabIndex?: number | undefined;
    label: string;
    tooltip?: string;
    columnMap: string;
    value?: string | undefined | null;
    autoComplete?: string;
    required?: boolean;
    disabled?: boolean;
    pattern?: string;
    title?: string;
    min?: string;
    max?: string;
    readonly?: boolean;
    onChange?: (e: IFormInputElement) => void;
}

const FormInput: FC<IProps> = ({
    id,
    placeholder,
    type,
    tabIndex,
    label,
    tooltip,
    columnMap,
    value,
    autoComplete,
    required,
    disabled,
    pattern,
    title,
    min,
    max,
    readonly,
    onChange,
}: IProps) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const isReadonly = readonly ?? false;
    
    useEffect(() => {
        if( type === 'password' ) {
        if(value === undefined || value === null || value === '') {
            setShowPassword(false);
        }
        }
    }, [value])

    const onHandleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange({ columnMap, value: newValue });
        }
    };


    if(type === 'password') {
        return (
            <div className="form-input">
                {tooltip && label && (
                    <span className="tooltip right wide-xl" data-tooltip={tooltip}>
                        <span className="form-input-label">{label}</span>
                        <span className="form-input-icon">
                            <FaRegQuestionCircle className="form-input-icon" />
                        </span>
                    </span>
                )}
                {!tooltip && label && (
                    <span className="form-input-label">{label}</span>
                )}
                <span className="form-input-field-password">
                    {!showPassword ? (
                        <input
                            id={id}
                            tabIndex={tabIndex}
                            className="form-input-field"
                            placeholder={placeholder}
                            type={type ?? 'text'}
                            value={value as string}
                            autoComplete={autoComplete}
                            onChange={onHandleChange}
                            required={required}
                            disabled={disabled}
                            pattern={pattern}
                            title={title}
                            min={min ?? ''}
                            max={max ?? ''}
                        />

                    ) : (
                    <input
                        id={id}
                        tabIndex={tabIndex}
                        className="form-input-field"
                        placeholder={placeholder}
                        type={'text'}
                        value={value as string}
                        autoComplete={autoComplete}
                        onChange={onHandleChange}
                        required={required}
                        disabled={disabled}
                        pattern={pattern}
                        title={title}
                        min={min ?? ''}
                        max={max ?? ''}
                    />
                    )}
                    <span onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </span>
            </div>
        );        
    } else {
        return (
            <div className="form-input">
                {tooltip && label && (
                    <span className="tooltip right wide-xl" data-tooltip={tooltip}>
                        <span className="form-input-label">{label}</span>
                        <span className="form-input-icon">
                            <FaRegQuestionCircle className="form-input-icon" />
                        </span>
                    </span>
                )}
                {!tooltip && label && (
                    <span className="form-input-label">{label}</span>
                )}
                {!readonly && (
                    <input
                        id={id}
                        tabIndex={tabIndex}
                        className="form-input-field"
                        placeholder={placeholder}
                        type={type ?? 'text'}
                        value={value as string}
                        autoComplete={autoComplete}
                        onChange={onHandleChange}
                        required={required}
                        disabled={disabled}
                        pattern={pattern}
                        title={title}
                        min={min ?? ''}
                        max={max ?? ''}
                    />
                )}
                {readonly && (
                    <span className="form-input-field-readonly">
                        {value}
                    </span>
                )}
            </div>
        );        
    }

};

export default FormInput;
