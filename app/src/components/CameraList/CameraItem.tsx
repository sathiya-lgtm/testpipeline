// React
import React, { FC, useContext, useState, useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';

// Third Party
import { Tooltip } from 'react-tooltip';

// Context
import { AuthContext } from '../../contexts/AuthProvider';
import { ListTargetContext } from '../../contexts/ListTarget';
import { ICameraTarget } from '../../contexts/ListTarget.controller';

// Custom types
import { AccountType, JobType } from '../../types/enums';

// Utils
import checkEdgeVersionNumber from '../../utils/checkEdgeVersionNumber';
import truncateString from '../../utils/truncateString';

// Types
import { IEdgeStatusData } from '../../types/interfaces';

// Styles
import '../../styles/components/CameraList/CameraItem.scss';
import { isOnCameraPage } from './CameraList.controller';

interface IProps {
    serviceProviderId?: number;
    serviceProviderName?: string;
    customerId: number;
    customerName: string;
    siteId: number;
    siteName: string;
    cameraId: number;
    cameraName: string;
    active: boolean;
    numberOfParents: number;
    camera_properties: {
        job_type?: JobType;
        version?: string;
        template?: string; // Used for smtp panels (Amarok, Stages, etc)
    };
    edgeStatus: IEdgeStatusData[];
}

const CameraItem: FC<IProps> = ({
    serviceProviderId,
    serviceProviderName,
    customerId,
    customerName,
    siteId,
    siteName,
    cameraId,
    cameraName,
    active,
    numberOfParents,
    camera_properties,
    edgeStatus,
}) => {
    const params = useParams();
    const location = useLocation();
    const { activeUser } = useContext(AuthContext);
    const { handleListTargetClick, listTarget } = useContext(ListTargetContext);
    const [showTooltip, setShowTooltip] = useState(false);

    /** Returns 'active' if camera id is found in URL? */
    const activeLink = (): 'active' | '' => {
        if (params && params.id && params.id === String(cameraId)) {
            return 'active';
        }

        if (active) {
            return 'active';
        }

        return '';
    };

    const isActive = useMemo(() => {
        if (params && params.id && params.id === String(cameraId)) {
            return true;
        }

        if (
            listTarget &&
            listTarget?.type === 'camera' &&
            listTarget.cameraId === cameraId
        ) {
            return true;
        }

        return false;
    }, [listTarget, params]);

    /** Will do nothing if the current URL features 'home/camera' and thus, presumably, the user
     * is on the camera page. Doing nothing allows the link to function normally. Otherwise, will
     * prevent the link's default behavior such that it does nothing, in which case, this function
     * will update the state of "list target".
     */
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        const newListTarget: ICameraTarget = {
            src: 'camera-list',
            type: 'camera',
            numberOfParents,
            serviceProviderId,
            serviceProviderName,
            customerId,
            customerName,
            siteId,
            siteName,
            cameraId,
            cameraName,
            camera_properties,
        };

        handleListTargetClick(newListTarget, isActive);

        if (isOnCameraPage(location?.pathname || '')) {
            return;
        }

        e.preventDefault(); // Prevent link behavior if not on Camera Page.
    };

    const cameraLink = useMemo(() => {
        const version = camera_properties?.version;
        const job_type = camera_properties?.job_type;
        const template = camera_properties?.template;

        if (job_type === 'panel' && template) {
            return `panel/${cameraId}`;
        }

        if (job_type === 'panel') {
            return `dmp-panel/${cameraId}`;
        }

        if (job_type === 'device-io') {
            return `device-io/${cameraId}`;
        }

        if (version && checkEdgeVersionNumber(version)) {
            return `edge/${cameraId}`;
        }

        return `camera/${cameraId}`;
    }, [camera_properties, cameraId]);

    const deviceName = useMemo(() => {
        const job_type = camera_properties?.job_type;
        if (job_type === 'panel') {
            return truncateString(`Panel: ${cameraName}`, 25);
        }

        return truncateString(cameraName, 25);
    }, [camera_properties]);

    const edgeStatusData = useMemo(() => {
        const foundEdgeStatusData = edgeStatus.find(
            (item) => item.camera_id === cameraId
        );

        return foundEdgeStatusData;
    }, [edgeStatus, cameraId]);

    return (
        <li
            className={`camera ${
                activeUser?.account_type === AccountType.Customer
                    ? 'customer-specific'
                    : ''
            }`}
        >
            {cameraName.length > 25 && (
                <Tooltip
                    id={`${cameraId}-${cameraName}`}
                    content={cameraName}
                    style={{
                        backgroundColor: '#000', // solid black background
                        opacity: 1, // remove transparency
                        color: '#fff', // text color
                    }}
                />
            )}

            <Link
                data-tooltip-id={`${cameraId}-${cameraName}`}
                id={`camera-item-${cameraId}`}
                className={`link ${activeLink()} name`}
                to={cameraLink}
                onClick={handleClick}
            >
                {deviceName}

                {edgeStatusData && edgeStatusData.status !== 'UNKNOWN' && (
                    <div
                        className="edgeStatusContainer"
                        data-tooltip={edgeStatusData.status}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <span
                            className={`edgeStatusReading ${edgeStatusData.status}`}
                        />
                        {showTooltip && (
                            <span
                                className={`edgeStatusTooltip ${edgeStatusData.status}`}
                            >
                                {edgeStatusData.status}
                            </span>
                        )}
                    </div>
                )}
            </Link>
        </li>
    );
};

export default CameraItem;
