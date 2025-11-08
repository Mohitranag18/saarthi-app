import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const checkLocationPermission = async () => {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
};

export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Location Permission Required',
      'Saarthi needs location access to provide accessible navigation.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  return true;
};

export const checkCameraPermission = async () => {
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  return status === 'granted';
};

export const requestCameraPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Camera Permission Required',
      'Saarthi needs camera access to attach photos to reports.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  return true;
};

export const checkMediaLibraryPermission = async () => {
  const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  return status === 'granted';
};

export const requestMediaLibraryPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Media Library Permission Required',
      'Saarthi needs access to your photo library.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  return true;
};