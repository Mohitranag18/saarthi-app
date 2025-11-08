import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

/**
 * Card - Dark themed card container
 */
export const Card = ({ children, className = '' }) => {
  return (
    <View className={`bg-[#1E293B] rounded-2xl p-6 ${className}`}>
      {children}
    </View>
  );
};

/**
 * Button - Yellow accent button
 */
export const Button = ({ 
  onPress, 
  children, 
  variant = 'primary',
  icon,
  disabled = false,
  className = '' 
}) => {
  const variants = {
    primary: 'bg-[#FCD34D]',
    secondary: 'bg-[#1E293B] border-2 border-[#FCD34D]',
    danger: 'bg-[#DC2626]',
  };

  const textVariants = {
    primary: 'text-[#0F172A]',
    secondary: 'text-[#FCD34D]',
    danger: 'text-white',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${variants[variant]} py-4 px-6 rounded-xl flex-row items-center justify-center ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={20} 
          color={variant === 'primary' ? '#0F172A' : '#FCD34D'} 
          style={{ marginRight: 8 }}
        />
      )}
      <Text className={`${textVariants[variant]} font-semibold text-base`}>
        {children}
      </Text>
    </Pressable>
  );
};

/**
 * Input - Dark themed input field
 */
export const Input = ({ 
  placeholder, 
  value, 
  onChangeText,
  icon,
  className = '',
  ...props 
}) => {
  return (
    <View className={`bg-[#334155] rounded-xl px-4 py-3 flex-row items-center ${className}`}>
      {icon && (
        <Ionicons name={icon} size={20} color="#94A3B8" style={{ marginRight: 8 }} />
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-white text-base"
        {...props}
      />
    </View>
  );
};

/**
 * RouteOption - Selectable route option with icon
 */
export const RouteOption = ({ 
  icon, 
  label, 
  selected = false, 
  onPress 
}) => {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center py-3 px-4 rounded-lg ${selected ? 'bg-[#FCD34D]/20' : ''}`}
    >
      <View className={`w-8 h-8 rounded-full ${selected ? 'bg-[#FCD34D]' : 'bg-[#334155]'} items-center justify-center mr-3`}>
        <Ionicons 
          name={icon} 
          size={18} 
          color={selected ? '#0F172A' : '#64748B'} 
        />
      </View>
      <Text className={`flex-1 ${selected ? 'text-[#FCD34D]' : 'text-[#94A3B8]'} text-base`}>
        {label}
      </Text>
      {selected && (
        <Ionicons name="checkmark-circle" size={24} color="#FCD34D" />
      )}
    </Pressable>
  );
};

/**
 * EmergencyButton - Large red emergency button
 */
export const EmergencyButton = ({ onPress, disabled = false }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="w-48 h-48 bg-[#DC2626] rounded-full items-center justify-center shadow-lg"
    >
      <Text className="text-white text-4xl font-bold">HELP</Text>
    </Pressable>
  );
};

/**
 * StatusBadge - Shows status with icon
 */
export const StatusBadge = ({ icon, text, color = '#10B981' }) => {
  return (
    <View className="flex-row items-center bg-[#1E293B] px-4 py-2 rounded-lg">
      <Ionicons name={icon} size={16} color={color} />
      <Text className="text-white ml-2 text-sm">{text}</Text>
    </View>
  );
};

/**
 * CircularProgress - Proximity indicator (5m, 10m, 20m)
 */
export const CircularProgress = ({ value, maxValue, label }) => {
  const percentage = (value / maxValue) * 100;
  
  return (
    <View className="items-center">
      <View className="w-24 h-24 rounded-full border-4 border-[#FCD34D] items-center justify-center">
        <Text className="text-[#FCD34D] text-2xl font-bold">{value}m</Text>
      </View>
      {label && (
        <Text className="text-[#94A3B8] text-sm mt-2">{label}</Text>
      )}
    </View>
  );
};