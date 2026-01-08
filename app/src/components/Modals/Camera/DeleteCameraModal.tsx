// React
import { FC, FormEvent, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Third party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Api Calls
import deleteCamera from '../../../api_calls/deleteCamera';

// Components
import ModalBase from '../../ModalBase';
import LoadingModal from '../LoadingModal';

// Context
import { AuthContext } from '../../../contexts/AuthProvider';
import { ListTargetContext } from '../../../contexts/ListTarget';

// Custom
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import PasswordConfirm from '../../PasswordConfirm/PasswordConfirm';
import FormInput, { IFormInputElement } from '../../Inputs/FormInput';

// Types
import { ICameraData } from '../../../types/tng-api.interfaces';

// styles
import '../../../styles/components/Modals/DeleteAlertModal.scss';
import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../ButtonGroup/ButtonGroup';

interface IProps {
    handleClose: () => void;
    closeEditModal: () => void;
    cameraData: ICameraData;
    refetchCameraTreeData: () => void;
}

const DeleteAlertModal: FC<IProps> = ({
    handleClose,
    closeEditModal,
    cameraData,
    refetchCameraTreeData,
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearListTarget } = useContext(ListTargetContext);
    const { activeUser, setActiveUser } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordValue, setPasswordValue] = useState<string>('');
    const [passwordsMatched, setPasswordMatched] = useState<boolean>(false);
    const [dmpUserId, setDMPUserId] = useState<string | null>(
        activeUser?.email ?? null
    );
    const [dmpPassword, setDMPPassword] = useState<string | null>(null);

    const onSuccess = async () => {
        toast.success('Camera deleted!');
        refetchCameraTreeData();
        setIsLoading(false);
        handleClose();
        closeEditModal();
        clearListTarget();

        const pathParts = location.pathname.split('/').reverse();
        if (
            location.pathname.includes('/home/camera') &&
            pathParts[0] === cameraData.camera_id.toString()
        ) {
            navigate('/home/camera/0');
        }
    };

    const deleteCameraMutation = useMutation({
        mutationFn: deleteCamera,
        onError: (err: any) => {
            setIsLoading(false);
            handleHttpRequestError(err, setActiveUser, navigate);
        },

        onSuccess: () => onSuccess(),
    });

    const handleDeleteAlert = (e: FormEvent) => {
        e.preventDefault();

        if (!activeUser) {
            return;
        }

        if (cameraData?.camera_properties.is_alarm_vision && !dmpUserId) {
            toast.warning('The DMP Username is not valid');
            return;
        }

        if (
            cameraData?.camera_properties.is_alarm_vision &&
            !passwordsMatched
        ) {
            toast.warning('DMP Passwords do not match!');
            return;
        }

        setIsLoading(true);

        deleteCameraMutation.mutate({
            user: activeUser,
            camera_id: cameraData.camera_id,
            dmp_user_id: dmpUserId ?? '',
            dmp_password: dmpPassword ?? '',
        });
    };

    const onHandleDmpPasswordChange = (passed: boolean, password: string) => {
        setPasswordMatched(passed);
        if (passed) {
            setDMPPassword(password);
        } else {
            setDMPPassword(null);
        }
    };

    const onDMPUserIdChanged = (e: IFormInputElement) => {
        setDMPUserId(e?.value ?? '');
    };

    return (
        <ModalBase title="Delete Camera" handleClose={handleClose}>
            <form onSubmit={handleDeleteAlert} className="DeleteAlertModal">
                <p>
                    Are you sure you want to delete the following Camera: <br />
                    <ul>
                        <li>{cameraData.camera_name}</li>
                    </ul>
                </p>
                {cameraData?.camera_properties?.is_alarm_vision && (
                    <p className="DeleteAlertModal-Link-DMP-Account">
                        <span className="section-title">
                            Enter password to link your DMP user account
                        </span>
                        <div className="section-content">
                            <FormInput
                                id="dmp-username"
                                columnMap="dmp-username"
                                label="DMP Username"
                                value={dmpUserId}
                                onChange={onDMPUserIdChanged}
                            />
                            <PasswordConfirm
                                passwordValue={passwordValue}
                                passwordLabelText="DMP Password"
                                confirmLabelText="DMP Password Confirm"
                                onChanged={onHandleDmpPasswordChange}
                            />
                        </div>
                    </p>
                )}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                    }}
                >
                    <button className="btn danger" type="submit">
                        Delete
                    </button>
                    <button
                        className="btn neutral"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>

                {isLoading && <LoadingModal modalText="Deleting Camera..." />}
            </form>
        </ModalBase>
    );
};

export default DeleteAlertModal;
