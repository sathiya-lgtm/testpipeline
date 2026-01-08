export default (version: string, compareTo: string = '5.9.909') => {
    const isValidVersion = (ver: string): boolean => {
        return /^(\d+\.)?(\d+\.)?(\d+)$/.test(ver);
    };

    if (!isValidVersion(version)) {
        return false;
    }

    const parseVersion = (ver: string): number[] => {
        return ver.split('.').map(Number);
    };

    const versionParts = parseVersion(version);
    const compareToParts = parseVersion(compareTo);

    for (
        let i = 0;
        i < Math.max(versionParts.length, compareToParts.length);
        i += 1
    ) {
        const verNum = versionParts[i] || 0;
        const compareNum = compareToParts[i] || 0;

        if (verNum > compareNum) {
            return true;
        }
        if (verNum < compareNum) {
            return false;
        }
    }

    return true;
};
