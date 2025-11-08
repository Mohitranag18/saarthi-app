import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@saarthi:authToken';
const REFRESH_TOKEN_KEY = '@saarthi:refreshToken';
const USER_DATA_KEY = '@saarthi:userData';

export const storage = {
  saveTokens: async (token, refreshToken) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      return true;
    } catch (error) {
      console.error('Save tokens error:', error);
      return false;
    }
  },

  getAuthToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  },

  getRefreshToken: async () => {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Get refresh token error:', error);
      return null;
    }
  },

  saveUserData: async (user) => {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Save user data error:', error);
      return false;
    }
  },

  getUserData: async () => {
    try {
      const data = await AsyncStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  },

  clearAll: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      return true;
    } catch (error) {
      console.error('Clear all storage error:', error);
      return false;
    }
  },
};
