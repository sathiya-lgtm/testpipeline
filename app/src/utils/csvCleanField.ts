export default (inputString: string) => {
    // Remove any leading or trailing whitespace
    let cleanedString = inputString.trim();

    // Replace any double quotes with single quotes and escape special characters
    cleanedString = cleanedString.replace(/"/g, "'");

    // Replace # as it was breaking the report
    cleanedString = cleanedString.replace(/#/g, '');
    cleanedString = `"${cleanedString.replace(/[\r\n]/g, ' ')}"`;

    return cleanedString;
};
