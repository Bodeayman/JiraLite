/**
 * Validates card title
 * @param {string} title - Card title to validate
 * @returns {boolean} - True if valid
 */
export const validateCardTitle = (title) => {
    if (!title || typeof title !== 'string') return false;
    const trimmed = title.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length > 255) return false;
    return true;
};

/**
 * Validates list title
 * @param {string} title - List title to validate
 * @returns {boolean} - True if valid
 */
export const validateListTitle = (title) => {
    if (!title || typeof title !== 'string') return false;
    const trimmed = title.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length > 100) return false;
    return true;
};

/**
 * Validates card description
 * @param {string} description - Card description
 * @returns {boolean} - True if valid
 */
export const validateCardDescription = (description) => {
    if (!description) return true;
    if (typeof description !== 'string') return false;
    if (description.length > 5000) return false;
    return true;
};
