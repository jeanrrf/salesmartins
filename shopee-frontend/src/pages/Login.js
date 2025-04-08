import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validators';
import './Login.css';

const Login = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const { login, error: authError, loading } = useContext(AuthContext);
    const history = useHistory();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation errors when typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!validateEmail(credentials.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!validatePassword(credentials.password)) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await login(credentials.email, credentials.password);
            history.push('/'); // Redirect to dashboard on successful login
        } catch (error) {
            console.error('Login error:', error);
            // Auth error is handled by the context
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Login</h2>

                {authError && (
                    <div className="error-message">{authError}</div>
                )}

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                    />
                    {formErrors.email && (
                        <div className="field-error">{formErrors.email}</div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                    />
                    {formErrors.password && (
                        <div className="field-error">{formErrors.password}</div>
                    )}
                </div>

                <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </button>

                <div className="form-footer">
                    <a href="/forgot-password">Forgot password?</a>
                </div>
            </form>
        </div>
    );
};

export default Login;
