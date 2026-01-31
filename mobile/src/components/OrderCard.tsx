import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { PendingOrder } from '../core/types';
import { calculateInvoiceTotal, formatCurrency } from '../core/utils/invoiceUtils';
import { Badge, Button } from './Common';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';

interface OrderCardProps {
  order: PendingOrder;
  onGenerateInvoice: (order: PendingOrder) => void;
  onSendBotInvoice: (order: PendingOrder) => void;
  onRequestBotPayment: (order: PendingOrder) => void;
  onDelete: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onGenerateInvoice,
  onSendBotInvoice,
  onRequestBotPayment,
  onDelete 
}) => {
  const { t } = useLanguage();
  const totalAmount = calculateInvoiceTotal(order.services);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse orderDate from ISO or DD/MM/YYYY format
  const parseDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    // ISO format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return new Date(dateStr);
    }
    // DD/MM/YYYY format
    const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
      return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    }
    return null;
  };
  
  const orderDateObj = parseDate(order.orderDate);
  const formattedOrderDate = orderDateObj 
    ? orderDateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : order.orderDate || 'N/A';
  
  const dueDateObj = parseDate(order.dueDate);
  const isOverdue = dueDateObj ? dueDateObj < today : false;
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
          <Text style={styles.customerPhone}>{order.customerPhone || 'N/A'}</Text>
          <Text style={styles.orderDate}>{t('order-date-label')}: {formattedOrderDate}</Text>
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
          <Text style={styles.advanceAmount}>{formatCurrency(order.advancePaid.amount)}</Text>
        </View>
        <View style={styles.actions}>
           <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
              <Button 
                onPress={() => onSendBotInvoice(order)}
                variant="secondary"
                style={{ flex: 1, paddingVertical: 6, maxHeight: 36 }}
                textStyle={{ fontSize: 11 }}
              >
                Bot Inv
              </Button>
              <Button 
                onPress={() => onRequestBotPayment(order)}
                variant="primary" 
                style={{ flex: 1, paddingVertical: 6, maxHeight: 36 }}
                textStyle={{ fontSize: 11 }}
              >
                Req Pay
              </Button>
           </View>
           
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
  deleteButton: {
    backgroundColor: colors.error,
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
