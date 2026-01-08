import sortByName, { compare } from '../../utils/sortByName';

describe('Sort By Name module', () => {
    describe('Compare function', () => {
        test('Should treat base characters as equal in sort.', () => {
            const actualCameraNames: string[] = [
                'Bulk',
                'Bulk 1',
                'Bulk 11',
                'Bulk _1',
                'bulk',
                'bulk 1',
                'bulk 10',
                'bulk 11',
                'Bulk 11',
                'bulk 12',
                'bulk 13',
                'bulk 14',
                'bulk 15',
                'bulk 16',
                'bulk 17',
                'bulk 18',
                'bulk 19',
                'bulk 2',
                'bulk 20',
                'bulk 21',
                'bulk 22',
                'bulk 23',
                'bulk 30',
                'bulk 31',
                'bulk 33',
                'bulk 3',
                'bulk 3_',
                'bulk 4',
                'bulk 5',
                'bulk 6&',
                'bulk 7',
                'bulk 8',
                'bulk 9',
                'bulk&',
            ];
            const expectedCameraNames: string[] = [
                'Bulk',
                'bulk',
                'Bulk _1',
                'Bulk 1',
                'bulk 1',
                'bulk 2',
                'bulk 3',
                'bulk 3_',
                'bulk 4',
                'bulk 5',
                'bulk 6&',
                'bulk 7',
                'bulk 8',
                'bulk 9',
                'bulk 10',
                'Bulk 11',
                'bulk 11',
                'Bulk 11',
                'bulk 12',
                'bulk 13',
                'bulk 14',
                'bulk 15',
                'bulk 16',
                'bulk 17',
                'bulk 18',
                'bulk 19',
                'bulk 20',
                'bulk 21',
                'bulk 22',
                'bulk 23',
                'bulk 30',
                'bulk 31',
                'bulk 33',
                'bulk&',
            ];

            expect(actualCameraNames.sort(compare)).toStrictEqual(
                expectedCameraNames
            );
        });
    });

    describe('sortByName function', () => {
        test('Should throw error if attempting to sort array with mismatched name properties.', () => {
            const arr: any[] = [
                { name: 'A name' },
                { site_name: 'A site name' },
            ];

            expect(() => arr.sort(sortByName)).toThrowError();
        });
    });
});
