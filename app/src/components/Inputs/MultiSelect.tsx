// React
import { FC, useMemo } from 'react';

// React Select
import Select, { MultiValue, StylesConfig } from 'react-select';

interface SelectOption {
    value: string;
    label: string;
}

interface IProps {
    id: string;
    className?: string;
    value: MultiValue<SelectOption> | null;
    onChange: (newValue: MultiValue<SelectOption>) => void;
    options: SelectOption[];
    maxHeight?: number;
}

const MultiSelect: FC<IProps> = ({
    id,
    className,
    value,
    options,
    onChange,
    maxHeight,
}) => {
    const customStyles = useMemo(() => {
        const styles: StylesConfig<SelectOption> = {
            control: (provided) => ({
                ...provided,
                borderRadius: '0px',
                background: 'none',
                border: '1px solid #6a737b',
                cursor: 'pointer',
            }),
            multiValue: (provided) => {
                return {
                    ...provided,
                    margin: 0,
                    marginRight: 5,
                    marginBottom: 5,
                    padding: 0,
                    background: '#6a737b',
                };
            },
            multiValueLabel: (provided) => ({
                ...provided,
                color: 'white',
            }),
            menu: (provided) => {
                return {
                    ...provided,
                    background: 'rgba(0, 0, 0, 0.9)',
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
                marginBottom: 5,
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
            id={id}
            className={className}
            styles={customStyles}
            value={value}
            options={options}
            onChange={onChange}
            isMulti
            isSearchable
        />
    );
};

export default MultiSelect;
