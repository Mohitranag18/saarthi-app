import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    await AsyncStorage.setItem('locationPermission', status);
    return status === 'granted';
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Get location error:', error);
    throw error;
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    return result[0];
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
};

export const geocodeAddress = async (address) => {
  try {
    const result = await Location.geocodeAsync(address);
    return result[0];
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
};