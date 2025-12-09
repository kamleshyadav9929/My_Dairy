import { useState, useEffect, createContext, useContext } from 'react';
import { customerPortalApi } from '../../lib/api';

interface CustomerUser {
  id: number;
  name: string;
  amcuId: string;
  phone: string;
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  token: string | null;
  login: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export const CustomerAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('customer_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('customer_token');
      const storedUser = localStorage.getItem('customer_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: any) => {
    try {
      const { data } = await customerPortalApi.login(credentials);
      const { token, customer } = data;
      
      localStorage.setItem('customer_token', token);
      localStorage.setItem('customer_user', JSON.stringify(customer));
      
      setToken(token);
      setUser(customer);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    setToken(null);
    setUser(null);
    window.location.href = '/customer/login';
  };

  return (
    <CustomerAuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
