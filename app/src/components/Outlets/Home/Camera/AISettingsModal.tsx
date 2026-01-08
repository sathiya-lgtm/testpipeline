/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import { FC, useState, useContext, useMemo, useEffect } from 'react';

// React Query
import { useQuery, useMutation } from '@tanstack/react-query';

// Toast
import { toast } from 'react-toastify';

// Api calls
import getCameraTypes from '../../../../api_calls/getCameraTypes';
import updateMotionConfidence from '../../../../api_calls/updateMotionConfidence';
import updateConfidence from '../../../../api_calls/updateConfidence';
import updateCameraType from '../../../../api_calls/updateCameraType';

// Components
import ModalBase from '../../../ModalBase';
import Toggle from '../../../Inputs/Toggle';
import Select from '../../../Inputs/Select';
import LoadingModal from '../../../Modals/LoadingModal';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

// Icons
import PersonIcon from '../../../../images/icons/EV_person.svg?react';
import VehicleIcon from '../../../../images/icons/EV_vehicle.svg?react';

// Utils
import {
    handleCameraTypeUpdate,
    extractCameraConfidenceThresholds,
    convertTrackingSensitivityTextToNumber,
    defaultConfidenceThreshold,
} from './Camera.controller';

// Types
import { IUser, SelectOption } from '../../../../types/interfaces';
import { TrackingSensitivity } from '../../../../types/enums';
import { ICameraData } from '../../../../types/tng-api.interfaces';

// Styles
import '../../../../styles/components/Outlets/Home/Edge/AdvancedSettingsModal.scss';

interface IProps {
    handleClose: () => void;
    cameraData: ICameraData;
    refetch: any;
}

const AISettingsModal: FC<IProps> = ({ handleClose, cameraData, refetch }) => {
    const { activeUser } = useContext(AuthContext);

    const [cameraType, setCameraType] = useState<SelectOption | null>(null);
    const [personMotionConfidence, setPersonMotionConfidence] = useState(4);
    const [vehicleMotionConfidence, setVehicleMotionConfidence] = useState(30);
    const [personConfidenceThreshold, setPersonConfidenceThreshold] =
        useState<number>(defaultConfidenceThreshold);

    const [vehicleConfidenceThreshold, setVehicleConfidenceThreshold] =
        useState<number>(defaultConfidenceThreshold);
    const [isPersonAiEnabled, setIsPersonAiEnabled] = useState<boolean>(true);
    const [isVehicleAiEnabled, setIsVehicleAiEnabled] = useState<boolean>(true);

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

    const handleSave = async () => {
        if (!activeUser || !cameraType) {
            return;
        }

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
                        vehicle_motion_confidence: vehicleMotionConfidence,
                        person_motion_confidence: personMotionConfidence,
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
        } catch (error) {
            console.log(error);
            toast.error('Unable to save settings');
            return;
        }
        toast.success('Settings Updated.');
        refetch();
        handleClose();
    };

    useEffect(() => {
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

    return (
        <>
            <ModalBase
                title="AI Settings"
                handleClose={handleClose}
                className="advancedSettingsModal"
            >
                <div>
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
                                        setIsVehicleAiEnabled(
                                            !isVehicleAiEnabled
                                        )
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
            {(motionConfidenceMutation.isLoading ||
                confidenceMutation.isLoading ||
                cameraTypeMutation.isLoading) && (
                <LoadingModal modalText="Updating AI Settings..." />
            )}
        </>
    );
};

export default AISettingsModal;
