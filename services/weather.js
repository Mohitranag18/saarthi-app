import { weatherAPI } from './api';

export const getWeatherCondition = async (latitude, longitude) => {
  try {
    const weather = await weatherAPI.getCurrent(latitude, longitude);
    return weather;
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
};

export const getWeatherIcon = (condition) => {
  const icons = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Snow: '❄️',
    Thunderstorm: '⛈️',
    Drizzle: '🌦️',
    Mist: '🌫️',
    Fog: '🌫️',
  };
  return icons[condition] || '🌤️';
};

export const shouldAvoidRoute = (weather, problemType) => {
  if (!weather) return false;

  if (weather.condition === 'Rain' && problemType === 'Slippery Surface') {
    return true;
  }

  if (weather.temperature > 35 && problemType === 'No Shade') {
    return true;
  }

  return false;
};