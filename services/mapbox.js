
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
