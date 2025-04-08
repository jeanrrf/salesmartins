import React, { createContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, getUserData } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is already logged in on component mount
    useEffect(() => {
        const checkLoggedIn = async () => {
            try {
                const userData = await getUserData();
                if (userData) {
                    setUser(userData);
                    setIsAuthenticated(true);
                }
            } catch (err) {
                console.error("Error checking authentication status:", err);
            } finally {
                setLoading(false);
            }
        };

        checkLoggedIn();
    }, []);

    // Login function
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const userData = await loginUser(email, password);
            setUser(userData);
            setIsAuthenticated(true);
            return userData;
        } catch (err) {
            setError(err.message || "Login failed");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        setLoading(true);
        try {
            await logoutUser();
            setUser(null);
            setIsAuthenticated(false);
        } catch (err) {
            setError(err.message || "Logout failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            isAuthenticated,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
