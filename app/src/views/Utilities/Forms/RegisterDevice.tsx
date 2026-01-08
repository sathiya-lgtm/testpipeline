/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import { FC, Dispatch, SetStateAction, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Components
import TabPanel, { TabPage } from '../../../components/TabPanel/TabPanel';
import RegisterDeviceWithCode from './RegisterDeviceWithCode';
import RegisterEdgeDevice from './RegisterEdgeDevice';
import RegisterNetworkDevice from './RegisterNetworkDevice';
import RegisterPanel from './RegisterPanel';

// Types
import { IUser, SelectOption } from '../../../types/interfaces';
import { AccountType } from '../../../types/enums';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    defaultServiceProvider: SelectOption | null;
    defaultCustomer: SelectOption | null;
}

const RegisterDevice: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    defaultServiceProvider,
    defaultCustomer,
}) => {
    const [searchParams] = useSearchParams();

    const defaultTabIndex = useMemo(() => {
        const deviceType = searchParams.get('device');

        if (deviceType === 'edge') {
            return 1;
        }

        return 0;
    }, [searchParams]);

    return (
        <TabPanel defaultSelectedTabIndex={defaultTabIndex}>
            <TabPage label="Milestone">
                <RegisterDeviceWithCode
                    activeUser={activeUser}
                    setActiveUser={setActiveUser}
                    accountType={accountType}
                    defaultServiceProvider={defaultServiceProvider}
                    defaultCustomer={defaultCustomer}
                />
            </TabPage>
            <TabPage label="Edge">
                <RegisterEdgeDevice
                    activeUser={activeUser}
                    setActiveUser={setActiveUser}
                    accountType={accountType}
                    defaultServiceProvider={defaultServiceProvider}
                    defaultCustomer={defaultCustomer}
                />
            </TabPage>
            <TabPage label="Network Device">
                <RegisterNetworkDevice
                    activeUser={activeUser}
                    accountType={accountType}
                />
            </TabPage>
            <TabPage label="Panel">
                <RegisterPanel
                    activeUser={activeUser}
                    setActiveUser={setActiveUser}
                    accountType={accountType}
                    defaultServiceProvider={defaultServiceProvider}
                    defaultCustomer={defaultCustomer}
                />
            </TabPage>
        </TabPanel>
    );
};

export default RegisterDevice;
