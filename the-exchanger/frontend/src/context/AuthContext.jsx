import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import axios from 'axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API_URL = 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL });

const fetchUser = async (token) => {
  if (!token) return null;
  const { data } = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.user;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const fallbackUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Only fetch if token exists
  const swrKey = token ? ['auth/me', token] : null;
  const { data: user, error, isLoading, mutate } = useSWR(
    swrKey,
    () => fetchUser(token),
    { fallbackData: fallbackUser }
  );

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const register = async (name, email, password, location) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password, location });
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      await globalMutate(['auth/me', data.token], data.user, { revalidate: false });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      await globalMutate(['auth/me', data.token], data.user, { revalidate: false });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    await globalMutate(['auth/me', token], null, { revalidate: false });
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, loading: isLoading, error, API_URL }}
    >
      {children}
    </AuthContext.Provider>
  );
};
