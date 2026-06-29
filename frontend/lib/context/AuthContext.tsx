'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'contributor';
}

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'contributor';
  exp: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isContributor: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('disacare_token');
    setToken(null);
    setUser(null);
  };

  const login = (newToken: string) => {
    localStorage.setItem('disacare_token', newToken);
    setToken(newToken);
    try {
      const decoded: DecodedToken = jwtDecode(newToken);
      setUser({
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      });
    } catch (err) {
      console.error('Invalid token format:', err);
      logout();
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('disacare_token');
    if (savedToken) {
      try {
        const decoded: DecodedToken = jwtDecode(savedToken);
        // Check expiration (exp is in seconds)
        const isExpired = decoded.exp * 1000 < Date.now();
        if (isExpired) {
          logout();
        } else {
          setToken(savedToken);
          setUser({
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
          });
        }
      } catch (err) {
        console.error('Error parsing saved token:', err);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isContributor = user?.role === 'contributor' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isContributor, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
