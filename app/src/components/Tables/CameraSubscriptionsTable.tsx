/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import { Dispatch, FC, SetStateAction, ChangeEvent } from 'react';
import { Tooltip } from 'react-tooltip';

// Types
import {
    ICameraSubscription,
    MonitorMode,
} from '../../api_calls/Subscriptions';

// Styles
import '../../styles/components/Tables/CameraSubscriptionsTable.scss';

interface IProps {
    currentCameraSubscriptions: ICameraSubscription[];
    setCurrentCameraSubscriptions: Dispatch<
        SetStateAction<ICameraSubscription[]>
    >;
}

const CameraSubscriptionsTable: FC<IProps> = ({
    currentCameraSubscriptions,
    setCurrentCameraSubscriptions,
}) => {
    const handleCameraSubscriptionSelect = (
        e: ChangeEvent<HTMLInputElement>,
        updateIndex: number
    ) => {
        const cameraSubscriptionCopy = [...currentCameraSubscriptions];
        cameraSubscriptionCopy[updateIndex].monitor_mode = e.target
            .value as MonitorMode;
        setCurrentCameraSubscriptions(cameraSubscriptionCopy);
    };

    return (
        <div className="cameraSubscriptionTable">
            <div className="tableHeader">
                <div />
                <div className="subscriptionTitles">
                    <Tooltip
                        id="VirtualGuardTooltip"
                        content="Professional Remote Video Monitoring (Outdoor)"
                        style={{
                            backgroundColor: '#000',
                            opacity: 1,
                            color: '#fff',
                            zIndex: 10,
                        }}
                    />
                    <span data-tooltip-id="VirtualGuardTooltip">
                        Virtual Guard
                    </span>
                    <Tooltip
                        id="SmartSensorTooltip"
                        content="Professional Burglar Alarm Monitoring with Video Verification (Indoor)"
                        style={{
                            backgroundColor: '#000',
                            opacity: 1,
                            color: '#fff',
                            zIndex: 10,
                            maxWidth: 400,
                        }}
                    />
                    <span data-tooltip-id="SmartSensorTooltip">
                        Smart Sensor
                    </span>
                    <Tooltip
                        id="MIYTooltip"
                        content="Self Monitored Camera"
                        style={{
                            backgroundColor: '#000',
                            opacity: 1,
                            color: '#fff',
                            zIndex: 10,
                        }}
                    />
                    <span data-tooltip-id="MIYTooltip">MIY</span>
                    <Tooltip
                        id="LiveViewOnlyTooltip"
                        content="Live View Only, No event monitoring "
                        style={{
                            backgroundColor: '#000',
                            opacity: 1,
                            color: '#fff',
                            zIndex: 10,
                        }}
                    />
                    <span data-tooltip-id="LiveViewOnlyTooltip">
                        Live View Only
                    </span>
                </div>
            </div>

            {currentCameraSubscriptions.map((cameraSubscriptionData, index) => {
                return (
                    <div
                        className="tableRow"
                        key={`camera-subscription-${cameraSubscriptionData.camera_id}`}
                    >
                        <span>{cameraSubscriptionData.camera_name}</span>
                        <div className="radioGroupTest">
                            <div className="radioBtnContainer">
                                <div className="radioBtn primary">
                                    <input
                                        type="radio"
                                        id={`camera-subscription-${cameraSubscriptionData.camera_id}-Virtual-Guard`}
                                        name={`camera-subscription-${cameraSubscriptionData.camera_id}`}
                                        value="Virtual Guard"
                                        checked={
                                            cameraSubscriptionData.monitor_mode ===
                                            'Virtual Guard'
                                        }
                                        onChange={(e) =>
                                            handleCameraSubscriptionSelect(
                                                e,
                                                index
                                            )
                                        }
                                    />

                                    <label
                                        htmlFor={`camera-subscription-${cameraSubscriptionData.camera_id}-Virtual-Guard`}
                                    />
                                </div>
                            </div>

                            <div className="radioBtnContainer">
                                <div className="radioBtn primary">
                                    <input
                                        type="radio"
                                        id={`camera-subscription-${cameraSubscriptionData.camera_id}-Smart-Sensor`}
                                        name={`camera-subscription-${cameraSubscriptionData.camera_id}`}
                                        value="Smart Sensor"
                                        checked={
                                            cameraSubscriptionData.monitor_mode ===
                                            'Smart Sensor'
                                        }
                                        onChange={(e) =>
                                            handleCameraSubscriptionSelect(
                                                e,
                                                index
                                            )
                                        }
                                    />
                                    <label
                                        htmlFor={`camera-subscription-${cameraSubscriptionData.camera_id}-Smart-Sensor`}
                                    />
                                </div>
                            </div>

                            <div className="radioBtnContainer">
                                <div className="radioBtn primary">
                                    <input
                                        type="radio"
                                        id={`camera-subscription-${cameraSubscriptionData.camera_id}-MIY`}
                                        name={`camera-subscription-${cameraSubscriptionData.camera_id}`}
                                        value="MIY"
                                        checked={
                                            cameraSubscriptionData.monitor_mode ===
                                            'MIY'
                                        }
                                        onChange={(e) =>
                                            handleCameraSubscriptionSelect(
                                                e,
                                                index
                                            )
                                        }
                                    />
                                    <label
                                        htmlFor={`camera-subscription-${cameraSubscriptionData.camera_id}-MIY`}
                                    />
                                </div>
                            </div>

                            <div className="radioBtnContainer">
                                <div className="radioBtn primary">
                                    <input
                                        type="radio"
                                        id={`camera-subscription-${cameraSubscriptionData.camera_id}-None`}
                                        name={`camera-subscription-${cameraSubscriptionData.camera_id}`}
                                        value="None"
                                        checked={
                                            cameraSubscriptionData.monitor_mode ===
                                            'None'
                                        }
                                        onChange={(e) =>
                                            handleCameraSubscriptionSelect(
                                                e,
                                                index
                                            )
                                        }
                                    />
                                    <label
                                        htmlFor={`camera-subscription-${cameraSubscriptionData.camera_id}-None`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CameraSubscriptionsTable;
