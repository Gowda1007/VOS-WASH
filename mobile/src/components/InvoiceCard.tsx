import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import type { Invoice } from '../core/types';
import { calculateInvoiceTotal, calculateStatus, formatCurrency } from '../core/utils/invoiceUtils';
import { Badge } from './Common';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';

interface InvoiceCardProps {
  invoice: Invoice;
  onPreview: (invoice: Invoice) => void;
  onCollect: (invoice: Invoice) => void;
  onDelete: (invoiceNumber: string) => void;
  onEdit?: (invoice: Invoice) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ 
  invoice, 
  onPreview,
  onCollect,
  onDelete,
  onEdit,
}) => {
  const { t } = useLanguage();
  const totalAmount = calculateInvoiceTotal(invoice.services);
  const status = calculateStatus(invoice);
  
  const getStatusBadge = () => {
    if (status === 'paid') return <Badge color="green">{t('paid')}</Badge>;
    if (status === 'partially_paid') return <Badge color="amber">{t('partially_paid')}</Badge>;
    return <Badge color="red">{t('unpaid')}</Badge>;
  };

  return (
    <View style={[styles.card, shadows.small]}>
      <View style={styles.header}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{invoice.customerName || 'N/A'}</Text>
          <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber || 'N/A'}</Text>
          <Text style={styles.invoiceDate}>{t('invoice-date-label', 'Date')}: {invoice.invoiceDate || 'N/A'}</Text>
        </View>
        {getStatusBadge()}
      </View>
      
      <View style={styles.footer}>
  <Text style={styles.amount}>{t('total-amount-label', 'Total')}: {formatCurrency(totalAmount)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onPreview(invoice)}
          >
            <Ionicons name="eye-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onCollect(invoice)}
            disabled={status === 'paid'}
          >
            <MaterialIcons 
              name="payments" 
              size={20} 
              color={status === 'paid' ? colors.disabled : colors.success} 
            />
          </TouchableOpacity>
          {onEdit && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onEdit(invoice)}
            >
              <MaterialIcons name="edit" size={20} color={colors.info} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onDelete(invoice.invoiceNumber)}
          >
            <MaterialIcons name="delete-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    marginBottom: spacing.md,
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
  invoiceNumber: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  invoiceDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
});
