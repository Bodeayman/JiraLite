

export const threeWayMerge = (base, local, server) => {

    if (JSON.stringify(local) === JSON.stringify(server)) {
        return { merged: local, hasConflict: false };
    }

    const merged = { ...base };
    const conflicts = {};


    const allKeys = new Set([
        ...Object.keys(local),
        ...Object.keys(server)
    ]);

    for (const key of allKeys) {
        const baseVal = base[key];
        const localVal = local[key];
        const serverVal = server[key];


        if (['version', 'lastModifiedAt', 'syncStatus'].includes(key)) {
            continue;
        }


        if (localVal !== baseVal && serverVal !== baseVal && localVal !== serverVal) {
            conflicts[key] = { local: localVal, server: serverVal };
            merged[key] = serverVal;
        }

        else if (localVal !== baseVal) {
            merged[key] = localVal;
        }

        else if (serverVal !== baseVal) {
            merged[key] = serverVal;
        }

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