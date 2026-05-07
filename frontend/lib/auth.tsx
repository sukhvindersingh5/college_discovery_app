'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User { id: number; name: string; email: string; }
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
  }, []);

  const login = (user: User, token: string) => {
    setUser(user); setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!user }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
