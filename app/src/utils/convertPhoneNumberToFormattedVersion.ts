import { Dispatch, SetStateAction } from 'react';

export const convertPhoneNumberToFormattedVersion = (
    phoneNumber: string
): string => {
    let formattedNumber = phoneNumber;
    if (phoneNumber.length === 10) {
        formattedNumber = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(
            3,
            6
        )}-${phoneNumber.slice(6)}`;
    } else if (phoneNumber.length === 11) {
        formattedNumber = `${phoneNumber.slice(0, 1)}-${phoneNumber.slice(
            1,
            4
        )}-${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7)}`;
    }

    return formattedNumber;
};

export const handlePhoneNumberChange = (
    newValue: string,
    setPhoneNumber: Dispatch<SetStateAction<string>>
) => {
    if (/^\d*$/.test(newValue)) {
        setPhoneNumber(newValue);
    }
};

export const handlePhoneNumberFocus = (
    newValue: string,
    setPhoneNumber: Dispatch<SetStateAction<string>>
) => {
    setPhoneNumber(newValue.replace(/\D/g, ''));
};

export const handlePhoneNumberBlur = (
    newValue: string,
    setPhoneNumber: Dispatch<SetStateAction<string>>
) => {
    setPhoneNumber(convertPhoneNumberToFormattedVersion(newValue));
};
