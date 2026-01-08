/* eslint-disable no-param-reassign */
import { Dispatch, RefObject, SetStateAction } from 'react';

// Third party
import { format } from 'date-fns';

// Custom
import extractErrorMessage from '../../../../utils/extractErrorMessage';

// Custom types
import { BrushType, SelectOption } from '../../../../types/interfaces';
import { ICameraData, IClip } from '../../../../types/tng-api.interfaces';
import { JobType, TrackingSensitivity } from '../../../../types/enums';
import { IAVPanelInfo } from '../../../../api_calls/getAVPanelInfo';

export const defaultConfidenceThreshold: number = 75;

export const edgeLicenseTypeOptions = [
    { label: 'CS - Fixed Camera Only (default)', value: 'CS-EDGE' },
    { label: 'CP – Fixed and PTZ Camera', value: 'CP-EDGE' },
];

/**
 * Updates link of source video (between annotated and non-annotated).
 * @param {boolean} hasBoundingBox
 * @param {Dispatch<SetStateAction<string | undefined>>} setVideoSource
 */
export const handleBoundingBoxToggle = (
    hasBoundingBox: boolean,
    autoplayClipData: IClip,
    setVideoSource: Dispatch<SetStateAction<string | undefined | null>>
): void => {
    let src;

    if (hasBoundingBox) {
        src = autoplayClipData.aws_pre_sign_annotated || '';
    } else {
        src = autoplayClipData.aws_pre_sign_origin || '';
    }

    setVideoSource(src);
};

export const displayAutoClipDateTime = (createdAt: string): string => {
    // ! The Z at the end tells the Date object that the argument is UTC.
    const date = format(new Date(`${createdAt}Z`), 'P');
    // ! The Z at the end tells the Date object that the argument is UTC.
    const time = format(new Date(`${createdAt}Z`), 'pp');

    return `${date} - ${time}`;
};

/**
 * Toggle brush type and video controls. If a brush type is selected video controls will be hidden,
 * if a brush type is unselected, video controls will become visible.
 * @param {BrushType} activeBrushType - The brush type that is active prior to chaning brush type.
 * @param {BrushType} selectedBrushType - The brush type to change to.
 * @param {Dispatch<SetStateAction<BrushType>>} setBrushType - Setter for brush type.
 * @param {RefObject<HTMLVideoElement>} videoRef - Reference to video element.
 */
export const handleBrushTypeToggle = (
    activeBrushType: BrushType,
    selectedBrushType: BrushType,
    setBrushType: Dispatch<SetStateAction<BrushType>>,
    videoRef: RefObject<HTMLVideoElement>
): void => {
    if (activeBrushType === selectedBrushType) {
        setBrushType(undefined);

        if (videoRef.current) videoRef.current.controls = true;
    } else {
        setBrushType(selectedBrushType);

        if (videoRef.current) videoRef.current.controls = false;
    }
};

/** Just returns whether either of the provided booleans are true.
 * Created because formatter kept breaking inline boolean expression equivalent.
 */
export const isEitherTrue = (a: boolean, b: boolean): boolean => {
    return a === true || b === true;
};

/**
 * Used to set state for camera Type when camera data is updated
 */
export const handleCameraTypeUpdate = (
    newCameraType: 'rgb' | 'flir',
    cameraTypeOptions: SelectOption[],
    setCameraType: Dispatch<SetStateAction<SelectOption | null>>
) => {
    if (newCameraType) {
        const typeOption = cameraTypeOptions.find(
            (option) => option.value === newCameraType
        );

        if (typeOption) setCameraType(typeOption);
        else setCameraType(cameraTypeOptions[0]);
    } else {
        setCameraType(cameraTypeOptions[0]);
    }
};

/**
 * Used to set the state for a camera Job type (we are formatting the responses from the api for ui purposes)
 */
export const handleJobTypeUpdate = (
    givenJobType: JobType | undefined
): string => {
    if (givenJobType === JobType.Milestone) return 'Milestone';
    if (givenJobType === JobType.Email) return 'SMTP';
    if (givenJobType === JobType.Verify) return 'Immix';
    if (givenJobType === JobType.Edge) return 'Edge';
    if (givenJobType === JobType.NetworkOptix) return 'Network-Optix';
    if (givenJobType === JobType.NVR) return 'Email-NVR';

    return givenJobType || '';
};

export const extractCameraConfidenceThresholds = (
    cameraData: ICameraData
): {
    person: number;
    vehicle: number;
} => {
    let aPersonConfidenceThreshold: number | undefined;
    let aVehicleConfidenceThreshold: number | undefined;

    // Wrapping in try-catch in case properties become inaccessible.
    try {
        aPersonConfidenceThreshold = cameraData.camera_confidence?.person;
        aVehicleConfidenceThreshold = cameraData.camera_confidence?.vehicle;

        if (!aPersonConfidenceThreshold || !aVehicleConfidenceThreshold) {
            throw new Error(
                `Failed to identify confidence thresholds for camera: ${cameraData.camera_name}. Using defaults.`
            );
        }

        aPersonConfidenceThreshold *= 100;
        aVehicleConfidenceThreshold *= 100;
    } catch (error) {
        const errorMessage = extractErrorMessage(error);

        console.warn(errorMessage);
    }

    return {
        person: Math.round(
            aPersonConfidenceThreshold || defaultConfidenceThreshold
        ),
        vehicle: Math.round(
            aVehicleConfidenceThreshold || defaultConfidenceThreshold
        ),
    };
};

export const setAlertMenuClassName = (
    data: ICameraData | IAVPanelInfo | undefined,
    readOnlyUser: boolean
) => {
    let className = 'alert-menu ';

    if (!data || readOnlyUser) {
        className += 'disabled';
    }

    return className;
};

export const setCameraColorModelMenuClassName = (
    data: ICameraData | undefined,
    readOnlyUser: boolean
) => {
    let className = 'camera-color-model-menu ';

    if (!data || readOnlyUser) {
        className += 'disabled';
    } else if (data.camera_properties?.job_type === JobType.Milestone) {
        className += 'disabled text milestone';
    }

    return className;
};

export const setMotionConfidenceControlClassName = (
    data: ICameraData | undefined,
    readOnlyUser: boolean
) => {
    let className = 'motion-confidence ';

    if (!data || readOnlyUser) {
        className += 'disabled';
    } else if (data?.camera_properties?.job_type === JobType.Milestone) {
        className += 'disabled text milestone';
    }

    return className;
};

export const setConfidenceThresholdClassName = (
    data: ICameraData | undefined,
    readOnlyUser: boolean
) => {
    let className = 'confidence-threshold ';

    if (!data || readOnlyUser) {
        className += 'disabled';
    } else if (data?.camera_properties?.job_type === JobType.Milestone) {
        className += 'disabled text milestone';
    } else if (data?.camera_properties?.job_type === JobType.Verify) {
        className += 'disabled text immix';
    }

    return className;
};

export const setMaskingControlClassName = (
    data: ICameraData | undefined,
    readOnlyUser: boolean
) => {
    let className = 'ai-mask ';

    if (data?.camera_properties?.job_type === JobType.Milestone) {
        className += 'disabled text milestone';
    } else if (
        !data ||
        data.camera_properties?.allow_masking !== true ||
        readOnlyUser
    ) {
        className += 'disabled';
    }

    return className;
};

export const setPremiumFeaturesClassName = (
    data: ICameraData | undefined,
    readOnlyUser: boolean
) => {
    let className = 'premium-features-container';

    if (!data || data.camera_properties.license_type) {
        className += ' text disabled';
    } else if (readOnlyUser) {
        className += ' disabled';
    }

    return className;
};

/** Converts the old way of representing Motion Confidence to a number
 * between 1-99. The old way is defined by the TrackingSensitivity enum.
 */
export const convertTrackingSensitivityTextToNumber = (
    s: TrackingSensitivity
): number => {
    switch (s) {
        case TrackingSensitivity.VeryLow:
            return 90;
        case TrackingSensitivity.Low:
            return 60;
        case TrackingSensitivity.Medium:
            return 30;
        case TrackingSensitivity.High:
            return 15;
        case TrackingSensitivity.VeryHigh:
            return 7.5;
        default:
            throw new Error(`Invalid tracking sensitivity: ${s}`);
    }
};
