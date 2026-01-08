/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable prettier/prettier */
// React
import React, { FC, useState } from 'react';

// React-icons
import { FaSearch } from 'react-icons/fa';
import { GoEye, GoEyeClosed } from 'react-icons/go';

// Styles
import '../../../styles/components/Filters/RecentSearches.scss';

interface IProps {
    recentSearches: string[];
    handleRecentSearchClick: (search: string) => Promise<void>;
}

const RecentSearches: FC<IProps> = ({
    recentSearches,
    handleRecentSearchClick,
}) => {
    const [hideSearches, setHideSearches] = useState(true);

    return (
        <div className="recentSearchesContainer">
            <div className="recent-searches-title-container">
                <h2>Recent Searches </h2>
                {hideSearches ? (
                    <button
                        type="button"
                        onClick={() => setHideSearches(!hideSearches)}
                    >
                        <GoEye />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setHideSearches(!hideSearches)}
                    >
                        <GoEyeClosed />
                    </button>
                )}
            </div>

            <ul>
                {!hideSearches &&
                    recentSearches.map((search) => {
                        return (
                            <li
                                key={search}
                                onClick={() => handleRecentSearchClick(search)}
                            >
                                <FaSearch className="search-icon" />
                                {search}
                            </li>
                        );
                    })}
            </ul>
        </div>
    );
};

export default RecentSearches;
