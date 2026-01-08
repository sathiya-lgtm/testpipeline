// Custom types
import { IAboutInfo } from '../types/interfaces';

/** Fetch data for application (version number, api build, api sha) */
export default async (): Promise<IAboutInfo> => {
    const data = await fetch(
        `https://evolon-insites-version.s3.amazonaws.com/insites-version.json`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    const result: IAboutInfo = await data.json();
    return result;
};
