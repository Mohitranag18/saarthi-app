import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { theme } from '../constants/theme';
import { requestCameraPermission, requestMediaLibraryPermission } from '../utils/permissions';

const PROBLEM_TYPES = [
  'Broken Ramp',
  'Steep Slope',
  'Slippery Surface',
  'No Sidewalk',
  'Narrow Path',
  'Poor Lighting',
  'Blocked Path',
  'Missing Tactile Paving',
  'Other',
];

const DISABILITY_TYPES = [
  'Wheelchair',
  'Visual Impairment',
  'Hearing Impairment',
  'Mobility Issues',
  'Cognitive Disabilities',
];

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export default function ReportForm({ onSubmit, initialLocation }) {
  const [problemType, setProblemType] = useState('');
  const [disabilityTypes, setDisabilityTypes] = useState([]);
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleDisabilityType = (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisabilityTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleChoosePhoto = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSubmit = async () => {
    if (!problemType) {
      Alert.alert('Required Field', 'Please select a problem type');
      return;
    }

    if (disabilityTypes.length === 0) {
      Alert.alert('Required Field', 'Please select at least one disability type affected');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Required Field', 'Please provide a description');
      return;
    }

    if (description.length > 200) {
      Alert.alert('Description Too Long', 'Please limit description to 200 characters');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onSubmit({
        problemType,
        disabilityTypes,
        severity,
        description,
        photo: photo?.uri || null,
        location: initialLocation,
      });

      setProblemType('');
      setDisabilityTypes([]);
      setSeverity('Medium');
      setDescription('');
      setPhoto(null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.label}>Problem Type *</Text>
        <View style={styles.optionsGrid}>
          {PROBLEM_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.optionButton, problemType === type && styles.optionButtonSelected]}
              onPress={() => {
                setProblemType(type);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: problemType === type }}
            >
              <Text
                style={[styles.optionText, problemType === type && styles.optionTextSelected]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Disability Types Affected *</Text>
        <View style={styles.optionsGrid}>
          {DISABILITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                disabilityTypes.includes(type) && styles.optionButtonSelected,
              ]}
              onPress={() => toggleDisabilityType(type)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: disabilityTypes.includes(type) }}
            >
              <Text
                style={[
                  styles.optionText,
                  disabilityTypes.includes(type) && styles.optionTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Severity *</Text>
        <View style={styles.severityContainer}>
          {SEVERITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.severityButton, severity === level && styles[`severity${level}`]]}
              onPress={() => {
                setSeverity(level);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: severity === level }}
            >
              <Text style={[styles.severityText, severity === level && styles.severityTextSelected]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description * (max 200 characters)</Text>
        <TextInput
          style={styles.textInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the accessibility issue..."
          placeholderTextColor={theme.colors.text.secondary}
          multiline
          maxLength={200}
          accessibilityLabel="Description input"
        />
        <Text style={styles.charCount}>{description.length}/200</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Photo (Optional)</Text>
        {photo ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setPhoto(null)}
              accessibilityLabel="Remove photo"
            >
              <Text style={styles.removePhotoText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
              accessibilityLabel="Take photo with camera"
            >
              <Text style={styles.photoButtonText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleChoosePhoto}
              accessibilityLabel="Choose photo from gallery"
            >
              <Text style={styles.photoButtonText}>🖼️ Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Submit report"
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '40',
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '40',
  },
  severityLow: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  severityMedium: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  severityHigh: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  severityCritical: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  severityText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  severityTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.text.primary,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '40',
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: 4,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  photoButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});