import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';

interface AppHeaderProps {
  right?: React.ReactNode;
  showMenu?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ right, showMenu = true }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const handleMenuPress = () => {
    try {
      // Try to open drawer, handle cases where drawer might not be available
      navigation.dispatch(DrawerActions.openDrawer());
    } catch (error) {
      console.warn('Could not open drawer:', error);
      // Fallback: try to navigate to main drawer navigator
      try {
        (navigation as any).getParent()?.dispatch(DrawerActions.openDrawer());
      } catch (fallbackError) {
        console.warn('Drawer navigation not available');
      }
    }
  };
  
  return (
    // Ensure the header background fills the notch area and stays opaque so text isn't clipped
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm, backgroundColor: colors.white }]}>
      <View style={styles.brandRow}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.companyInfo}>
          <Text style={styles.appName}>{t('app-name') || 'VOS WASH'}</Text>
          <Text style={styles.tagline}>({t('app-tagline') || 'Clean Everything'})</Text>
        </View>
      </View>
      <View style={styles.rightContainer}>
        {right}
        {showMenu && (
          <TouchableOpacity 
            onPress={handleMenuPress}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  companyInfo: {
    alignItems: 'stretch',
    justifyContent: 'center',
    minWidth: 80,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: { width: 44, height: 44 },
  appName: { ...typography.body, color: colors.primary, fontWeight: '700', lineHeight: Platform.OS === 'android' ? 26 : 22, textAlign: 'left', fontSize: 22 },
  tagline: { ...typography.caption, color: colors.textSecondary, opacity: 1, lineHeight: 16, textAlign: 'right', fontSize: 12, fontWeight: '600' },
});
