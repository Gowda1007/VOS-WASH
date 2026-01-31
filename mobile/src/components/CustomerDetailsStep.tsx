import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, typography } from '../styles/theme';
import type { CustomerType, Customer, Invoice } from '../core/types';
import { calculateRemainingBalance, formatCurrency } from '../core/utils/invoiceUtils';

export interface CustomerDetailsValue {
  name: string;
  phone: string;
  address: string;
  customerType: CustomerType;
  gstNumber?: string;
  oldBalanceAmount?: number; // aggregated arrears (display only)
  advanceAmount?: number;   // aggregated overpaid amount (display only)
}

interface Props {
  value: CustomerDetailsValue;
  onChange: (next: CustomerDetailsValue) => void;
  customers: Customer[];
  invoices: Invoice[];
  disabled?: boolean;
  showSummary?: boolean; // whether to show arrears summary if > 0
  customerTypes?: CustomerType[];
}

export const validateCustomerDetails = (v: CustomerDetailsValue) => {
  const errors: string[] = [];
  if (!v.phone || v.phone.replace(/\D/g,'').length !== 10) errors.push('invalid-phone');
  if (!v.name.trim()) errors.push('invalid-name');
  if (!v.address.trim()) errors.push('invalid-address');
  return { valid: errors.length === 0, errors };
};

const defaultTypes: CustomerType[] = ['customer','garage_service_station','dealer'];

export const CustomerDetailsStep: React.FC<Props> = ({ value, onChange, customers, invoices, disabled, showSummary = true, customerTypes = defaultTypes }) => {
  const { t } = useLanguage();

  // Auto fill & arrears aggregation when phone becomes valid
  useEffect(() => {
    const phoneDigits = (value.phone || '').replace(/\D/g,'');
    if (phoneDigits.length === 10) {
      const existing = customers.find(c => (c.phone || '').replace(/\D/g,'') === phoneDigits);
      let oldBalanceAmount = 0;
      let advanceAmount = 0;
      if (existing) {
        // aggregate remaining balances and advances for this customer's invoices
        const invMatches = invoices.filter(inv => (inv.customerPhone || '').replace(/\D/g,'') === phoneDigits);
        oldBalanceAmount = invMatches
          .filter(inv => (inv.customerPhone || '').replace(/\D/g,'') === phoneDigits)
          .reduce((sum, inv) => {
            const remain = calculateRemainingBalance(inv);
            return remain > 0 ? sum + remain : sum;
          }, 0);
        advanceAmount = invMatches
          .reduce((sum, inv) => {
            const remain = calculateRemainingBalance(inv);
            return remain < 0 ? sum + Math.abs(remain) : sum;
          }, 0);

        onChange({
          ...value,
            name: existing.name,
            gstNumber: existing.gstNumber,
            address: existing.address,
            oldBalanceAmount: oldBalanceAmount > 0 ? Math.round(oldBalanceAmount) : undefined,
            advanceAmount: advanceAmount > 0 ? Math.round(advanceAmount) : undefined,
        });
      } else {
        onChange({ ...value, oldBalanceAmount: undefined, advanceAmount: undefined });
      }
    } else if (value.oldBalanceAmount || value.advanceAmount) {
      // reset if phone invalidated
      onChange({ ...value, oldBalanceAmount: undefined, advanceAmount: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.phone, customers, invoices]);

  const setField = (patch: Partial<CustomerDetailsValue>) => onChange({ ...value, ...patch });

  return (
    <View style={styles.card} pointerEvents={disabled ? 'none' : 'auto'}>
      <Text style={styles.heading}>{t('customer-details')}</Text>

      <View style={styles.group}>
        <View style={styles.labelRow}>
          <MaterialIcons name="phone" size={16} color={colors.primary} />
          <Text style={styles.label}>{t('customer-phone')}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={value.phone}
          placeholder={t('customer-phone')}
          keyboardType="number-pad"
          maxLength={10}
          onChangeText={(phone) => setField({ phone })}
        />
      </View>

      <View style={styles.group}>
        <View style={styles.labelRow}>
          <MaterialIcons name="person" size={16} color={colors.primary} />
          <Text style={styles.label}>{t('customer-name')}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={value.name}
          placeholder={t('customer-name')}
          onChangeText={(name) => setField({ name })}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.group}>
        <View style={styles.labelRow}>
          <MaterialIcons name="receipt" size={16} color={colors.primary} />
          <Text style={styles.label}>{t('gst-number') || 'GST Number'}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={value.gstNumber || ''}
          placeholder={t('gst-number') || 'GST Number'}
          onChangeText={(gstNumber) => setField({ gstNumber })}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.group}>
        <View style={styles.labelRow}>
          <MaterialIcons name="place" size={16} color={colors.primary} />
          <Text style={styles.label}>{t('customer-address')} *</Text>
        </View>
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          numberOfLines={3}
          value={value.address}
          placeholder={t('customer-address')}
          onChangeText={(address) => setField({ address })}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>{t('customer-type')}</Text>
        <View style={styles.typeRow}>
          {customerTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, value.customerType === type && styles.typeChipActive]}
              onPress={() => setField({ customerType: type })}
            >
              <Text style={[styles.typeChipText, value.customerType === type && styles.typeChipTextActive]}>{t(type)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showSummary && value.oldBalanceAmount && value.oldBalanceAmount > 0 && (
        <View style={styles.summaryBox}>
          <MaterialIcons name="warning" size={18} color={colors.error} />
          <Text style={styles.summaryText}>
            {t('old-balance-arrears')} • {formatCurrency(value.oldBalanceAmount || 0)}
          </Text>
        </View>
      )}
      {showSummary && value.advanceAmount && value.advanceAmount > 0 && (
        <View style={styles.summaryBox}>
          <MaterialIcons name="paid" size={18} color={colors.success} />
          <Text style={[styles.summaryText, { color: colors.success }]}> 
            {t('advance-paid')} • {formatCurrency(value.advanceAmount || 0)}
          </Text>
        </View>
      )}
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
  heading: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  group: { marginBottom: spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  label: { ...typography.bodySmall, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    ...typography.body,
  },
  multiline: { textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary },
  typeChipText: { ...typography.caption, color: colors.textSecondary },
  typeChipTextActive: { color: colors.white, fontWeight: '600' },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryText: { ...typography.caption, color: colors.error, fontWeight: '600' },
});

export default CustomerDetailsStep;
