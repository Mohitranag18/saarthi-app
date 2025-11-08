import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

/**
 * IconBadge - Displays Audio/Visual/Haptic indicators
 */
export const IconBadge = ({ type, active = true }) => {
  const badges = {
    audio: { icon: 'volume-high', label: 'Audio' },
    visual: { icon: 'eye', label: 'Visual' },
    haptic: { icon: 'hand-left', label: 'Haptic' },
  };

  const badge = badges[type];
  if (!badge) return null;

  return (
    <View className={`flex-row items-center px-2 py-1 rounded-lg ${active ? 'bg-primary-card' : 'bg-gray-700/50'}`}>
      <Ionicons 
        name={badge.icon} 
        size={14} 
        color={active ? '#FCD34D' : '#64748B'} 
      />
      <Text className={`ml-1 text-xs ${active ? 'text-primary-text' : 'text-gray-500'}`}>
        {badge.label}
      </Text>
    </View>
  );
};

/**
 * AccessibilityBar - Top bar with audio/visual/haptic indicators
 */
export const AccessibilityBar = ({ audio = true, visual = true, haptic = true }) => {
  return (
    <View className="flex-row items-center gap-2 mb-4">
      <IconBadge type="audio" active={audio} />
      <IconBadge type="visual" active={visual} />
      <IconBadge type="haptic" active={haptic} />
    </View>
  );
};