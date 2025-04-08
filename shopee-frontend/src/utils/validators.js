const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
    return password.length >= 6;
};

/**
 * Validates product search query
 * @param {string} query - Search query string
 * @returns {boolean} True if valid
 */
export const validateProductSearch = (query) => {
    // Basic validation to avoid injection or invalid queries
    if (typeof query !== 'string') {
        return false;
    }

    // Check for very long queries
    if (query.length > 200) {
        return false;
    }

    // Check for obviously malicious patterns
    const maliciousPatterns = [
        /script/i,
        /javascript:/i,
        /<[^>]*>/,  // HTML tags
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i // SQL injection attempts
    ];

    for (const pattern of maliciousPatterns) {
        if (pattern.test(query)) {
            console.warn('Potentially malicious search query detected:', query);
            return false;
        }
    }

    return true;
};

/**
 * Validates filter values
 * @param {number|string} minSales - Minimum sales count
 * @param {number|string} maxCommission - Maximum commission percentage
 * @param {number|string} similarityThreshold - Similarity threshold percentage
 * @returns {object} Object with error messages keyed by field name
 */
export const validateFilterValues = (minSales, maxCommission, similarityThreshold) => {
    const errors = {};

    // Validate minSales
    if (minSales !== undefined && minSales !== '') {
        const minSalesNum = parseFloat(minSales);
        if (isNaN(minSalesNum)) {
            errors.minSales = 'Must be a valid number';
        } else if (minSalesNum < 0) {
            errors.minSales = 'Cannot be negative';
        } else if (minSalesNum > 1000000) {
            errors.minSales = 'Value too large';
        }
    }

    // Validate maxCommission
    if (maxCommission !== undefined && maxCommission !== '') {
        const maxCommissionNum = parseFloat(maxCommission);
        if (isNaN(maxCommissionNum)) {
            errors.maxCommission = 'Must be a valid number';
        } else if (maxCommissionNum < 0) {
            errors.maxCommission = 'Cannot be negative';
        } else if (maxCommissionNum > 100) {
            errors.maxCommission = 'Cannot exceed 100%';
        }
    }

    // Validate similarityThreshold
    if (similarityThreshold !== undefined && similarityThreshold !== '') {
        const similarityThresholdNum = parseFloat(similarityThreshold);
        if (isNaN(similarityThresholdNum)) {
            errors.similarityThreshold = 'Must be a valid number';
        } else if (similarityThresholdNum < 0) {
            errors.similarityThreshold = 'Cannot be negative';
        } else if (similarityThresholdNum > 100) {
            errors.similarityThreshold = 'Cannot exceed 100%';
        }
    }

    return errors;
};

/**
 * Validates if an image URL is likely to be valid
 * @param {string} url - Image URL to validate
 * @returns {boolean} True if URL looks valid 
 */
export const validateImageUrl = (url) => {
    if (!url) return false;

    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
    }

    // Make sure it has a file extension that's an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext =>
        url.toLowerCase().includes(ext)
    );

    // Also allow URLs from known image hosts even without extensions
    const knownImageHosts = [
        'cloudinary.com',
        'unsplash.com',
        'imgur.com',
        'placehold.it',
        'via.placeholder.com',
        'images.unsplash.com'
    ];

    const isKnownHost = knownImageHosts.some(host =>
        url.toLowerCase().includes(host)
    );

    return hasImageExtension || isKnownHost;
};

export { validateEmail, validatePassword };