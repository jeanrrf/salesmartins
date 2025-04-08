import axios from 'axios';
import config from '../config';

/**
 * Creates an Axios instance with retry capability
 * @param {Object} options - Configuration options
 * @returns {Object} Axios instance with interceptors
 */
export const createAxiosWithRetry = (options = {}) => {
    const {
        baseURL = '',
        timeout = config.API_TIMEOUT,
        maxRetries = config.MAX_RETRIES,
        retryDelay = config.RETRY_DELAY
    } = options;

    const instance = axios.create({
        baseURL,
        timeout,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Request interceptor
    instance.interceptors.request.use(config => {
        // Add retry count to config if doesn't exist
        if (config.retry === undefined) {
            config.retry = 0;
        }
        return config;
    });

    // Response interceptor
    instance.interceptors.response.use(
        response => response,
        async error => {
            const { config } = error;

            // If config does not exist or we've reached max retries
            if (!config || !config.retry || config.retry >= maxRetries) {
                return Promise.reject(error);
            }

            // Increment retry count
            config.retry += 1;

            // Calculate delay with exponential backoff
            const delay = retryDelay * Math.pow(2, config.retry - 1);
            console.log(`Retrying request (${config.retry}/${maxRetries}) after ${delay}ms...`);

            // Create new promise that resolves after delay
            return new Promise(resolve => {
                setTimeout(() => resolve(instance(config)), delay);
            });
        }
    );

    return instance;
};

/**
 * Parses and formats error messages
 * @param {Error} error - The error object from axios
 * @returns {String} Formatted error message
 */
export const parseErrorMessage = (error) => {
    if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        if (status === 404) {
            return 'Resource not found';
        } else if (status === 401) {
            return 'Unauthorized access';
        } else if (status === 403) {
            return 'Access forbidden';
        } else if (status === 500) {
            return 'Server error';
        } else if (data && data.message) {
            return data.message;
        } else {
            return `Error ${status}: ${data}`;
        }
    } else if (error.request) {
        // Request made but no response
        if (error.code === 'ECONNABORTED') {
            return 'Request timed out';
        }
        return 'Network error. Please check your connection.';
    } else {
        // Error in request setup
        return error.message || 'An unknown error occurred';
    }
};

export default {
    createAxiosWithRetry,
    parseErrorMessage
};
