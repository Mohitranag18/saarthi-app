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
import RouteCard from '../../components/RouteCard';
import { theme } from '../../constants/theme';
import { routeAPI } from '../../services/api';
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
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);

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

  const handleCalculateRoutes = async () => {
    if (!startLocation || !endLocation) {
      Alert.alert('Missing Information', 'Please select both start and end locations');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await routeAPI.calculate({
        start: { lat: startLocation.latitude, lon: startLocation.longitude },
        end: { lat: endLocation.latitude, lon: endLocation.longitude },
        user_disability: disabilityProfile,
      });

      setRoutes(response.routes);
      setWeather(response.weather);
      setSelectedRoute(response.routes.find((r) => r.type === 'safest'));
      
      await saveUserPreferences({ disabilityProfile });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Route calculation error:', error);
      Alert.alert('Error', 'Failed to calculate routes. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRoute(route);
  };

  const handleDisabilityProfileChange = (profileId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisabilityProfile(profileId);
    setRoutes([]);
    setSelectedRoute(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Route Planning</Text>
        <Text style={styles.subtitle}>Find accessible paths tailored for you</Text>
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
          onPress={handleCalculateRoutes}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Calculate routes"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Routes</Text>
          )}
        </TouchableOpacity>

        {weather && (
          <View style={styles.weatherCard}>
            <Text style={styles.weatherText}>
              🌤️ {weather.condition} • {weather.temperature}°C
            </Text>
          </View>
        )}

        {routes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Routes</Text>
            {routes.map((route) => (
              <RouteCard
                key={route.type}
                route={route}
                selected={selectedRoute?.type === route.type}
                onSelect={() => handleRouteSelect(route)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {selectedRoute && startLocation && endLocation && (
        <View style={styles.mapPreview}>
          <CustomMapView
            userLocation={userLocation}
            routeCoordinates={selectedRoute.coordinates}
            style={{ height: 200 }}
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
  weatherCard: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  weatherText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  mapPreview: {
    height: 200,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
});
