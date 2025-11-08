import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { theme } from '../constants/theme';
import { geocodeAddress, getCurrentLocation } from '../services/location';

export default function LocationPicker({ onLocationSelect, placeholder }) {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const location = await getCurrentLocation();
      onLocationSelect({
        latitude: location.latitude,
        longitude: location.longitude,
        address: 'Current Location',
      });
      setSearchText('Current Location');
      setSuggestions([]);
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text) => {
    setSearchText(text);
    
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const result = await geocodeAddress(text);
      if (result) {
        setSuggestions([
          {
            id: '1',
            address: text,
            latitude: result.latitude,
            longitude: result.longitude,
          },
        ]);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchText(item.address);
    onLocationSelect(item);
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={handleSearch}
          placeholder={placeholder || 'Enter location'}
          placeholderTextColor={theme.colors.text.secondary}
          accessibilityLabel="Location search input"
        />
        {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
      </View>

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
        accessibilityLabel="Use current location"
      >
        <Text style={styles.currentLocationText}>📍 Use Current Location</Text>
      </TouchableOpacity>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsList}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(item)}
              accessibilityLabel={`Select ${item.address}`}
            >
              <Text style={styles.suggestionText}>{item.address}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '40',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: theme.colors.text.primary,
    fontSize: 14,
  },
  currentLocationButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  currentLocationText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  suggestionsList: {
    marginTop: 8,
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 4,
  },
  suggestionText: {
    color: theme.colors.text.primary,
    fontSize: 14,
  },
});
