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





    const keys = new Set([...Object.keys(local), ...Object.keys(server)]);
    const merged = { ...server };

    let hasConflict = false;

    for (const key of keys) {
        const baseVal = base ? base[key] : undefined;
        const localVal = local[key];
        const serverVal = server[key];


        if (['version', 'lastModifiedAt', 'last_modified', 'timestamp'].includes(key)) continue;

        const localChanged = localVal !== baseVal;
        const serverChanged = serverVal !== baseVal;

        if (localChanged && serverChanged) {
            if (localVal !== serverVal) {

                hasConflict = true;
                console.log(`Conflict detected on field '${key}': Local='${localVal}', Server='${serverVal}'`);
            }

        } else if (localChanged) {

            merged[key] = localVal;
        }

    }

    if (hasConflict) return null;

    return merged;
};
