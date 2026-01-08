import {
    hasNoRelation,
    isSelf,
    isChild,
    isParent,
    ListTarget,
    ISiteTarget,
    ICustomerTarget,
    ICameraTarget,
    IServiceProviderTarget,
    determineRelationship,
    devolve,
    RelationToActiveListTarget,
    determineReplacementListTarget,
} from '../../../contexts/ListTarget.controller';

const mockServiceProviderTarget = (
    overwrite?: Partial<IServiceProviderTarget>
): IServiceProviderTarget => {
    return {
        src: overwrite?.src || 'camera-list',
        type: 'service-provider',
        numberOfParents: 0,
        serviceProviderId: overwrite?.serviceProviderId || 1,
        serviceProviderName:
            overwrite?.serviceProviderName || 'Service Provider 1',
    };
};

const mockCustomerTarget = (
    overwrite?: Partial<ICustomerTarget>
): ICustomerTarget => {
    return {
        src: overwrite?.src || 'camera-list',
        type: 'account',
        numberOfParents: 1,
        serviceProviderId: overwrite?.serviceProviderId || 1,
        serviceProviderName:
            overwrite?.serviceProviderName || 'Service Provider 1',
        customerId: overwrite?.customerId || 1,
        customerName: overwrite?.customerName || 'Customer 1',
    };
};

const mockSiteTarget = (overwrite?: Partial<ISiteTarget>): ISiteTarget => {
    return {
        src: overwrite?.src || 'camera-list',
        type: 'site',
        numberOfParents: 2,
        serviceProviderId: overwrite?.serviceProviderId || 1,
        serviceProviderName:
            overwrite?.serviceProviderName || 'Service Provider 1',
        customerId: overwrite?.customerId || 1,
        customerName: overwrite?.customerName || 'Customer 1',
        siteId: overwrite?.siteId || 1,
        siteName: overwrite?.siteName || 'Site 1',
    };
};

const mockCameraTarget = (
    overwrite?: Partial<ICameraTarget>
): ICameraTarget => {
    return {
        src: overwrite?.src || 'camera-list',
        type: 'camera',
        numberOfParents: 3,
        serviceProviderId: overwrite?.serviceProviderId || 1,
        serviceProviderName:
            overwrite?.serviceProviderName || 'Service Provider 1',
        customerId: overwrite?.customerId || 1,
        customerName: overwrite?.customerName || 'Customer 1',
        siteId: overwrite?.siteId || 1,
        siteName: overwrite?.siteName || 'Site 1',
        cameraId: overwrite?.cameraId || 1,
        cameraName: overwrite?.cameraName || 'Camera 1',
    };
};

describe('List Target Controller', () => {
    describe('hasNoRelation', () => {
        it('Should correctly identify when targets have no relation.', () => {
            const activeListTarget: ListTarget | null = null;

            expect(hasNoRelation(activeListTarget)).toEqual(true);
        });

        it('Should correctly identify when targets are related.', () => {
            const activeListTarget = mockCustomerTarget();

            expect(hasNoRelation(activeListTarget)).toEqual(false);
        });
    });

    describe('isSelf', () => {
        it('Should correctly equate list target of differing sources.', () => {
            const targetedItem = mockCustomerTarget();
            const activeListTarget = mockCustomerTarget({
                src: 'forensic-search',
            });

            expect(isSelf(targetedItem, activeListTarget)).toEqual(true);
        });

        it('Should correctly equate list target if all values are the same.', () => {
            const targetedItem = mockCustomerTarget();
            const activeListTarget = mockCustomerTarget();

            expect(isSelf(targetedItem, activeListTarget)).toEqual(true);
        });

        it('Should recognize targets are not equal if IDs differ.', () => {
            const targetedItem = mockCustomerTarget();
            const activeListTarget = mockCustomerTarget({ customerId: 2 });

            expect(isSelf(targetedItem, activeListTarget)).toEqual(false);
        });
    });

    describe('isChild', () => {
        describe('Positive cases', () => {
            it('Should correctly identify Customer as child of Service Provider.', () => {
                const targetedItem = mockCustomerTarget();
                const activeListTarget = mockServiceProviderTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Site as child of Service Provider.', () => {
                const targetedItem = mockSiteTarget();
                const activeListTarget = mockServiceProviderTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Site as child of Customer.', () => {
                const targetedItem = mockSiteTarget();
                const activeListTarget = mockCustomerTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Camera as child of Service Provider.', () => {
                const targetedItem = mockCameraTarget();
                const activeListTarget = mockServiceProviderTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Camera as child of Customer.', () => {
                const targetedItem = mockCameraTarget();
                const activeListTarget = mockCustomerTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Camera as child of Site.', () => {
                const targetedItem = mockCameraTarget();
                const activeListTarget = mockSiteTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(true);
            });
        });

        describe('Negative cases', () => {
            it('Should know that Service Provider can not be a child of self.', () => {
                const targetedItem = mockServiceProviderTarget();
                const activeListTarget = mockServiceProviderTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Service Provider can not be a child of self (different source).', () => {
                const targetedItem = mockServiceProviderTarget({
                    src: 'forensic-search',
                });
                const activeListTarget = mockServiceProviderTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Customer can not be a child of self.', () => {
                const targetedItem = mockCustomerTarget();
                const activeListTarget = mockCustomerTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Customer can not be a child of self (different source).', () => {
                const targetedItem = mockCustomerTarget({
                    src: 'forensic-search',
                });
                const activeListTarget = mockCustomerTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Site can not be a child of self.', () => {
                const targetedItem = mockSiteTarget();
                const activeListTarget = mockSiteTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Site can not be a child of self (different source).', () => {
                const targetedItem = mockSiteTarget({
                    src: 'forensic-search',
                });
                const activeListTarget = mockSiteTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Camera can not be a child of self.', () => {
                const targetedItem = mockCameraTarget();
                const activeListTarget = mockCameraTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Camera can not be a child of self (different source).', () => {
                const targetedItem = mockCameraTarget();
                const activeListTarget = mockCameraTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Customer is not a child of Service Provider.', () => {
                const targetedItem = mockServiceProviderTarget({
                    serviceProviderId: 2,
                });
                const activeListTarget = mockCustomerTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Customer can not be a child of Customer.', () => {
                const targetedItem = mockCustomerTarget({ customerId: 2 });
                const activeListTarget = mockCustomerTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Customer can not be a child of Site.', () => {
                const targetedItem = mockCustomerTarget();
                const activeListTarget = mockSiteTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Customer can not be a child of Camera.', () => {
                const targetedItem = mockCustomerTarget();
                const activeListTarget = mockCameraTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Site is not a child of Service Provider.', () => {
                const activeListTarget = mockServiceProviderTarget({
                    serviceProviderId: 2,
                });
                const targetedItem = mockSiteTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Site is not a child of Customer.', () => {
                const activeListTarget = mockCustomerTarget({ customerId: 2 });
                const targetedItem = mockSiteTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Site can not be a child of Site.', () => {
                const targetedItem = mockSiteTarget();
                const activeListTarget = mockSiteTarget({ siteId: 2 });

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Site can not be a child of Camera.', () => {
                const targetedItem = mockSiteTarget();
                const activeListTarget = mockCameraTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Camera is not a child of Service Provider.', () => {
                const activeListTarget = mockServiceProviderTarget({
                    serviceProviderId: 2,
                });
                const targetedItem = mockCameraTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Camera is not a child of Customer.', () => {
                const activeListTarget = mockCustomerTarget({ customerId: 2 });
                const targetedItem = mockCameraTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Camera is not a child of Site.', () => {
                const activeListTarget = mockSiteTarget({
                    siteId: 2,
                    siteName: 'Site 2',
                });
                const targetedItem = mockCameraTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Camera can not be a child of Camera.', () => {
                const activeListTarget = mockCameraTarget({ cameraId: 2 });
                const targetedItem = mockCameraTarget();

                expect(isChild(targetedItem, activeListTarget)).toEqual(false);
            });
        });
    });

    describe('isParent', () => {
        describe('Positive cases', () => {
            it('Should correctly identify Service Provider as parent of Customer.', () => {
                const targetedItem = mockServiceProviderTarget();
                const activeListTarget = mockCustomerTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Service Provider as parent of Site.', () => {
                const targetedItem = mockServiceProviderTarget();
                const activeListTarget = mockSiteTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Service Provider as parent of Camera.', () => {
                const targetedItem = mockServiceProviderTarget();
                const activeListTarget = mockCameraTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Customer as parent of Site.', () => {
                const targetedItem = mockCustomerTarget();
                const activeListTarget = mockSiteTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Customer as parent of Camera.', () => {
                const targetedItem = mockCustomerTarget();
                const activeListTarget = mockCameraTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(true);
            });

            it('Should correctly identify Site as parent of Camera.', () => {
                const targetedItem = mockSiteTarget();
                const activeListTarget = mockCameraTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(true);
            });
        });

        describe('Negative cases', () => {
            it('Should know that Service Provider can not be parent of self.', () => {
                const targetedItem = mockServiceProviderTarget();
                const activeListTarget = mockServiceProviderTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Service Provider can not be parent of self (different source).', () => {
                const targetedItem = mockServiceProviderTarget({
                    src: 'forensic-search',
                });
                const activeListTarget = mockServiceProviderTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Customer can not be parent of self.', () => {
                const targetedItem = mockCustomerTarget();
                const activeListTarget = mockCustomerTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Customer can not be parent of self (different source).', () => {
                const targetedItem = mockCustomerTarget({
                    src: 'forensic-search',
                });
                const activeListTarget = mockCustomerTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Site can not be parent of self.', () => {
                const targetedItem = mockSiteTarget();
                const activeListTarget = mockSiteTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Site can not be parent of self (different source).', () => {
                const targetedItem = mockSiteTarget({
                    src: 'forensic-search',
                });
                const activeListTarget = mockSiteTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Camera can not be parent of self.', () => {
                const targetedItem = mockCameraTarget();
                const activeListTarget = mockCameraTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Camera can not be parent of self (different source).', () => {
                const targetedItem = mockCameraTarget({
                    src: 'forensic-search',
                });
                const activeListTarget = mockCameraTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Service Provider is not parent of Customer.', () => {
                const targetedItem = mockServiceProviderTarget({
                    serviceProviderId: 2,
                });
                const activeListTarget = mockCustomerTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Service Provider is not parent of Site.', () => {
                const targetedItem = mockServiceProviderTarget({
                    serviceProviderId: 2,
                });
                const activeListTarget = mockSiteTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Service Provider is not parent of Camera.', () => {
                const targetedItem = mockServiceProviderTarget({
                    serviceProviderId: 2,
                });
                const activeListTarget = mockCameraTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Customer is not parent of Site.', () => {
                const targetedItem = mockCustomerTarget({ customerId: 2 });
                const activeListTarget = mockSiteTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Customer is not parent of Camera.', () => {
                const targetedItem = mockCustomerTarget({ customerId: 2 });
                const activeListTarget = mockCameraTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should recognize when Site is not parent of Camera.', () => {
                const targetedItem = mockSiteTarget({ siteId: 2 });
                const activeListTarget = mockCameraTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Camera can not be parent of Service Provider.', () => {
                const targetedItem = mockCameraTarget();
                const activeListTarget = mockServiceProviderTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Camera can not be parent of Customer.', () => {
                const targetedItem = mockCameraTarget();
                const activeListTarget = mockCustomerTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });

            it('Should know that Camera can not be parent of Site.', () => {
                const targetedItem = mockCameraTarget();
                const activeListTarget = mockSiteTarget();

                expect(isParent(targetedItem, activeListTarget)).toEqual(false);
            });
        });
    });

    describe('determineRelationship', () => {
        it('Should return "no-relationship" if active target is null.', () => {
            const targetedItem = mockSiteTarget();
            const activeListTarget = null;

            expect(
                determineRelationship(targetedItem, activeListTarget)
            ).toEqual('no-relation');
        });

        it('Should return "self" if targets match.', () => {
            const targetedItem = mockSiteTarget();
            const activeListTarget = mockSiteTarget();

            expect(
                determineRelationship(targetedItem, activeListTarget)
            ).toEqual('self');
        });

        it('Should return "child" if child.', () => {
            const targetedItem = mockSiteTarget();
            const activeListTarget = mockCustomerTarget();

            expect(
                determineRelationship(targetedItem, activeListTarget)
            ).toEqual('child');
        });

        it('Should return "parent" if parent.', () => {
            const targetedItem = mockCustomerTarget();
            const activeListTarget = mockSiteTarget();

            expect(
                determineRelationship(targetedItem, activeListTarget)
            ).toEqual('parent');
        });

        it('Should return "sibling" if sibling.', () => {
            const targetedItem = mockCustomerTarget({ customerId: 2 });
            const activeListTarget = mockSiteTarget();

            expect(
                determineRelationship(targetedItem, activeListTarget)
            ).toEqual('sibling');
        });
    });

    describe('devolve', () => {
        it('Should devolve Customer to null when there is no Service Provider', () => {
            const targetedItem: ICustomerTarget = {
                src: 'camera-list',
                type: 'account',
                numberOfParents: 0,
                customerId: 1,
                customerName: 'Customer 1',
            };

            expect(devolve(targetedItem)).toEqual(null);
        });

        it('Should devolve Customer to Service Provider when Service Provider is available', () => {
            const targetedItem = mockCustomerTarget();

            expect(devolve(targetedItem)).toEqual(mockServiceProviderTarget());
        });

        it('Should devolve Site to Customer', () => {
            const targetedItem = mockSiteTarget();

            expect(devolve(targetedItem)).toEqual(mockCustomerTarget());
        });

        it('Should devolve Camera to Site', () => {
            const targetedItem = mockCameraTarget();

            expect(devolve(targetedItem)).toEqual(mockSiteTarget());
        });
    });

    describe('determineReplacementListTarget', () => {
        it('Should determine that listTarget should be replaced with targetedItem if child.', () => {
            const targetedItem = mockSiteTarget();
            const activeListTarget = mockCustomerTarget();

            /** targetedItem's relation to currently active list target. */
            const relation: RelationToActiveListTarget = determineRelationship(
                targetedItem,
                activeListTarget
            );

            expect(
                determineReplacementListTarget(targetedItem, relation)
            ).toEqual(targetedItem);
        });

        it('Should determine that listTarget should be replaced with targetedItem if sibling.', () => {
            const targetedItem: ICustomerTarget = mockCustomerTarget();
            const activeListTarget: ICustomerTarget = mockCustomerTarget({
                customerId: 2,
            });

            /** targetedItem's relation to currently active list target. */
            const relation: RelationToActiveListTarget = determineRelationship(
                targetedItem,
                activeListTarget
            );

            expect(
                determineReplacementListTarget(targetedItem, relation)
            ).toEqual(targetedItem);
        });

        it('Should determine that listTarget should be replaced with targetedItem if no relation.', () => {
            const targetedItem: ICustomerTarget = mockCustomerTarget();
            const activeListTarget = null;

            /** targetedItem's relation to currently active list target. */
            const relation: RelationToActiveListTarget = determineRelationship(
                targetedItem,
                activeListTarget
            );

            expect(
                determineReplacementListTarget(targetedItem, relation)
            ).toEqual(targetedItem);
        });

        it('Should determine that listTarget should be devolved if parent.', () => {
            const targetedItem = mockCustomerTarget();
            const activeListTarget = mockSiteTarget();

            /** targetedItem's relation to currently active list target. */
            const relation: RelationToActiveListTarget = determineRelationship(
                targetedItem,
                activeListTarget
            );

            expect(
                determineReplacementListTarget(targetedItem, relation)
            ).toEqual(mockServiceProviderTarget());
        });

        it('Should determine that listTarget should be devolved if self.', () => {
            const targetedItem = mockSiteTarget();
            const activeListTarget = mockSiteTarget();

            /** targetedItem's relation to currently active list target. */
            const relation: RelationToActiveListTarget = determineRelationship(
                targetedItem,
                activeListTarget
            );

            expect(
                determineReplacementListTarget(targetedItem, relation)
            ).toEqual(mockCustomerTarget());
        });
    });
});
