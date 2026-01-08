/* eslint-disable react/no-array-index-key */
// React
import { FC, useMemo } from 'react';

// Third Party
import { Tooltip } from 'react-tooltip';

// Types
import { IClipPayload } from '../../types/tng-api.interfaces';

interface IProps {
    tooltipId: string;
    clipPayload: IClipPayload;
}

export const extractAISettingsValues = (clipPayload: IClipPayload) => {
    const result: { label: string; value: String }[] = [];

    result.push({
        label: 'apply_blur',
        value: (clipPayload.apply_blur ?? true).toString(),
    });
    result.push({
        label: 'apply_tiling',
        value: (clipPayload.apply_tiling ?? false).toString(),
    });
    result.push({
        label: 'apply_sharpening',
        value: (clipPayload.apply_sharpening ?? false).toString(),
    });
    result.push({
        label: 'analyze_secondary_attributes',
        value: (clipPayload.analyze_secondary_attributes ?? false).toString(),
    });
    result.push({
        label: 'suppress_untracked_persons',
        value: (clipPayload.suppress_untracked_persons ?? false).toString(),
    });
    result.push({
        label: 'suppress_untracked_vehicles',
        value: (clipPayload.suppress_untracked_vehicles ?? false).toString(),
    });
    result.push({
        label: 'analyze_person_loitering',
        value: (clipPayload.analyze_person_loitering ?? false).toString(),
    });
    result.push({
        label: 'analyze_vehicle_loitering',
        value: (clipPayload.analyze_vehicle_loitering ?? false).toString(),
    });
    result.push({
        label: 'apply_person_pixel_motion_filter',
        value: (
            clipPayload.apply_person_pixel_motion_filter ?? false
        ).toString(),
    });
    result.push({
        label: 'apply_vehicle_pixel_motion_filter',
        value: (
            clipPayload.apply_vehicle_pixel_motion_filter ?? false
        ).toString(),
    });
    result.push({
        label: 'disable_person_ai',
        value: (clipPayload.disable_person_ai ?? false).toString(),
    });
    result.push({
        label: 'disable_vehicle_ai',
        value: (clipPayload.disable_vehicle_ai ?? false).toString(),
    });
    result.push({
        label: 'secondary_verification',
        value: (clipPayload.secondary_verification ?? false).toString(),
    });
    result.push({
        label: 'min_confidence_person',
        value: (
            clipPayload.min_confidence ?? {
                person: -1,
                vehicle: -1,
            }
        ).person.toString(),
    });
    result.push({
        label: 'person_motion_confidence',
        value: (clipPayload.person_motion_confidence ?? -1).toString(),
    });
    result.push({
        label: 'min_confidence_vehicle',
        value: (
            clipPayload.min_confidence ?? {
                person: -1,
                vehicle: -1,
            }
        ).vehicle.toString(),
    });
    result.push({
        label: 'vehicle_motion_confidence',
        value: (clipPayload.vehicle_motion_confidence ?? -1).toString(),
    });

    return result;
};

const PaginatedClipsTableTooltip: FC<IProps> = ({ tooltipId, clipPayload }) => {
    const formattedAISettings = useMemo(() => {
        return extractAISettingsValues(clipPayload);
    }, [clipPayload]);

    return (
        <Tooltip className="alarmMetadataTooltip" id={tooltipId} place="left">
            {formattedAISettings.map((item, index) => {
                return (
                    <p
                        key={`paylod-${index}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) 50px',
                            textAlign: 'left',
                            gap: '12px',
                        }}
                    >
                        <span
                            style={{
                                textAlign: 'right',
                            }}
                        >
                            {item.label}:
                        </span>
                        <span>{item.value.toString()}</span>
                    </p>
                );
            })}
        </Tooltip>
    );
};

export default PaginatedClipsTableTooltip;
