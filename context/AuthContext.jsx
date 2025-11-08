import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/auth';
import { storage } from '../services/storage';

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, message: 'Provider not ready' }),
  register: async () => ({ success: false, message: 'Provider not ready' }),
  logout: async () => {},
  updateUserProfile: async () => ({ success: false, message: 'Provider not ready' }),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await storage.getUserData();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      const { access, refresh } = response.data;

      await storage.saveTokens(access, refresh);

      // Fetch user profile
      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data;

      await storage.saveUserData(userData);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      // Auto login after registration
      const loginResult = await login(userData.username, userData.password);
      
      if (loginResult.success) {
        return { success: true, message: 'Registration successful!' };
      }
      
      return { 
        success: true, 
        message: 'Registration successful! Please login.',
        autoLoginFailed: true 
      };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.username?.[0] 
        || error.response?.data?.email?.[0]
        || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await storage.clearAll();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data;
      
      await storage.saveUserData(updatedUser);
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.detail || 'Failed to update profile';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
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
