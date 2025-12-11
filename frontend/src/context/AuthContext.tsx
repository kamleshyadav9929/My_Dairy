import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id?: number;
  customerId?: number;
  username?: string;
  amcuId?: string;
  name: string;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string, isAdmin?: boolean, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from storage on mount
  useEffect(() => {
    // Use new keys to invalidate any old bad states
    const storedToken = localStorage.getItem('dairy_app_token') || sessionStorage.getItem('dairy_app_token');
    const storedUser = localStorage.getItem('dairy_app_user') || sessionStorage.getItem('dairy_app_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        // Clean up
        localStorage.removeItem('dairy_app_token');
        localStorage.removeItem('dairy_app_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, isAdmin = true, rememberMe = false) => {
    // Clear legacy keys just in case
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Clear current keys
    localStorage.removeItem('dairy_app_token');
    localStorage.removeItem('dairy_app_user');
    sessionStorage.removeItem('dairy_app_token');
    sessionStorage.removeItem('dairy_app_user');
    
    const response = isAdmin
      ? await authApi.adminLogin(username, password)
      : await authApi.customerLogin(username, password);
    
    // Backend returns { token, user } for BOTH admin and customer
    const { token: newToken, user: userData } = response.data;
    
    // Defensive check - if userData is undefined, throw error
    if (!userData || !userData.role) {
      console.error('Invalid login response - userData:', userData);
      throw new Error('Invalid login response from server');
    }
    
    let userInfo: User;
    
    if (userData.role === 'customer') {
      userInfo = {
        customerId: userData.id,
        amcuId: userData.amcuId, // Backend sends amcuId for customer
        name: userData.name,
        role: 'customer'
      };
    } else {
      userInfo = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        role: 'admin'
      };
    }
    
    // Store in localStorage (for Remember Me) or sessionStorage
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('dairy_app_token', newToken);
    storage.setItem('dairy_app_user', JSON.stringify(userInfo));
    
    setToken(newToken);
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem('dairy_app_token');
    localStorage.removeItem('dairy_app_user');
    sessionStorage.removeItem('dairy_app_token');
    sessionStorage.removeItem('dairy_app_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
