// React
import { useMemo } from 'react';

// Utils
import getAccountType from '../utils/getAccountType';

// Types
import { IUser } from '../types/interfaces';

const useGetAccountType = (activeUser: IUser | null) => {
    const accountType = useMemo(() => getAccountType(activeUser), [activeUser]);
    return accountType;
};

export default useGetAccountType;
