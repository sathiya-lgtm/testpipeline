/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
// React
import {
    FC,
    useState,
    SetStateAction,
    useEffect,
    Dispatch,
    useContext,
    useMemo,
    useCallback,
} from 'react';

// Third party
import { useMutation, useQuery } from '@tanstack/react-query';
import { MultiValue, SingleValue } from 'react-select';
import { format } from 'date-fns';
import { Editor, Transforms } from 'slate';
import { toast } from 'react-toastify';

// Custom
import { useCustomers, useSites, useCameras } from '../../../hooks';
import getAccountType from '../../../utils/getAccountType';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';

// Api Calls
// import { ITokenResponse } from '../../../api_calls/getKeywords';
import getNLSearchEnabled from '../../../api_calls/getNLSearchEnabled';
import getNLQueryTokens from '../../../api_calls/getNLQueryTokens';
import SitesRoute, {
    IGetSitesProps,
    ISiteData,
} from '../../../api_calls/Sites';

// Context
import { ListTargetContext } from '../../../contexts/ListTarget';
import {
    ICustomerTarget,
    ISiteTarget,
    ICameraTarget,
} from '../../../contexts/ListTarget.controller';
import { AuthContext } from '../../../contexts/AuthProvider';

// Controller
import {
    generateDefaultFilterEndDate,
    getNumberOfParentsForListTarget,
    generateDefaultFilterStartDate,
    defaultNLKeywords,
} from './ForensicSearchFilter.controller';

// Components
import LoadingModal from '../../Modals/LoadingModal';
import Toggle from '../../Inputs/Toggle';
import ForensicSearchForm from './ForensicSearchForm';
import AutoComplete from '../../Inputs/AutoComplete';
import NaturalLanguageTokens from './NaturalLanguageTokens';
import RecentSearches from './RecentSearches';
import SingleSelect from '../../Inputs/Select';

// Custom Types
import {
    // IClip,
    ICustomer,
    ISite,
    // INLSearchTokens,
    IAISearchTokens,
    IAIQueryBuilderKeywordMismatchObj,
} from '../../../types/tng-api.interfaces';
import { SelectOption, IUser } from '../../../types/interfaces';
import { AccountType } from '../../../types/enums';

// Styles
import '../../../styles/components/Filters/ForensicSearchFilter.scss';

interface IProps {
    searchTab: 'fs' | 'nl';
    setSearchTab: Dispatch<SetStateAction<'fs' | 'nl'>>;
    // keywordsData: ITokenResponse | undefined;
    // setFilteredClips: Dispatch<SetStateAction<IClip[]>>;
    filterStart: string;
    setFilterStart: Dispatch<SetStateAction<string>>;
    filterEnd: string;
    setFilterEnd: Dispatch<SetStateAction<string>>;
    selectedServiceProvider: SelectOption | null;
    selectedCustomers: SelectOption | null;
    setSelectedCustomers: Dispatch<SetStateAction<SelectOption | null>>;
    selectedSites: SelectOption | null;
    setSelectedSites: Dispatch<SetStateAction<SelectOption | null>>;
    selectedCameras: SelectOption | null;
    setSelectedCameras: Dispatch<SetStateAction<SelectOption | null>>;
    selectedClassifications: MultiValue<SelectOption> | null;
    setSelectedClassifications: Dispatch<
        SetStateAction<MultiValue<SelectOption> | null>
    >;
    selectedEventTypes: MultiValue<SelectOption> | null;
    setSelectedEventTypes: Dispatch<
        SetStateAction<MultiValue<SelectOption> | null>
    >;
    selectedEvents: MultiValue<SelectOption> | null;
    setSelectedEvents: Dispatch<
        SetStateAction<MultiValue<SelectOption> | null>
    >;
    // setHashArray: Dispatch<SetStateAction<string[]>>;
    currentIndex: number;
    setCurrentIndex: Dispatch<SetStateAction<number>>;
    // setLastIndex: Dispatch<SetStateAction<number>>;
    // searchTokens: INLSearchTokens;
    // setSearchTokens: Dispatch<SetStateAction<INLSearchTokens>>;
    searchTokens: IAISearchTokens;
    setSearchTokens: Dispatch<SetStateAction<IAISearchTokens>>;
    nlSearchInput: string;
    setNlSearchInput: Dispatch<SetStateAction<string>>;
    recentSearches: string[];
    autoRefresh: boolean;
    setAutoRefresh: Dispatch<SetStateAction<boolean>>;
    // handleNLForensicSearch: (
    //     user: IUser,
    //     query: string,
    //     site_id: number
    // ) => Promise<void>;
    handleInitialClipsSearch: () => Promise<void>;
    selectedNlCustomers: SelectOption | null;
    setSelectedNlCustomers: Dispatch<SetStateAction<SelectOption | null>>;
    selectedNlSites: SelectOption | null;
    setSelectedNlSites: Dispatch<SetStateAction<SelectOption | null>>;
    queryBuilderNonTokensResponse: IAIQueryBuilderKeywordMismatchObj | null;
    setQueryBuilderNonTokensResponse: Dispatch<
        SetStateAction<IAIQueryBuilderKeywordMismatchObj | null>
    >;
}
const ForensicSearchFilter: FC<IProps> = ({
    searchTab,
    setSearchTab,
    filterStart,
    setFilterStart,
    filterEnd,
    setFilterEnd,
    selectedServiceProvider,
    selectedCustomers,
    setSelectedCustomers,
    selectedSites,
    setSelectedSites,
    selectedCameras,
    setSelectedCameras,
    selectedClassifications,
    setSelectedClassifications,
    selectedEventTypes,
    setSelectedEventTypes,
    selectedEvents,
    setSelectedEvents,
    currentIndex,
    setCurrentIndex,
    searchTokens,
    setSearchTokens,
    nlSearchInput,
    setNlSearchInput,
    recentSearches,
    autoRefresh,
    setAutoRefresh,
    handleInitialClipsSearch,
    selectedNlCustomers,
    setSelectedNlCustomers,
    selectedNlSites,
    setSelectedNlSites,
    queryBuilderNonTokensResponse,
    setQueryBuilderNonTokensResponse,
}) => {
    const { activeUser } = useContext(AuthContext);
    const { listTarget, handleListTargetClick, clearListTarget } =
        useContext(ListTargetContext);

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

    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer !== null ? [defaultCustomer] : []
    );
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [cameraOptions, setCameraOptions] = useState<SelectOption[]>([]);

    // NL Search State
    const [editor, setEditor] = useState<Editor | null>(null);

    const [aiEnabledSitesIsFetching, setAIEnabledSitesIsFetching] =
        useState(false);
    const [aiEnabledSites, setAIEnabledSites] = useState<ISiteData[]>([]);

    const [nlCustomerOptions, setNlCustomerOptions] = useState<SelectOption[]>(
        defaultCustomer !== null ? [defaultCustomer] : []
    );
    const [nlSiteOptions, setNlSiteOptions] = useState<SelectOption[]>([]);

    const customerQueryServiceProviderId = useMemo(() => {
        if (!activeUser) {
            return 0;
        }

        if (accountType === AccountType.Evolon && selectedServiceProvider) {
            return Number(selectedServiceProvider.value);
        }

        if (accountType === AccountType.ServiceProvider) {
            return activeUser.service_provider_account as number;
        }
        if (accountType === AccountType.Customer) {
            return activeUser.id;
        }

        return 0;
    }, [activeUser, selectedServiceProvider]);

    const nlSearchEnabled = useQuery(
        ['nlSearchEnabled'],
        () => getNLSearchEnabled(activeUser as IUser),
        { enabled: !!activeUser }
    );

    const customersQuery = useCustomers({
        serviceProviderId: customerQueryServiceProviderId,
        activeUser: activeUser as IUser,
        enabled:
            activeUser !== null &&
            accountType !== AccountType.Customer &&
            customerQueryServiceProviderId !== 0,
    });

    const sitesQuery = useSites({
        customerId: Number(selectedCustomers?.value),
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Customer,
    });

    const camerasQuery = useCameras({
        siteId: Number(selectedSites?.value),
        activeUser: activeUser as IUser,
        enabled: false,
    });

    const customersQueryForNl = useCustomers({
        serviceProviderId: customerQueryServiceProviderId,
        activeUser: activeUser as IUser,
        enabled:
            activeUser !== null &&
            accountType !== AccountType.Customer &&
            customerQueryServiceProviderId !== 0,
    });

    const camerasQueryForNl = useCameras({
        siteId: Number(selectedNlSites?.value),
        activeUser: activeUser as IUser,
        enabled: false,
    });

    const nlAutoFillValues = useMemo(() => {
        if (camerasQueryForNl.data) {
            const keywords: string[] = [];
            Object.values(camerasQueryForNl.data).forEach((cameraInfo) => {
                keywords.push(cameraInfo.camera_name);
            });

            return [...keywords, ...defaultNLKeywords];
        }

        return defaultNLKeywords;
    }, [camerasQueryForNl.data]);

    const minStartDate = useMemo(() => {
        if (activeUser?.properties.retention_days) {
            const today = new Date();
            const dataRetentionStartDate = new Date(today);
            dataRetentionStartDate.setDate(
                today.getDate() - (activeUser.properties.retention_days - 1)
            );

            return `${format(dataRetentionStartDate, 'yyyy-MM-dd')}T00:00:00`;
        }

        return undefined;
    }, [activeUser]);

    const handleCustomerSelect = async (
        selectOption: SingleValue<SelectOption>
    ) => {
        // This was needed to fix a bug where selecting the same customer would removed the site options
        // This logic is applied to sites
        if (selectedCustomers?.value === selectOption?.value) {
            return;
        }

        // Always reset following fields if user changes customers.
        setSelectedSites(null);
        setSelectedCameras(null);
        setSiteOptions([]);
        setCameraOptions([]);

        // Then set selected customer.
        setSelectedCustomers(selectOption);

        // Checks to see if user removed Customer from selection.
        if (selectOption === null) {
            clearListTarget();
        }
    };

    const handleSiteSelect = (selectOption: SelectOption | null): void => {
        if (selectOption?.value === selectedSites?.value) {
            return;
        }

        // Always reset following fields when user selects a site.
        setSelectedCameras(null);
        setCameraOptions([]); // The options for cameras should be refetched upon setting site (if appropriate).

        // Then set site.
        setSelectedSites(selectOption);

        // Checks to see if Site is being removed via select dropdown.
        if (selectOption === null) {
            if (accountType === AccountType.Customer) {
                // Remove list target if removing a Site selection as Customer.
                clearListTarget();

                return;
            }

            const newListTarget: ISiteTarget = {
                src: 'forensic-search',
                type: 'site',
                numberOfParents: getNumberOfParentsForListTarget(
                    accountType,
                    'site'
                ),
                serviceProviderId: listTarget?.serviceProviderId,
                serviceProviderName: listTarget?.serviceProviderName,
                customerId: (listTarget as ISiteTarget).customerId,
                customerName: (listTarget as ISiteTarget).customerName,
                siteId: (listTarget as ISiteTarget).siteId,
                siteName: (listTarget as ISiteTarget).siteName,
            };

            handleListTargetClick(newListTarget);
        }
    };

    const handleCameraSelect = (
        selectOption: SingleValue<SelectOption>
    ): void => {
        if (selectOption?.value === selectedCameras?.value) {
            return;
        }

        setSelectedCameras(selectOption);

        // Checks to see if user is removing camera selection.
        if (selectOption === null) {
            const newListTarget: ICameraTarget = {
                ...(listTarget as ICameraTarget),
                src: 'forensic-search',
            };

            handleListTargetClick(newListTarget);
        }
    };

    const nlQueryTokensMutation = useMutation({
        mutationFn: getNLQueryTokens,
    });

    const handleRecentSearchClick = async (search: string) => {
        if (!activeUser) {
            return;
        }

        if (editor) {
            Transforms.delete(editor, {
                at: {
                    anchor: Editor.start(editor, []),
                    focus: Editor.end(editor, []),
                },
            });

            setSearchTokens({ start_date: '', end_date: '' });
            setQueryBuilderNonTokensResponse(null);
            Transforms.insertText(editor, search);
            setNlSearchInput(search);
        }
    };

    const clearAISearchInput = () => {
        if (editor) {
            Transforms.delete(editor, {
                at: {
                    anchor: Editor.start(editor, []),
                    focus: Editor.end(editor, []),
                },
            });
        }

        if (accountType !== AccountType.Customer) {
            setSelectedNlCustomers(null);
            setNlSiteOptions([]);
        }
        setSelectedNlSites(null);
        setNlSearchInput('');
        setSearchTokens({ start_date: '', end_date: '' });
    };

    const clearSearch = useCallback((): void => {
        if (accountType !== AccountType.Customer) {
            setSelectedCustomers(null);
            setSiteOptions([]);
        }

        setSelectedSites(null);
        setSelectedCameras(null);
        setCameraOptions([]);
        setFilterStart(generateDefaultFilterStartDate());
        setFilterEnd(generateDefaultFilterEndDate());
        setSelectedClassifications(null);
        setSelectedEventTypes(null);
        setSelectedEvents(null);
        setCurrentIndex(0);
        clearListTarget();
    }, [accountType]);

    useEffect(() => {
        if (selectedServiceProvider) {
            clearSearch();
        }
    }, [selectedServiceProvider]);

    // Removed on 6/17/2025
    // useEffect(() => {
    //     return () => {
    //         if (listTarget?.src === 'forensic-search') {
    //             // Change owner of ListTarget to CameraList when unmounting.
    //             // This is done so this component will acknowledge the listTarget.
    //             // This component won't acknowledge listTarget if the src is 'forensic-search'
    //             // as to avoid an infinite loop.
    //             modifyListTargetSource('camera-list');
    //         }
    //     };
    // }, []);

    useEffect(() => {
        if (
            listTarget === null &&
            selectedCustomers !== null &&
            accountType !== AccountType.Customer
        ) {
            setSelectedCustomers(null);
            setSelectedSites(null);
            setSelectedCameras(null);
        }

        if (listTarget !== null && listTarget.src === 'camera-list') {
            if (listTarget.type === 'account') {
                const listTargetCustomerOption: SelectOption = {
                    label: listTarget.customerName,
                    value: String(listTarget.customerId),
                };

                setSelectedCustomers(listTargetCustomerOption);
                setSelectedSites(null);
                setSelectedCameras(null);
            }

            if (listTarget.type === 'site') {
                const listTargetCustomerOption: SelectOption = {
                    label: listTarget.customerName,
                    value: String(listTarget.customerId),
                };
                const listTargetSiteOption: SelectOption = {
                    label: listTarget.siteName,
                    value: String(listTarget.siteId),
                };

                setSelectedCustomers(listTargetCustomerOption);
                setSelectedSites(listTargetSiteOption);
                setSelectedCameras(null);
            }

            if (listTarget.type === 'camera') {
                const listTargetCustomerOption: SelectOption = {
                    label: listTarget.customerName,
                    value: String(listTarget.customerId),
                };
                const listTargetSiteOption: SelectOption = {
                    label: listTarget.siteName,
                    value: String(listTarget.siteId),
                };
                const listTargetCameraOption: SelectOption = {
                    label: listTarget.cameraName,
                    value: String(listTarget.cameraId),
                };

                setSelectedCustomers(listTargetCustomerOption);
                setSelectedSites(listTargetSiteOption);
                setSelectedCameras(listTargetCameraOption);
            }
        }
    }, [listTarget]);

    useEffect(() => {
        const isSelectedFromForensicSearchForm: boolean =
            String((listTarget as ICustomerTarget)?.customerId) !==
            selectedCustomers?.value;

        if (selectedCustomers?.value && isSelectedFromForensicSearchForm) {
            const newListTarget: ICustomerTarget = {
                src: 'forensic-search',
                type: 'account',
                numberOfParents: getNumberOfParentsForListTarget(
                    accountType,
                    'account'
                ),
                customerId: Number(selectedCustomers.value),
                customerName: selectedCustomers.label,
            };

            clearListTarget();
            handleListTargetClick(newListTarget);
            sitesQuery.refetch();
        }
    }, [selectedCustomers]);

    useEffect(() => {
        const isSelectedFromForensicSearchForm: boolean =
            String((listTarget as ISiteTarget)?.siteId) !==
            selectedSites?.value;

        if (selectedSites?.value && isSelectedFromForensicSearchForm) {
            const newListTarget: ISiteTarget = {
                src: 'forensic-search',
                type: 'site',
                numberOfParents: getNumberOfParentsForListTarget(
                    accountType,
                    'site'
                ),
                customerId: Number(selectedCustomers?.value),
                customerName: selectedCustomers?.label || '',
                siteId: Number(selectedSites?.value),
                siteName: selectedSites?.label,
            };

            clearListTarget();
            handleListTargetClick(newListTarget);
            camerasQuery.refetch();
        }
    }, [selectedSites]);

    useEffect(() => {
        const isSelectedFromForensicSearchForm: boolean =
            String((listTarget as ICameraTarget)?.cameraId) !==
            selectedCameras?.value;

        if (selectedCameras?.value && isSelectedFromForensicSearchForm) {
            const newListTarget: ICameraTarget = {
                src: 'forensic-search',
                type: 'camera',
                numberOfParents: getNumberOfParentsForListTarget(
                    accountType,
                    'camera'
                ),
                customerId: Number(selectedCustomers?.value),
                customerName: selectedCustomers?.label || '',
                siteId: Number(selectedSites?.value),
                siteName: selectedSites?.label || '',
                cameraId: Number(selectedCameras?.value),
                cameraName: selectedCameras?.label,
                camera_properties: {},
            };

            clearListTarget();
            handleListTargetClick(newListTarget);
        }
    }, [selectedCameras]);

    useEffect(() => {
        const customersData: ICustomer[] | undefined = customersQuery.data;

        if (customersData && customersData.length > 0) {
            const sortedCustomersData = customersData.sort(sortByName);
            const options =
                OptionsConverter.convertCustomersToOptions(sortedCustomersData);

            setCustomerOptions(options);
        }
    }, [customersQuery.data]);

    useEffect(() => {
        const sitesData: ISite[] | undefined = sitesQuery.data;

        if (sitesData && sitesData.length > 0) {
            const sortedSitesData = sitesData.sort(sortByName);
            const options =
                OptionsConverter.convertSitesToOptions(sortedSitesData);

            setSiteOptions(options);
        }
    }, [sitesQuery.data]);

    useEffect(() => {
        const camerasData = camerasQuery.data;

        if (camerasData && camerasData.length > 0) {
            const sortedCameraData = camerasData.sort(sortByName);
            const options =
                OptionsConverter.convertCamerasToOptions(sortedCameraData);

            setCameraOptions(options);
        }
    }, [camerasQuery.data]);

    const handleNlCustomerSelect = async (
        selectOption: SingleValue<SelectOption>
    ) => {
        // This was needed to fix a bug where selecting the same customer would removed the site options
        // This logic is applied to sites
        if (selectedNlCustomers?.value === selectOption?.value) {
            return;
        }

        // Always reset following fields if user changes customers.
        setSelectedNlSites(null);
        setNlSiteOptions([]);

        // Then set selected customer.
        setSelectedNlCustomers(selectOption);
    };

    const getAIEnabledSites = async () => {
        try {
            setAIEnabledSitesIsFetching(true);
            const route = SitesRoute(activeUser as IUser);

            const inputData: IGetSitesProps = {
                account_id: Number(selectedNlCustomers?.value),
                ai_copilot_enabled: true,
            };

            if (accountType === AccountType.Evolon && selectedServiceProvider) {
                inputData['service_provider_account_id'] = Number(
                    selectedServiceProvider?.value
                );
            }

            const results = await route.get(inputData);
            setAIEnabledSites(results);
        } catch (error: any) {
            if (error.response.data.code !== 401) {
                const { description } = error.response.data.details;
                if (description) {
                    toast.error(`Get AI Enabled sites failed: ${description}`);
                } else {
                    toast.error(`Failed to get AI Enabled sites!`);
                }
            }
        } finally {
            setAIEnabledSitesIsFetching(false);
        }
    };

    const handleNlSiteSelect = (selectOption: SelectOption | null): void => {
        if (selectedNlSites?.value === selectOption?.value) {
            return;
        }

        // Then set site.
        setSelectedNlSites(selectOption);
    };

    useEffect(() => {
        if (
            selectedNlCustomers?.value &&
            accountType === AccountType.Customer
        ) {
            // sitesQueryForNl.refetch();
            getAIEnabledSites();
        }
    }, [selectedNlCustomers]);

    useEffect(() => {
        if (selectedNlSites?.value) {
            camerasQueryForNl.refetch();
        }
    }, [selectedNlSites]);

    useEffect(() => {
        const customersData: ICustomer[] | undefined = customersQueryForNl.data;

        if (customersData && customersData.length > 0) {
            const sortedCustomersData = customersData.sort(sortByName);
            const options =
                OptionsConverter.convertCustomersToOptions(sortedCustomersData);

            setNlCustomerOptions(options);
        }
    }, [customersQueryForNl.data]);

    // useEffect(() => {
    //     const sitesData: ISite[] | undefined = sitesQueryForNl.data;

    //     if (sitesData && sitesData.length > 0) {
    //         const sortedSitesData = sitesData.sort(sortByName);
    //         const options =
    //             OptionsConverter.convertSitesToOptions(sortedSitesData);

    //         setNlSiteOptions(options);
    //     }
    // }, [sitesQueryForNl.data]);

    useEffect(() => {
        const sitesData: ISiteData[] | undefined = aiEnabledSites;

        if (sitesData && sitesData.length > 0) {
            const sortedSitesData = sitesData.sort(sortByName);
            const options =
                OptionsConverter.convertAIEnabledSitesToOptions(
                    sortedSitesData
                );

            setNlSiteOptions(options);
        }

        if (aiEnabledSites.length === 0) {
            setSelectedNlSites(null);
            setNlSiteOptions([]);
        } else if (selectedNlSites) {
            const selectedSiteExists = nlSiteOptions.some((item) => {
                if (item.value === selectedNlSites?.value) {
                    setSelectedNlSites(item);
                    return true;
                }
            });

            if (!selectedSiteExists) {
                setSelectedNlSites(null);
            }
        }
    }, [aiEnabledSites]);

    useEffect(() => {
        if (selectedNlCustomers?.value && searchTab === 'nl') {
            getAIEnabledSites();
            // This polls for AI Enabled Site details
            const interval = setInterval(() => {
                // if (aiEnabledSites) {
                getAIEnabledSites();
                // }
            }, 30000); // Poll every 30 seconds

            return () => clearInterval(interval);
        }
    }, [searchTab, selectedNlCustomers]);

    if (nlSearchEnabled.isLoading) {
        return null;
    }

    return (
        <>
            {nlQueryTokensMutation.isLoading && (
                <LoadingModal modalText="Retrieving clips..." zIndex={96} />
            )}
            {(nlSearchEnabled.data === 1 ||
                (accountType === AccountType.Customer &&
                    aiEnabledSites.length !== 0)) && (
                <ul className="forensic-search-tab-list">
                    <li
                        role="presentation"
                        className={`dashboard-tab ${
                            searchTab === 'nl' ? 'selected' : ''
                        }`}
                        data-testid="dashboard-tab-events"
                        onClick={() => setSearchTab('nl')}
                    >
                        AI Copilot Search (Beta)
                    </li>
                    <li
                        role="presentation"
                        className={`dashboard-tab ${
                            searchTab === 'fs' ? 'selected' : ''
                        }`}
                        data-testid="dashboard-tab-events"
                        onClick={() => setSearchTab('fs')}
                    >
                        Traditional Search
                    </li>
                </ul>
            )}

            <section className="ForensicSearchFilter">
                <div className="title-container">
                    <div className="title">
                        <h2>Forensic Search</h2>
                        <h3>Filter Clips: </h3>
                        {searchTab === 'fs' &&
                            activeUser?.properties?.retention_days && (
                                <p style={{ marginTop: 5 }}>
                                    Retention Policy{' '}
                                    {activeUser.properties.retention_days} days
                                </p>
                            )}
                        {searchTab === 'nl' &&
                            selectedNlSites &&
                            selectedNlSites?.retentiondays !== 0 && (
                                <p style={{ marginTop: 5 }}>
                                    Retention Policy{' '}
                                    {selectedNlSites?.retentiondays} days
                                </p>
                            )}

                        {currentIndex === 0 && (
                            <div className="auto-refresh-toggle-container">
                                <p id="auto-refresh-toggle-label">
                                    Auto Refresh Searches
                                </p>
                                <Toggle
                                    id="auto-refresh-toggle"
                                    value={autoRefresh}
                                    onToggleChange={() => {
                                        localStorage.setItem(
                                            'autoRefresh',
                                            autoRefresh ? 'off' : 'on'
                                        );
                                        setAutoRefresh(!autoRefresh);
                                    }}
                                    toggleOnText="ON"
                                    toggleOffText="OFF"
                                />
                            </div>
                        )}
                    </div>
                </div>
                {searchTab === 'nl' && (
                    <div style={{ flex: 1, paddingLeft: '2rem' }}>
                        <div className="fields-container">
                            <div
                                className={`field ${
                                    defaultCustomer !== null ? 'defaulted' : ''
                                } ${
                                    customersQueryForNl.isFetching
                                        ? 'fetching'
                                        : ''
                                }`}
                            >
                                <span className="label">Customer</span>
                                <span className="asterisk">*</span>

                                <SingleSelect
                                    id="customer-select"
                                    value={selectedNlCustomers}
                                    onChange={handleNlCustomerSelect}
                                    placeholder={
                                        customersQueryForNl.isFetching
                                            ? ''
                                            : undefined
                                    }
                                    options={nlCustomerOptions}
                                    disabled={defaultCustomer !== null}
                                />
                            </div>
                            <div
                                className={`field 
                                                ${
                                                    aiEnabledSitesIsFetching
                                                        ? 'fetching'
                                                        : ''
                                                }`}
                            >
                                <span className="label">Site</span>
                                <span className="asterisk">*</span>

                                <SingleSelect
                                    id="site-select"
                                    value={selectedNlSites}
                                    onChange={handleNlSiteSelect}
                                    placeholder={
                                        aiEnabledSitesIsFetching
                                            ? ''
                                            : undefined
                                    }
                                    options={nlSiteOptions}
                                    noOptionsMessage="A Customer with registered sites must be selected first."
                                />
                            </div>
                        </div>
                        <div style={{ position: 'relative', maxWidth: 800 }}>
                            <AutoComplete
                                autoFillValues={nlAutoFillValues}
                                onSubmit={handleInitialClipsSearch}
                                nlSearchInput={nlSearchInput}
                                setNlSearchInput={setNlSearchInput}
                                setSearchTokens={setSearchTokens}
                                setEditor={setEditor}
                                clearAISearchInput={clearAISearchInput}
                            />
                        </div>
                        {recentSearches.length > 0 && (
                            <RecentSearches
                                handleRecentSearchClick={
                                    handleRecentSearchClick
                                }
                                recentSearches={recentSearches}
                            />
                        )}

                        <NaturalLanguageTokens
                            searchTokens={searchTokens}
                            nonTokensResponse={queryBuilderNonTokensResponse}
                        />
                    </div>
                )}
                {searchTab === 'fs' && (
                    <ForensicSearchForm
                        filterStart={filterStart}
                        setFilterStart={setFilterStart}
                        filterEnd={filterEnd}
                        setFilterEnd={setFilterEnd}
                        minStartDate={minStartDate}
                        handleClipSearch={handleInitialClipsSearch}
                        clearSearch={clearSearch}
                        fetchingCameras={camerasQuery.isFetching}
                        cameraOptions={cameraOptions}
                        selectedCameras={selectedCameras}
                        handleCameraSelect={handleCameraSelect}
                        fetchingSites={sitesQuery.isFetching}
                        siteOptions={siteOptions}
                        selectedSites={selectedSites}
                        handleSiteSelect={handleSiteSelect}
                        fetchingCustomers={customersQuery.isFetching}
                        customerOptions={customerOptions}
                        selectedCustomers={selectedCustomers}
                        handleCustomerSelect={handleCustomerSelect}
                        selectedClassifications={selectedClassifications}
                        setSelectedClassifications={setSelectedClassifications}
                        selectedEventTypes={selectedEventTypes}
                        setSelectedEventTypes={setSelectedEventTypes}
                        selectedEvents={selectedEvents}
                        setSelectedEvents={setSelectedEvents}
                    />
                )}
            </section>
        </>
    );
};

export default ForensicSearchFilter;
