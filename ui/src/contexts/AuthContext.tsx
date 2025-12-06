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
  login: (email: string, password: string) => Promise<string | boolean>;
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

  const login = async (email: string, password: string): Promise<string | boolean> => {
    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Email: email, Password: password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('socialsphere-auth', JSON.stringify({ user: userData }));
        return true;
      } else {
        const errorData = await response.json();
        return errorData.detail || "Login failed";
      }
    } catch (error) {
      console.error("Network error during login:", error);
      return "Network error. Please try again.";
    }
  };

  const signup = async (userData: UserData, password: string): Promise<boolean> => {
    try {
      const payload = {
        Full_Name: userData.fullName,
        Email: userData.email,
        Password: password,
        business_name: userData.businessName,
        Industry: userData.industry,
        Country: userData.region,
        Business_website: userData.businessWebsite,
        Business_Size: userData.businessSize,
        Brand_color: userData.logoColor,
        Insta_API_KEY: userData.instagramApiKey || "",
        Insta_user_id: userData.instagramUserId || "",
        Facebook_API_KEY: userData.facebookApiKey || "",
        Facebook_page_id: userData.facebookPageId || "",
        Linkedin_access_token: userData.linkedinAccessToken || "",
        Linkedin_Author_URN: userData.linkedinAuthorUrl || "",
        Google_connecter_email: userData.googleConnectorEmail || "",
        Google_api_key: userData.googleApiKey || ""
      };

      const response = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Registration successful:", data);

        // Keep local state update for immediate UI feedback
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('socialsphere-auth', JSON.stringify({ user: userData }));
        return true;
      } else {
        const errorData = await response.json();
        console.error("Registration failed:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Network error during registration:", error);
      return false;
    }
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
