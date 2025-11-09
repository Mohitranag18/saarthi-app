import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, Modal } from 'react-native';
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
  startLocation = null,
  endLocation = null,
  style,
}) {
  const mapRef = useRef(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Zoom to current navigation step when it changes
  useEffect(() => {
    if (isNavigating && navigationSteps.length > 0 && currentStepIndex >= 0) {
      const currentStep = navigationSteps[currentStepIndex];
      if (currentStep && currentStep.coordinate && mapRef.current) {
        // Zoom to current step with close view
        mapRef.current.animateToRegion({
          latitude: currentStep.coordinate.latitude,
          longitude: currentStep.coordinate.longitude,
          latitudeDelta: 0.008, // Even closer zoom for better visibility
          longitudeDelta: 0.008, // Even closer zoom for better visibility
        }, 1000);
      }
    }
  }, [currentStepIndex, isNavigating, navigationSteps]);

  const handleMapPress = (event) => {
    if (onMapPress) {
      const { coordinate } = event.nativeEvent;
      onMapPress({
        longitude: coordinate.longitude,
        latitude: coordinate.latitude,
      });
    }
  };

  // Generate navigation steps from route coordinates
  const generateNavigationSteps = (coordinates) => {
    if (!coordinates || coordinates.length < 2) return [];
    
    const steps = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [startLng, startLat] = coordinates[i];
      const [endLng, endLat] = coordinates[i + 1];
      
      const distance = calculateDistance(
        { latitude: startLat, longitude: startLng },
        { latitude: endLat, longitude: endLng }
      );
      
      const bearing = calculateBearing(
        { latitude: startLat, longitude: startLng },
        { latitude: endLat, longitude: endLng }
      );
      
      const direction = getDirection(bearing);
      
      steps.push({
        instruction: `${direction} for ${Math.round(distance * 1000)}m`,
        distance: distance,
        coordinate: { latitude: endLat, longitude: endLng },
        direction
      });
    }
    
    return steps;
  };

  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateBearing = (point1, point2) => {
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(point2.latitude * Math.PI / 180);
    const x = Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) -
              Math.sin(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  const getDirection = (bearing) => {
    const directions = ['North', 'North East', 'East', 'South East', 'South', 'South West', 'West', 'North West'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  const startNavigation = () => {
    const selectedRoute = routes.find(route => route.type === selectedRouteType);
    if (!selectedRoute) {
      Alert.alert('No Route', 'Please select a route first');
      return;
    }

    const steps = generateNavigationSteps(selectedRoute.coordinates);
    setNavigationSteps(steps);
    setCurrentStepIndex(0);
    setIsNavigating(true);
    
    // Zoom to first navigation point for closer view
    if (mapRef.current && selectedRoute.coordinates.length > 0) {
      // Get the first navigation point (or first coordinate if no navigation steps)
      let firstPoint;
      if (steps.length > 0) {
        firstPoint = steps[0].coordinate;
      } else if (selectedRoute.coordinates.length > 0) {
        const [firstLng, firstLat] = selectedRoute.coordinates[0];
        firstPoint = { latitude: firstLat, longitude: firstLng };
      }
      
      if (firstPoint) {
        // Zoom in closer to the first point with smaller delta for better visibility
        mapRef.current.animateToRegion({
          latitude: firstPoint.latitude,
          longitude: firstPoint.longitude,
          latitudeDelta: 0.01, // Much closer zoom
          longitudeDelta: 0.01, // Much closer zoom
        }, 1000);
      }
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
    setNavigationSteps([]);
    
    // Reset map view
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < navigationSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
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

        {endLocation && (
          <Marker
            coordinate={{
              latitude: endLocation.latitude,
              longitude: endLocation.longitude,
            }}
            title="Destination"
            pinColor="#ef4444"
          />
        )}

        {/* Navigation step markers */}
        {isNavigating && navigationSteps.map((step, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: step.coordinate.latitude,
              longitude: step.coordinate.longitude,
            }}
            title={step.instruction}
          >
            <View style={[
              styles.navigationMarker,
              index === currentStepIndex && styles.currentStepMarker
            ]}>
              <Text style={[
                styles.navigationMarkerText,
                index === currentStepIndex && styles.currentStepMarkerText
              ]}>
                {index + 1}
              </Text>
            </View>
          </Marker>
        ))}

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

      {/* Fullscreen Button */}
      <TouchableOpacity style={styles.fullscreenButton} onPress={() => setIsFullscreen(true)}>
        <Text style={styles.fullscreenButtonText}>⛶ Fullscreen</Text>
      </TouchableOpacity>

      {/* Navigation Controls */}
      {routes && routes.length > 0 && (
        <View style={styles.navigationControls}>
          {!isNavigating ? (
            <TouchableOpacity style={styles.startNavigationButton} onPress={startNavigation}>
              <Text style={styles.startNavigationText}>🧭 Start Navigation</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navigationPanel}>
              <View style={styles.currentStepInfo}>
                <Text style={styles.stepNumber}>
                  Step {currentStepIndex + 1} of {navigationSteps.length}
                </Text>
                <Text style={styles.stepInstruction}>
                  {navigationSteps[currentStepIndex]?.instruction || 'Navigation started'}
                </Text>
              </View>
              
              <View style={styles.navigationButtons}>
                <TouchableOpacity 
                  style={[styles.navButton, styles.previousButton]} 
                  onPress={previousStep}
                  disabled={currentStepIndex === 0}
                >
                  <Text style={styles.navButtonText}>← Previous</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.navButton, styles.nextButton]} 
                  onPress={nextStep}
                  disabled={currentStepIndex === navigationSteps.length - 1}
                >
                  <Text style={styles.navButtonText}>Next →</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.navButton, styles.stopButton]} onPress={stopNavigation}>
                  <Text style={styles.navButtonText}>⏹ Stop</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenContainer}>
          <MapView
            ref={mapRef}
            style={styles.fullscreenMap}
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

            {endLocation && (
              <Marker
                coordinate={{
                  latitude: endLocation.latitude,
                  longitude: endLocation.longitude,
                }}
                title="Destination"
                pinColor="#ef4444"
              />
            )}

            {/* Navigation step markers */}
            {isNavigating && navigationSteps.map((step, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: step.coordinate.latitude,
                  longitude: step.coordinate.longitude,
                }}
                title={step.instruction}
              >
                <View style={[
                  styles.navigationMarker,
                  index === currentStepIndex && styles.currentStepMarker
                ]}>
                  <Text style={[
                    styles.navigationMarkerText,
                    index === currentStepIndex && styles.currentStepMarkerText
                  ]}>
                    {index + 1}
                  </Text>
                </View>
              </Marker>
            ))}

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

          {/* Fullscreen Navigation Controls */}
          {routes && routes.length > 0 && (
            <View style={styles.fullscreenNavigationControls}>
              {!isNavigating ? (
                <TouchableOpacity style={styles.startNavigationButton} onPress={startNavigation}>
                  <Text style={styles.startNavigationText}>🧭 Start Navigation</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.navigationPanel}>
                  <View style={styles.currentStepInfo}>
                    <Text style={styles.stepNumber}>
                      Step {currentStepIndex + 1} of {navigationSteps.length}
                    </Text>
                    <Text style={styles.stepInstruction}>
                      {navigationSteps[currentStepIndex]?.instruction || 'Navigation started'}
                    </Text>
                  </View>
                  
                  <View style={styles.navigationButtons}>
                    <TouchableOpacity 
                      style={[styles.navButton, styles.previousButton]} 
                      onPress={previousStep}
                      disabled={currentStepIndex === 0}
                    >
                      <Text style={styles.navButtonText}>← Previous</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.navButton, styles.nextButton]} 
                      onPress={nextStep}
                      disabled={currentStepIndex === navigationSteps.length - 1}
                    >
                      <Text style={styles.navButtonText}>Next →</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.navButton, styles.stopButton]} onPress={stopNavigation}>
                      <Text style={styles.navButtonText}>⏹ Stop</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.exitFullscreenButton} 
                onPress={() => setIsFullscreen(false)}
              >
                <Text style={styles.exitFullscreenText}>✕ Exit Fullscreen</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
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
  // Navigation styles
  navigationMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStepMarker: {
    backgroundColor: '#ef4444',
    transform: [{ scale: 1.2 }],
  },
  navigationMarkerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentStepMarkerText: {
    fontSize: 14,
  },
  navigationControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  startNavigationButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  startNavigationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationPanel: {
    gap: 12,
  },
  currentStepInfo: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  previousButton: {
    backgroundColor: '#6b7280',
  },
  nextButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  // Fullscreen styles
  fullscreenButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fullscreenButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenMap: {
    flex: 1,
  },
  fullscreenNavigationControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  exitFullscreenButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  exitFullscreenText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
