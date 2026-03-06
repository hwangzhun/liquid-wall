import { useState, useCallback } from 'react';
import { AuthContext } from './authContextRef';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('liquid-wall-token'));

  const isLoggedIn = !!token;

  const login = useCallback((newToken) => {
    localStorage.setItem('liquid-wall-token', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('liquid-wall-token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
