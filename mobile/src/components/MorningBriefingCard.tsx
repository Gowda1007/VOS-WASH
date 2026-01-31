import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrencyShortIndian } from '../core/utils/invoiceUtils';

interface MorningBriefingProps {
  todayRevenue: number;
  avgLast7Days: number;
  achievedTarget: boolean;
  unpaidCount: number;
}

export const MorningBriefingCard: React.FC<MorningBriefingProps> = ({ 
  todayRevenue, 
  avgLast7Days, 
  achievedTarget,
  unpaidCount
}) => {
  const { t } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="wb-sunny" size={24} color={colors.warning} />
        <Text style={styles.title}>{t('morning-briefing', 'Business Health')}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.greeting}>
          {achievedTarget 
            ? t('target-hit-msg', '🚀 You are beating the weekly average!')
            : t('target-miss-msg', '📉 Revenue is slightly below average today.')}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.label}>{t('today-sales', 'Today')}</Text>
            <Text style={styles.value}>{formatCurrencyShortIndian(todayRevenue)}</Text>
          </View>
          <View style={[styles.divider]} />
          <View style={styles.stat}>
            <Text style={styles.label}>{t('weekly-avg', '7-Day Avg')}</Text>
            <Text style={styles.value}>{formatCurrencyShortIndian(avgLast7Days)}</Text>
          </View>
          <View style={[styles.divider]} />
          <View style={styles.stat}>
            <Text style={styles.label}>{t('pending-action', 'Pending')}</Text>
            <Text style={[styles.value, { color: unpaidCount > 0 ? colors.error : colors.success }]}>
              {unpaidCount}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    ...shadows.small,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  title: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700'
  },
  content: {
    gap: spacing.sm
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.textSecondary
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs
  },
  stat: {
    alignItems: 'center',
    flex: 1
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    height: '100%'
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2
  },
  value: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text
  }
});
