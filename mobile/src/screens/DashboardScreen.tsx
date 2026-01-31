import React, { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../../App'; // Import DrawerParamList from App.tsx
// Removed bottom tab hook; drawer navigation doesn't provide tab bar height.
// Provide a fallback constant for spacing formerly based on tab bar height.
import { LineChart, PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { StatCard, OrderCard, InvoiceCard, EmptyState, MorningBriefingCard } from '../components';
import type { Invoice, PendingOrder, AnalyticsData } from '../core/types';
import { calculateInvoiceTotal, calculateStatus, formatCurrency, formatCurrencyShortIndian, scaleValuesForIndianChart, safeNumber } from '../core/utils/invoiceUtils';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';
import { FloatingActionButton } from '../components';
import { notificationAdapter } from '../adapters'; 
import { Modal } from 'react-native';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { parseVoiceCommand } from '../core/utils/voiceParser';

// Import analytics service
const filterAndGroupInvoicesForChart = (
  period: 'day' | 'week' | 'month',
  allInvoices: Invoice[],
  previous: boolean = false,
  offset: number = 0
): { labels: string[]; datasets: [{ data: number[] }] } => {
  const getStartOfPeriod = (p: 'day' | 'week' | 'month'): Date => {
    const now = new Date();
    const start = new Date(now);
    if (p === 'day') start.setHours(0, 0, 0, 0);
    else if (p === 'week') {
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
    } else if (p === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    return start;
  };

  let labels: string[] = [];
  const now = new Date();

  if (period === 'day') labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  else if (period === 'week') labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  else if (period === 'month') {
    // Get days in the target month (considering offset)
    const targetDate = new Date(now);
    if (period === 'month') targetDate.setMonth(targetDate.getMonth() + offset);
    const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  }

  const dataMap = new Map<string, number>(labels.map((l) => [l, 0]));

  allInvoices.forEach((inv) => {
    // Attempt to parse date string into a Date object.
    const invDate = new Date(inv.invoiceDate);
    if (isNaN(invDate.getTime())) return;

    const startOfPeriod = getStartOfPeriod(period);
    const endOfPeriod = new Date(startOfPeriod);
    if (period === 'day') endOfPeriod.setHours(23, 59, 59, 999);
    else if (period === 'week') {
      endOfPeriod.setDate(startOfPeriod.getDate() + 6);
      endOfPeriod.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      endOfPeriod.setMonth(startOfPeriod.getMonth() + 1, 0);
      endOfPeriod.setHours(23, 59, 59, 999);
    }

    // Apply offset to shift periods
    let periodStart = new Date(startOfPeriod);
    let periodEnd = new Date(endOfPeriod);
    
    if (period === 'day' && offset !== 0) {
      periodStart.setDate(periodStart.getDate() + offset);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setHours(23, 59, 59, 999);
    } else if (period === 'week' && offset !== 0) {
      periodStart.setDate(periodStart.getDate() + (offset * 7));
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } else if (period === 'month' && offset !== 0) {
      periodStart.setMonth(periodStart.getMonth() + offset, 1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1, 0);
      periodEnd.setHours(23, 59, 59, 999);
    }
    
    if (invDate >= periodStart && invDate <= periodEnd) {
      const invoiceTotal = calculateInvoiceTotal(inv.services);
      let key: string | undefined;
      
      if (period === 'day') {
        // Group by hour for the selected day
        key = `${invDate.getHours()}:00`;
      } else if (period === 'week') {
        // Group by day of the week (0=Sun to 6=Sat)
        key = labels[invDate.getDay()];
      } else if (period === 'month') {
        // Group by day of the month
        key = String(invDate.getDate());
      }

      if (key && dataMap.has(key)) {
        dataMap.set(key, (dataMap.get(key) || 0) + invoiceTotal);
      }
    }
  });

  // Ensure chart data is finite numbers only
  const datasets = [{ data: Array.from(dataMap.values()).map((v) => safeNumber(v, 0)) }] as [{ data: number[] }];
  return { labels, datasets };
};

type ChartPeriod = 'day' | 'week' | 'month';
const screenWidth = Dimensions.get('window').width;

const getDailyRevenueComparison = (allInvoices: Invoice[]): { todayRevenue: number; avgLast7Days: number; achievedTarget: boolean } => {
  const now = new Date();
  const today = new Date(now).setHours(0, 0, 0, 0);
  const oneDay = 24 * 60 * 60 * 1000;
  
  let todayRevenue = 0;
  let sevenDayTotal = 0;
  let daysInPeriod = 0;
  
  const sevenDaysAgo = today - 7 * oneDay;

  allInvoices.forEach(inv => {
    const invDate = new Date(inv.invoiceDate);
    if (isNaN(invDate.getTime())) return;
    
    const invDay = new Date(invDate).setHours(0, 0, 0, 0);
    const revenue = calculateInvoiceTotal(inv.services);
    
    if (invDay === today) {
      todayRevenue += revenue;
    }
    
    // Check if within the last 7 days (including today)
    if (invDay >= sevenDaysAgo) {
      sevenDayTotal += revenue;
      // Simple way to track unique days:
      // Note: This calculation of daysInPeriod is simple but technically flawed if invoices only exist for one day
      // within the 7-day period. However, given the context, a rolling 7-day average approximation is acceptable.
    }
  });
  
  // Calculate distinct days in the past 7 days with revenue to get a more accurate average
  const distinctDays = new Set();
  allInvoices.forEach(inv => {
      const invDate = new Date(inv.invoiceDate);
      if (isNaN(invDate.getTime())) return;
      const invDay = new Date(invDate).setHours(0, 0, 0, 0);
      if (invDay >= sevenDaysAgo && invDay <= today) {
          distinctDays.add(invDay);
      }
  });
  
  const daysWithRevenue = distinctDays.size;
  
  const avgLast7Days = daysWithRevenue > 0 ? (sevenDayTotal / daysWithRevenue) : 0;
  
  // Set target based on 20% increase over average
  const target = avgLast7Days * 1.2;
  const achievedTarget = todayRevenue > target && avgLast7Days > 0;
  
  return { todayRevenue: safeNumber(todayRevenue), avgLast7Days: safeNumber(avgLast7Days), achievedTarget };
};

interface DashboardScreenProps {
  analytics: AnalyticsData;
  allInvoices: Invoice[];
  pendingOrders: PendingOrder[];
  onPreviewInvoice: (invoice: Invoice) => void;
  onGenerateInvoice: (order: PendingOrder) => void;
  onCollectPayment: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceNumber: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onNavigateToUnpaid: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  analytics,
  allInvoices,
  pendingOrders,
  onPreviewInvoice,
  onGenerateInvoice,
  onCollectPayment,
  onDeleteInvoice,
  onDeleteOrder,
  onNavigateToUnpaid,
  onRefresh,
  refreshing,
}) => {
  const { t, language } = useLanguage();

  // Calculate stats
  const dayRevenueStats = useMemo(() => getDailyRevenueComparison(allInvoices), [allInvoices]);
  const unpaidCount =  useMemo(() => analytics.unpaidInvoicesCount || 0, [analytics]);

  // Notification logic based on daily revenue comparison
  React.useEffect(() => {
    if (allInvoices.length === 0) return;

    // Use the calculated stats
    const { todayRevenue, avgLast7Days, achievedTarget } = dayRevenueStats;

    if (achievedTarget) {
      notificationAdapter.showNotification?.({
        title: t('target-achieved-title', '🚀 Daily Target Crushed!'),
        body: t('target-achieved-body', 'You earned {revenue} today, beating the average of {average}! Keep up the momentum!').replace('{revenue}', formatCurrencyShortIndian(todayRevenue, language)).replace('{average}', formatCurrencyShortIndian(avgLast7Days, language)),
      });
    } else if (todayRevenue < avgLast7Days * 0.8 && avgLast7Days > 500) { // Only send warning if past 80% below average
      notificationAdapter.showNotification?.({
        title: t('target-warning-title', '💡 Need a Boost?'),
        body: t('target-warning-body', 'Your revenue is currently {revenue}. Try to hit {target} to beat yesterday\'s pace!').replace('{revenue}', formatCurrencyShortIndian(todayRevenue, language)).replace('{target}', formatCurrencyShortIndian(avgLast7Days, language)),
      });
    }

  }, [allInvoices, language]); // Run when invoices update

  
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList, 'Dashboard'>>(); // Use specific navigation type
  const insets = useSafeAreaInsets();
    // Compute inner chart width to avoid horizontal overflow inside padded containers
    const chartInnerWidth = useMemo(() => {
      const outerPadding = spacing.lg * 2; // section padding left+right
      const cardPadding = spacing.lg * 2;  // card inner padding left+right
      return Math.max(200, screenWidth - outerPadding - cardPadding);
    }, []);
  // Replace useBottomTabBarHeight (not available in drawer) with fixed offset
  const tabBarHeight = 0; // drawer has no bottom bar; adjust FAB position
  // Default to 'day' view per requirement
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('day');
  const [periodOffset, setPeriodOffset] = useState(0); 

  // Voice Recognition Logic
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceRecognition();
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const handleVoiceFabPress = async () => {
      setShowVoiceModal(true);
      resetTranscript();
      await startListening();
  };

  const handleVoiceProcess = () => {
      stopListening();
      setShowVoiceModal(false);
      
      if (!transcript) return;
      
      const result = parseVoiceCommand(transcript);
      if (result.phone || result.service || result.name) {
          (navigation as any).navigate('NewInvoice', { voiceResult: result });
      } else {
          // Simple alert if no useful data found
           notificationAdapter.showNotification?.({
            title: t('try-again'),
            body: t('voice-no-data', 'Could not understand command. Try "Invoice for [Name] phone [Number]"'),
          });
      }
  };

  const handleVoiceClose = () => {
      stopListening();
      setShowVoiceModal(false);
  };

  // Chart data
  const recentInvoices = useMemo(
    () => [...allInvoices].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()).slice(0, 10),
    [allInvoices]
  );

  // Chart data
  const chartDataRaw = useMemo(
    () => filterAndGroupInvoicesForChart(chartPeriod, allInvoices, periodOffset !== 0, periodOffset),
    [chartPeriod, allInvoices, periodOffset]
  );

  const { scaled: scaledChartValues, unitLabel: chartUnit } = useMemo(() => {
    return scaleValuesForIndianChart(chartDataRaw.datasets[0].data, language);
  }, [chartDataRaw, language]);

  const chartData = useMemo(() => ({
    labels: chartDataRaw.labels,
    datasets: [{ data: scaledChartValues }]
  }), [chartDataRaw.labels, scaledChartValues]);

  // Compress X-axis labels to avoid crowding (no horizontal scroll)
  const compressedLabels = useMemo(() => {
    const total = chartData.labels.length;
    const maxTicks = chartPeriod === 'week' ? 7 : 6; // show all 7 days for week, else ~6 ticks
    if (total <= maxTicks) return chartData.labels;
    const step = Math.ceil(total / maxTicks);
    return chartData.labels.map((lbl, idx) => (idx % step === 0 ? lbl : ''));
  }, [chartData.labels, chartPeriod]);

  // Use a square drawing size and center it within full card width
  const pieSize = useMemo(() => Math.min(chartInnerWidth, 220), [chartInnerWidth]);

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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: colors.white }]}>
        <Text style={[styles.headerText, { fontWeight: '700' }]} numberOfLines={2}>{t('welcome-back')}</Text>
      </View>

      <View style={{ marginBottom: spacing.md }}>
        <MorningBriefingCard 
          todayRevenue={dayRevenueStats.todayRevenue}
          avgLast7Days={dayRevenueStats.avgLast7Days}
          achievedTarget={dayRevenueStats.achievedTarget}
          unpaidCount={analytics.unpaidInvoicesCount || 0}
        />
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <StatCard
              title={t('total-revenue')}
              value={formatCurrencyShortIndian(safeNumber(analytics.totalRevenue), language)}
              icon="trending-up"
              color={colors.success}
              onPress={() => navigation.navigate('Invoices', { filter: 'all' })} // Corrected navigation type
            />
          </View>
          <View style={styles.kpiItem}>
            <StatCard
              title={t('collected')}
              value={formatCurrencyShortIndian(safeNumber(analytics.totalPayments), language)}
              icon="account-balance-wallet"
              color={colors.info}
              onPress={() => navigation.navigate('Invoices', { filter: 'paid' })} // Corrected navigation type
            />
          </View>
        </View>
        <View style={styles.kpiRow}>
          {/* Make unpaid balance card clickable to match web behaviour */}
          <View style={styles.kpiItem}>
            <StatCard
              title={t('unpaid-balance')}
              value={formatCurrencyShortIndian(safeNumber(analytics.unpaidBalance), language)}
              icon="hourglass-empty"
              color={colors.error}
              onPress={onNavigateToUnpaid}
            />
          </View>
          <View style={styles.kpiItem}>
            <StatCard
              title={t('total-spent')}
              value={formatCurrencyShortIndian(safeNumber(analytics.totalRawMaterialSpent), language)}
              icon="local-mall"
              color={colors.warning}
              onPress={() => navigation.navigate('RawMaterials' as never)} // Navigate to RawMaterialsScreen
            />
          </View>
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
          // Show top 3 recent invoices to match web dashboard
          recentInvoices.slice(0, 3).map((invoice) => (
            <InvoiceCard
              key={invoice.invoiceNumber}
              invoice={invoice}
              onPreview={onPreviewInvoice}
              onCollect={onCollectPayment}
              onDelete={onDeleteInvoice}
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

      {/* Revenue Trend Chart - Redesigned */}
      <View style={styles.chartSection}>
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View style={styles.chartTitleContainer}>
              <MaterialIcons name="trending-up" size={24} color={colors.primary} />
              <View>
                <Text style={styles.chartTitle}>{t('revenue-trend')}</Text>
                <Text style={styles.chartSubtitle}>{t('track-your-earnings')}</Text>
              </View>
            </View>
            <View style={styles.periodToggle}>
              {(['day', 'week', 'month'] as ChartPeriod[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => {
                    setChartPeriod(p);
                    setPeriodOffset(0); // Reset to current when changing period type
                  }}
                  style={[
                    styles.periodButton,
                    chartPeriod === p && styles.periodButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      chartPeriod === p && styles.periodButtonTextActive,
                    ]}
                  >
                    {t(p)}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.navigationArrows}>
                <TouchableOpacity
                  onPress={() => setPeriodOffset((v) => v - 1)}
                  style={styles.arrowButton}
                >
                  <MaterialIcons name="arrow-back-ios" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPeriodOffset((v) => Math.min(v + 1, 0))}
                  style={[styles.arrowButton, periodOffset === 0 && styles.arrowButtonDisabled]}
                  disabled={periodOffset === 0}
                >
                  <MaterialIcons name="arrow-forward-ios" size={16} color={periodOffset === 0 ? colors.border : colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <LineChart
            data={{
              labels: compressedLabels,
              datasets: chartData.datasets,
            }}
            width={chartInnerWidth}
            height={200}
            yAxisLabel={chartUnit ? '' : '₹'}
            yAxisSuffix={chartUnit ? (language === 'kn' ? (chartUnit === 'ಲಕ್ಷ' ? ' ಲಕ್ಷ' : ' ಕೋಟಿ') : ` ${chartUnit}`) : ''}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#f0f9ff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
              style: {
                borderRadius: 12,
              },
              propsForDots: {
                r: '0',
                strokeWidth: '0',
              },
              propsForLabels: {
                fontSize: 9,
                fontWeight: '600',
              },
              propsForBackgroundLines: {
                stroke: '#e2e8f0',
                strokeWidth: 1,
                strokeDasharray: '5,5',
              },
            }}
            style={styles.chart}
            fromZero
            bezier
            segments={4}
            withInnerLines
            withOuterLines
            withVerticalLabels
            withHorizontalLabels
          />
          {chartUnit ? (
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
              {language === 'kn' ? `ಮೌಲ್ಯಗಳು ${chartUnit === 'ಲಕ್ಷ' ? 'ಲಕ್ಷಗಳಲ್ಲಿ' : 'ಕೋಟಿಗಳಲ್ಲಿ'} ಪ್ರದರ್ಶಿಸಲಾಗುತ್ತಿವೆ` : `Values shown in ${chartUnit === 'L' ? 'Lakhs' : 'Crores'}`}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Revenue by Customer Type - Pie Chart Only */}
      <View style={styles.analyticsSection}>
        <View style={styles.analyticsCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="pie-chart" size={24} color={colors.primary} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.chartTitle}>{t('revenue-by-type')}</Text>
              <Text style={styles.chartSubtitle}>{t('customer-distribution')}</Text>
            </View>
          </View>
          <View style={styles.pieOnlyContainer}>
            <PieChart
              data={[
                {
                  name: t('customer'),
                  population: safeNumber(analytics.revenueByCustomerType.customer),
                  color: '#3b82f6',
                  legendFontColor: colors.text,
                  legendFontSize: 13,
                },
                {
                  name: t('garage_service_station'),
                  population: safeNumber(analytics.revenueByCustomerType.garage_service_station),
                  color: '#10b981',
                  legendFontColor: colors.text,
                  legendFontSize: 13,
                },
                {
                  name: t('dealer'),
                  population: safeNumber(analytics.revenueByCustomerType.dealer),
                  color: '#f59e0b',
                  legendFontColor: colors.text,
                  legendFontSize: 13,
                },
              ]}
              width={screenWidth - spacing.lg * 2}
              height={240}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft={`${(screenWidth - spacing.lg * 2) / 2 - 90}`}
              hasLegend={false}
              absolute
            />
            <View style={styles.pieLegendBelow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>{t('customer')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>{t('garage_service_station')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>{t('dealer')}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Top Services - Redesigned */}
      <View style={styles.analyticsSection}>
        <View style={styles.analyticsCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="star" size={24} color={colors.warning} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.chartTitle}>{t('top-services')}</Text>
              <Text style={styles.chartSubtitle}>{t('most-requested')}</Text>
            </View>
          </View>
          {analytics.topServices.length > 0 ? (
            <View style={styles.servicesGrid}>
              {analytics.topServices.map(([name, count], index) => (
                <View key={name} style={styles.serviceCard}>
                  <View style={[styles.serviceRank, { backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b' }]}>
                    <Text style={styles.serviceRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={2}>{t(name)}</Text>
                    <View style={styles.serviceCountBadge}>
                      <MaterialIcons name="check-circle" size={14} color={colors.success} />
                      <Text style={styles.serviceCountText}>{String(count)} {t('times')}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="assessment" size={48} color={colors.border} />
              <Text style={styles.emptyText}>{t('no-service-data')}</Text>
            </View>
          )}
        </View>
      </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
      {/* Voice Recognition Modal */}
      <Modal visible={showVoiceModal} transparent animationType="fade" onRequestClose={handleVoiceClose}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <MaterialIcons name="mic" size={32} color={isListening ? colors.primary : colors.textSecondary} />
                    <Text style={styles.modalTitle}>{isListening ? t('listening', 'Listening...') : t('processing', 'Processing')}</Text>
                </View>
                
                <View style={styles.transcriptBox}>
                    <Text style={styles.transcriptText}>{transcript || t('say-something', 'Say: "Hesaru Ravi Phone 9876543210 Service Washing"')}</Text>
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity onPress={handleVoiceClose} style={[styles.modalButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                        <Text style={{ ...typography.body, color: colors.text }}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleVoiceProcess} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                         <Text style={{ ...typography.body, color: colors.white, fontWeight: 'bold' }}>{t('process')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Floating Action Buttons */}
      <View style={[styles.fabContainer, { bottom: tabBarHeight + spacing.md }]} pointerEvents="box-none">
        <FloatingActionButton 
          accessibilityLabel={t('voice-invoice')}
          variant="primary" 
          style={{ backgroundColor: '#8B5CF6' }} 
          onPress={handleVoiceFabPress}
          icon={<MaterialIcons name="mic" size={24} color={colors.white} />}
        />
        <FloatingActionButton 
          accessibilityLabel={t('new-invoice')}
          variant="primary" 
          onPress={() => navigation.navigate('NewInvoice' as never)}
          icon={<MaterialIcons name="receipt-long" size={20} color={colors.white} />}
        />
        <FloatingActionButton 
          accessibilityLabel={t('take-order')}
          variant="secondary" 
          onPress={() => navigation.navigate('TakeOrder' as never)}
          icon={<MaterialIcons name="add-shopping-cart" size={20} color={colors.white} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
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
  kpiItem: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  chartSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  chart: {
    borderRadius: 12,
    marginVertical: spacing.sm,
    marginLeft: -spacing.sm,
  },
  chartHeaderRow: {
    marginBottom: spacing.md,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chartTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  chartSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chartScrollContent: {
    paddingRight: spacing.md,
  },
  analyticsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  analyticsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  pieOnlyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  pieLegendBelow: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
  },
  legendText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  revenueTypeGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  revenueTypeCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Voice Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  transcriptBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 12,
    width: '100%',
    minHeight: 100,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueTypeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueTypePercentage: {
    ...typography.h3,
    fontWeight: '800',
    color: colors.text,
  },
  revenueTypeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
    height: 32,
  },
  revenueTypeValue: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
  },
  barChartContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  barItem: {
    gap: spacing.xs,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  barLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  barDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  barLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  barValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
  },
  barTrack: {
    height: 28,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barFill: {
    height: '100%',
    borderRadius: 14,
    minWidth: 4,
  },
  barPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  servicesGrid: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceRank: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  serviceRankText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  serviceCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: spacing.xs,
  },
  serviceCountText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  bottomSpacing: {
    height: spacing.xxl * 2,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  fab: {
    borderRadius: 32,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  fabPrimary: {
    backgroundColor: colors.primary,
  },
  fabSecondary: {
    backgroundColor: colors.success,
  },
  fabText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  periodButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  navigationArrows: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  arrowButton: {
    padding: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowButtonDisabled: {
    opacity: 0.4,
  },
  serviceName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
