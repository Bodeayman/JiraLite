export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (date) => {
    if (!date) return '';
    try {
        return new Date(date).toLocaleDateString();
    } catch {
        return '';
    }
};

export const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
};