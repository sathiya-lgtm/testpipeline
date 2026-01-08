interface IName {
    name: string;
}

interface IServiceProviderName {
    service_provider_account_name: string;
}

interface ICustomerName {
    account_name: string;
}

interface ISiteName {
    site_name: string;
}

interface ICameraName {
    camera_name: string;
}

type Name =
    | IName
    | IServiceProviderName
    | ICustomerName
    | ISiteName
    | ICameraName;

export const compare = (nameA: string, nameB: string): number => {
    return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: 'base',
    });
};

/** Callback function to be passed to Array.sort method that will
 * sort elements alphabetically by their name property in ascending order.
 * @param {IName} a - First object (with name property) to be sorted.
 * @param {IName} b - Second element (with name property) to be sorted.
 * @returns {number}
 */
export default (a: Name, b: Name): number => {
    // Assumes that if there's a .name property that it should sort according to that.
    if ('name' in a && 'name' in b) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        return compare(nameA, nameB);
    }

    // Assumes that if the above condition(s) were false, but .camera_name property exists then it should sort according to that.
    if ('camera_name' in a && 'camera_name' in b) {
        const nameA = a.camera_name.toLowerCase();
        const nameB = b.camera_name.toLowerCase();

        return compare(nameA, nameB);
    }

    // Assumes that if the above condition(s) were false, but .site_name property exists then it should sort according to that.
    if ('site_name' in a && 'site_name' in b) {
        const nameA = a.site_name.toLowerCase();
        const nameB = b.site_name.toLowerCase();

        return compare(nameA, nameB);
    }

    // Assumes that if the above condition(s) were false, but .account_name property exists then it should sort according to that.
    if ('account_name' in a && 'account_name' in b) {
        const nameA = a.account_name.toLowerCase();
        const nameB = b.account_name.toLowerCase();

        return compare(nameA, nameB);
    }

    // Assumes that if the above condition(s) were false, but .service_provider_account_name property exists then it should sort according to that.
    if (
        'service_provider_account_name' in a &&
        'service_provider_account_name' in b
    ) {
        const nameA = a.service_provider_account_name.toLowerCase();
        const nameB = b.service_provider_account_name.toLowerCase();

        return compare(nameA, nameB);
    }

    throw new Error(
        'Failed to sort objects by name. Name property is invalid or properties throughout array are not comparable.'
    );
};
