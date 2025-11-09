import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl } from 'react-native';
import { StatCard, OrderCard, InvoiceCard, EmptyState } from '../components';
import type { Invoice, PendingOrder, AnalyticsData } from '../core/types';
import { calculateInvoiceTotal, calculateStatus } from '../core/utils/invoiceUtils';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';

interface DashboardScreenProps {
  analytics: AnalyticsData;
  recentInvoices: Invoice[];
  pendingOrders: PendingOrder[];
  onPreviewInvoice: (invoice: Invoice) => void;
  onGenerateInvoice: (order: PendingOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onNavigateToUnpaid: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  analytics,
  recentInvoices,
  pendingOrders,
  onPreviewInvoice,
  onGenerateInvoice,
  onDeleteOrder,
  onNavigateToUnpaid,
  onRefresh,
  refreshing,
}) => {
  const { t } = useLanguage();

  // Sort pending orders by urgency and due date
  const sortedPendingOrders = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const ordersWithData = pendingOrders.map(order => ({
      ...order,
      totalAmount: calculateInvoiceTotal(order.services),
      dueDateObj: order.dueDate ? new Date(order.dueDate) : null,
    }));

    return ordersWithData.sort((a, b) => {
      // 1. Urgent status
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;

      const aDueDate = a.dueDateObj;
      const bDueDate = b.dueDateObj;

      // 2. Due date presence
      if (aDueDate && !bDueDate) return -1;
      if (!aDueDate && bDueDate) return 1;
      if (!aDueDate && !bDueDate) return b.totalAmount - a.totalAmount;

      // 3. Overdue status
      const aIsOverdue = aDueDate! < now;
      const bIsOverdue = bDueDate! < now;
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;

      // 4. Due date proximity
      const timeDiffA = aDueDate!.getTime() - now.getTime();
      const timeDiffB = bDueDate!.getTime() - now.getTime();
      if (timeDiffA !== timeDiffB) return timeDiffA - timeDiffB;

      // 5. Order value
      return b.totalAmount - a.totalAmount;
    });
  }, [pendingOrders]);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('welcome-back')}</Text>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiRow}>
          <StatCard
            title={t('total-revenue')}
            value={`₹${analytics.totalRevenue.toLocaleString('en-IN')}`}
            icon="trending-up"
            color={colors.success}
          />
          <StatCard
            title={t('collected')}
            value={`₹${analytics.totalPayments.toLocaleString('en-IN')}`}
            icon="account-balance-wallet"
            color={colors.info}
          />
        </View>
        <View style={styles.kpiRow}>
          <StatCard
            title={t('unpaid-balance')}
            value={`₹${analytics.unpaidBalance.toLocaleString('en-IN')}`}
            icon="hourglass-empty"
            color={colors.error}
          />
          <StatCard
            title={t('total-invoices')}
            value={analytics.totalInvoices}
            icon="description"
            color={colors.textSecondary}
          />
        </View>
      </View>

      {/* Pending Orders Section */}
      {sortedPendingOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pending-orders')}</Text>
          {sortedPendingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onGenerateInvoice={onGenerateInvoice}
              onDelete={onDeleteOrder}
            />
          ))}
        </View>
      )}

      {/* Recent Invoices Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recent-invoices')}</Text>
        {recentInvoices.length > 0 ? (
          recentInvoices.slice(0, 5).map((invoice) => (
            <InvoiceCard
              key={invoice.invoiceNumber}
              invoice={invoice}
              onPreview={onPreviewInvoice}
              onCollect={() => {}}
              onDelete={() => {}}
            />
          ))
        ) : (
          <EmptyState
            icon="receipt"
            title={t('no-invoices-found')}
            message={t('adjust-filters-message')}
          />
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  kpiGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
});
