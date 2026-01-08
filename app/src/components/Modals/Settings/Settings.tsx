// React
import React, { FC, useState } from 'react';

// Components
import ModalBase from '../../ModalBase';

// Styles
import '../../../styles/components/Modals/Settings.scss';

interface IProps {
    handleClose: () => void;
}

const Settings: FC<IProps> = ({ handleClose }) => {
    const [selectedSetting, setSelectedSetting] = useState('changePass');

    const handleMenuItemClick = (setting: string) => {
        setSelectedSetting(setting);
    };

    return (
        <ModalBase title="Settings" handleClose={handleClose}>
            <div className="settingsModalContent">
                <ul className="settingsNavMenu">
                    <li
                        onClick={() => handleMenuItemClick('changePass')}
                        className={
                            selectedSetting === 'changePass' ? 'selected' : ''
                        }
                        role="presentation"
                    >
                        Change Password
                        <div className="highlighter" />
                    </li>
                    <li
                        onClick={() => handleMenuItemClick('manageUsers')}
                        className={
                            selectedSetting === 'manageUsers' ? 'selected' : ''
                        }
                        role="presentation"
                    >
                        Manage Users
                        <div className="highlighter" />
                    </li>
                </ul>
            </div>
        </ModalBase>
    );
};

export default Settings;
