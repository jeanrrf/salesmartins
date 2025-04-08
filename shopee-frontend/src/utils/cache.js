/**
 * Client-side cache utility for storing API responses
 */

const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Sets an item in the cache with expiration
 * 
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {string} source - Source of the data (api, local, mock)
 * @param {number} expiresIn - Time in ms until cache expires
 */
export const setCacheItem = (key, data, source = 'api', expiresIn = DEFAULT_CACHE_TIME) => {
    try {
        const item = {
            data,
            timestamp: Date.now(),
            expires: Date.now() + expiresIn,
            source
        };

        sessionStorage.setItem(key, JSON.stringify(item));
        return true;
    } catch (err) {
        console.warn('Cache set error:', err);
        return false;
    }
};

/**
 * Gets an item from the cache
 * 
 * @param {string} key - Cache key
 * @param {boolean} ignoreExpiry - Whether to return expired items
 * @returns {Object|null} Cached item or null if not found/expired
 */
export const getCacheItem = (key, ignoreExpiry = false) => {
    try {
        const item = sessionStorage.getItem(key);
        if (!item) return null;

        const parsedItem = JSON.parse(item);

        // Check if cache has expired
        if (!ignoreExpiry && parsedItem.expires < Date.now()) {
            sessionStorage.removeItem(key); // Clean up expired items
            return null;
        }

        return parsedItem;
    } catch (err) {
        console.warn('Cache get error:', err);
        return null;
    }
};

/**
 * Clears all or specific cache entries
 * 
 * @param {string|RegExp} pattern - Optional pattern to match keys
 */
export const clearCache = (pattern = null) => {
    try {
        if (!pattern) {
            sessionStorage.clear();
            return;
        }

        // Clear only keys matching the pattern
        const isRegExp = pattern instanceof RegExp;
        const keys = Object.keys(sessionStorage);

        keys.forEach(key => {
            if (isRegExp && pattern.test(key)) {
                sessionStorage.removeItem(key);
            } else if (typeof pattern === 'string' && key.includes(pattern)) {
                sessionStorage.removeItem(key);
            }
        });
    } catch (err) {
        console.warn('Cache clear error:', err);
    }
};

export default {
    setCacheItem,
    getCacheItem,
    clearCache,
};
