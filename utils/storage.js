import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_REPORTS_KEY = '@saarthi:pending_reports';
const USER_PREFERENCES_KEY = '@saarthi:user_preferences';

export const queueReport = async (report) => {
  try {
    const existing = await AsyncStorage.getItem(PENDING_REPORTS_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push({ ...report, timestamp: Date.now() });
    await AsyncStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Queue report error:', error);
    return false;
  }
};

export const getPendingReports = async () => {
  try {
    const data = await AsyncStorage.getItem(PENDING_REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Get pending reports error:', error);
    return [];
  }
};

export const removePendingReport = async (timestamp) => {
  try {
    const queue = await getPendingReports();
    const filtered = queue.filter((r) => r.timestamp !== timestamp);
    await AsyncStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Remove pending report error:', error);
    return false;
  }
};

export const clearPendingReports = async () => {
  try {
    await AsyncStorage.removeItem(PENDING_REPORTS_KEY);
    return true;
  } catch (error) {
    console.error('Clear pending reports error:', error);
    return false;
  }
};

export const saveUserPreferences = async (preferences) => {
  try {
    await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Save preferences error:', error);
    return false;
  }
};

export const getUserPreferences = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Get preferences error:', error);
    return null;
  }
};