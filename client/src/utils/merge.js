/**
 * Performs a 3-way merge on two objects (local and server) against a base version.
 * Returns the merged object if auto-merge is possible, or null if there is a conflict.
 * 
 * @param {Object} base - The original state before local changes
 * @param {Object} local - The current local state
 * @param {Object} server - The new server state
 * @returns {Object|null} - Merged object or null if conflict
 */
export const mergeItems = (base, local, server) => {
    // If no base, assume standard "ours vs theirs", but let's try to infer.
    // In our queue system, we might not have the exact "base" stored easily unless we snapshot it.
    // If we lack base, we compare local vs server directly.
    // Conflict if: local[key] !== server[key] AND local[key] !== base[key] (if base exists)

    const keys = new Set([...Object.keys(local), ...Object.keys(server)]);
    const merged = { ...server }; // Start with server as truth

    let hasConflict = false;

    for (const key of keys) {
        const baseVal = base ? base[key] : undefined;
        const localVal = local[key];
        const serverVal = server[key];

        // Ignore internal fields
        if (['version', 'lastModifiedAt', 'last_modified', 'timestamp'].includes(key)) continue;

        const localChanged = localVal !== baseVal;
        const serverChanged = serverVal !== baseVal;

        if (localChanged && serverChanged) {
            if (localVal !== serverVal) {
                // Both changed to different values -> CONFLICT
                hasConflict = true;
                console.log(`Conflict detected on field '${key}': Local='${localVal}', Server='${serverVal}'`);
            }
            // If both changed to SAME value, it's fine (already in merged from server copy)
        } else if (localChanged) {
            // Only local changed -> Keep local
            merged[key] = localVal;
        }
        // If only server changed -> Keep server (already in merged)
    }

    if (hasConflict) return null;

    return merged;
};
