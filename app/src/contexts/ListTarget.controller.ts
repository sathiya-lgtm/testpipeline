// Third party
import _ from 'lodash';
import { JobType } from '../types/enums';

export type ListTargetSource = 'camera-list' | 'forensic-search';

export type RelationToActiveListTarget =
    | 'parent'
    | 'self'
    | 'sibling'
    | 'child'
    | 'no-relation';

export interface IServiceProviderTarget {
    src: ListTargetSource;
    type: 'service-provider';
    numberOfParents: number;
    serviceProviderId: number;
    serviceProviderName: string;
}

// "Partial" tells compiler to extend all properties as optionally undefined.
// "Omit" tells compiler which properties can be overwritten.
export interface ICustomerTarget
    extends Partial<Omit<IServiceProviderTarget, 'type'>> {
    src: ListTargetSource;
    /** What's referred to as an "account" on the back-end is referred to as a "Customer" on the UI. */
    type: 'account';
    /** Specifies whether target item is "root" of Camera List. */
    numberOfParents: number;
    customerId: number;
    customerName: string;
}

export interface ISiteTarget extends Omit<ICustomerTarget, 'type'> {
    type: 'site';
    siteId: number;
    siteName: string;

    // Used temporarily to added nvr email to dashboard
    properties?: {
        email?: string;
        job_type?: string;
    };
}

export interface ICameraTarget extends Omit<ISiteTarget, 'type'> {
    type: 'camera';
    cameraId: number;
    cameraName: string;
    camera_properties: {
        job_type?: JobType;
    };
}

// Using union type instead of interface here because it tells compiler to force only one of the following interfaces.
// Will have to check identity of object in certain places where this is used so compiler understands which one should be enforced.
export type ListTarget =
    | IServiceProviderTarget
    | ICustomerTarget
    | ISiteTarget
    | ICameraTarget;

/**
 * Determines whether targetedItem is related to active list target.
 * @param activeListTarget - An object representing the Camera List item that is currently active in state.
 * @returns {boolean}
 */
export const hasNoRelation = (activeListTarget: ListTarget | null): boolean => {
    if (activeListTarget === null) {
        return true;
    }

    return false;
};

/**
 * Determines whether targetedItem is equal to active list target.
 * @param targetedItem - An object representing the most recent Camera List item the user clicked.
 * @param activeListTarget- An object representing the Camera List item that is currently active in state.
 * @returns {boolean}
 */
export const isSelf = (
    targetedItem: ListTarget,
    activeListTarget: ListTarget | null
): boolean => {
    if (
        _.isEqual(
            _.omit(activeListTarget, 'src'), // Omit creates a copy of object, but excludes "src".
            _.omit(targetedItem, 'src')
        )
    ) {
        return true;
    }

    return false;
};

/**
 * Determines whether targetedItem is a child of active list target.
 * @param targetedItem  - An object representing the most recent Camera List item the user clicked.
 * @param activeListTarget - An object representing the Camera List item that is currently active in state.
 * @returns {boolean}
 */
export const isChild = (
    targetedItem: ListTarget,
    activeListTarget: ListTarget | null
): boolean => {
    // Can't be child of nothing.
    if (activeListTarget === null) {
        return false;
    }

    // Can't be a child if the type is equal.
    if (activeListTarget.type === targetedItem.type) {
        return false;
    }

    // Can't be a child of a Camera.
    if (activeListTarget.type === 'camera') {
        return false;
    }

    // Can only be a child of Site if active target is Camera.
    if (activeListTarget.type === 'site' && targetedItem.type !== 'camera') {
        return false;
    }

    // Can only be child of Site if active target's type is Camera and both target's Site IDs match.
    if (activeListTarget.type === 'site' && targetedItem.type === 'camera') {
        return activeListTarget.siteId === targetedItem.siteId;
    }

    // Can only be a child of a Customer if active target's type is Site or Camera and both target's Customer IDs match.
    if (activeListTarget.type === 'account' && 'customerId' in targetedItem) {
        return activeListTarget.customerId === targetedItem.customerId;
    }

    // If active target is not a Camera, Site, or Camera (checked via conditions above), it must be a Service Provider...
    return (
        // If active target is a Service Provider and new target is not, new target must be a child if Service Provider IDs match.
        activeListTarget.serviceProviderId === targetedItem.serviceProviderId
    );
};

/**
 * Determines whether targetedItem is a parent of active list target.
 * @param targetedItem - An object representing the most recent Camera List item the user clicked.
 * @param activeListTarget- An object representing the Camera List item that is currently active in state.
 * @returns {boolean}
 */
export const isParent = (
    targetedItem: ListTarget,
    activeListTarget: ListTarget | null
): boolean => {
    // Can't be parent of nothing.
    if (activeListTarget === null) {
        return false;
    }

    // Can't be a parent if the type is equal.
    if (activeListTarget.type === targetedItem.type) {
        return false;
    }

    // Can't be a parent of a Service Provider.
    if (activeListTarget.type === 'service-provider') {
        return false;
    }

    // Can only be parent of Customer if target is SP and SP IDs match.
    if (
        activeListTarget.type === 'account' &&
        targetedItem.type === 'service-provider'
    ) {
        switch (targetedItem.type) {
            case 'service-provider':
                return (
                    activeListTarget.serviceProviderId ===
                    targetedItem.serviceProviderId
                );
            default:
                return false;
        }
    }

    // Can only be parent of Site if SP or Customer and SP ID or Customer ID match, respectively.
    if (activeListTarget.type === 'site') {
        switch (targetedItem.type) {
            case 'service-provider':
                return (
                    activeListTarget.serviceProviderId ===
                    targetedItem.serviceProviderId
                );
            case 'account':
                return activeListTarget.customerId === targetedItem.customerId;
            default:
                return false;
        }
    }

    switch (targetedItem.type) {
        case 'service-provider':
            return (
                (activeListTarget as ICameraTarget).serviceProviderId ===
                targetedItem.serviceProviderId
            );
        case 'account':
            return (
                (activeListTarget as ICameraTarget).customerId ===
                targetedItem.customerId
            );
        case 'site':
            return (
                (activeListTarget as ICameraTarget).siteId ===
                targetedItem.siteId
            );
        default:
            return false;
    }
};

/**
 * Determines how targetedItem is related to active list target.
 * @param targetedItem  - An object representing the most recent Camera List item the user clicked.
 * @param activeListTarget - An object representing the Camera List item that is currently active in state.
 * @returns {RelationToActiveListTarget}
 */
export const determineRelationship = (
    targetedItem: ListTarget,
    activeListTarget: ListTarget | null
): RelationToActiveListTarget => {
    if (hasNoRelation(activeListTarget)) {
        return 'no-relation';
    }

    if (isSelf(targetedItem, activeListTarget)) {
        return 'self';
    }

    if (isChild(targetedItem, activeListTarget)) {
        return 'child';
    }

    if (isParent(targetedItem, activeListTarget)) {
        return 'parent';
    }

    return 'sibling';
};

/**
 * "Devolves" targeted list item such that it becomes equivalent to its parent. For example,
 * a Camera becomes its parent Site, a Site becomes its parent Customer, etc.
 * @param targetedItem - An object representing the most recent Camera List item the user clicked.
 * @returns {ListTarget | null} An object representing a Camera List item one level up the tree (i.e.
 * a parent of targetedItem) or null if selected Camera List item (targetedItem) is at the root of the
 * list and therefore has no parents.
 */
export const devolve = (targetedItem: ListTarget): ListTarget | null => {
    // Return null if parent doesn't exist.
    if (targetedItem.numberOfParents === 0) {
        return null;
    }

    switch (targetedItem.type) {
        case 'account':
            if (
                targetedItem.serviceProviderId &&
                targetedItem.serviceProviderName
            ) {
                const devolvedTarget: IServiceProviderTarget = {
                    src: targetedItem.src,
                    type: 'service-provider',
                    numberOfParents: targetedItem.numberOfParents - 1,
                    serviceProviderId: targetedItem.serviceProviderId,
                    serviceProviderName: targetedItem.serviceProviderName,
                };

                return devolvedTarget;
            }

            return null;
        case 'site': {
            const devolvedTarget: ICustomerTarget = {
                src: targetedItem.src,
                type: 'account',
                numberOfParents: targetedItem.numberOfParents - 1,
                serviceProviderId: targetedItem?.serviceProviderId,
                serviceProviderName: targetedItem?.serviceProviderName,
                customerId: targetedItem.customerId,
                customerName: targetedItem.customerName,
            };

            return devolvedTarget;
        }
        case 'camera': {
            const devolvedTarget: ISiteTarget = {
                src: targetedItem.src,
                type: 'site',
                numberOfParents: targetedItem.numberOfParents - 1,
                serviceProviderId: targetedItem?.serviceProviderId,
                serviceProviderName: targetedItem?.serviceProviderName,
                customerId: targetedItem.customerId,
                customerName: targetedItem.customerName,
                siteId: targetedItem.siteId,
                siteName: targetedItem.siteName,
                properties: targetedItem.properties,
            };

            return devolvedTarget;
        }
        default:
            throw new Error(
                `Failed to devolve ListTarget, ListTarget type not valid: ${targetedItem.type}`
            );
    }
};

/**
 * Takes an object representing the most recently clicked Camera List item and returns what should
 * be the next active list target based on targetedItem's relation to the currently active list target.
 * @param targetedItem - An object representing the most recent Camera List item the user clicked.
 * @param relation - targetedItem's relation to the list target that is currently active (e.g. "parent", "self", "child", etc)
 * @returns {ListTarget | null} Object representing what should be the next active list target.
 */
export const determineReplacementListTarget = (
    targetedItem: ListTarget,
    relation: RelationToActiveListTarget
): ListTarget | null => {
    // If the relation between targetedItem and active target is 'parent' or 'self'...
    if (relation === 'parent' || relation === 'self') {
        const devolvedTarget: ListTarget | null = devolve(targetedItem);

        // Return a target that is one layer higher up the Camera List hierarchy (see "devolve" function for more info).
        return devolvedTarget;
    }

    // Return the targetedItem if its relation to current target is 'child', 'sibling' or 'no-relation'.
    return targetedItem;
};
