import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomMapView from '../../components/MapView';
import ReportForm from '../../components/ReportForm';
import { theme } from '../../constants/theme';
import { reportAPI } from '../../services/api';
import { getCurrentLocation } from '../../services/location';
import { getPendingReports, queueReport, removePendingReport } from '../../utils/storage';

export default function ReportScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    initializeScreen();
    checkNetworkStatus();
  }, []);

  const initializeScreen = async () => {
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setSelectedLocation(location);
      await loadReports();
      await loadPendingReports();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  const checkNetworkStatus = async () => {
    const networkState = await Network.getNetworkStateAsync();
    setIsOnline(networkState.isConnected);
  };

  const loadReports = async () => {
  setLoading(true);
  try {
    const data = await reportAPI.getAll();

    // 🔧 Convert string lat/lng to numbers safely
    const parsedData = data.map((item) => ({
      ...item,
      latitude: item.latitude ? parseFloat(item.latitude) : null,
      longitude: item.longitude ? parseFloat(item.longitude) : null,
    }));

    setReports(parsedData);
  } catch (error) {
    console.error('Load reports error:', error);
  } finally {
    setLoading(false);
  }
};


  const loadPendingReports = async () => {
    const pending = await getPendingReports();
    setPendingCount(pending.length);
  };

  const syncPendingReports = async () => {
    const pending = await getPendingReports();
    if (pending.length === 0) return;

    let synced = 0;
    for (const report of pending) {
      try {
        await reportAPI.create({
          latitude: report.location.latitude,
          longitude: report.location.longitude,
          problem_type: report.problemType,
          disability_types: report.disabilityTypes,
          severity: report.severity,
          description: report.description,
          photo: report.photo, // Use photo instead of photo_url for API
        });
        
        await removePendingReport(report.timestamp);
        synced++;
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    if (synced > 0) {
      Alert.alert('Success', `${synced} pending report(s) synced`);
      await loadReports();
      await loadPendingReports();
    }
  };

  const handleMapPress = (coordinate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLocation(coordinate);
  };

  const handleSubmitReport = async (reportData) => {
    const networkState = await Network.getNetworkStateAsync();
    
    if (!networkState.isConnected) {
      await queueReport(reportData);
      Alert.alert(
        'Saved Offline',
        'Your report will be submitted when you reconnect to the internet.'
      );
      setShowForm(false);
      await loadPendingReports();
      return;
    }

    try {
      await reportAPI.create({
        latitude: Number(reportData.location.latitude.toFixed(8)),  // Round to 6 decimals
        longitude: Number(reportData.location.longitude.toFixed(8)),
        problem_type: reportData.problemType,
        disability_types: reportData.disabilityTypes,
        severity: reportData.severity,
        description: reportData.description,
        photo: reportData.photo || undefined, // Send undefined instead of null
      });

      Alert.alert('Success', 'Report submitted successfully');
      setShowForm(false);
      await loadReports();
    } catch (error) {
      console.error('Submit error:', error);
      await queueReport(reportData);
      Alert.alert(
        'Saved Offline',
        'Unable to submit now. Report saved and will be synced later.'
      );
      await loadPendingReports();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Report Accessibility</Text>
          <Text style={styles.subtitle}>Help improve navigation for everyone</Text>
        </View>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      {!showForm ? (
        <>
          <View style={styles.mapContainer}>
            <CustomMapView
              reports={reports}
              userLocation={userLocation}
              selectedCoordinate={selectedLocation}
              onMapPress={handleMapPress}
            />
            <View style={styles.mapOverlay}>
              <Text style={styles.mapHint}>Tap on map to select location</Text>
            </View>
          </View>

          <View style={styles.controls}>
            {pendingCount > 0 && (
              <TouchableOpacity
                style={styles.syncButton}
                onPress={syncPendingReports}
                accessibilityLabel="Sync pending reports"
              >
                <Text style={styles.syncButtonText}>
                  📤 Sync {pendingCount} Pending Report{pendingCount > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => setShowForm(true)}
              accessibilityRole="button"
              accessibilityLabel="Create new report"
            >
              <Text style={styles.reportButtonText}>Create Report</Text>
            </TouchableOpacity>

            <View style={styles.legend}>
              <Text style={styles.legendTitle}>Severity Legend</Text>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>Critical</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#f97316' }]} />
                  <Text style={styles.legendText}>High</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.legendText}>Medium</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.legendText}>Low</Text>
                </View>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowForm(false)}
              accessibilityLabel="Go back"
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.formTitle}>New Report</Text>
          </View>
          <ReportForm
            onSubmit={handleSubmitReport}
            initialLocation={selectedLocation}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  offlineBadge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.surface + 'E6',
    padding: 12,
    borderRadius: 8,
  },
  mapHint: {
    fontSize: 14,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  controls: {
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  syncButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  reportButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  legend: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
    },
  legendText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  formContainer: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
