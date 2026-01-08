import customFetch from '../utils/customFetch';

interface ICompleteRegistrationData {
    password: string;
    confirm: string;
}

interface IParams {
    completeRegistrationData: ICompleteRegistrationData;
    registrationHash: string;
}

/** Makes a POST request to save mask. */
export default async ({
    completeRegistrationData,
    registrationHash,
}: IParams): Promise<void> => {
    await customFetch(
        `/api/registration/complete/${registrationHash}`,
        {
            method: 'POST',
            body: JSON.stringify(completeRegistrationData),
        },
        'Password update'
    );
};
