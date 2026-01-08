// React
import React, { FC, useState, useEffect } from 'react';

// Third party
import { UseMutationResult } from '@tanstack/react-query';

// Custom
import extractErrorMessage from '../../utils/extractErrorMessage';

// Components
import ModalBase from '../ModalBase';
import Button from '../Button';
import Toggle from '../Inputs/Toggle';
import ConfirmPremiumFeaturesModal from './ConfirmPremiumFeaturesModal';

// API
import { IUpdateLoiteringPostParams } from '../../api_calls/updateLoitering';

// Types
import { IUser } from '../../types/interfaces';
import { ICameraData } from '../../types/tng-api.interfaces';

// Images
import PersonIcon from '../../images/icons/EV_person.svg?react';
import VehicleIcon from '../../images/icons/EV_vehicle.svg?react';
import ToolTipIcon from '../../images/icons/EdgeAT_Info.svg?react';

// Styles
import '../../styles/components/Modals/PremiumFeaturesModal.scss';

interface IProps {
    user: IUser;
    loiteringMutation: UseMutationResult<
        void,
        any,
        IUpdateLoiteringPostParams,
        unknown
    >;
    data: ICameraData;
    handleClose: () => void;
}

const PremiumFeaturesModal: FC<IProps> = ({
    handleClose,
    loiteringMutation,
    data,
    user,
}) => {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPersonLoiteringEnabled, setIsPersonLoiteringEnabled] =
        useState<boolean>(
            data.camera_properties.analyze_person_loitering || false
        );
    const [personTimeInArea, setPersonTimeInArea] = useState<string | number>(
        data.camera_properties.person_min_time_in_scene || '10'
    );
    const [personTimeout, setPersonTimeout] = useState<string | number>(
        data.camera_properties.person_timeout_duration || '60'
    );
    const [isVehicleLoiteringEnabled] = useState<boolean>(false);
    const [vehicleTimeInArea, setVehicleTimeInArea] = useState<string | number>(
        data.camera_properties.vehicle_min_time_in_scene || '30'
    );
    const [vehicleTimeout, setVehicleTimeout] = useState<string | number>(
        data.camera_properties.vehicle_timeout_duration || '60'
    );

    // Confirm modal
    const [
        isEnablePremiumFeaturesModalOpen,
        setIsEnablePremiumFeaturesModalOpen,
    ] = useState(false);

    const validateForm = (): void => {
        const errorMessages = [];

        if (Number.isNaN(personTimeInArea)) {
            errorMessages.push('Person Time In Area must be a number.');
        }

        if (Number.isNaN(personTimeout)) {
            errorMessages.push('Person Timeout must be a number.');
        }

        if (Number.isNaN(vehicleTimeInArea)) {
            errorMessages.push('Vehicle Time In Area must be a number.');
        }

        if (Number.isNaN(vehicleTimeout)) {
            errorMessages.push('Vehicle Timeout must be a number.');
        }

        if (errorMessages.length > 0) {
            throw new Error(errorMessages.join(' '));
        }
    };

    const saveLoitering = (): void => {
        try {
            validateForm();
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));

            return;
        }

        loiteringMutation.mutate({
            user,
            updateLoiteringData: {
                camera_id: data.camera_id,
                loitering_options: {
                    analyze_person_loitering: isPersonLoiteringEnabled,
                    person_min_time_in_scene: +personTimeInArea,
                    person_timeout_duration: +personTimeout,
                    analyze_vehicle_loitering: false,
                    vehicle_min_time_in_scene: +vehicleTimeInArea,
                    vehicle_timeout_duration: +vehicleTimeout,
                },
            },
        });
    };

    const handleApply = (): void => {
        const wasLoiteringAlreadyEnabled: boolean =
            data.camera_properties.analyze_person_loitering === true ||
            data.camera_properties.analyze_vehicle_loitering === true;
        const isEnablingLoitering: boolean =
            !wasLoiteringAlreadyEnabled &&
            (isPersonLoiteringEnabled || isVehicleLoiteringEnabled);

        if (isEnablingLoitering) {
            setIsEnablePremiumFeaturesModalOpen(true);
        } else {
            saveLoitering();
            handleClose();
        }
    };

    const enablePremiumFeatures = (): void => {
        saveLoitering();
        setIsEnablePremiumFeaturesModalOpen(false);
        handleClose();
    };

    useEffect(() => {
        setErrorMessage(null);
    }, [personTimeInArea, personTimeout, vehicleTimeInArea, vehicleTimeout]);

    return (
        <ModalBase title="Premium Features" handleClose={handleClose}>
            <form
                className="PremiumFeaturesModal"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleApply();
                }}
            >
                {isEnablePremiumFeaturesModalOpen && (
                    <ConfirmPremiumFeaturesModal
                        handleConfirm={enablePremiumFeatures}
                        handleClose={() =>
                            setIsEnablePremiumFeaturesModalOpen(false)
                        }
                    />
                )}
                <section id="loitering">
                    {errorMessage && <p className="error">{errorMessage}</p>}
                    <div
                        className="header tooltip bottom"
                        data-tooltip="Loitering is a feature that will check the scene for any objects that persist in that area for a set amount of time. Time in Area will set the threshold for an alert (seconds). Timeout will set the time in which the Loitering alert will reset (seconds)."
                    >
                        <ToolTipIcon
                            onClick={() => {}}
                            className="icon"
                            id="tooltip-icon"
                        />
                        <h4 className="header-title">Loitering</h4>
                    </div>
                    <div className="row">
                        <PersonIcon className="person icon" />
                        <label
                            htmlFor="person-time-in-area"
                            className={`${
                                isPersonLoiteringEnabled ? '' : 'disabled'
                            } field`}
                        >
                            <span className="label">Time In Area:</span>
                            <input
                                className="input"
                                type="number"
                                inputMode="numeric"
                                id="person-time-in-area"
                                name="person-time-in-area"
                                min={1}
                                max={7_200}
                                value={personTimeInArea}
                                required
                                onChange={(e) => {
                                    setPersonTimeInArea(e.target.value);
                                }}
                            />
                        </label>
                        <label
                            htmlFor="person-timeout"
                            className={`${
                                isPersonLoiteringEnabled ? '' : 'disabled'
                            } field`}
                        >
                            <span className="label">Timeout:</span>
                            <input
                                className="input"
                                type="number"
                                inputMode="numeric"
                                id="person-timeout"
                                name="person-timeout"
                                min={1}
                                max={7_200}
                                value={personTimeout}
                                required
                                onChange={(e) => {
                                    setPersonTimeout(e.target.value);
                                }}
                            />
                        </label>
                        <Toggle
                            id="person-loitering-toggle"
                            value={isPersonLoiteringEnabled}
                            onToggleChange={() =>
                                setIsPersonLoiteringEnabled(
                                    !isPersonLoiteringEnabled
                                )
                            }
                            toggleOnText="ON"
                            toggleOffText="OFF"
                        />
                    </div>
                    <div
                        className="row"
                        id="vehicle-loitering-fields-container"
                    >
                        <VehicleIcon className="vehicle icon disabled" />
                        <label
                            htmlFor="vehicle-time-in-area"
                            className={`${
                                isVehicleLoiteringEnabled ? '' : 'disabled'
                            } field`}
                        >
                            <span className="label">Time In Area:</span>
                            <input
                                className="input"
                                type="number"
                                inputMode="numeric"
                                id="vehicle-time-in-area"
                                name="vehicle-time-in-area"
                                min={1}
                                max={7_200}
                                value={vehicleTimeInArea}
                                required
                                onChange={(e) => {
                                    setVehicleTimeInArea(e.target.value);
                                }}
                            />
                        </label>
                        <label
                            htmlFor="vehicle-timeout"
                            className={`${
                                isVehicleLoiteringEnabled ? '' : 'disabled'
                            } field`}
                        >
                            <span className="label">Timeout:</span>
                            <input
                                className="input"
                                type="number"
                                inputMode="numeric"
                                id="vehicle-timeout"
                                name="vehicle-timeout"
                                min={1}
                                max={7_200}
                                value={vehicleTimeout}
                                required
                                onChange={(e) => {
                                    setVehicleTimeout(e.target.value);
                                }}
                            />
                        </label>
                        <Toggle
                            id="vehicle-loitering-toggle"
                            value={isVehicleLoiteringEnabled}
                            onToggleChange={() => {}}
                            toggleOnText="ON"
                            toggleOffText="OFF"
                        />
                    </div>
                </section>
                <div className="button-container">
                    <Button
                        id="apply-premium-features-button"
                        type="submit"
                        label="Apply"
                        className="btn primary"
                    />
                    <Button
                        id="cancel-premium-features-button"
                        type="button"
                        label="Cancel"
                        className="btn danger"
                        onClick={() => handleClose()}
                    />
                </div>
            </form>
        </ModalBase>
    );
};

export default PremiumFeaturesModal;
