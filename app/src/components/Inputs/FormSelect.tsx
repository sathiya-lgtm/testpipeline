import {
    FC,
    useEffect,
    useState,
    useRef,
    CSSProperties,
    FocusEvent,
} from 'react';
import { FaRegQuestionCircle, FaChevronDown, FaTimes } from 'react-icons/fa';

// Sass Imports
import '../../styles/components/Input.scss';

export interface IFormSelectOption {
    value: string | null;
    label: string;
}

export interface IFormSelectProps {
    id: string;
    label?: string;
    tooltip?: string;
    value?: string | number | readonly string[] | undefined;
    placeholder?: string;
    nodatamessage?: string;
    tabIndex?: number | undefined;
    options: IFormSelectOption[] | null;
    onItemClick: (data: any) => void;
    onItemClear: () => void;
}

const FormSelect: FC<IFormSelectProps> = ({
    id,
    label,
    tooltip,
    value,
    placeholder,
    options,
    nodatamessage,
    tabIndex,
    onItemClick,
    onItemClear,
}) => {
    const optionsRef = useRef<Array<HTMLDivElement | null>>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string | undefined | null>('');
    const [showDropdown, setShowDropdown] = useState<Boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputStyles: CSSProperties = {};
    inputStyles.display = !showDropdown ? 'none' : 'inline-block';

    // Component Events
    const handleKeydown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event) {
            if (event.key === 'ArrowDown') {
                if (!showDropdown) {
                    setShowDropdown(true);
                    setSelectedIndex(selectedIndex);
                } else {
                    setSelectedIndex(selectedIndex + 1);
                }
            } else if (event.key === 'ArrowUp') {
                if (selectedIndex > 0) {
                    setSelectedIndex(selectedIndex - 1);
                } else {
                    setSelectedIndex(0);
                }
            } else if (event.key === 'Escape') {
                setShowDropdown(false);
                setInputValue('');
                setSelectedIndex(0);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                setShowDropdown(false);
                if (options) {
                    if (onItemClick) {
                        onItemClick(options[selectedIndex]);
                    }
                    setSelectedIndex(0);
                }
            }
        }
    };

    const handleClickChevron = () => {
        setShowDropdown(!showDropdown);
        setInputValue('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleLostFocus = (event: FocusEvent<HTMLInputElement>) => {
        if (event) {
            setShowDropdown(false);
        }
    };

    const handleClear = () => {
        setInputValue(null);
        setShowDropdown(false);
        if (onItemClear) {
            onItemClear();
        }
    };

    const handleClick = () => {
        setInputValue(value as string);
        setShowDropdown(true);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleOptionClick = (index: number) => {
        setShowDropdown(false);
        if (options) {
            const data = options[index];
            if (onItemClick) {
                onItemClick(data);
            }
        }
    };

    // Component Functions
    const onRenderOptions = () => {
        const renderOptions: any[] = [];
        if (options) {
            options.forEach((option: IFormSelectOption, index) => {
                const setRef = (e1: HTMLDivElement | null) => {
                    optionsRef.current[index] = e1;
                };
                let isValid: boolean = true;
                const filterValue = inputValue ?? '';
                if (filterValue) {
                    if (option.label.indexOf(filterValue) < 0) {
                        isValid = false;
                    }
                }
                if (isValid) {
                    renderOptions.push(
                        <div
                            className={
                                index === selectedIndex
                                    ? 'form-select-option-selected'
                                    : 'form-select-option'
                            }
                            data-index={index}
                            key={option.value}
                            ref={setRef}
                            onClick={() => handleOptionClick(index)}
                        >
                            {option.label}
                        </div>
                    );
                }
            });
        }
        return renderOptions;
    };

    // Component Hooks
    useEffect(() => {
        const element = document.getElementById('form-select-input');
        if (element) {
            element.addEventListener(
                'keydown',
                handleKeydown as unknown as EventListener
            );
        }

        return () => {
            if (element) {
                element.removeEventListener(
                    'keydown',
                    handleKeydown as unknown as EventListener
                );
            }
        };
    }, []);

    useEffect(() => {
        const element = document.getElementById('form-select-input');
        if (element) {
            element.addEventListener(
                'keydown',
                handleKeydown as unknown as EventListener
            );
        }

        return () => {
            if (element) {
                element.removeEventListener(
                    'keydown',
                    handleKeydown as unknown as EventListener
                );
            }
        };
    }, []);

    useEffect(() => {
        setShowDropdown(false);
    }, [value]);

    useEffect(() => {
        if (optionsRef.current[selectedIndex]) {
            optionsRef.current[selectedIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
            optionsRef.current[selectedIndex].focus();
        }
    }, [selectedIndex]);

    return (
        <div id={id} className="form-select" onBlur={handleLostFocus}>
            <div className="form-select-label">
                {label && (
                    <span className="form-select-label-text">{label}</span>
                )}
                {tooltip && (
                    <span className="tooltip wide right" data-tooltip={tooltip}>
                        <FaRegQuestionCircle
                            className="form-select-label-icon"
                            size="1.2em"
                        />
                    </span>
                )}
            </div>
            <div className="form-select-container">
                <input
                    ref={inputRef}
                    className="form-select-input"
                    type="text"
                    placeholder={placeholder}
                    value={inputValue as string}
                    tabIndex={tabIndex}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeydown}
                    style={inputStyles}
                />
                {!showDropdown && (
                    <span
                        className={
                            value
                                ? 'form-select-input'
                                : 'form-select-placeholder'
                        }
                        onClick={handleClick}
                    >
                        {value ?? placeholder}
                    </span>
                )}
                <span className="form-select-clear" onClick={handleClear}>
                    <FaTimes />
                </span>
                <span
                    className="form-select-chevron"
                    onClick={handleClickChevron}
                >
                    <FaChevronDown size="1.2em" />
                </span>
            </div>
            {showDropdown && (
                <div className="form-select-options">{onRenderOptions()}</div>
            )}
            {showDropdown && options?.length === 0 && (
                <div className="form-select-options">
                    <span className="form-select-option">
                        {nodatamessage ?? 'No Data'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default FormSelect;
