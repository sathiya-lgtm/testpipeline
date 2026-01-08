// Third party
import jwtDecode from 'jwt-decode';

// Custom
import customFetch from '../utils/customFetch';

// Types
import { IUser, IDecodedAccessToken, IJwtToken } from '../types/interfaces';

/** Makes a POST request to log in user.
 * @param {string} username - User's username, which as of now, is their email address.
 * @param {string} password - User's password.
 * @returns {Promise<IUser>} User data.
 */

export default async (username: string, password: string): Promise<IUser> => {
    const response = await customFetch(
        `/api/jwt/login`,
        {
            method: 'POST',
            timeout: 7_000,
            body: JSON.stringify({
                username,
                password,
                app_type: 'web',
                user_agent: navigator.userAgent,
            }),
        },
        'Log in'
    );

    const webToken: IJwtToken = await response.json();

    const decodedAccessToken: IDecodedAccessToken = jwtDecode(webToken.access);

    return {
        ...decodedAccessToken,
        account_name: webToken.account_name,
        accessToken: webToken.access,
        refreshToken: webToken.refresh,
        properties: webToken.properties,
    };
};
