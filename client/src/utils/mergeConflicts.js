// utils/mergeConflicts.js

export const threeWayMerge = (base, local, server) => {
    // If local and server made the same change, no conflict
    if (JSON.stringify(local) === JSON.stringify(server)) {
        return { merged: local, hasConflict: false };
    }

    const merged = { ...base };
    const conflicts = {};

    // Check each field
    const allKeys = new Set([
        ...Object.keys(local),
        ...Object.keys(server)
    ]);

    for (const key of allKeys) {
        const baseVal = base[key];
        const localVal = local[key];
        const serverVal = server[key];

        // Skip metadata fields
        if (['version', 'lastModifiedAt', 'syncStatus'].includes(key)) {
            continue;
        }

        // Both changed differently = conflict
        if (localVal !== baseVal && serverVal !== baseVal && localVal !== serverVal) {
            conflicts[key] = { local: localVal, server: serverVal };
            merged[key] = serverVal; // Default to server version
        }
        // Only local changed
        else if (localVal !== baseVal) {
            merged[key] = localVal;
        }
        // Only server changed
        else if (serverVal !== baseVal) {
            merged[key] = serverVal;
        }
        // Neither changed
        else {
            merged[key] = baseVal;
        }
    }

    return {
        merged,
        hasConflict: Object.keys(conflicts).length > 0,
        conflicts
    };
};