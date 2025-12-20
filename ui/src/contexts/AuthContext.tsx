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
  businessDocuments?: File[];
  instagramApiKey?: string;
  instagramUserId?: string;
  facebookApiKey?: string;
  facebookPageId?: string;
  linkedinAccessToken?: string;
  linkedinAuthorUrl?: string;
  googleConnectorEmail?: string;
  googleApiKey?: string;
  defaultFromEmail?: string;
  Gmail_Access_Token?: string;
  Gmail_Refresh_Token?: string;
  Gmail_Token_Expiry?: string;
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

  // Check for backend session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:8000/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Important: send cookies
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          // No valid session
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<string | boolean> => {
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: receive cookies
        body: JSON.stringify({ Email: email, Password: password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;

        setUser(userData);
        setIsAuthenticated(true);
        // We no longer rely on localStorage for auth state
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
    // Signup logic remains mostly similar, but we might want to ensure immediate login (backend session)
    // or just let them sign up and then log in. The existing code uses /register then potentially assumes login?
    // The previous implementation set local state. A better UX is to auto-login.
    // For now, let's keep the existing structure but allow it to update local state, 
    // BUT the real session requires /login call or backend change to set session on register.
    // The user strictly asked for login session. Let's stick to /login starting session.

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
        Google_api_key: userData.googleApiKey || "",
        Gmail_Access_Token: userData.Gmail_Access_Token,
        Gmail_Refresh_Token: userData.Gmail_Refresh_Token,
        Gmail_Token_Expiry: userData.Gmail_Token_Expiry,
      };

      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Registration successful:", data);

        // Upload documents if any
        if (userData.businessDocuments && userData.businessDocuments.length > 0) {
          // ... (upload logic omitted for brevity, keeping existing)
          const formData = new FormData();
          userData.businessDocuments.forEach((file) => {
            formData.append('files', file);
          });
          await fetch(`http://localhost:8000/upload-documents/${data.bid}`, {
            method: 'POST',
            body: formData,
          });
        }

        // Auto-login after registration? Or just redirect to login?
        // Current existing logic set state immediately. 
        // To establish backend session, we must hit an endpoint that sets the cookie.
        // We can either modify /register to set cookie OR call /login here.
        // Let's call /login implicitly for seamless UX.
        await login(userData.email, password);
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

  const logout = async () => {
    try {
      await fetch('http://localhost:8000/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error("Logout failed", e);
    }
    setIsAuthenticated(false);
    setUser(null);
    // localStorage.removeItem('socialsphere-auth'); // Clean up legacy
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
