// React
import { FC, useMemo } from 'react';

// React Select
import Select, { StylesConfig, SingleValue } from 'react-select';

// Custom Types
import { SelectOption } from '../../types/interfaces';

interface IProps {
    id: string;
    value?: SelectOption | null;
    onChange?: (newValue: SingleValue<SelectOption>) => void | Promise<void>;
    options?: SelectOption[] | null;
    className?: string;
    classNamePrefix?: string;
    disabled?: boolean;
    placeholder?: string;
    isClearable?: boolean;
    isSearchable?: boolean;
    noOptionsMessage?: string;
    required?: boolean;
    maxHeight?: number;
}

const SingleSelect: FC<IProps> = ({
    id,
    className,
    classNamePrefix,
    value,
    onChange,
    options,
    disabled,
    placeholder,
    isClearable = true,
    isSearchable = true,
    noOptionsMessage = 'No options available',
    required,
    maxHeight,
}) => {
    const customStyles = useMemo(() => {
        const styles: StylesConfig<SelectOption> = {
            control: (provided, { isDisabled }) => ({
                ...provided,
                borderRadius: '0px',
                background: 'none',
                border: '1px solid #6a737b',
                opacity: isDisabled ? '0.5' : '1',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
            }),

            singleValue: (provided) => {
                return {
                    ...provided,
                    color: 'white',
                };
            },
            multiValueLabel: (provided) => ({
                ...provided,
                color: 'white',
            }),
            menu: (provided) => {
                return {
                    ...provided,
                    background: 'rgba(0, 0, 0, 1)',
                    zIndex: 10,
                };
            },
            menuList: (provided) => {
                return {
                    ...provided,
                    maxHeight: maxHeight || 250,
                };
            },
            option: (provided, state) => {
                return {
                    ...provided,
                    background: state.isFocused ? 'rgba(50, 50, 50, 0.9)' : '',
                    textDecoration: state.isDisabled ? 'line-through' : 'none',
                    cursor: state.isDisabled ? 'not-allowed' : 'default',
                };
            },

            placeholder: (provided) => ({
                ...provided,
                marginBottom: 5,
                color: 'gray',
            }),
            input: (provided) => ({
                ...provided,
                margin: 0,
                marginBottom: 0,
                padding: 0,
                color: 'white',
            }),
            valueContainer: (provided) => ({
                ...provided,
                paddingTop: '0.5rem',
                paddingLeft: '0.625rem',
                paddingRight: '0.6rem',
                paddingBottom: 'calc(0.63rem - 5px)',
            }),
        };

        return styles;
    }, [maxHeight]);

    return (
        <Select
            required={required || false}
            id={id}
            isMulti={false}
            className={className}
            classNamePrefix={classNamePrefix}
            isClearable={isClearable}
            styles={customStyles}
            value={value}
            options={options ?? []}
            onChange={onChange}
            isSearchable={isSearchable}
            isDisabled={disabled}
            placeholder={placeholder}
            noOptionsMessage={({ inputValue }) =>
                !inputValue ? noOptionsMessage : 'No results found'
            }
            // menuPortalTarget={document.body}
            // menuPosition="fixed"
        />
    );
};

export default SingleSelect;
