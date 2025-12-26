import { threeWayMerge } from './mergeConflicts';

describe('mergeConflicts', () => {
    describe('threeWayMerge', () => {
        it('should return no conflict when changes are identical', () => {
            const base = { title: 'Original' };
            const local = { title: 'Changed' };
            const server = { title: 'Changed' };

            const result = threeWayMerge(base, local, server);

            expect(result.hasConflict).toBe(false);
            expect(result.merged.title).toBe('Changed');
        });

        it('should detect conflict when same field changed differently', () => {
            const base = { title: 'Original' };
            const local = { title: 'Local Change' };
            const server = { title: 'Server Change' };

            const result = threeWayMerge(base, local, server);

            expect(result.hasConflict).toBe(true);
            expect(result.conflicts.title).toBeDefined();
            expect(result.merged.title).toBe('Server Change'); // Defaults to server
        });

        it('should merge non-conflicting changes', () => {
            const base = { title: 'Original', description: 'Base' };
            const local = { title: 'Local Title', description: 'Base' };
            const server = { title: 'Original', description: 'Server Desc' };

            const result = threeWayMerge(base, local, server);

            expect(result.hasConflict).toBe(false);
            expect(result.merged.title).toBe('Local Title');
            expect(result.merged.description).toBe('Server Desc');
        });

        it('should handle only local changes', () => {
            const base = { title: 'Original' };
            const local = { title: 'Local Change' };
            const server = { title: 'Original' };

            const result = threeWayMerge(base, local, server);

            expect(result.hasConflict).toBe(false);
            expect(result.merged.title).toBe('Local Change');
        });

        it('should handle only server changes', () => {
            const base = { title: 'Original' };
            const local = { title: 'Original' };
            const server = { title: 'Server Change' };

            const result = threeWayMerge(base, local, server);

            expect(result.hasConflict).toBe(false);
            expect(result.merged.title).toBe('Server Change');
        });
    });
});
