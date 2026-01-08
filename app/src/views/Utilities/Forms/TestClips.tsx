/* eslint-disable no-continue */
/* eslint-disable no-lonely-if */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable object-shorthand */
/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
    ReactElement,
    FC,
    Dispatch,
    SetStateAction,
    useEffect,
    useMemo,
    useState,
    FormEvent,
    useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { motion } from 'framer-motion';
import { SingleValue } from 'react-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// API Calls
import SendTestClip from '../../../api_calls/SendTestClip';
import getCameraData from '../../../api_calls/getCameraData';
import updateCameraAnnotationSettings from '../../../api_calls/updateCameraAnnotationSettings';
import getApiTokensForAccount from '../../../api_calls/getApiTokensForAccount';

// Custom
import {
    useCustomers,
    useSites,
    useServiceProviders,
    useCameras,
} from '../../../hooks';
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import OptionsConverter from '../../../classes/OptionsConverter';
import sortByName from '../../../utils/sortByName';
import { maskColorChannels } from '../../../components/Canvases/MaskCanvas/DrawingLayer';

// Components
import Select from '../../../components/Inputs/Select';
import LoadingModal from '../../../components/Modals/LoadingModal';
import Toggle from '../../../components/Inputs/Toggle';
import Input from '../../../components/Inputs/Input';

// Custom types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType, JobType } from '../../../types/enums';
import {
    ICustomer,
    ISite,
    IServiceProvider,
} from '../../../types/tng-api.interfaces';

// Styles
import '../../../styles/views/Utilities/TestClips.scss';

const jobTypeOptions = [
    { value: JobType.Email, label: 'Email' },
    { value: JobType.NVR, label: 'Email-NVR' },
    { value: JobType.Verify, label: 'Immix' },
    { value: JobType.Edge, label: 'Edge' },
    { value: JobType.NetworkOptix, label: 'Network-Optix' },
    { value: JobType.Milestone, label: 'Milestone' },
];

function removeURLEncodedChars(filename: string): string {
    // Only allow unreserved characters: A-Z a-z 0-9 - _ . ~
    // Everything else gets removed
    return filename
        .split('')
        .filter((char) => {
            const code = char.charCodeAt(0);
            const isAlphaNumeric =
                (code >= 48 && code <= 57) || // 0-9
                (code >= 65 && code <= 90) || // A-Z
                (code >= 97 && code <= 122); // a-z
            const isUnreserved = ['-', '_', '.', '~'].includes(char);
            return isAlphaNumeric || isUnreserved;
        })
        .join('');
}

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
}

/**
 * Form for creating Customers.
 * @returns {ReactElement}
 */
const TestClips: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
}: IProps): ReactElement => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // state
    const [serviceProviderOptions, setServiceProviderOptions] = useState<
        SelectOption[]
    >(defaultServiceProvider !== null ? [defaultServiceProvider] : []);
    const [selectedServiceProvider, setSelectedServiceProvider] =
        useState<SingleValue<SelectOption> | null>(defaultServiceProvider);
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>([]);
    const [selectedCustomer, setSelectedCustomer] =
        useState<SingleValue<SelectOption> | null>(null);
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [selectedSite, setSelectedSite] =
        useState<SingleValue<SelectOption> | null>(null);
    const [cameraOptions, setCameraOptions] = useState<SelectOption[]>([]);
    const [selectedCamera, setSelectedCamera] =
        useState<SingleValue<SelectOption> | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mask, setMask] = useState('');
    const [apply_blur, set_apply_blur] = useState(true);
    const [apply_tiling, set_apply_tiling] = useState(false);
    const [suppress_untracked_vehicles, set_suppress_untracked_vehicles] =
        useState(false);
    const [suppress_untracked_persons, set_suppress_untracked_persons] =
        useState(false);
    const [analyze_person_loitering, set_analyze_person_loitering] =
        useState(false);
    const [analyze_secondary_attributes, set_analyze_secondary_attributes] =
        useState(false);
    const [analyze_vehicle_loitering, set_analyze_vehicle_loitering] =
        useState(false);
    const [
        apply_person_pixel_motion_filter,
        set_apply_person_pixel_motion_filter,
    ] = useState(true);
    const [apply_sharpening, set_apply_sharpening] = useState(false);
    const [
        apply_vehicle_pixel_motion_filter,
        set_apply_vehicle_pixel_motion_filter,
    ] = useState(true);
    const [disable_person_ai, set_disable_person_ai] = useState(false);
    const [disable_vehicle_ai, set_disable_vehicle_ai] = useState(false);
    const [secondary_verification, set_secondary_verification] =
        useState(false);

    const serviceProvidersQuery = useServiceProviders({
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Evolon,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const serviceProviderId = useMemo(() => {
        if (accountType === AccountType.Evolon && selectedServiceProvider) {
            return Number(selectedServiceProvider?.value);
        }

        if (accountType === AccountType.ServiceProvider) {
            return activeUser.service_provider_account as number;
        }

        return null;
    }, [activeUser, selectedServiceProvider]);

    const customersQuery = useCustomers({
        serviceProviderId: serviceProviderId || 0,
        activeUser: activeUser as IUser,
        enabled: serviceProviderId !== null,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    const sitesQuery = useSites({
        customerId: Number(selectedCustomer?.value),
        activeUser: activeUser as IUser,
        enabled: accountType === AccountType.Customer,
    });

    const camerasQuery = useCameras({
        siteId: Number(selectedSite?.value),
        activeUser: activeUser as IUser,
        enabled: false,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
    });

    useQuery({
        queryKey: ['api-tokens', selectedCustomer?.value],
        queryFn: () =>
            getApiTokensForAccount(
                activeUser as IUser,
                selectedCustomer?.value as string
            ),
        enabled: !!selectedCustomer?.value,
        onSuccess: (data) => {
            if (data && data.length > 0) {
                setApiKey(data[0].key);
            } else {
                setApiKey('');
            }
        },
    });

    const { data: cameraData, isFetching: loadingCameraData } = useQuery({
        queryKey: ['camera-data', selectedCamera?.value],
        queryFn: () =>
            getCameraData(activeUser as IUser, selectedCamera?.value as string),
        enabled: !!selectedCamera?.value,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: (data) => {
            if (data.camera_properties) {
                set_apply_blur(data.camera_properties.apply_blur ?? true);
                set_apply_tiling(data.camera_properties.apply_tiling ?? false);
                set_suppress_untracked_persons(
                    data.camera_properties.suppress_untracked_persons ?? false
                );
                set_suppress_untracked_vehicles(
                    data.camera_properties.suppress_untracked_vehicles ?? false
                );
                set_analyze_person_loitering(
                    data.camera_properties.analyze_person_loitering ?? false
                );
                set_analyze_vehicle_loitering(
                    data.camera_properties.analyze_vehicle_loitering ?? false
                );
                set_analyze_secondary_attributes(
                    data.camera_properties.analyze_secondary_attributes ?? false
                );
                set_apply_person_pixel_motion_filter(
                    data.camera_properties.apply_person_pixel_motion_filter ??
                        true
                );
                set_apply_sharpening(
                    data.camera_properties.apply_sharpening ?? false
                );
                set_apply_vehicle_pixel_motion_filter(
                    data.camera_properties.apply_vehicle_pixel_motion_filter ??
                        true
                );
                set_disable_person_ai(
                    data.camera_properties.disable_person_ai ?? false
                );
                set_disable_vehicle_ai(
                    data.camera_properties.disable_vehicle_ai ?? false
                );
                set_secondary_verification(
                    data.camera_properties.secondary_verification ?? false
                );
            }
        },
    });

    const selectedJobType = useMemo(() => {
        if (cameraData) {
            const jobTypeString = cameraData.camera_properties.job_type;

            const foundOption = jobTypeOptions.find(
                (option) => option.value === jobTypeString
            );

            if (foundOption) {
                return foundOption;
            }
        }

        return jobTypeOptions[0];
    }, [cameraData]);

    const { mutate, isLoading: updatingCameraAnnotationSettings } = useMutation(
        {
            mutationFn: updateCameraAnnotationSettings,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['camera-data'],
                });
            },
        }
    );

    useEffect(() => {
        const { data }: { data: IServiceProvider[] | undefined } =
            serviceProvidersQuery;

        if (data) {
            const serviceProvidersSorted: IServiceProvider[] =
                data.sort(sortByName);
            const options: SelectOption[] =
                OptionsConverter.convertServiceProvidersToOptions(
                    serviceProvidersSorted
                );

            setServiceProviderOptions(options);
        }
    }, [serviceProvidersQuery.data]);

    useEffect(() => {
        if (customersQuery.data) {
            const sortedCustomers = customersQuery.data.sort(sortByName);

            const customersAsOptions =
                OptionsConverter.convertCustomersToOptions(
                    sortedCustomers as ICustomer[]
                );

            setCustomerOptions(customersAsOptions);
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
        const cameraQueryData = camerasQuery.data;

        if (cameraQueryData && cameraQueryData.length > 0) {
            const sortedCamerasData = cameraQueryData.sort(sortByName);
            const options =
                OptionsConverter.convertCamerasToOptions(sortedCamerasData);

            setCameraOptions(options);
        }
    }, [camerasQuery.data]);

    useEffect(() => {
        if (selectedCustomer) {
            sitesQuery.refetch();
        }
    }, [selectedCustomer]);

    useEffect(() => {
        if (selectedSite) {
            camerasQuery.refetch();
        }
    }, [selectedSite]);

    const [files, setFiles] = useState<FileList | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiles(e.target.files);
    };

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (mask && canvas && cameraData) {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = `data:image/png;base64,${mask}`;

            img.onload = () => {
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Set canvas size to image size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw the image off-screen
                ctx.drawImage(img, 0, 0);

                // Extract pixel data (RGBA)
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const { data } = imageData;

                // Create new pixel array for the alpha mask
                const newPixels = new Uint8ClampedArray(
                    img.width * img.height * 4
                );

                for (let i = 0; i < img.width * img.height; i += 1) {
                    const alpha = data[i * 4]; // Assuming alpha data is stored in Red channel
                    const maskValue = alpha > 0 ? 255 : 0; // Convert to 255 (white) or 0 (black)

                    // Edge needs the masked reversed
                    if (cameraData.camera_properties.job_type === 'edge') {
                        if (maskValue === 0) {
                            newPixels[i * 4 + 0] = 0;
                            newPixels[i * 4 + 1] = 0;
                            newPixels[i * 4 + 2] = 0;
                            newPixels[i * 4 + 0] = 0;
                            newPixels[i * 4 + 1] = 0;
                            newPixels[i * 4 + 2] = 0;
                            newPixels[i * 4 + 3] = 255;
                        } else {
                            // Each 4 consecutive values represents 1 pixel, wherein each value is a color channel for said pixel.
                            // If the bit is 0, set each channel to a value of 0 (i.e. transparent / no color).
                            newPixels[i * 4 + 0] = 0;
                            newPixels[i * 4 + 1] = 0;
                            newPixels[i * 4 + 2] = 0;
                            newPixels[i * 4 + 3] = 0;
                        }
                    } else {
                        if (maskValue === 0) {
                            // Each 4 consecutive values represents 1 pixel, wherein each value is a color channel for said pixel.
                            // If the bit is 0, set each channel to a value of 0 (i.e. transparent / no color).
                            newPixels[i * 4 + 0] = 0;
                            newPixels[i * 4 + 1] = 0;
                            newPixels[i * 4 + 2] = 0;
                            newPixels[i * 4 + 3] = 0;
                        } else {
                            newPixels[i * 4 + 0] = maskColorChannels.r;
                            newPixels[i * 4 + 1] = maskColorChannels.g;
                            newPixels[i * 4 + 2] = maskColorChannels.b;
                            newPixels[i * 4 + 3] = 255;
                        }
                    }
                }

                ctx?.clearRect(0, 0, img.width, img.height);
                ctx.putImageData(
                    new ImageData(newPixels, img.width, img.height),
                    0,
                    0
                );
            };
        }
    }, [mask]);

    const sendClipForProcessing = async (formData: FormData, file: File) => {
        try {
            const response = await SendTestClip(formData);

            if (response.status === 201) {
                toast.success(`Uploaded ${file.name}`);
            } else if (response.status === 200) {
                toast.warn(
                    `Clip sent but failed to process due to site being disarmed.`
                );
            } else {
                toast.error(
                    `Failed to upload ${file.name} - ${response.status}`
                );
            }
        } catch (error) {
            console.log(error);
            toast.error('Error uploading files');
        }
    };

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();

        if (!selectedSite) {
            toast.error('Must select a site.');
            return;
        }

        if (!cameraData?.camera_properties) {
            toast.error('No properties found for camera');
            return;
        }

        if (!files || files.length === 0) return;

        setIsLoading(true);

        for (const file of Array.from(files)) {
            const formData = new FormData();
            if (file.name.includes('.txt')) {
                // text files could pose problems, so we will skip them.
                toast.error(`File ${file.name} is a text file, skipping.`);
                setIsLoading(false);
                continue;
            }
            // the remort video request for view clips in forensic search doesn't work if the file name
            // contains chars that will be encoded in a url.
            const cleanedFileName = removeURLEncodedChars(file.name);
            formData.append('video', file, cleanedFileName);

            const payload: {
                job_type: string;
                api_key: string;
                camera_unique_string: string;
                site_name: string;
                camera_type: string;
                mask?: string;
            } = {
                job_type: cameraData.camera_properties.job_type,
                api_key: apiKey,
                camera_unique_string: cameraData.camera_unique_string,
                site_name: selectedSite.label,
                camera_type: cameraData.camera_properties.camera_type || 'rgb',
            };

            if (cameraData.camera_properties.job_type === 'milestone') {
                if (mask) {
                    payload.mask = mask;
                }

                const milestonePayload = {
                    ...payload,
                    apply_blur,
                    apply_tiling,
                    apply_sharpening,
                    apply_person_pixel_motion_filter,
                    apply_vehicle_pixel_motion_filter,
                    suppress_untracked_persons,
                    suppress_untracked_vehicles,
                    disable_person_ai,
                    disable_vehicle_ai,
                };

                Object.entries(milestonePayload).forEach(([key, value]) => {
                    formData.append(key, String(value));
                });

                await sendClipForProcessing(formData, file);
                setIsLoading(false);
            } else if (
                mask &&
                cameraData.camera_properties.job_type === 'edge'
            ) {
                Object.entries(payload).forEach(([key, value]) => {
                    formData.append(key, value);
                });

                formData.append('mask', mask);
                await sendClipForProcessing(formData, file);
                setIsLoading(false);
                formData.append('mask', mask);
                await sendClipForProcessing(formData, file);
                setIsLoading(false);
            } else {
                // Append the payload data to the FormData
                Object.entries(payload).forEach(([key, value]) => {
                    formData.append(key, value);
                });

                await sendClipForProcessing(formData, file);
                setIsLoading(false);
            }
        }
    };

    const handleToggleClick = (
        key:
            | 'apply_blur'
            | 'apply_tiling'
            | 'suppress_untracked_persons'
            | 'suppress_untracked_vehicles'
            | 'analyze_person_loitering'
            | 'analyze_secondary_attributes'
            | 'analyze_vehicle_loitering'
            | 'apply_person_pixel_motion_filter'
            | 'apply_sharpening'
            | 'apply_vehicle_pixel_motion_filter'
            | 'disable_person_ai'
            | 'disable_vehicle_ai'
            | 'secondary_verification',
        newValue: boolean
    ) => {
        if (!activeUser || !selectedCamera) {
            return null;
        }

        mutate({
            user: activeUser,
            annotationSettings: {
                camera_id: Number(selectedCamera.value),
                changes: {
                    [key]: newValue,
                },
            },
        });

        return undefined;
    };

    const handleJobTypeSelect = (newJobType: string) => {
        if (!activeUser || !selectedCamera) {
            return null;
        }

        mutate({
            user: activeUser,
            annotationSettings: {
                camera_id: Number(selectedCamera.value),
                changes: {
                    job_type: newJobType,
                },
            },
        });

        return undefined;
    };

    return (
        <motion.form
            className="test-clips"
            id="CreateCustomer"
            key="CreateCustomer"
            autoComplete="off"
            onSubmit={handleUpload}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <h3 id="title">
                <span>Test Clips</span>
            </h3>

            {accountType === AccountType.Evolon && (
                <div className="select-container form-item">
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

                            setSelectedCustomer(null);
                            setCustomerOptions([]);
                            setSelectedSite(null);
                            setSiteOptions([]);
                            setSelectedCamera(null);
                            setCameraOptions([]);
                        }}
                        options={serviceProviderOptions}
                        isClearable={false}
                        disabled={defaultServiceProvider !== null}
                        required
                    />
                </div>
            )}
            <div className="select-container form-item">
                <label htmlFor="customers">
                    <span>Customer</span>
                    <span className="asterisk">*</span>
                </label>
                <Select
                    id="customers"
                    value={selectedCustomer}
                    onChange={(option) => {
                        if (option?.value === selectedCustomer?.value) {
                            return;
                        }

                        setSelectedCustomer(
                            option as SingleValue<SelectOption>
                        );
                        setSelectedSite(null);
                        setSiteOptions([]);
                        setSelectedCamera(null);
                        setCameraOptions([]);
                    }}
                    options={customerOptions}
                    isClearable={false}
                    required
                />
            </div>
            <div className="select-container form-item">
                <label htmlFor="site">
                    <span>Site</span>
                    <span className="asterisk">*</span>
                </label>
                <Select
                    id="site-select"
                    value={selectedSite}
                    onChange={(option) => {
                        if (option?.value === selectedSite?.value) {
                            return;
                        }

                        setSelectedSite(option as SingleValue<SelectOption>);
                        setSelectedCamera(null);
                        setCameraOptions([]);
                    }}
                    options={siteOptions}
                    required
                />
            </div>
            <div className="select-container form-item">
                <label htmlFor="site">
                    <span>Camera</span>
                    <span className="asterisk">*</span>
                </label>
                <Select
                    id="camera-select"
                    value={selectedCamera}
                    onChange={(option) => {
                        setSelectedCamera(option as SingleValue<SelectOption>);
                    }}
                    options={cameraOptions}
                    required
                    maxHeight={190}
                />
            </div>

            <Input
                id="api-key-input"
                name="api-key-input"
                label="API Key"
                className="input field"
                type="text"
                value={apiKey}
                autoComplete="false"
                onChange={setApiKey}
                required
            />

            {selectedCamera && cameraData && (
                <>
                    <div className="select-container form-item">
                        <label htmlFor="site">
                            <span>Job Type</span>
                        </label>
                        <Select
                            id="job-type-select"
                            value={selectedJobType}
                            onChange={(option) => {
                                if (option?.value) {
                                    handleJobTypeSelect(option.value);
                                }
                            }}
                            isClearable={false}
                            options={jobTypeOptions}
                            required
                        />
                    </div>
                    {cameraData.camera_properties.job_type === 'edge' && (
                        <>
                            <div className="select-container form-item">
                                <label htmlFor="site">
                                    <span>Mask</span>
                                </label>
                                <textarea
                                    className="input"
                                    value={mask}
                                    onChange={(e) => setMask(e.target.value)}
                                    rows={6}
                                />
                            </div>
                            <div>
                                <canvas
                                    style={{ height: 'auto', width: 300 }}
                                    ref={canvasRef}
                                    height={cameraData.height}
                                    width={cameraData.width}
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            {isLoading && <LoadingModal modalText="Sending Clip(s)..." />}
            {updatingCameraAnnotationSettings && (
                <LoadingModal modalText="Updating Camera Annotation Settings..." />
            )}
            {loadingCameraData && (
                <LoadingModal modalText="Loading Camera Data..." />
            )}

            {cameraData && selectedCamera && (
                <div>
                    <p>Camera Info</p>
                    <p>CAMERA ID: {cameraData.camera_id}</p>
                    {cameraData?.camera_properties.email && (
                        <p>Email: {cameraData?.camera_properties.email}</p>
                    )}

                    <p>
                        Camera Unique String: {cameraData.camera_unique_string}
                    </p>

                    <p>Job Type: {cameraData?.camera_properties.job_type}</p>
                    <ul className="camera-settings-list">
                        <li className="camera-settings-toggle-container">
                            <p id="apply-blur">Apply Blur</p>
                            <Toggle
                                id="apply-blur-toggle"
                                value={apply_blur}
                                onToggleChange={() =>
                                    handleToggleClick('apply_blur', !apply_blur)
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="apply-tiling">Apply Tiling</p>
                            <Toggle
                                id="apply-tiling-toggle"
                                value={apply_tiling}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'apply_tiling',
                                        !apply_tiling
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="apply-sharpening">Apply Sharpening</p>
                            <Toggle
                                id="apply-sharpening-toggle"
                                value={apply_sharpening}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'apply_sharpening',
                                        !apply_sharpening
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="analyze-secondary-attributes">
                                Analyze Secondary Attributes
                            </p>
                            <Toggle
                                id="analyze-secondary-attributes-toggle"
                                value={analyze_secondary_attributes}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'analyze_secondary_attributes',
                                        !analyze_secondary_attributes
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>

                        <li className="camera-settings-toggle-container">
                            <p>Suppress Untracked Persons</p>
                            <Toggle
                                id="suppress-untracked-persons-toggle"
                                value={suppress_untracked_persons}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'suppress_untracked_persons',
                                        !suppress_untracked_persons
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="apply-blur">Suppress Untracked Vehicles</p>
                            <Toggle
                                id="suppress-untracked-vehicles-toggle"
                                value={suppress_untracked_vehicles}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'suppress_untracked_vehicles',
                                        !suppress_untracked_vehicles
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="analyze-person-loitering">
                                Analyze Person Loitering
                            </p>
                            <Toggle
                                id="analyze-person-loitering-toggle"
                                value={analyze_person_loitering}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'analyze_person_loitering',
                                        !analyze_person_loitering
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="analyze-vehicle-loitering">
                                Analyze Vehicle Loitering
                            </p>
                            <Toggle
                                id="analyze-vehicle-loitering-toggle"
                                value={analyze_vehicle_loitering}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'analyze_vehicle_loitering',
                                        !analyze_vehicle_loitering
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>

                        <li className="camera-settings-toggle-container">
                            <p id="apply-person-pixel-motion-filter">
                                Apply Person Pixel Motion Filter
                            </p>
                            <Toggle
                                id="apply-person-pixel-motion-filter-toggle"
                                value={apply_person_pixel_motion_filter}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'apply_person_pixel_motion_filter',
                                        !apply_person_pixel_motion_filter
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="apply-person-vehicle-motion-filter">
                                Apply Vehicle Pixel Motion Filter
                            </p>
                            <Toggle
                                id="apply-person-vehicle-motion-filter-toggle"
                                value={apply_vehicle_pixel_motion_filter}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'apply_vehicle_pixel_motion_filter',
                                        !apply_vehicle_pixel_motion_filter
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="disable-person-ai">Disable Person AI</p>
                            <Toggle
                                id="disable-person-ai-toggle"
                                value={disable_person_ai}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'disable_person_ai',
                                        !disable_person_ai
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="disable-vehicle-ai">Disable Vehicle AI</p>
                            <Toggle
                                id="disable-vehicle-ai-toggle"
                                value={disable_vehicle_ai}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'disable_vehicle_ai',
                                        !disable_vehicle_ai
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                        <li className="camera-settings-toggle-container">
                            <p id="secondary-verification">
                                Secondary Verification
                            </p>
                            <Toggle
                                id="secondary-verification-toggle"
                                value={secondary_verification}
                                onToggleChange={() =>
                                    handleToggleClick(
                                        'secondary_verification',
                                        !secondary_verification
                                    )
                                }
                                toggleOnText="True"
                                toggleOffText="False"
                            />
                        </li>
                    </ul>
                </div>
            )}

            <input type="file" multiple onChange={handleFileChange} />

            <button className="btn primary" type="submit">
                Send Clip
            </button>
        </motion.form>
    );
};

export default TestClips;
