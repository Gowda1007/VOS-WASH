import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal as RNModal, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

// Button Component - matching web Common.tsx
interface ButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: any;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  onPress, 
  children, 
  variant = 'primary', 
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary };
      case 'secondary':
        return { backgroundColor: colors.borderLight };
      case 'danger':
        return { backgroundColor: colors.error };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextColor = () => {
    return variant === 'secondary' ? colors.text : colors.white;
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getVariantStyle(),
        disabled && styles.buttonDisabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <>
          <ActivityIndicator color={getTextColor()} style={styles.spinnerMargin} />
          <Text style={[styles.buttonText, { color: getTextColor() }, textStyle]}>{children}</Text>
        </>
      ) : (
        <>
          {icon ? <View style={styles.buttonIcon}>{icon}</View> : null}
          <Text style={[styles.buttonText, { color: getTextColor() }, textStyle]}>{children}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// Input Component - matching web form inputs
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  error?: string;
  style?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  error,
  style,
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
        ]}
      />
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
};

// Badge Component - matching web status badges
interface BadgeProps {
  children: React.ReactNode;
  color: 'green' | 'red' | 'amber' | 'blue' | 'slate';
}

export const Badge: React.FC<BadgeProps> = ({ children, color }) => {
  const getBadgeColor = () => {
    switch (color) {
      case 'green': return { bg: '#dcfce7', text: '#166534' };
      case 'red': return { bg: '#fee2e2', text: '#991b1b' };
      case 'amber': return { bg: '#fef3c7', text: '#92400e' };
      case 'blue': return { bg: '#dbeafe', text: '#1e40af' };
      case 'slate': return { bg: '#f1f5f9', text: '#475569' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  const badgeColors = getBadgeColor();

  return (
    <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
      <Text style={[styles.badgeText, { color: badgeColors.text }]}>{children}</Text>
    </View>
  );
};

// EmptyState Component - matching web empty states
interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <MaterialIcons name={icon as any} size={32} color={colors.textLight} />
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateMessage}>{message}</Text>
    </View>
  );
};

// Modal Component - matching web modal
interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  fullScreen?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ visible, onClose, title, children, footer, fullScreen = false }) => {
  const isFullScreen = !title || fullScreen; // Full screen when no title provided or fullScreen=true
  
  return (
    <RNModal
      visible={visible}
      transparent={!isFullScreen}
      animationType="fade"
      onRequestClose={onClose}
    >
      {isFullScreen ? (
        // Full screen mode for invoice preview
        <View style={styles.modalFullScreen}>
          {children}
        </View>
      ) : (
        // Regular modal mode
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {children}
            </ScrollView>
            {footer && (
              <View style={styles.modalFooter}>
                {footer}
              </View>
            )}
          </View>
        </View>
      )}
    </RNModal>
  );
};

// Card Component - matching web card container
interface CardProps {
  children: React.ReactNode;
  style?: any;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Button styles
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
  },

  // Input styles
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  inputErrorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Badge styles
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // EmptyState styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyStateMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalFullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxHeight: '80%',
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalClose: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },

  // Card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Button icon spacing
  buttonIcon: {
    marginRight: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerMargin: {
    marginRight: spacing.xs,
  }
});

// Re-export InvoicePreviewScreen
export { InvoicePreviewScreen } from './InvoicePreviewScreen';
