import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../lib/api';

interface AuthContextType {
  user: any;
  login: (userData: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const TOKEN_KEY = 'dairy_auth_token';
const USER_KEY = 'dairy_user_data';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && userData) {
        setAuthToken(token);
        setUser(JSON.parse(userData));
        console.log('✅ Restored login session');
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: any, token: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
      setAuthToken(token);
      setUser(userData);
      console.log('✅ Login complete:', userData.name);
    } catch (error) {
      console.error('Failed to save auth:', error);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      setAuthToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
