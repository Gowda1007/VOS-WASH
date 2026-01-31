import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, GestureResponderEvent, AccessibilityRole, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, spacing, typography, shadows } from '../styles/theme';

interface FABProps {
  label?: string;
  accessibilityLabel?: string;
  color?: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  showLabel?: boolean; // when true, show small text next to icon
  style?: any;
  loading?: boolean; // New prop
  disabled?: boolean; // New prop
}

export const FloatingActionButton: React.FC<FABProps> = ({ label, accessibilityLabel, color, onPress, variant = 'primary', icon, showLabel = false, style, loading = false, disabled = false }) => {
  const backgroundColor = color || (variant === 'primary' ? colors.primary : colors.success);
  const isDisabled = disabled || loading;
  const opacityStyle = isDisabled ? { opacity: 0.7 } : {};

  return (
    <Animated.View style={[styles.wrapper, style]}>
      <TouchableOpacity
        accessibilityRole={'button' as AccessibilityRole}
        accessibilityLabel={accessibilityLabel || label}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.fab, { backgroundColor }, opacityStyle]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            {icon && <View style={[styles.icon, showLabel ? styles.iconWithLabel : null]}>{icon}</View>}
            {showLabel && label ? <Text style={styles.label}>{label}</Text> : null}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: { },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 0,
    ...shadows.medium,
  },
  icon: { alignItems: 'center', justifyContent: 'center' },
  iconWithLabel: { marginRight: spacing.xs },
  label: { ...typography.bodySmall, color: colors.white, fontWeight: '600', paddingHorizontal: spacing.sm },
});

export default FloatingActionButton;