// Este arquivo é um placeholder e não está em uso.
// O contexto real de autenticação se encontra em "frontend-react/contexts/AuthContext.js".
import { createContext } from 'react';
const AuthContext = createContext(null);
export default AuthContext;
export const AuthProvider = AuthContext.Provider;
export const AuthConsumer = AuthContext.Consumer;