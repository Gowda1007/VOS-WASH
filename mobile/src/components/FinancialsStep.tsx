import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';
import { formatDateInput } from '../core/utils/invoiceUtils';

export interface FinancialsValue {
  showOldBalance: boolean;
  oldBalance: { amount: number; date: string };
  showAdvancePaid: boolean;
  advancePaid: { amount: number; date: string };
}

interface Props {
  value: FinancialsValue;
  onChange: (next: FinancialsValue) => void;
}

export const FinancialsStep: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useLanguage();

  const setField = (patch: Partial<FinancialsValue>) => onChange({ ...value, ...patch });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('financials')}</Text>

      {/* Old Balance Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setField({ showOldBalance: !value.showOldBalance })}
        >
          <MaterialIcons
            name={value.showOldBalance ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={colors.error}
          />
          <Text style={styles.checkboxLabel}>{t('old-balance-arrears')}</Text>
        </TouchableOpacity>
        {value.showOldBalance && (
          <View style={styles.nestedInputs}>
            <TextInput
              style={styles.input}
              placeholder={t('amount-placeholder', 'Amount')}
              keyboardType="numeric"
              value={value.oldBalance.amount > 0 ? String(value.oldBalance.amount) : ''}
              onChangeText={(v) =>
                setField({ oldBalance: { ...value.oldBalance, amount: parseFloat(v) || 0 } })
              }
            />
            <TextInput
              style={styles.input}
              placeholder={t('date-placeholder', 'Date (DD/MM/YYYY)')}
              keyboardType="number-pad"
              maxLength={10}
              value={value.oldBalance.date}
              onChangeText={(date) => setField({ oldBalance: { ...value.oldBalance, date: formatDateInput(date) } })}
            />
          </View>
        )}
      </View>

      {/* Advance Paid Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setField({ showAdvancePaid: !value.showAdvancePaid })}
        >
          <MaterialIcons
            name={value.showAdvancePaid ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={colors.success}
          />
          <Text style={styles.checkboxLabel}>{t('advance-paid')}</Text>
        </TouchableOpacity>
        {value.showAdvancePaid && (
          <View style={styles.nestedInputs}>
            <TextInput
              style={styles.input}
              placeholder={t('amount-placeholder', 'Amount')}
              keyboardType="numeric"
              value={value.advancePaid.amount > 0 ? String(value.advancePaid.amount) : ''}
              onChangeText={(v) =>
                setField({ advancePaid: { ...value.advancePaid, amount: parseFloat(v) || 0 } })
              }
            />
            <TextInput
              style={styles.input}
              placeholder={t('date-placeholder', 'Date (DD/MM/YYYY)')}
              keyboardType="number-pad"
              maxLength={10}
              value={value.advancePaid.date}
              onChangeText={(date) => setField({ advancePaid: { ...value.advancePaid, date: formatDateInput(date) } })}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  nestedInputs: {
    marginLeft: spacing.xl,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    backgroundColor: colors.white,
    ...typography.body,
  },
});

export default FinancialsStep;
