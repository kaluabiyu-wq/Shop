import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(api.getToken()));

  // Restore the session from a saved token on first load.
  useEffect(() => {
    if (!api.getToken()) return;
    api.auth
      .me()
      .then(setUser)
      .catch(() => api.setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback((res) => {
    api.setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback(
    async (email, password) => handleAuth(await api.auth.login({ email, password })),
    [handleAuth]
  );

  const register = useCallback(
    async (fullName, email, password) =>
      handleAuth(await api.auth.register({ fullName, email, password })),
    [handleAuth]
  );

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAdmin: user?.role === 'Admin' }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
