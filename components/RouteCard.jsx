import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/theme';

export default function RouteCard({ route, onSelect, selected }) {
  const getRouteTypeColor = (type) => {
    switch (type) {
      case 'fastest':
        return theme.colors.secondary;
      case 'safest':
        return theme.colors.success;
      case 'community_verified':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  const getRouteTypeLabel = (type) => {
    switch (type) {
      case 'fastest':
        return 'Fastest Route';
      case 'safest':
        return 'Safest Accessible Route';
      case 'community_verified':
        return 'Community Verified';
      default:
        return 'Route';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.selected,
        { borderLeftColor: getRouteTypeColor(route.type) },
      ]}
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`${getRouteTypeLabel(route.type)}, ${route.distance}, ${route.duration}`}
      accessibilityHint="Double tap to select this route"
    >
      <View style={styles.header}>
        <Text style={styles.typeLabel}>{getRouteTypeLabel(route.type)}</Text>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(route.accessibility_score) }]}>
          <Text style={styles.scoreText}>{route.accessibility_score}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{route.distance}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{route.duration}</Text>
        </View>
      </View>

      {route.hazards_avoided > 0 && (
        <View style={styles.hazardsBadge}>
          <Text style={styles.hazardsText}>
            {route.hazards_avoided} hazard{route.hazards_avoided > 1 ? 's' : ''} avoided
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  selected: {
    backgroundColor: '#2d3139',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  hazardsBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.success + '20',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  hazardsText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
});