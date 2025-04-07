import axios from 'axios';

const API_URL = 'https://api.shopee.com'; // Replace with the actual Shopee API URL

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        setToken(response.data.token); // Save token when login is successful
        return response.data;
    } catch (error) {
        throw new Error('Login failed. Please check your credentials.');
    }
};

// Add this new export to match what's being imported in AuthContext.js
export const loginUser = login; // Export login as loginUser for compatibility

export const logout = async () => {
    try {
        await axios.post(`${API_URL}/auth/logout`);
        removeToken(); // Remove token when logout is successful
    } catch (error) {
        throw new Error('Logout failed. Please try again.');
    }
};

// Add this new export to match what's being imported in AuthContext.js
export const logoutUser = logout; // Export logout as logoutUser for compatibility

export const getUserData = async () => {
    try {
        const token = getToken();
        if (!token) return null;
        
        const response = await axios.get(`${API_URL}/auth/user`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        removeToken(); // Remove invalid token
        return null;
    }
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const setToken = (token) => {
    localStorage.setItem('token', token);
};

export const removeToken = () => {
    localStorage.removeItem('token');
};