import React, { FC, useState } from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

// sass files
import '../../styles/components/SearchBar/SearchBar.scss';
import '../../styles/tooltip.scss';

// components
import DownloadCSV, { Column } from '../DownloadCSV/DownloadCSV';

export interface ISearchBarProps {
    caption?: string;
    placeHolder?: string;
    object_name?: string;
    data?: any;
    headers?: Column[];
    filename?: string;
    onAddNew?: () => void;
    onSearch?: (searchValue: string) => void;
    onClear?: () => void;
}

const SearchBar: FC<ISearchBarProps> = ({
    caption,
    placeHolder,
    object_name,
    data,
    headers,
    filename,
    onAddNew,
    onSearch,
    onClear,
}: ISearchBarProps) => {
    const [searchValue, setSearchValue] = useState<string>('');
    const handleKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (searchValue.length > 0) {
                if (onSearch) {
                    onSearch(searchValue);
                }
            }

            if (searchValue.length === 0) {
                if (onClear) {
                    onClear();
                }
            }
        } else if (event.key === 'Backspace') {
            if (searchValue.length === 1) {
                if (onClear) {
                    onClear();
                }
            }
        } else if (event.key === 'Escape') {
            if (onClear) {
                onClear();
            }
            setSearchValue('');
        }
        if (searchValue.length === 0) {
            if (onClear) {
                onClear();
            }
        }
    };

    const handleClear = () => {
        if (onClear) {
            onClear();
        }
        setSearchValue('');
    };

    const handlAddNew = () => {
        if (onAddNew) {
            onAddNew();
        }
    };

    return (
        <div className="search-bar">
            <h2 className="search-bar-caption">{caption}</h2>
            {onAddNew && (
                <span className="search-bar-add-new" onClick={handlAddNew}>
                    <span
                        className="tooltip bottom wide"
                        data-tooltip={`Add a new ${object_name}`}
                    >
                        <FaPlus />
                    </span>
                </span>
            )}
            {filename && headers && (
                <DownloadCSV
                    data={data}
                    object_name={object_name}
                    headers={headers}
                    filename={filename}
                    filter={searchValue}
                />
            )}
            <div className="search-bar-input">
                <div className="search-bar-icon">
                    <FaSearch />
                </div>
                <input
                    className="search-bar-text"
                    placeholder={placeHolder}
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleKeydown}
                />
                <div className="search-bar-clear" onClick={handleClear}>
                    <IoMdClose />
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
