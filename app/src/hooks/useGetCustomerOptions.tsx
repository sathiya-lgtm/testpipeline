// React
import { useMemo } from 'react';

// Utils
import sortByName from '../utils/sortByName';
import OptionsConverter from '../classes/OptionsConverter';

// Types
import { ICustomer } from '../types/tng-api.interfaces';
import { SelectOption } from '../types/interfaces';

const useGetCustomerOptions = (
    data: ICustomer[] | undefined,
    defaultValue?: SelectOption | null
) => {
    const selectOptions = useMemo(() => {
        if (data && data.length > 0) {
            const options = OptionsConverter.convertCustomersToOptions(
                data.sort(sortByName)
            );

            return options;
        }

        if (!data && defaultValue) {
            return [defaultValue];
        }

        return [];
    }, [data, defaultValue]);

    return selectOptions;
};

export default useGetCustomerOptions;
