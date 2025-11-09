import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { createMarkerAnnotation, getSeverityColor } from '../services/mapbox';

// Function to get route colors based on type and selection
const getRouteColor = (routeType, isSelected) => {
  const baseColors = {
    'fastest': '#10b981',      // Green
    'safest': '#3b82f6',       // Blue  
    'community_verified': '#f59e0b', // Orange
    'default': '#3b82f6',      // Blue for default route
  };
  
  // For dynamic route types (route_1, route_2, etc.)
  if (routeType.startsWith('route_')) {
    const routeNumber = parseInt(routeType.split('_')[1]);
    const colors = ['#8b5cf6', '#ec4899', '#f97316']; // Purple, Pink, Orange
    return isSelected ? colors[routeNumber - 1] : colors[routeNumber - 1] + '80'; // Add transparency for unselected
  }
  
  const color = baseColors[routeType] || '#3b82f6'; // Blue fallback
  return isSelected ? color : color + '80'; // Add transparency for unselected routes
};

export default function CustomMapView({
  reports = [],
  userLocation,
  onMapPress,
  selectedCoordinate,
  routeCoordinates = null,
  routes = [], // New prop for multiple routes
  selectedRouteType = null, // New prop for selected route
  style,
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  }, [userLocation]);

  const handleMapPress = (event) => {
    if (onMapPress) {
      const { coordinate } = event.nativeEvent;
      onMapPress({
        longitude: coordinate.longitude,
        latitude: coordinate.latitude,
      });
    }
  };

  const initialRegion = userLocation ? {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        showsCompass={true}
        showsScaleBar={false}
      >
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {selectedCoordinate && (
          <Marker
            coordinate={{
              latitude: selectedCoordinate.latitude,
              longitude: selectedCoordinate.longitude,
            }}
            title="Selected Location"
          >
            <View style={styles.selectedMarker} />
          </Marker>
        )}

        {reports.map((report) => {
          const annotation = createMarkerAnnotation(report);
          return (
            <Marker
              key={annotation.id}
              coordinate={{
                latitude: report.latitude,
                longitude: report.longitude,
              }}
              title={annotation.title}
              description={annotation.subtitle}
            >
              <View
                style={[
                  styles.reportMarker,
                  { backgroundColor: getSeverityColor(report.severity) },
                ]}
              />
            </Marker>
          );
        })}

        {/* Render multiple routes with different colors */}
        {routes && routes.length > 0 && routes.map((route) => {
          const isSelected = route.type === selectedRouteType;
          const routeColor = getRouteColor(route.type, isSelected);
          const strokeWidth = isSelected ? 6 : 4;
          
          return (
            <Polyline
              key={route.type}
              coordinates={route.coordinates.map(coord => ({
                latitude: coord[1],
                longitude: coord[0],
              }))}
              strokeColor={routeColor}
              strokeWidth={strokeWidth}
              lineCap="round"
              lineJoin="round"
              zIndex={isSelected ? 2 : 1}
            />
          );
        })}

        {/* Fallback for single route (backward compatibility) */}
        {routeCoordinates && routeCoordinates.length > 0 && (!routes || routes.length === 0) && (
          <Polyline
            coordinates={routeCoordinates.map(coord => ({
              latitude: coord[1],
              longitude: coord[0],
            }))}
            strokeColor="#f59e0b"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  selectedMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  reportMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
