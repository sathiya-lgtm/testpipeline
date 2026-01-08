export default (inputString: string, maxLength: number) => {
    if (inputString.length > maxLength) {
        return `${inputString.substring(0, maxLength - 1)} ...`;
    }

    return inputString;
};
