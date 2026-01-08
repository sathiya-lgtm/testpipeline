// React
import React, { FC } from 'react';

// date-fns
import { format } from 'date-fns';

// Custom Types
import {
    IAIQueryBuilderKeywordMismatchObj,
    IAISearchTokens,
    // INLSearchTokens,
} from '../../../types/tng-api.interfaces';

// Styles
import '../../../styles/components/Filters/NaturalLanguageTokens.scss';

const convertUTCToLocalTime = (dateString: string) => {
    const date = new Date(dateString);
    const milliseconds = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    );
    const localTime = new Date(milliseconds);
    localTime.getDate(); // local date
    localTime.getHours(); // local hour
    return localTime;
};

interface IProps {
    // searchTokens: INLSearchTokens;
    searchTokens: IAISearchTokens;
    nonTokensResponse: IAIQueryBuilderKeywordMismatchObj | null;
}

// const SearchToken = ({ token }: { token: string }) => {
//     return <span className="search-token">{token}</span>;
// };

type SearchTokenProps = {
    token: string;
    isInvalidCamera?: boolean;
};

const SearchToken = ({ token, isInvalidCamera = false }: SearchTokenProps) => {
    return (
        <span
            className={`search-token ${
                isInvalidCamera ? 'invalid-camera' : ''
            }`}
        >
            {token}
        </span>
    );
};

const NaturalLanguageTokens: FC<IProps> = ({
    searchTokens,
    nonTokensResponse,
}) => {
    if (!searchTokens.start_date) {
        return null;
    }

    return (
        <div className="natural-language-tokens">
            <div className="dates">
                {searchTokens.start_date && (
                    <div style={{ flex: 1 }}>
                        <span className="label">Start Date: </span>
                        <SearchToken
                            // token={format(
                            //     new Date(
                            //         convertUTCToLocalTime(
                            //             searchTokens.start_date
                            //         )
                            //     ),
                            //     'MM-dd-yyyy hh:mm aa'
                            // )}
                            token={format(
                                searchTokens.start_date,
                                'MM-dd-yyyy hh:mm aa'
                            )}
                        />
                    </div>
                )}
                {searchTokens.end_date && (
                    <div style={{ flex: 1 }}>
                        <span className="label"> End Date: </span>
                        <SearchToken
                            // token={format(
                            //     new Date(
                            //         convertUTCToLocalTime(searchTokens.end_date)
                            //     ),
                            //     'MM-dd-yyyy hh:mm aa'
                            // )}
                            token={format(
                                searchTokens.end_date,
                                'MM-dd-yyyy hh:mm aa'
                            )}
                        />
                    </div>
                )}
            </div>

            {searchTokens.camera_names && (
                <div className="token-category">
                    <span className="label">Cameras: </span>
                    {searchTokens.camera_names.map((camera) => {
                        return <SearchToken token={camera} key={camera} />;
                    })}
                </div>
            )}

            {nonTokensResponse && nonTokensResponse.invalid_camera_names && (
                <div className="token-category">
                    <span className="label">Invalid Cameras: </span>
                    {nonTokensResponse.invalid_camera_names.map((camera) => {
                        return (
                            <SearchToken
                                token={camera}
                                key={camera}
                                isInvalidCamera={true}
                            />
                        );
                    })}
                </div>
            )}

            {searchTokens.event_type_filter && (
                <div className="token-category">
                    <span className="label">Event Type: </span>
                    {searchTokens.event_type_filter.map((event_type) => {
                        return (
                            <SearchToken token={event_type} key={event_type} />
                        );
                    })}
                </div>
            )}

            {searchTokens.events_filter && (
                <div className="token-category">
                    <span className="label">Events: </span>
                    {searchTokens.events_filter.map((event) => {
                        return <SearchToken token={event} key={event} />;
                    })}
                </div>
            )}

            {searchTokens.classifications_filter && (
                <div className="token-category">
                    <span className="label">Objects: </span>
                    {searchTokens.classifications_filter.map((object) => {
                        return <SearchToken token={object} key={object} />;
                    })}
                </div>
            )}

            {searchTokens.gender_types && (
                <div className="token-category">
                    <span className="label">Person: </span>
                    {searchTokens.gender_types.map((object) => {
                        return <SearchToken token={object} key={object} />;
                    })}
                </div>
            )}

            {searchTokens.vehicle_colors && (
                <div className="token-category">
                    <span className="label">Vehicle Color: </span>
                    {searchTokens.vehicle_colors.map((object) => {
                        return <SearchToken token={object} key={object} />;
                    })}
                </div>
            )}

            {searchTokens.vehicle_types && (
                <div className="token-category">
                    <span className="label">Vehicle Type: </span>
                    {searchTokens.vehicle_types.map((object) => {
                        return <SearchToken token={object} key={object} />;
                    })}
                </div>
            )}
        </div>
    );
};

export default NaturalLanguageTokens;
