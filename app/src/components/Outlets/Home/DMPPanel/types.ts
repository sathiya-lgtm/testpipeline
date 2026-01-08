export type AlarmVisionUserAccess = {
    is_jwt_expired: boolean,
    access_token: string;
    refresh_token: string;
    validated: boolean;
};

export const DefaultAlarmVisionUserAccess: AlarmVisionUserAccess = {
    is_jwt_expired: true,
    access_token: '',
    refresh_token: '',
    validated: false
}

export type AlarmVisionUserInfo = {
    user_id: string;
    password: string;
    validated: boolean;
};

export const DefaultAlarmVisionUserInfo: AlarmVisionUserInfo = {
    user_id: '',
    password: '',
    validated: false
};

