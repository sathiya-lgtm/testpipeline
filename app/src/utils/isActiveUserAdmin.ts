import { IUser } from '../types/interfaces';
import { EvolonRole, ServiceProviderRole, CustomerRole } from '../types/enums';

export default (activeUser: IUser): boolean => {
    return activeUser.access_roles.some((role) => {
        switch (role) {
            case EvolonRole.GlobalAdmin:
                return true;
            case ServiceProviderRole.AccountAdmin:
                return true;
            case CustomerRole.UserIsAdmin:
                return true;
            default:
                return false;
        }
    });
};
