import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationPicker from '../../components/LocationPicker';
import CustomMapView from '../../components/MapView';
import { theme } from '../../constants/theme';
import { directionsAPI } from '../../services/mapbox';
import { getCurrentLocation } from '../../services/location';
import { getUserPreferences, saveUserPreferences } from '../../utils/storage';

const DISABILITY_PROFILES = [
  { id: 'wheelchair', label: 'Wheelchair User', icon: '♿' },
  { id: 'visual', label: 'Visual Impairment', icon: '👁️' },
  { id: 'hearing', label: 'Hearing Impairment', icon: '👂' },
  { id: 'mobility', label: 'Mobility Issues', icon: '🦯' },
];

export default function HomeScreen() {
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [disabilityProfile, setDisabilityProfile] = useState('wheelchair');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routePreference, setRoutePreference] = useState('fastest'); // 'fastest' or 'safest'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeLocation();
    loadUserPreferences();
  }, []);

  const initializeLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const loadUserPreferences = async () => {
    const preferences = await getUserPreferences();
    if (preferences?.disabilityProfile) {
      setDisabilityProfile(preferences.disabilityProfile);
    }
  };

  const handleDisabilityProfileChange = (profileId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisabilityProfile(profileId);
    // Save preference for future use
    saveUserPreferences({ disabilityProfile: profileId });
  };

  const handleCalculateRoute = async () => {
    if (!startLocation || !endLocation) {
      Alert.alert('Missing Information', 'Please select both start and end locations');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Fetch multiple routes from mapping service
      console.log('Fetching routes from mapping service...');
      const fetchedRoutes = await directionsAPI.fetchMultipleRoutes(
        { lat: startLocation.latitude, lng: startLocation.longitude },
        { lat: endLocation.latitude, lng: endLocation.longitude }
      );

      console.log(`Fetched ${fetchedRoutes.length} routes from mapping service`);

      // Format routes with proper types
      const formattedRoutes = fetchedRoutes.map((route, index) => ({
        ...route,
        type: index === 0 ? 'fastest' : 'safest',
        coordinates: route.coordinates,
        distance: route.distance,
        duration: route.duration,
        summary: route.summary || `Route ${index + 1}`,
      }));

      setRoutes(formattedRoutes);
      
      // Select fastest route by default
      setSelectedRoute(formattedRoutes[0]);
      setRoutePreference('fastest');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Route calculation error:', error);
      Alert.alert('Error', 'Failed to calculate route. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoutePreferenceChange = (preference) => {
    if (routes.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (preference === 'fastest') {
      setSelectedRoute(routes[0]); // First route is fastest
    } else {
      // Select any other route for "safest" (second route if available, otherwise first)
      setSelectedRoute(routes.length > 1 ? routes[1] : routes[0]);
    }
    
    setRoutePreference(preference);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Planning</Text>
        <Text style={styles.subtitle}>Find the best route for your journey</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disability Profile</Text>
          <View style={styles.profileGrid}>
            {DISABILITY_PROFILES.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileButton,
                  disabilityProfile === profile.id && styles.profileButtonSelected,
                ]}
                onPress={() => handleDisabilityProfileChange(profile.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: disabilityProfile === profile.id }}
              >
                <Text style={styles.profileIcon}>{profile.icon}</Text>
                <Text
                  style={[
                    styles.profileLabel,
                    disabilityProfile === profile.id && styles.profileLabelSelected,
                  ]}
                >
                  {profile.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Starting Point</Text>
          <LocationPicker
            onLocationSelect={setStartLocation}
            placeholder="Enter starting location"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination</Text>
          <LocationPicker
            onLocationSelect={setEndLocation}
            placeholder="Enter destination"
          />
        </View>

        <TouchableOpacity
          style={[styles.calculateButton, loading && styles.calculateButtonDisabled]}
          onPress={handleCalculateRoute}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Get route"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.calculateButtonText}>Get Route</Text>
          )}
        </TouchableOpacity>

        {routes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Preference</Text>
            <View style={styles.preferenceToggle}>
              <TouchableOpacity
                style={[
                  styles.preferenceButton,
                  routePreference === 'fastest' && styles.preferenceButtonSelected,
                ]}
                onPress={() => handleRoutePreferenceChange('fastest')}
              >
                <Text style={[
                  styles.preferenceButtonText,
                  routePreference === 'fastest' && styles.preferenceButtonTextSelected,
                ]}>
                  🚀 Fastest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.preferenceButton,
                  routePreference === 'safest' && styles.preferenceButtonSelected,
                ]}
                onPress={() => handleRoutePreferenceChange('safest')}
              >
                <Text style={[
                  styles.preferenceButtonText,
                  routePreference === 'safest' && styles.preferenceButtonTextSelected,
                ]}>
                  🛡️ Safest
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {selectedRoute && startLocation && endLocation && (
        <View style={styles.mapPreview}>
          <CustomMapView
            userLocation={userLocation}
            routes={[selectedRoute]}
            selectedRouteType={selectedRoute.type}
            style={{ height: 300 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  profileButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileButtonSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  profileIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  profileLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  preferenceToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  preferenceButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  preferenceButtonSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  preferenceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  preferenceButtonTextSelected: {
    color: theme.colors.primary,
  },
  mapPreview: {
    height: 300,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
});
