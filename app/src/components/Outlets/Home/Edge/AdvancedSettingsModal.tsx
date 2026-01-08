/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
    FC,
    useState,
    useContext,
    Dispatch,
    SetStateAction,
    useMemo,
    useEffect,
} from 'react';

// React Query
import { useQuery, useMutation } from '@tanstack/react-query';

// Toast
import { toast } from 'react-toastify';

// Api calls
import getCameraTypes from '../../../../api_calls/getCameraTypes';
import updateMotionConfidence from '../../../../api_calls/updateMotionConfidence';
import updateConfidence from '../../../../api_calls/updateConfidence';
import updateCameraType from '../../../../api_calls/updateCameraType';
import updateEdgeLicenseType from '../../../../api_calls/updateEdgeLicenseType';

// Components
import ModalBase from '../../../ModalBase';
import Toggle from '../../../Inputs/Toggle';
import Select from '../../../Inputs/Select';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

// Icons
import PersonIcon from '../../../../images/icons/EV_person.svg?react';
import VehicleIcon from '../../../../images/icons/EV_vehicle.svg?react';

// Utils
import {
    edgeLicenseTypeOptions,
    handleCameraTypeUpdate,
    extractCameraConfidenceThresholds,
    convertTrackingSensitivityTextToNumber,
} from '../Camera/Camera.controller';

// Edge Data Fetching
import {
    getASMSetting,
    getNuisanceData,
    getObjectDetectionStatus,
    setActiveSceneManagement,
    setNuisanceSettings,
    getInsitesPreMilliseconds,
    getInsitesPostMilliseconds,
} from './dataFetching';

// Types
import { IUser, SelectOption } from '../../../../types/interfaces';
import { TrackingSensitivity } from '../../../../types/enums';
import {
    ICameraData,
    EdgeLicenseTypes,
} from '../../../../types/tng-api.interfaces';
import { ASMSetting } from './edgeTypes';
import { CustomWebSocket } from './Edge';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/AdvancedSettingsModal.scss';

interface IProps {
    handleClose: () => void;
    cameraData: ICameraData;
    edgeLicenseType: SelectOption;
    setEdgeLicenseType: Dispatch<SetStateAction<SelectOption>>;
    personMotionConfidence: number;
    setPersonMotionConfidence: Dispatch<SetStateAction<number>>;
    vehicleMotionConfidence: number;
    setVehicleMotionConfidence: Dispatch<SetStateAction<number>>;
    personConfidenceThreshold: number;
    setPersonConfidenceThreshold: Dispatch<SetStateAction<number>>;
    vehicleConfidenceThreshold: number;
    setVehicleConfidenceThreshold: Dispatch<SetStateAction<number>>;
    isPersonAiEnabled: boolean;
    setIsPersonAiEnabled: Dispatch<SetStateAction<boolean>>;
    isVehicleAiEnabled: boolean;
    setIsVehicleAiEnabled: Dispatch<SetStateAction<boolean>>;
    setLoadingText: Dispatch<SetStateAction<string>>;
    refetch: any;
    socket: CustomWebSocket;
    source_id: string;
    getSequence: () => number;
}

const AdvancedSettingsModal: FC<IProps> = ({
                                               handleClose,
                                               cameraData,
                                               edgeLicenseType,
                                               setEdgeLicenseType,
                                               personMotionConfidence,
                                               setPersonMotionConfidence,
                                               vehicleMotionConfidence,
                                               setVehicleMotionConfidence,
                                               personConfidenceThreshold,
                                               setPersonConfidenceThreshold,
                                               vehicleConfidenceThreshold,
                                               setVehicleConfidenceThreshold,
                                               isPersonAiEnabled,
                                               setIsPersonAiEnabled,
                                               isVehicleAiEnabled,
                                               setIsVehicleAiEnabled,
                                               setLoadingText,
                                               refetch,
                                               socket,
                                               source_id,
                                               getSequence,
                                           }) => {
    const { activeUser } = useContext(AuthContext);

    const [objectDetection, setObjectDetection] = useState<
        'on' | 'off' | 'unknown'
    >('unknown');
    const [asmSettings, setAsmSetting] = useState<ASMSetting>('1');
    const [nuisanceEnabled, setNuisanceEnabled] = useState(false);
    const [nuisanceCounter, setNuisanceCounter] = useState('2');
    const [nuisanceInterval, setNuisanceInterval] = useState('60');
    const [nuisanceReset, setNuisanceReset] = useState('60');
    const [nuisanceCoverage, setNuisanceCoverage] = useState('10');

    const [cameraType, setCameraType] = useState<SelectOption | null>(null);

    const getASM = async () => {
        if (!socket || !source_id) {
            toast.error('Unable to connect to edge camera.');
            return '';
        }

        const result = await getASMSetting({
            socket,
            source_id,
            getSequence,
        });

        return result;
    };

    const getNuisance = async () => {
        if (!socket || !source_id) {
            toast.error('Unable to connect to edge camera.');
            return null;
        }

        const result = await getNuisanceData({
            socket,
            source_id,
            getSequence,
        });

        return result;
    };

    const getObjectDetection = async () => {
        if (!socket || !source_id) {
            toast.error('Unable to connect to edge camera.');
            return '';
        }

        const result = await getObjectDetectionStatus({
            socket,
            source_id,
            getSequence,
        });

        return result;
    };

    const getPreMilliseconds = async () => {
        if (!socket || !source_id) {
            toast.error('Unable to connect to edge camera.');
            return '';
        }

        const result = await getInsitesPreMilliseconds({
            socket,
            source_id,
            getSequence,
        });

        return result;
    };

    const getPostMilliseconds = async () => {
        if (!socket || !source_id) {
            toast.error('Unable to connect to edge camera.');
            return '';
        }

        const result = await getInsitesPostMilliseconds({
            socket,
            source_id,
            getSequence,
        });

        return result;
    };

    // Get the list of camera Types
    const cameraTypesData = useQuery({
        queryKey: ['camera-types'],
        queryFn: () => getCameraTypes(activeUser as IUser),
    });

    const cameraTypeOptions = useMemo(() => {
        return cameraTypesData.data;
    }, [cameraTypesData.data]);

    const motionConfidenceMutation = useMutation({
        mutationFn: updateMotionConfidence,
    });

    const confidenceMutation = useMutation({
        mutationFn: updateConfidence,
    });

    const cameraTypeMutation = useMutation({
        mutationFn: updateCameraType,
    });

    const edgeLicenseTypeMutation = useMutation({
        mutationFn: updateEdgeLicenseType,
    });

    const handleSave = async () => {
        if (!activeUser || !cameraType || !edgeLicenseType) {
            return;
        }

        setLoadingText('Updating settings...');

        const { camera_id } = cameraData;

        const aPersonConfidenceThreshold: number =
            personConfidenceThreshold > 0 ? personConfidenceThreshold / 100 : 0;
        const aVehicleConfidenceThreshold: number =
            vehicleConfidenceThreshold > 0
                ? vehicleConfidenceThreshold / 100
                : 0;

        try {
            await motionConfidenceMutation.mutateAsync({
                user: activeUser,
                motionConfidenceData: {
                    camera_id,
                    changes: {
                        person_motion_confidence: personMotionConfidence,
                        vehicle_motion_confidence: vehicleMotionConfidence,
                    },
                },
            });
            await confidenceMutation.mutateAsync({
                user: activeUser,
                confidenceData: {
                    camera_id,
                    confidence: {
                        person: aPersonConfidenceThreshold,
                        vehicle: aVehicleConfidenceThreshold,
                    },
                    disable_ai: {
                        disable_person_ai: !isPersonAiEnabled,
                        disable_vehicle_ai: !isVehicleAiEnabled,
                    },
                },
            });
            await cameraTypeMutation.mutateAsync({
                user: activeUser,
                cameraId: camera_id,
                cameraType: cameraType.value as 'rgb' | 'thermal',
            });
            await edgeLicenseTypeMutation.mutateAsync({
                user: activeUser,
                cameraId: camera_id,
                licenseType: edgeLicenseType.value as EdgeLicenseTypes,
            });
            await setActiveSceneManagement({
                socket,
                source_id,
                asmSetting: asmSettings,
                getSequence,
            });
            await setNuisanceSettings({
                socket,
                source_id,
                getSequence,
                nuisanceSettings: {
                    nuisanceEnabled: nuisanceEnabled ? '1' : '0',
                    nuisanceCounter,
                    nuisanceInterval,
                    nuisanceReset,
                    nuisanceCoverage,
                },
            });
        } catch (error) {
            console.log(error);
            toast.error('Unable to save settings');
            setLoadingText('');
            return;
        }
        toast.success('Settings Updated.');
        setLoadingText('');
        refetch();
        handleClose();
    };

    const getEdgeData = async () => {
        try {
            setLoadingText('Getting camera data...');
            const asmValue = await getASM();
            const objectDetectionValue = await getObjectDetection();
            const nuisanceData = await getNuisance();
            setAsmSetting(asmValue as ASMSetting);

            if (nuisanceData) {
                setNuisanceEnabled(nuisanceData.nuisanceEnabled === '1');
                setNuisanceCounter(nuisanceData.nuisanceCounter);
                setNuisanceInterval(nuisanceData.nuisanceInterval);
                setNuisanceReset(nuisanceData.nuisanceReset);
                setNuisanceCoverage(nuisanceData.nuisanceCoverage);
            }

            let objectDetectionFormatted = 'unknown' as
                | 'on'
                | 'off'
                | 'unknown';

            if (objectDetectionValue === '0') {
                objectDetectionFormatted = 'off';
            } else if (objectDetectionValue === '1') {
                objectDetectionFormatted = 'on';
            }

            setObjectDetection(objectDetectionFormatted);
        } catch (error) {
            toast.error('Unable to get data from edge camera.');
        }

        setLoadingText('');
    };

    useEffect(() => {
        if (cameraData.camera_properties.license_type) {
            const licenseType = cameraData.camera_properties.license_type;

            const currentLicenseType = edgeLicenseTypeOptions.find((option) => {
                return option.value === licenseType;
            });

            if (currentLicenseType) {
                setEdgeLicenseType(currentLicenseType);
            }
        }

        // There use to be only one motion confidence and it applied to vehicles.
        // This has sense been updated to the two values below
        const oldMotionConfidence: TrackingSensitivity | number | undefined =
            cameraData.camera_properties.vehicle_motion_sensitivity;
        // New way motion confidence is used.  It would be great to eventually remove the logic
        // handling the oldMotionConfidence values.
        const savedPersonMotionConfidence =
            cameraData.camera_properties.person_motion_confidence;
        const savedVehicleMotionConfidence =
            cameraData.camera_properties.vehicle_motion_confidence;
        const confidence = extractCameraConfidenceThresholds(cameraData);
        const disablePersonAi: boolean | undefined =
            cameraData?.camera_properties?.disable_person_ai;
        const disableVehicleAi: boolean | undefined =
            cameraData?.camera_properties?.disable_vehicle_ai;

        // 4 is what the AI defaults to for person motion confidence if not assigned (as of 11/21/2024 9:25am CST)
        // 30 is what the AI defaults to for vehicle motion confidence if not assigned (as of 11/21/2024 9:25am CST)
        // savedPersonMotionConfidence and savedVehicleMotionConfidence can be 0 so we need to explicitly check if it is undefined (can't use truthy/falsey)
        setPersonMotionConfidence(
            savedPersonMotionConfidence === undefined
                ? 4
                : savedPersonMotionConfidence
        );
        setVehicleMotionConfidence(
            savedVehicleMotionConfidence === undefined
                ? 30
                : savedVehicleMotionConfidence
        );

        // This handles the legacy motion confidence which was called vehicle_motion_sensitivity
        // And was the only motionConfidence that could be changed at the time.
        if (savedVehicleMotionConfidence === undefined) {
            if (oldMotionConfidence === undefined) {
                setVehicleMotionConfidence(30);
            } else if (typeof oldMotionConfidence === 'number') {
                setVehicleMotionConfidence(oldMotionConfidence);
            } else if (
                Object.values(TrackingSensitivity).includes(oldMotionConfidence)
            ) {
                setVehicleMotionConfidence(
                    convertTrackingSensitivityTextToNumber(oldMotionConfidence)
                );
            } else {
                const errorMessage: string = `Invalid motion confidence value: ${oldMotionConfidence}`;

                console.error(errorMessage);
                toast.error(errorMessage);
            }
        }

        setPersonConfidenceThreshold(confidence.person);
        setVehicleConfidenceThreshold(confidence.vehicle);
        setIsPersonAiEnabled(disablePersonAi !== true);
        setIsVehicleAiEnabled(disableVehicleAi !== true);
    }, [cameraData]);

    useEffect(() => {
        if (cameraTypeOptions) {
            let type = 'rgb';

            if (cameraData.camera_properties?.camera_type) {
                type = cameraData.camera_properties?.camera_type;
            }

            handleCameraTypeUpdate(
                type as 'rgb' | 'flir',
                cameraTypeOptions,
                setCameraType
            );
        }
    }, [cameraTypeOptions]);

    useEffect(() => {
        getEdgeData();
    }, []);

    return (
        <ModalBase
            title="Advanced Settings"
            handleClose={handleClose}
            className="advancedSettingsModal"
        >
            <div>
                <h3>Detection</h3>
                <div className="toggleContainer">
                    <span className="label">Object Detection</span>
                    <span>{objectDetection}</span>
                </div>
                <div className="radioContainer">
                    <span className="label">ASM</span>
                    <div className="radioGroup">
                        <div className="radioBtn primary">
                            <input
                                type="radio"
                                id="asmOff"
                                name="autoScaleMode"
                                value="1"
                                checked={asmSettings === '1'}
                                onChange={(e) =>
                                    setAsmSetting(e.target.value as ASMSetting)
                                }
                            />
                            <label htmlFor="asmOff">OFF</label>
                        </div>
                        <div className="radioBtn primary">
                            <input
                                type="radio"
                                id="asmLow"
                                name="asmLow"
                                value="3"
                                checked={asmSettings === '3'}
                                onChange={(e) =>
                                    setAsmSetting(e.target.value as ASMSetting)
                                }
                            />
                            <label htmlFor="asmLow">Low</label>
                        </div>
                        <div className="radioBtn primary">
                            <input
                                type="radio"
                                id="asmMedium"
                                name="asmMedium"
                                value="5"
                                checked={asmSettings === '5'}
                                onChange={(e) =>
                                    setAsmSetting(e.target.value as ASMSetting)
                                }
                            />
                            <label htmlFor="asmMedium">Medium</label>
                        </div>
                        <div className="radioBtn primary">
                            <input
                                type="radio"
                                id="asmHigh"
                                name="asmHigh"
                                value="7"
                                checked={asmSettings === '7'}
                                onChange={(e) =>
                                    setAsmSetting(e.target.value as ASMSetting)
                                }
                            />
                            <label htmlFor="asmHigh">High</label>
                        </div>
                    </div>
                </div>

                <div className="toggleContainer">
                    <span className="label">Nuisance Detection</span>

                    <Toggle
                        id="nuisanceEnabledToggle"
                        value={nuisanceEnabled}
                        onToggleChange={() => {
                            setNuisanceEnabled(!nuisanceEnabled);
                        }}
                        toggleOnText="ON"
                        toggleOffText="OFF"
                    />
                </div>

                {nuisanceEnabled && (
                    <>
                        <div className="inputContainer">
                            <label
                                htmlFor="nuisanceCounterInput"
                                className="labelWrapper"
                            >
                                <span className="label">Nuisance Counter</span>
                                <input
                                    type="number"
                                    name="nuisanceCounterInput"
                                    className="input"
                                    value={nuisanceCounter}
                                    onChange={(e) =>
                                        setNuisanceCounter(e.target.value)
                                    }
                                />
                            </label>
                        </div>

                        <div className="inputContainer">
                            <label
                                htmlFor="nuisanceTimeIntervalInput"
                                className="labelWrapper"
                            >
                                <span className="label">
                                    Nuisance Time Interval (sec)
                                </span>
                                <input
                                    type="number"
                                    name="nuisanceTimeIntervalInput"
                                    className="input"
                                    value={nuisanceInterval}
                                    onChange={(e) =>
                                        setNuisanceInterval(e.target.value)
                                    }
                                />
                            </label>
                        </div>

                        <div className="inputContainer">
                            <label
                                htmlFor="nuisanceResetTimeInput"
                                className="labelWrapper"
                            >
                                <span className="label">
                                    Nuisance Reset Time (min)
                                </span>
                                <input
                                    type="number"
                                    name="nuisanceResetTimeInput"
                                    className="input"
                                    value={nuisanceReset}
                                    onChange={(e) =>
                                        setNuisanceReset(e.target.value)
                                    }
                                />
                            </label>
                        </div>

                        <div className="inputContainer">
                            <label
                                htmlFor="nuisanceCoverageInput"
                                className="labelWrapper"
                            >
                                <span className="label">
                                    Nuisance Coverage (%)
                                </span>
                                <input
                                    type="number"
                                    name="nuisanceCoverageInput"
                                    className="input"
                                    value={nuisanceCoverage}
                                    onChange={(e) =>
                                        setNuisanceCoverage(e.target.value)
                                    }
                                />
                            </label>
                        </div>
                    </>
                )}

                <h3>AI Settings</h3>
                <div className="selectContainer">
                    <span className="label">Camera Type</span>
                    <div className="selectWrapper">
                        <Select
                            id="color-model-select"
                            value={cameraType}
                            options={cameraTypesData.data || []}
                            onChange={(newValue) => {
                                const result = newValue as SelectOption;
                                setCameraType(result);
                            }}
                            isClearable={false}
                        />
                    </div>
                </div>
                <div className="selectContainer">
                    <span className="label">Subscription Type</span>
                    <div className="selectWrapper">
                        <Select
                            id="subscription-type-select"
                            value={edgeLicenseType}
                            options={edgeLicenseTypeOptions || []}
                            onChange={(newValue) => {
                                const result = newValue as SelectOption;
                                setEdgeLicenseType(result);
                            }}
                            isClearable={false}
                        />
                    </div>
                </div>

                <div className="confidence-threshold">
                    <p className="label">Motion Confidence Threshold</p>

                    <div className="subtext-container">
                        <span>
                            <p className="subtext percentage">
                                {personMotionConfidence}%
                            </p>
                            <p
                                className="subtext title tooltip wide-xl right"
                                data-tooltip="Sets the level of person motion needed to trigger an alert. A higher value increases the level of motion required to trigger an alert on an object that is classified as a person. Useful to eliminate false positives from inanimate objects such as trees, poles, and reflections."
                            >
                                Person
                            </p>
                        </span>
                        <span>
                            <Toggle
                                id="person-motion-ai-toggle"
                                value={personMotionConfidence !== 0}
                                onToggleChange={() => {
                                    if (personMotionConfidence === 0) {
                                        setPersonMotionConfidence(4);
                                    } else {
                                        setPersonMotionConfidence(0);
                                    }
                                }}
                                toggleOnText="ON"
                                toggleOffText="OFF"
                            />
                            <PersonIcon className="person icon" />
                        </span>
                    </div>
                    <div
                        className={`slider-container ${
                            personMotionConfidence === 0 ? 'disabled' : ''
                        }`}
                    >
                        <input
                            id="person-confidence-threshold-slider"
                            className="slider"
                            type="range"
                            min="1"
                            max="99"
                            step="1"
                            value={personMotionConfidence}
                            onChange={(e) =>
                                setPersonMotionConfidence(
                                    Number(e.target.value)
                                )
                            }
                        />
                    </div>

                    <div className="subtext-container">
                        <span>
                            <p className="subtext percentage">
                                {vehicleMotionConfidence}%
                            </p>
                            <p
                                className="subtext title tooltip wide-xl right"
                                data-tooltip="Sets the level of vehicle motion needed to trigger an alert. A higher value increases the level of motion required to trigger an alert on an object that is classified as a vehicle. Useful to eliminate false positives from parked vehicles that are subject to random lighting."
                            >
                                Vehicle
                            </p>
                        </span>
                        <span>
                            <Toggle
                                id="vehicle-motion-ai-toggle"
                                value={vehicleMotionConfidence !== 0}
                                onToggleChange={() => {
                                    if (vehicleMotionConfidence === 0) {
                                        setVehicleMotionConfidence(30);
                                    } else {
                                        setVehicleMotionConfidence(0);
                                    }
                                }}
                                toggleOnText="ON"
                                toggleOffText="OFF"
                            />
                            <VehicleIcon className="vehicle icon" />
                        </span>
                    </div>
                    <div
                        className={`slider-container ${
                            vehicleMotionConfidence === 0 ? 'disabled' : ''
                        }`}
                    >
                        <input
                            id="vehicle-confidence-threshold-slider"
                            className="slider"
                            type="range"
                            min="1"
                            max="99"
                            step="1"
                            value={vehicleMotionConfidence}
                            onChange={(e) =>
                                setVehicleMotionConfidence(
                                    Number(e.target.value)
                                )
                            }
                        />
                    </div>
                </div>

                <div className="confidence-threshold">
                    <p className="label">AI Confidence Threshold</p>
                    <div className="subtext-container">
                        <span>
                            <p className="subtext percentage">
                                {personConfidenceThreshold}%
                            </p>
                            <p
                                className="subtext title tooltip wide-xl right"
                                data-tooltip="Sets the minimum confidence level for AI to classify an object as a person."
                            >
                                Person
                            </p>
                        </span>
                        <span>
                            <Toggle
                                id="disable-person-ai-toggle"
                                value={isPersonAiEnabled}
                                onToggleChange={() =>
                                    setIsPersonAiEnabled(!isPersonAiEnabled)
                                }
                                toggleOnText="ON"
                                toggleOffText="OFF"
                            />
                            <PersonIcon className="person icon" />
                        </span>
                    </div>
                    <div
                        className={`slider-container ${
                            isPersonAiEnabled ? '' : 'disabled'
                        }`}
                    >
                        <input
                            id="person-confidence-threshold-slider"
                            className="slider"
                            type="range"
                            min="1"
                            max="99"
                            step="1"
                            value={personConfidenceThreshold}
                            onChange={(e) =>
                                setPersonConfidenceThreshold(
                                    Number(e.target.value)
                                )
                            }
                        />
                    </div>
                    <div className="subtext-container">
                        <span>
                            <p className="subtext percentage">
                                {vehicleConfidenceThreshold}%
                            </p>
                            <p
                                className="subtext title tooltip wide-xl right"
                                data-tooltip="Sets the minimum confidence level for AI to classify an object as a vehicle."
                            >
                                Vehicle
                            </p>
                        </span>
                        <span>
                            <Toggle
                                id="disable-vehicle-ai-toggle"
                                value={isVehicleAiEnabled}
                                onToggleChange={() =>
                                    setIsVehicleAiEnabled(!isVehicleAiEnabled)
                                }
                                toggleOnText="ON"
                                toggleOffText="OFF"
                            />
                            <VehicleIcon className="vehicle icon" />
                        </span>
                    </div>
                    <div
                        className={`slider-container ${
                            isVehicleAiEnabled ? '' : 'disabled'
                        }`}
                    >
                        <input
                            id="vehicle-confidence-threshold-slider"
                            className="slider"
                            type="range"
                            min="1"
                            max="99"
                            step="1"
                            value={vehicleConfidenceThreshold}
                            onChange={(e) =>
                                setVehicleConfidenceThreshold(
                                    Number(e.target.value)
                                )
                            }
                        />
                    </div>
                </div>
                <div className="buttonsContainer">
                    <button
                        className="btn primary"
                        type="button"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <button
                        className="btn danger"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </ModalBase>
    );
};

export default AdvancedSettingsModal;
