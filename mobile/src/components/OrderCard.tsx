import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { PendingOrder } from '../core/types';
import { calculateInvoiceTotal } from '../core/utils/invoiceUtils';
import { Badge, Button } from './Common';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';

interface OrderCardProps {
  order: PendingOrder;
  onGenerateInvoice: (order: PendingOrder) => void;
  onDelete: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onGenerateInvoice,
  onDelete 
}) => {
  const { t } = useLanguage();
  const totalAmount = calculateInvoiceTotal(order.services);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = order.dueDate ? new Date(order.dueDate) < today : false;
  const dueDateObj = order.dueDate ? new Date(order.dueDate) : null;
  const formattedDueDate = dueDateObj 
    ? dueDateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';

  return (
    <View style={[styles.card, shadows.small]}>
      <View style={styles.header}>
        <View style={styles.customerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.customerName}>{order.customerName}</Text>
            {order.isUrgent && <Badge color="red">{t('urgent-badge')}</Badge>}
          </View>
          <Text style={styles.customerPhone}>{order.customerPhone}</Text>
          <Text style={styles.orderDate}>{t('order-date-label')}: {order.orderDate}</Text>
          {order.dueDate && (
            <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
              {t('due-date')}: {formattedDueDate}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.amountContainer}>
          <Text style={styles.advanceLabel}>{t('advance-paid')}</Text>
          <Text style={styles.advanceAmount}>₹{order.advancePaid.amount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.actions}>
          <Button 
            onPress={() => onGenerateInvoice(order)}
            variant="primary"
            style={styles.generateButton}
          >
            <Text style={styles.generateButtonText}>{t('generate-invoice')}</Text>
          </Button>
          <TouchableOpacity 
            onPress={() => onDelete(order.id)}
            style={styles.deleteButton}
          >
            <MaterialIcons name="delete" size={20} color={colors.white} />
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
    marginBottom: spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  customerName: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  customerPhone: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  orderDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dueDate: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
  },
  overdue: {
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  amountContainer: {
    alignItems: 'flex-start',
  },
  advanceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  advanceAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  generateButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flex: 1,
    maxWidth: 140,
  },
  generateButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.error,
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
