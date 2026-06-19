import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { data } = await getMe();
      setAdmin(data.data || data.admin || data);
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await apiLogin(email, password);
    setAdmin(data.data || data.admin || data);
    return data;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    } finally {
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        reloadUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
