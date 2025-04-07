import React, { createContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, getUserData } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const userData = await getUserData();
            setUser(userData);
            setLoading(false);
        };

        fetchUserData();
    }, []);

    const login = async (credentials) => {
        const userData = await loginUser(credentials);
        setUser(userData);
    };

    const logout = async () => {
        await logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};