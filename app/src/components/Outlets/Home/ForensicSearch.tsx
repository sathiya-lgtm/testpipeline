/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

// React
import { useContext, useState, useMemo, useEffect } from 'react';

// Third Party
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MultiValue, SingleValue } from 'react-select';
import { parseISO } from 'date-fns';

// Api Calls
// import forensicSearchPaginated, {
//     ForesenicSearchOverviewData,
//     ForensicSearchPaginatedResponse,
// } from '../../../api_calls/forensicSearchPaginated';
// import nlForensicSearchPaginated from '../../../api_calls/nlForensicSearchPaginated';
// import getKeywords from '../../../api_calls/getKeywords';
// import getNLQueryTokens from '../../../api_calls/getNLQueryTokens';
import forensicSearch2, {
    IForensicSearchParams,
} from '../../../api_calls/forensicSearch2';
import getAIQueryBuilder, {
    IAIForensicQueryBuilderInputObj,
} from '../../../api_calls/getAIQueryBuilder';
import aiForensicSearchPaginated, {
    IAIForensicQueryObj,
} from '../../../api_calls/aiForensicSearchPaginated';

// Components
import ForensicSearchTable from '../../Tables/ForensicSearchTable';
// import PaginatedClipsTable from '../../Tables/PaginatedClipsTable';
import ForensicSearchFilter from '../../Filters/ForensicSearch/ForensicSearchFilter';
import LoadingModal from '../../Modals/LoadingModal';
import Select from '../../Inputs/Select';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';
import { ListTargetContext } from '../../../contexts/ListTarget';

// Custom
import { useServiceProviders } from '../../../hooks';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';
import getTimeZoneName from '../../../utils/getTimeZoneName';

// Utils
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
// import stripTimeZoneFromClips from '../../../utils/stripTimeZoneFromClips';
import getAccountType from '../../../utils/getAccountType';

// Controller
import {
    autoRefreshTimeoutSeconds,
    generateDefaultFilterStartDate,
    generateDefaultFilterEndDate,
    // buildNLSearch,
    addSearchToHistory,
    getSearchHistory,
    buildAISearch,
} from '../../Filters/ForensicSearch/ForensicSearchFilter.controller';

// Custom Types
import {
    // IClip,
    // INLSearchTokens,
    IServiceProvider,
    INewForensicClip,
    IAISearchTokens,
    IAIQueryBuilderKeywordMismatchObj,
} from '../../../types/tng-api.interfaces';
import { AccountType } from '../../../types/enums';
import { SelectOption, IUser } from '../../../types/interfaces';

// Styles
import '../../../styles/components/Outlets/Home/ForensicSearch.scss';

const ForensicSearch = () => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const { listTarget } = useContext(ListTargetContext);

    const [searchTab, setSearchTab] = useState<'nl' | 'fs'>('fs');
    const [autoRefreshText, setAutoRefreshText] = useState<string>('');
    const [isClipModalOpen, setIsClipModalOpen] = useState<boolean>(false);
    // const [searchTokens, setSearchTokens] = useState<INLSearchTokens>({
    //     date_to: '',
    //     date_from: '',
    // });

    const accountType: AccountType = useMemo(
        () => getAccountType(activeUser),
        [activeUser]
    );

    /** Default Customer option if active user is Customer and necessary data is available. */
    const defaultCustomer = useMemo(() => {
        if (
            accountType === AccountType.Customer &&
            activeUser?.account_name &&
            activeUser?.client_account
        )
            return {
                label: activeUser.account_name,
                value: String(activeUser.client_account),
            };
        return null;
    }, [activeUser]);

    // NL Stuff
    const [nlSearchInput, setNlSearchInput] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>(
        getSearchHistory(activeUser?.username || '')
    );

    const [selectedNlCustomers, setSelectedNlCustomers] =
        useState<SelectOption | null>(defaultCustomer);
    const [selectedNlSites, setSelectedNlSites] = useState<SelectOption | null>(
        null
    );
    const [searchTokens, setSearchTokens] = useState<IAISearchTokens>({
        start_date: '',
        end_date: '',
        // site_id: Number(selectedNlSites?.value),
    });

    const [queryBuilderNonTokensResponse, setQueryBuilderNonTokensResponse] =
        useState<IAIQueryBuilderKeywordMismatchObj | null>(null);

    const [aiContextSearchInputs, setAIContextSearchInputs] =
        useState<IAIForensicQueryObj | null>(null);

    // Pagination Stuff
    const [forensicSearchData, setForensicSearchData] = useState<
        INewForensicClip[]
    >([]);
    const [nextPageAvailable, setNextPageAvailable] = useState(false);
    const [filterStart, setFilterStart] = useState(
        generateDefaultFilterStartDate()
    ); // Example date-time format: 2023-03-16T01:41
    const [filterEnd, setFilterEnd] = useState(generateDefaultFilterEndDate()); // Example date-time format: 2023-03-16T01:41
    // const [forensicSearchOverview, setForensicSearchOverview] =
    //     useState<ForesenicSearchOverviewData | null>(null);
    // const [paginatedFilteredClips, setPaginatedFilteredClips] = useState<
    //     IClip[]
    // >([]);

    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SelectOption | null>(null);
    const [selectedCustomers, setSelectedCustomers] =
        useState<SelectOption | null>(defaultCustomer);
    const [selectedSites, setSelectedSites] = useState<SelectOption | null>(
        null
    );
    const [selectedCameras, setSelectedCameras] = useState<SelectOption | null>(
        null
    );
    const [selectedClassifications, setSelectedClassifications] =
        useState<MultiValue<SelectOption> | null>(null);
    const [selectedEventTypes, setSelectedEventTypes] =
        useState<MultiValue<SelectOption> | null>(null);
    const [selectedEvents, setSelectedEvents] =
        useState<MultiValue<SelectOption> | null>(null);
    const [auditModeEnabled, setAuditModeEnabled] = useState(false);
    const [aiColumnsEnabled, setAIColumnsEnabled] = useState(false);
    // const [hashArray, setHashArray] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    // const [lastIndex, setLastIndex] = useState(0);
    // const [previousIndexes, setPreviousIndexes] = useState<number[]>([]);

    // Auto Refresh Stuff
    const [canRefreshSearch, setCanRefreshSearch] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(
        localStorage.getItem('autoRefresh') === 'on'
    );
    const [secondsToNextRefresh, setSecondsToNextRefresh] = useState(-1);

    // const onPaginatedSuccess = async (
    //     response: ForensicSearchPaginatedResponse | null
    // ) => {
    //     if (response === null) {
    //         setForensicSearchOverview(null);
    //         setPaginatedFilteredClips([]);
    //         toast.warn('No clips found under search criteria.');
    //         return;
    //     }

    //     if (response.set) {
    //         setForensicSearchOverview(response.set);
    //     }

    //     let last_index = Number.MAX_VALUE;
    //     // let pageToRead = nextPage;
    //     let pageToRead = currentIndex;
    //     const newHashArray = [];
    //     const newClips: IClip[] = [];

    //     for (const field in response) {
    //         if (field === 'set') {
    //             // this should be the info
    //             pageToRead = 0;
    //             // console.log('fs query info: ', JSON.stringify(response[field]));
    //         } else if (field === 'rows') {
    //             const rows: any = response[field];
    //             for (const dayronId in rows) {
    //                 newClips.push(rows[dayronId]);
    //                 if (rows[dayronId].alert_id < last_index) {
    //                     last_index = rows[dayronId].alert_id;
    //                 }
    //             }
    //         } else if (response[field].hash) {
    //             newHashArray.push(response[field].hash);
    //             if (response[field].rows) {
    //                 const { rows } = response[field];
    //                 for (const dayronId in rows) {
    //                     newClips.push(rows[dayronId]);
    //                     if (rows[dayronId].alert_id < last_index) {
    //                         last_index = rows[dayronId].alert_id;
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     if (!previousIndexes.includes(lastIndex)) {
    //         previousIndexes.push(lastIndex);
    //     }

    //     setLastIndex(last_index);

    //     if (pageToRead === 0) {
    //         setPreviousIndexes([]);
    //         setHashArray(newHashArray);
    //     }

    //     stripTimeZoneFromClips(newClips);
    //     newClips.sort((a: IClip, b: IClip) => {
    //         if (a.created_at < b.created_at) {
    //             return 1;
    //         }

    //         if (a.created_at > b.created_at) {
    //             return -1;
    //         }

    //         return 0;
    //     });

    //     setPaginatedFilteredClips(newClips);
    // };

    const onPaginatedSuccess = (response: any) => {
        if (response.data.length === 0) {
            toast.warn('No clips found under search criteria.');
        }

        if (response.data.length === 51) {
            setNextPageAvailable(true);
            setForensicSearchData((previousState) => [
                ...previousState,
                ...response.data.slice(0, -1),
            ]);
        } else {
            setNextPageAvailable(false);
            setForensicSearchData((previousState) => [
                ...previousState,
                ...response.data,
            ]);
        }
    };

    // const keywordsQuery = useQuery(
    //     ['keywords', selectedServiceProvider?.value || 0],
    //     () => getKeywords(activeUser, Number(selectedServiceProvider?.value)),
    //     {
    //         enabled:
    //             (!!activeUser && accountType !== AccountType.Evolon) ||
    //             !!selectedServiceProvider,
    //     }
    // );

    // const clipsMutationPaginated = useMutation({
    //     mutationFn: forensicSearchPaginated,
    //     onSuccess: (data) => onPaginatedSuccess(data),
    //     onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    // });

    // const forensicSearchMutation = useMutation({
    //     mutationFn: forensicSearch2,
    //     onSuccess: (data) => {
    //         if (data.data.length === 0) {
    //             toast.warn('No clips found under search criteria.');
    //         }

    //         if (data.data.length === 51) {
    //             setNextPageAvailable(true);
    //             setForensicSearchData((previousState) => [
    //                 ...previousState,
    //                 ...data.data.slice(0, -1),
    //             ]);
    //         } else {
    //             setNextPageAvailable(false);
    //             setForensicSearchData((previousState) => [
    //                 ...previousState,
    //                 ...data.data,
    //             ]);
    //         }
    //     },
    //     onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    // });
    const forensicSearchMutation = useMutation({
        mutationFn: forensicSearch2,
        onSuccess: (data) => onPaginatedSuccess(data),
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    // AI Forensic Search API Call Mutation
    // const nlSearchMutation = useMutation({
    //     mutationFn: nlForensicSearchPaginated,
    //     onSuccess: (data) => onPaginatedSuccess(data),
    // });

    // const nlQueryTokensMutation = useMutation({
    //     mutationFn: getNLQueryTokens,
    // });

    const aiSearchPaginatedMutation = useMutation({
        mutationFn: aiForensicSearchPaginated,
        onSuccess: (data) => onPaginatedSuccess(data),
        // onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const aiQueryBuilderMutation = useMutation({
        mutationFn: getAIQueryBuilder,
        // onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const serviceProvidersQuery = useServiceProviders({
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Evolon,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
    });

    const serviceProviderOptions = useMemo(() => {
        if (serviceProvidersQuery.data) {
            const serviceProvidersSorted: IServiceProvider[] =
                serviceProvidersQuery.data.sort(sortByName);

            return OptionsConverter.convertServiceProvidersToOptions(
                serviceProvidersSorted
            );
        }

        return [];
    }, [serviceProvidersQuery.data]);

    // const handleNLForensicSearch = async (user: IUser, query: string) => {
    //     if (!keywordsQuery.data) {
    //         return;
    //     }

    //     if (accountType === AccountType.Evolon && !selectedServiceProvider) {
    //         toast.error('Need to select a service provider');
    //         return;
    //     }

    //     if (!query) {
    //         toast.warning('Can not enter a blank search.');
    //         return;
    //     }

    //     try {
    //         const nlQueryTokens = await nlQueryTokensMutation.mutateAsync({
    //             user,
    //             query,
    //             service_provider_id:
    //                 Number(selectedServiceProvider?.value) || undefined,
    //         });

    //         const searchObj = buildNLSearch(
    //             keywordsQuery.data,
    //             nlQueryTokens,
    //             auditModeEnabled ? 'audit' : 'standard',
    //             0,
    //             Number(selectedServiceProvider?.value) || undefined
    //         );
    //         await nlSearchMutation.mutateAsync({
    //             user,
    //             nlSearch: searchObj,
    //         });

    //         const newRecentSearches = addSearchToHistory(query, user.username);
    //         setRecentSearches(newRecentSearches);
    //         setSearchTokens(nlQueryTokens);

    //         const searchEndTime = new Date(nlQueryTokens.date_to).getTime();
    //         const now = Date.now();

    //         if (searchEndTime > now) {
    //             setCanRefreshSearch(true);
    //             setSecondsToNextRefresh(autoRefreshTimeoutSeconds);
    //         }
    //     } catch (err) {
    //         handleHttpRequestError(err, setActiveUser, navigate);
    //     }
    // };

    const handleAIForensicSearch = async (
        user: IUser,
        user_query: string,
        site_id: number
    ) => {
        try {
            // AI Query Builder API Call Input
            const aiQueryBuilderInputs: IAIForensicQueryBuilderInputObj = {
                site_id,
                user_query,
                timezone: getTimeZoneName(),
            };

            if (selectedServiceProvider) {
                aiQueryBuilderInputs['service_provider_id'] = Number(
                    selectedServiceProvider?.value
                );
            }

            const nlQueryBuilderResponse =
                await aiQueryBuilderMutation.mutateAsync({
                    user,
                    aiQueryBuilderInputs,
                });

            // AI Forensic Search API Call Input
            const searchObj = buildAISearch(
                nlQueryBuilderResponse.tokens,
                site_id,
                auditModeEnabled,
                51,
                Number(selectedServiceProvider?.value) || undefined
            );

            await aiSearchPaginatedMutation.mutateAsync({
                user,
                aiSearch: searchObj,
            });

            setAIContextSearchInputs(searchObj);

            const newRecentSearches = addSearchToHistory(
                user_query,
                user.username
            );
            setRecentSearches(newRecentSearches);
            setSearchTokens(nlQueryBuilderResponse.tokens);
            setQueryBuilderNonTokensResponse(
                nlQueryBuilderResponse.keyword_mismatch_tokens
            );

            const searchEndTime = new Date(
                nlQueryBuilderResponse.tokens.end_date
            ).getTime();
            const now = Date.now();

            if (searchEndTime > now) {
                setCanRefreshSearch(true);
                setSecondsToNextRefresh(autoRefreshTimeoutSeconds);
            }
        } catch (err) {
            handleHttpRequestError(err, setActiveUser, navigate);
        }
    };

    const resetPaginationStuff = () => {
        setForensicSearchData([]);
        // setPaginatedFilteredClips([]);
        // setForensicSearchOverview(null);
        // setSearchTokens({ date_from: '', date_to: '' });
        setSearchTokens({ start_date: '', end_date: '' });
        setQueryBuilderNonTokensResponse(null);
        setAIContextSearchInputs(null);
        setCurrentIndex(0);
        // setHashArray([]);
        // setPreviousIndexes([]);
        // setLastIndex(0);
        setAutoRefreshText('');
    };

    const handleInitialClipSearch = async () => {
        if (!activeUser) {
            return;
        }

        if (accountType === AccountType.Evolon && !selectedServiceProvider) {
            toast.error('Need to select a service provider');
            return;
        }

        resetPaginationStuff();

        if (searchTab === 'nl') {
            if (
                accountType === AccountType.Evolon &&
                !selectedServiceProvider
            ) {
                toast.error('Need to select a service provider');
                return;
            }

            if (!selectedNlCustomers) {
                toast.warn('Need to select a Customer.');
                return;
            }

            if (!selectedNlSites) {
                toast.warn('Need to select a Site.');
                return;
            }

            if (!nlSearchInput) {
                toast.warning('Can not enter a blank search.');
                return;
            } else if (nlSearchInput.length > 512) {
                toast.warning(
                    'Input exceeds the maximum allowed length (512 characters).'
                );
                return;
            }

            // setSearchTokens({ date_from: '', date_to: '' });
            // await handleNLForensicSearch(activeUser, nlSearchInput);
            // setSearchTokens({ start_date: '', end_date: '' });
            await handleAIForensicSearch(
                activeUser,
                nlSearchInput,
                Number(selectedNlSites?.value)
            );
        } else if (searchTab === 'fs') {
            const startDateObj = parseISO(filterStart);
            const endDateObj = parseISO(filterEnd);

            const start_date = startDateObj
                .toISOString()
                .replace('T', ' ') // replace 'T' with space
                .replace('Z', '') // remove 'Z'
                .replace('.000', '.999999');
            const end_date = endDateObj
                .toISOString()
                .replace('T', ' ') // replace 'T' with space
                .replace('Z', '') // remove 'Z'
                .replace('.000', '.999999');

            let service_provider_account_id: number | undefined;
            if (selectedServiceProvider) {
                service_provider_account_id = Number(
                    selectedServiceProvider.value
                );
            }

            const forensicSearchParams: IForensicSearchParams = {
                start_date,
                end_date,
                service_provider_account_id,
                account_id: selectedCustomers?.value
                    ? Number(selectedCustomers?.value)
                    : 0,
                site_id: selectedSites?.value ? Number(selectedSites.value) : 0,
                camera_id: selectedCameras?.value
                    ? Number(selectedCameras.value)
                    : 0,
                page_limit: 51,
                is_audit_mode: auditModeEnabled,
            };

            if (selectedClassifications) {
                forensicSearchParams.classifications_filter =
                    selectedClassifications.map(
                        (classification) => classification.value
                    );
            }

            if (selectedEventTypes) {
                forensicSearchParams.event_type_filter = selectedEventTypes.map(
                    (eventType) => eventType.value
                );
            }

            if (selectedEvents) {
                forensicSearchParams.events_filter = selectedEvents.map(
                    (event) => event.value
                );
            }

            forensicSearchMutation.mutate({
                user: activeUser as IUser,
                forensicSearch: forensicSearchParams,
            });

            // Handles the auto refresh logic
            const searchEndTime = new Date(filterEnd).getTime();
            const now = Date.now();

            if (searchEndTime > now) {
                setCanRefreshSearch(true);
                setSecondsToNextRefresh(autoRefreshTimeoutSeconds);
            }
        }
    };

    useEffect(() => {
        // Need to freeze auto refresh if clip modal is open
        let timer: NodeJS.Timeout | undefined;

        if (
            currentIndex === 0 &&
            canRefreshSearch &&
            autoRefresh &&
            secondsToNextRefresh > 0 &&
            !isClipModalOpen
        ) {
            timer = setTimeout(() => {
                setSecondsToNextRefresh((prevValue) => prevValue - 1);
                setAutoRefreshText(
                    `Table will refresh in ${
                        secondsToNextRefresh - 1
                    } seconds...`
                );
            }, 1000);
        } else if (
            currentIndex === 0 &&
            canRefreshSearch &&
            autoRefresh &&
            secondsToNextRefresh === 0 &&
            !isClipModalOpen
        ) {
            handleInitialClipSearch();
        } else if (currentIndex !== 0) {
            setSecondsToNextRefresh(-1);
            setAutoRefreshText('');
        }

        return () => {
            clearInterval(timer);
        };
    }, [
        canRefreshSearch,
        autoRefresh,
        secondsToNextRefresh,
        isClipModalOpen,
        currentIndex,
    ]);

    useEffect(() => {
        setCanRefreshSearch(false);
        setAutoRefreshText('');
    }, [
        nlSearchInput,
        selectedNlCustomers,
        selectedNlSites,
        filterStart,
        filterEnd,
        selectedCustomers,
        selectedSites,
        selectedCameras,
        selectedClassifications,
        selectedEventTypes,
        selectedEvents,
        searchTab,
    ]);

    useEffect(() => {
        if (forensicSearchData.length > 50) {
            setCanRefreshSearch(false);
            setAutoRefreshText('');
        }
    }, [forensicSearchData]);

    useEffect(() => {
        if (!autoRefresh) {
            setAutoRefreshText('');
        } else {
            setSecondsToNextRefresh(autoRefreshTimeoutSeconds);
        }
    }, [autoRefresh]);

    useEffect(() => {
        resetPaginationStuff();
    }, [searchTab, auditModeEnabled]);

    useEffect(() => {
        if (
            listTarget !== null &&
            listTarget.src === 'camera-list' &&
            accountType === AccountType.Evolon
        ) {
            if (listTarget.type === 'service-provider') {
                const listTargetServiceProviderOption: SelectOption = {
                    label: listTarget.serviceProviderName,
                    value: String(listTarget.serviceProviderId),
                };

                setSelectedServiceProvider(listTargetServiceProviderOption);
            }
        }
    }, [listTarget, accountType]);

    return (
        <div id="ForensicSearch" className="ForensicSearch">
            {accountType === AccountType.Evolon && (
                <div
                    className="select-container form-item"
                    style={{ marginBottom: '2rem' }}
                >
                    <label htmlFor="service-providers">
                        <span>Under SP Account</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="service-providers"
                        value={selectedServiceProvider}
                        onChange={(option) => {
                            if (
                                option?.value === selectedServiceProvider?.value
                            ) {
                                return;
                            }

                            setSelectedServiceProvider(
                                option as SingleValue<SelectOption>
                            );
                        }}
                        options={serviceProviderOptions}
                        isClearable={false}
                        required
                    />
                </div>
            )}
            <ForensicSearchFilter
                searchTab={searchTab}
                setSearchTab={setSearchTab}
                // keywordsData={keywordsQuery.data}
                // setFilteredClips={setPaginatedFilteredClips}
                filterStart={filterStart}
                setFilterStart={setFilterStart}
                filterEnd={filterEnd}
                setFilterEnd={setFilterEnd}
                selectedServiceProvider={selectedServiceProvider}
                selectedCustomers={selectedCustomers}
                setSelectedCustomers={setSelectedCustomers}
                selectedSites={selectedSites}
                setSelectedSites={setSelectedSites}
                selectedCameras={selectedCameras}
                setSelectedCameras={setSelectedCameras}
                selectedClassifications={selectedClassifications}
                setSelectedClassifications={setSelectedClassifications}
                selectedEventTypes={selectedEventTypes}
                setSelectedEventTypes={setSelectedEventTypes}
                selectedEvents={selectedEvents}
                setSelectedEvents={setSelectedEvents}
                // setHashArray={setHashArray}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                // setLastIndex={setLastIndex}
                searchTokens={searchTokens}
                setSearchTokens={setSearchTokens}
                nlSearchInput={nlSearchInput}
                setNlSearchInput={setNlSearchInput}
                recentSearches={recentSearches}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                // handleNLForensicSearch={handleNLForensicSearch}
                // handleNLForensicSearch={handleAIForensicSearch}
                handleInitialClipsSearch={handleInitialClipSearch}
                selectedNlCustomers={selectedNlCustomers}
                setSelectedNlCustomers={setSelectedNlCustomers}
                selectedNlSites={selectedNlSites}
                setSelectedNlSites={setSelectedNlSites}
                queryBuilderNonTokensResponse={queryBuilderNonTokensResponse}
                setQueryBuilderNonTokensResponse={
                    setQueryBuilderNonTokensResponse
                }
            />
            {searchTab === 'nl' && (
                // <PaginatedClipsTable
                //     searchTokens={searchTokens}
                //     searchTab={searchTab}
                //     selectedServiceProvider={selectedServiceProvider}
                //     autoRefreshText={autoRefreshText}
                //     auditModeEnabled={auditModeEnabled}
                //     setAuditModeEnabled={setAuditModeEnabled}
                //     aiColumnsEnabled={aiColumnsEnabled}
                //     setAIColumnsEnabled={setAIColumnsEnabled}
                //     clips={paginatedFilteredClips}
                //     setClips={setPaginatedFilteredClips}
                //     isClipModalOpen={isClipModalOpen}
                //     setIsClipModalOpen={setIsClipModalOpen}
                //     forensicSearchOverview={forensicSearchOverview}
                //     currentIndex={currentIndex}
                //     setCurrentIndex={setCurrentIndex}
                //     lastIndex={lastIndex}
                //     previousIndexes={previousIndexes}
                //     hashArray={hashArray}
                //     filterStart={filterStart}
                //     filterEnd={filterEnd}
                //     clipsMutationPaginated={clipsMutationPaginated}
                //     handleInitialClipsSearch={handleInitialClipSearch}
                // />

                <ForensicSearchTable
                    searchTab={searchTab}
                    forensicSearchData={forensicSearchData}
                    setForensicSearchData={setForensicSearchData}
                    nextPageAvailable={nextPageAvailable}
                    setNextPageAvailable={setNextPageAvailable}
                    autoRefreshText={autoRefreshText}
                    auditModeEnabled={auditModeEnabled}
                    setAuditModeEnabled={setAuditModeEnabled}
                    aiColumnsEnabled={aiColumnsEnabled}
                    setAIColumnsEnabled={setAIColumnsEnabled}
                    isClipModalOpen={isClipModalOpen}
                    setIsClipModalOpen={setIsClipModalOpen}
                    filterStart={filterStart}
                    filterEnd={filterEnd}
                    selectedServiceProvider={selectedServiceProvider}
                    selectedCustomers={selectedNlCustomers}
                    selectedSites={selectedNlSites}
                    selectedCameras={selectedCameras}
                    selectedClassifications={selectedClassifications}
                    selectedEventTypes={selectedEventTypes}
                    selectedEvents={selectedEvents}
                    aiContextSearchInputs={aiContextSearchInputs}
                />
            )}

            {searchTab === 'fs' && (
                <ForensicSearchTable
                    searchTab={searchTab}
                    forensicSearchData={forensicSearchData}
                    setForensicSearchData={setForensicSearchData}
                    nextPageAvailable={nextPageAvailable}
                    setNextPageAvailable={setNextPageAvailable}
                    autoRefreshText={autoRefreshText}
                    auditModeEnabled={auditModeEnabled}
                    setAuditModeEnabled={setAuditModeEnabled}
                    aiColumnsEnabled={aiColumnsEnabled}
                    setAIColumnsEnabled={setAIColumnsEnabled}
                    isClipModalOpen={isClipModalOpen}
                    setIsClipModalOpen={setIsClipModalOpen}
                    filterStart={filterStart}
                    filterEnd={filterEnd}
                    selectedServiceProvider={selectedServiceProvider}
                    selectedCustomers={selectedCustomers}
                    selectedSites={selectedSites}
                    selectedCameras={selectedCameras}
                    selectedClassifications={selectedClassifications}
                    selectedEventTypes={selectedEventTypes}
                    selectedEvents={selectedEvents}
                />
            )}

            {/* {(nlQueryTokensMutation.isLoading ||
                clipsMutationPaginated.isLoading ||
                nlSearchMutation.isLoading ||
                forensicSearchMutation.isLoading) && (
                <LoadingModal modalText="Retrieving clips..." zIndex={96} />
            )} */}

            {(aiQueryBuilderMutation.isLoading ||
                aiSearchPaginatedMutation.isLoading ||
                forensicSearchMutation.isLoading) && (
                <LoadingModal modalText="Retrieving clips..." zIndex={96} />
            )}
        </div>
    );
};

export default ForensicSearch;
