import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserData {
  fullName: string;
  email: string;
  businessName: string;
  industry: string;
  region: string;
  businessWebsite: string;
  businessSize: string;
  logoColor: string;
  logoFile?: string;
  businessPdf?: string;
  instagramApiKey?: string;
  instagramUserId?: string;
  facebookApiKey?: string;
  facebookPageId?: string;
  linkedinAccessToken?: string;
  linkedinAuthorUrl?: string;
  googleConnectorEmail?: string;
  googleApiKey?: string;
  defaultFromEmail?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: UserData, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('socialsphere-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      setIsAuthenticated(true);
      setUser(parsed.user);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const stored = localStorage.getItem('socialsphere-users');
    if (stored) {
      const users = JSON.parse(stored);
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      if (foundUser) {
        const { password: _, ...userData } = foundUser;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('socialsphere-auth', JSON.stringify({ user: userData }));
        return true;
      }
    }
    return false;
  };

  const signup = async (userData: UserData, password: string): Promise<boolean> => {
    const stored = localStorage.getItem('socialsphere-users');
    const users = stored ? JSON.parse(stored) : [];
    
    if (users.find((u: any) => u.email === userData.email)) {
      return false;
    }

    users.push({ ...userData, password });
    localStorage.setItem('socialsphere-users', JSON.stringify(users));
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('socialsphere-auth', JSON.stringify({ user: userData }));
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('socialsphere-auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
