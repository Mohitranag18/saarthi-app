
export const getSeverityColor = (severity) => {
  const colors = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#10b981',
  };
  return colors[severity] || '#9ca3af';
};

export const createMarkerAnnotation = (report) => {
  return {
    id: report.id,
    coordinate: [report.longitude, report.latitude],
    title: report.problem_type,
    subtitle: `${report.severity} - ${report.description.substring(0, 50)}`,
    color: getSeverityColor(report.severity),
  };
};

// Google Directions API service for fetching multiple routes
export const directionsAPI = {
  /**
   * Fetch multiple route options from Google Directions API
   * @param {Object} start - Start location {lat, lng}
   * @param {Object} end - End location {lat, lng}
   * @returns {Promise<Array>} Array of route options
   */
  fetchMultipleRoutes: async (start, end) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found. Using mock routes.');
        return directionsAPI.getMockRoutes(start, end);
      }

      const origin = `${start.lat},${start.lng}`;
      const destination = `${end.lat},${end.lng}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&alternatives=true&key=${apiKey}`;
      
      console.log('Fetching routes from Google Directions API...');
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.error('Google Directions API error:', data.status, data.error_message);
        return directionsAPI.getMockRoutes(start, end);
      }
      
      // Convert Google Routes to our format
      const routes = data.routes.map((route, index) => {
        const leg = route.legs[0];
        
        // Decode polyline to coordinates
        const coordinates = decodePolyline(route.overview_polyline.points);
        
        return {
          coordinates: coordinates, // [[lng, lat], ...] format for backend
          distance: leg.distance.value / 1000, // Convert meters to km
          duration: leg.duration.text, // e.g., "12 mins"
          duration_seconds: leg.duration.value,
          summary: route.summary || `Route ${index + 1}`,
          warnings: route.warnings || [],
        };
      });
      
      console.log(`Fetched ${routes.length} routes from Google API`);
      return routes;
      
    } catch (error) {
      console.error('Error fetching routes from Google API:', error);
      return directionsAPI.getMockRoutes(start, end);
    }
  },

  /**
   * Generate mock routes for testing when API is not available
   * @param {Object} start - Start location {lat, lng}
   * @param {Object} end - End location {lat, lng}
   * @returns {Array} Mock route options
   */
  getMockRoutes: (start, end) => {
    console.log('Using mock routes for testing...');
    
    // Calculate base distance
    const distance = Math.sqrt(
      Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2)
    ) * 111; // Rough conversion to km
    
    // Generate realistic curved routes with multiple intermediate points
    const routes = [
      {
        // Route 1: More direct path with slight curve
        coordinates: generateRealisticPath(start, end, 'direct', distance * 1.0),
        distance: distance,
        duration: `${Math.round(distance * 12)} mins`,
        duration_seconds: Math.round(distance * 12 * 60),
        summary: 'Direct Route',
        warnings: [],
      },
      {
        // Route 2: Longer scenic route with curves
        coordinates: generateRealisticPath(start, end, 'scenic', distance * 1.3),
        distance: distance * 1.3,
        duration: `${Math.round(distance * 1.3 * 12)} mins`,
        duration_seconds: Math.round(distance * 1.3 * 12 * 60),
        summary: 'Scenic Route',
        warnings: [],
      },
      {
        // Route 3: Alternative highway-style route
        coordinates: generateRealisticPath(start, end, 'highway', distance * 1.15),
        distance: distance * 1.15,
        duration: `${Math.round(distance * 1.15 * 12)} mins`,
        duration_seconds: Math.round(distance * 1.15 * 12 * 60),
        summary: 'Highway Route',
        warnings: [],
      },
    ];
    
    return routes;
  },
};

/**
 * Decode Google polyline encoded string to coordinates
 * @param {string} encoded - Encoded polyline string
 * @returns {Array} Array of [lng, lat] coordinates
 */
/**
 * Generate realistic curved paths with multiple intermediate points
 * @param {Object} start - Start location {lat, lng}
 * @param {Object} end - End location {lat, lng}
 * @param {string} routeType - Type of route ('direct', 'scenic', 'highway')
 * @param {number} distance - Route distance in km
 * @returns {Array} Array of [lng, lat] coordinates
 */
function generateRealisticPath(start, end, routeType, distance) {
  const coordinates = [];
  const numPoints = Math.max(8, Math.round(distance * 3)); // More points for longer routes
  
  // Add starting point
  coordinates.push([start.lng, start.lat]);
  
  // Generate intermediate points based on route type
  for (let i = 1; i < numPoints - 1; i++) {
    const progress = i / (numPoints - 1);
    const baseLat = start.lat + (end.lat - start.lat) * progress;
    const baseLng = start.lng + (end.lng - start.lng) * progress;
    
    // Add curve based on route type
    let latOffset = 0;
    let lngOffset = 0;
    
    if (routeType === 'direct') {
      // Slight curve for direct route
      latOffset = Math.sin(progress * Math.PI) * 0.002;
      lngOffset = Math.cos(progress * Math.PI * 2) * 0.001;
    } else if (routeType === 'scenic') {
      // More dramatic curves for scenic route
      latOffset = Math.sin(progress * Math.PI * 2) * 0.008;
      lngOffset = Math.cos(progress * Math.PI) * 0.006;
    } else if (routeType === 'highway') {
      // Gentle curves for highway route
      latOffset = Math.sin(progress * Math.PI * 1.5) * 0.003;
      lngOffset = Math.cos(progress * Math.PI * 3) * 0.002;
    }
    
    coordinates.push([baseLng + lngOffset, baseLat + latOffset]);
  }
  
  // Add ending point
  coordinates.push([end.lng, end.lat]);
  
  return coordinates;
}

function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    points.push([lng / 1e5, lat / 1e5]); // [lng, lat] format
  }
  
  return points;
}
