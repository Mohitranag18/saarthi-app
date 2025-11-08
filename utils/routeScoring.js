export const calculateRouteScore = (route, reports, weather) => {
  let score = 100;

  const distancePenalty = Math.min((route.distance / 5) * 10, 20);
  score -= distancePenalty;

  const criticalReports = reports.filter((r) => r.severity === 'Critical');
  const highReports = reports.filter((r) => r.severity === 'High');
  const mediumReports = reports.filter((r) => r.severity === 'Medium');

  score -= criticalReports.length * 15;
  score -= highReports.length * 10;
  score -= mediumReports.length * 5;

  if (weather) {
    if (weather.condition === 'Rain') {
      score -= 5;
    }
    if (weather.temperature > 35) {
      score -= 5;
    }
    if (weather.temperature < 5) {
      score -= 5;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

export const rankRoutes = (routes, reports, weather) => {
  return routes.map((route) => ({
    ...route,
    accessibility_score: calculateRouteScore(route, reports, weather),
  })).sort((a, b) => b.accessibility_score - a.accessibility_score);
};

export const getRouteWarnings = (route, reports, weather) => {
  const warnings = [];

  const criticalReports = reports.filter((r) => r.severity === 'Critical');
  if (criticalReports.length > 0) {
    warnings.push(`${criticalReports.length} critical accessibility issue(s) on route`);
  }

  if (weather?.condition === 'Rain') {
    warnings.push('Rainy conditions - slippery surfaces possible');
  }

  if (weather?.temperature > 35) {
    warnings.push('High temperature - limited shade available');
  }

  return warnings;
};