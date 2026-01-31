import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress?: () => void; // Optional onPress handler
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onPress = undefined }) => { // Added default for onPress
  const valueString = String(value);
  // Count only digits to decide sizing (ignore ₹ and commas)
  const digitCount = (valueString.match(/\d/g) || []).length;
  const isAbbreviated = /\b(L|Cr|ಲಕ್ಷ|ಕೋಟಿ)\b/.test(valueString);

  // Base sizing; abbreviated values fit in fewer chars, so larger font permissible
  let fontSize = isAbbreviated ? 30 : 28;
  if (digitCount > 7) {
    fontSize = isAbbreviated ? 24 : 20; // Smaller for 7+ non-abbreviated digits
  } else if (digitCount > 5) {
    fontSize = isAbbreviated ? 28 : 24;
  }

  return (
    <TouchableOpacity // Wrap with TouchableOpacity if onPress is provided
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1} // Only show active feedback if clickable
      style={[styles.card, shadows.small, { borderLeftWidth: 4, borderLeftColor: color }]}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
      </View>
      <Text style={[styles.value, { fontSize, color, lineHeight: fontSize + 2 }]} numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    height: 120,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: 'bold',
    minWidth: 0,
  },
});
