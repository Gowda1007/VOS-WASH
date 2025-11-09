import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Customer } from '../core/types';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';

interface CustomerWithStats extends Customer {
  invoiceCount: number;
  totalSpent: number;
}

interface CustomerCardProps {
  customer: CustomerWithStats;
  onView: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onView }) => {
  const { t } = useLanguage();
  
  return (
    <TouchableOpacity 
      style={[styles.card, shadows.small]}
      onPress={() => onView(customer)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
          {customer.address && customer.address !== 'N/A' && (
            <Text style={styles.customerAddress}>{customer.address}</Text>
          )}
        </View>
        <View style={styles.invoiceCount}>
          <Text style={styles.invoiceLabel}>{t('invoices')}</Text>
          <Text style={styles.invoiceValue}>{customer.invoiceCount}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
  <Text style={styles.totalLabel}>{t('total-spent')}</Text>
        <Text style={styles.totalAmount}>₹{customer.totalSpent.toLocaleString('en-IN')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  customerPhone: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  customerAddress: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  invoiceCount: {
    alignItems: 'flex-end',
  },
  invoiceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  invoiceValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  totalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  totalAmount: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
});
