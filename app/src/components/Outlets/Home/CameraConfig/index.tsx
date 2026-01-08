// React
import { useContext, useMemo } from 'react';

// Third Party
import { useMatch } from 'react-router-dom';

// Components
import Edge from '../Edge/Edge';
import Camera2 from '../Camera/Camera2';
import CustomerEdgeView from '../CustomerEdgeView';
import CustomerCameraView from '../CustomerCameraView';
import DeviceIO from '../DeviceIO';
import DMPPanel from '../DMPPanel';
import Panel from '../Panel';

// Context
import { AuthContext } from '../../../../contexts/AuthProvider';

const CameraConfig = () => {
    const { activeUser } = useContext(AuthContext);

    const cameraMatch = useMatch('/home/camera/:id');
    const edgeMatch = useMatch('/home/edge/:id');
    const deviceIOMatch = useMatch('/home/device-io/:id');
    const dmpPanelMatch = useMatch('/home/dmp-panel/:id');
    const panelMatch = useMatch('/home/panel/:id');

    const serviceProviderUser = useMemo(() => {
        if (activeUser) {
            return (
                activeUser.account_type === 'sp' ||
                activeUser.account_type === 'ev'
            );
        }

        return false;
    }, [activeUser]);

    if (
        !activeUser ||
        (!cameraMatch &&
            !edgeMatch &&
            !deviceIOMatch &&
            !panelMatch &&
            !dmpPanelMatch)
    ) {
        return null;
    }

    if (serviceProviderUser && dmpPanelMatch) {
        return <DMPPanel />;
    }

    if (serviceProviderUser && panelMatch) {
        return <Panel />;
    }

    if (serviceProviderUser && edgeMatch) {
        return <Edge />;
    }

    if (serviceProviderUser && cameraMatch) {
        return <Camera2 />;
    }

    if (serviceProviderUser && deviceIOMatch) {
        return <DeviceIO />;
    }

    if (edgeMatch) {
        return <CustomerEdgeView />;
    }

    return <CustomerCameraView />;
};

export default CameraConfig;
