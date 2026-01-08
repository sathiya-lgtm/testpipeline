// JWT Decode
import jwtDecode from 'jwt-decode';

// Custom
import customFetch from '../utils/customFetch';

// Types
import { IUser, IDecodedAccessToken, IJwtToken } from '../types/interfaces';

/** Makes a POST request to refresh user's JWT.
 * @returns {Promise<IUser>} Updated user data.
 */
export default async (refreshToken: string): Promise<IUser> => {
    const data = await customFetch(
        `/api/jwt/refresh`,
        {
            method: 'POST',
            body: JSON.stringify({
                refresh: refreshToken,
            }),
        },
        'Session refresh'
    );

    const webToken: IJwtToken = await data.json();

    const decodedAccessToken: IDecodedAccessToken = jwtDecode(webToken.access);

    return {
        ...decodedAccessToken,
        account_name: webToken.account_name,
        accessToken: webToken.access,
        refreshToken: webToken.refresh,
        properties: webToken.properties,
    };
};
