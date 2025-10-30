
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import type { AnalyticsData, Invoice, PendingOrder } from '../types';
import { Card, Badge, Icon, Button, EmptyState } from './Common';
import { calculateInvoiceTotal, calculateStatus } from '../hooks/useInvoices';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ComponentProps<typeof Icon>['name']; colorStyle: any; onClick?: () => void }> = ({ title, value, icon, colorStyle, onClick }) => (
    <Card style={styles.kpiCard}>
        <TouchableOpacity onPress={onClick} disabled={!onClick} style={styles.kpiCardContent}>
            <View>
                <Text style={styles.kpiCardTitle}>{title}</Text>
                <Text style={[styles.kpiCardValue, colorStyle]}>₹{value}</Text> {/* FIX: Corrected typo 'kkpiCardValue' to 'kpiCardValue' */}
            </View>
            <View style={[styles.kpiCardIconContainer, colorStyle, { opacity: 0.2 }]}>
                <Icon name={icon} size={24} style={colorStyle} />
            </View>
        </TouchableOpacity>
    </Card>
);

interface DashboardPageProps {
    analytics: AnalyticsData;
    recentInvoices: Invoice[];
    pendingOrders: PendingOrder[];
    onPreviewInvoice: (invoice: Invoice) => void;
    onGenerateInvoice: (order: PendingOrder) => void;
    onDeleteOrder: (order: PendingOrder) => void; // FIX: Changed type to PendingOrder
    onNavigateToUnpaid: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ analytics, recentInvoices, pendingOrders, onPreviewInvoice, onGenerateInvoice, onDeleteOrder, onNavigateToUnpaid }) => {
    
    const { t } = useLanguage();

    const sortedPendingOrders = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // For date comparison without time

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

            // 2. Due date presence (orders with due dates first)
            if (aDueDate && !bDueDate) return -1;
            if (!aDueDate && bDueDate) return 1;
            if (!aDueDate && !bDueDate) return b.totalAmount - a.totalAmount; // Fallback to amount

            // 3. Overdue status
            const aIsOverdue = aDueDate! < now;
            const bIsOverdue = bDueDate! < now;
            if (aIsOverdue && !bIsOverdue) return -1;
            if (!aIsOverdue && bIsOverdue) return 1;

            // 4. Due date proximity (closer dates first)
            const timeDiffA = aDueDate!.getTime() - now.getTime();
            const timeDiffB = bDueDate!.getTime() - now.getTime();
            if (timeDiffA !== timeDiffB) return timeDiffA - timeDiffB;

            // 5. Order value (higher value first)
            return b.totalAmount - a.totalAmount;
        });
    }, [pendingOrders]);
    
    return (
        <View style={styles.container}>
            <Text style={styles.welcomeText}>{t('welcome-back')}</Text>
            
            <View style={styles.kpiGrid}>
                <KpiCard title={t('total-revenue')} value={analytics.totalRevenue.toLocaleString('en-IN')} icon="chart-pie" colorStyle={styles.textGreen600} />
                <KpiCard title={t('collected')} value={analytics.totalPayments.toLocaleString('en-IN')} icon="banknotes" colorStyle={styles.textBlue600} />
                <KpiCard title={t('unpaid-balance')} value={analytics.unpaidBalance.toLocaleString('en-IN')} icon="document-text" colorStyle={styles.textRed600} onClick={onNavigateToUnpaid} />
                <KpiCard title={t('total-invoices')} value={analytics.totalInvoices} icon="document-duplicate" colorStyle={styles.textSlate600} />
            </View>

            {pendingOrders.length > 0 && (
                <Card style={styles.cardMargin}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{t('pending-orders')}</Text>
                    </View>
                    <FlatList
                        data={sortedPendingOrders}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item: order }) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isOverdue = order.dueDate ? new Date(order.dueDate) < today : false;
                            const dueDateObj = order.dueDate ? new Date(order.dueDate) : null;
                            const formattedDueDate = dueDateObj ? dueDateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

                            return (
                                <View style={styles.orderListItem}>
                                    <View style={styles.orderInfo}>
                                        <View style={styles.orderNameRow}>
                                            <Text style={styles.orderCustomerName}>{order.customerName}</Text>
                                            {order.isUrgent && <Badge color="red">{t('urgent-badge', 'Urgent')}</Badge>}
                                        </View>
                                        <Text style={styles.orderPhone}>{order.customerPhone}</Text>
                                        <Text style={styles.orderDate}>{t('order-date-label')}: {order.orderDate}</Text>
                                        {order.dueDate && 
                                            <Text style={[styles.orderDueDate, isOverdue ? styles.orderDueDateOverdue : {}]}>
                                                {t('due-date')}: {formattedDueDate}
                                            </Text>
                                        }
                                    </View>
                                    <View style={styles.orderActions}>
                                        <View style={styles.orderAdvance}>
                                            <Text style={styles.orderAdvanceLabel}>{t('advance-paid')}</Text>
                                            <Text style={styles.orderAdvanceAmount}>₹{order.advancePaid.amount.toLocaleString('en-IN')}</Text>
                                        </View>
                                        <Button onPress={() => onGenerateInvoice(order)} variant="primary" style={styles.generateInvoiceButton}>
                                            {t('generate-invoice')}
                                        </Button>
                                        <TouchableOpacity onPress={() => onDeleteOrder(order)} style={styles.deleteButton} accessibilityLabel={t('delete')}> {/* FIX: Passed entire order object */}
                                            <Icon name="trash" size={20} style={styles.deleteIcon}/>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </Card>
            )}

            <View style={styles.chartSection}>
                <Card style={styles.chartCard}>
                    <Text style={styles.cardTitle}>{t('revenue-trend')}</Text>
                    <Text style={styles.chartPlaceholderText}>{t('chart-unavailable-rn')}</Text>
                </Card>

                <View style={styles.chartColumn}>
                    <Card style={styles.chartCardColumn}>
                        <Text style={styles.cardTitle}>{t('revenue-by-type')}</Text>
                        <Text style={styles.chartPlaceholderText}>{t('chart-unavailable-rn')}</Text>
                    </Card>
                    <Card style={styles.chartCardColumn}>
                        <Text style={styles.cardTitle}>{t('top-services')}</Text>
                        <View style={styles.topServicesList}>
                            {analytics.topServices.length > 0 ? analytics.topServices.map(([name, count]) => (
                                <View key={name} style={styles.topServiceItem}>
                                    <Text style={styles.topServiceText}>{t(name)}</Text>
                                    <Text style={styles.topServiceCount}>{count}</Text>
                                </View>
                            )) : <Text style={styles.noServiceData}>{t('no-service-data')}</Text>}
                        </View>
                    </Card>
                </View>
            </View>
             <Card style={styles.cardMargin}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{t('recent-invoices')}</Text>
                </View>
                 {recentInvoices.length > 0 ? (
                    <FlatList
                        data={recentInvoices}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item: inv }) => <InvoiceListItem invoice={inv} onPreview={onPreviewInvoice} />}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                 )
                 : (
                    <View style={styles.emptyStatePadding}>
                        <EmptyState icon="document-text" title={t('no-invoices-found')} message={t('no-invoices-found-message', "Your latest invoices will appear here once created.")} />
                    </View>
                 )}
            </Card>
        </View>
    );
};


const InvoiceListItem: React.FC<{ invoice: Invoice; onPreview: (invoice: Invoice) => void; }> = ({ invoice, onPreview }) => {
    const totalAmount = calculateInvoiceTotal(invoice.services);
    const status = calculateStatus(invoice);
    const { t } = useLanguage();
    
    return (
        <TouchableOpacity onPress={() => onPreview(invoice)} style={styles.invoiceListItem}>
            <View>
                <Text style={styles.invoiceListItemCustomerName}>{invoice.customerName}</Text>
                <Text style={styles.invoiceListItemDetails}>#{invoice.invoiceNumber} • {invoice.invoiceDate}</Text>
            </View>
            <View style={styles.invoiceListItemRight}>
                <Text style={styles.invoiceListItemAmount}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                {status === 'paid' && <Badge color="green">{t('paid')}</Badge>}
                {status === 'partially_paid' && <Badge color="amber">{t('partially_paid')}</Badge>}
                {status === 'unpaid' && <Badge color="red">{t('unpaid')}</Badge>}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 24, // Matches web spacing
    },
    welcomeText: {
        fontSize: 14, // text-slate-500
        color: '#64748b',
        marginBottom: 24, // space-y-8 at top
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16, // gap-4 md:gap-6
        marginBottom: 32, // space-y-8
    },
    kpiCard: {
        width: '48%', // Approx 2 cols
        padding: 16,
        // Card styling handled by Common.tsx
    },
    kpiCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    kpiCardTitle: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        color: '#64748b', // text-slate-500
    },
    kpiCardValue: {
        fontSize: 30, // text-3xl
        fontWeight: 'bold',
    },
    kpiCardIconContainer: {
        padding: 12, // p-3
        borderRadius: 9999, // rounded-full
    },
    textGreen600: {
        color: '#16a34a', // text-green-600
    },
    textBlue600: {
        color: '#2563eb', // text-blue-600
    },
    textRed600: {
        color: '#dc2626', // text-red-600
    },
    textSlate600: {
        color: '#475569', // text-slate-600
    },
    cardMargin: {
        marginBottom: 32,
    },
    cardHeader: {
        padding: 24, // p-6
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // border-b-slate-200
    },
    cardTitle: {
        fontSize: 20, // text-xl
        fontWeight: 'bold',
        color: '#1e293b', // text-slate-800
    },
    separator: {
        height: 1,
        backgroundColor: '#e2e8f0', // divide-slate-200
    },
    orderListItem: {
        flexDirection: 'column', // sm:flex-row
        alignItems: 'flex-start', // sm:items-start
        padding: 16, // p-4
        gap: 16, // sm:gap-4
        justifyContent: 'space-between',
    },
    orderInfo: {
        flexGrow: 1,
    },
    orderNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        marginBottom: 4, // mb-1
    },
    orderCustomerName: {
        fontSize: 16,
        fontWeight: '600', // font-semibold
        color: '#4f46e5', // text-indigo-600
    },
    orderPhone: {
        fontSize: 14, // text-sm
        color: '#64748b', // text-slate-500
    },
    orderDate: {
        fontSize: 12, // text-xs
        color: '#64748b', // text-slate-500
        marginTop: 4, // mt-1
    },
    orderDueDate: {
        fontSize: 14, // text-sm
        marginTop: 4, // mt-1
        fontWeight: '600', // font-semibold
        color: '#dc2626', // text-red-600
    },
    orderDueDateOverdue: {
        fontWeight: 'bold',
    },
    orderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        alignSelf: 'flex-end', // sm:self-auto
        width: '100%', // w-full sm:w-auto
        marginTop: 16, // Added for mobile spacing
    },
    orderAdvance: {
        textAlign: 'right',
        flexGrow: 1, // flex-grow for mobile
        marginRight: 8,
    },
    orderAdvanceLabel: {
        fontSize: 12, // text-xs
    },
    orderAdvanceAmount: {
        fontWeight: '600', // font-semibold
    },
    generateInvoiceButton: {
        paddingVertical: 8, // !py-2
        paddingHorizontal: 12, // !px-3
        fontSize: 14, // text-sm
    },
    deleteButton: {
        padding: 8, // p-2
        borderRadius: 6, // rounded-lg
        backgroundColor: '#ef4444', // bg-red-500
        // hover:bg-red-600
    },
    deleteIcon: {
        color: '#ffffff', // text-white
    },
    chartSection: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column', // lg:grid grid-cols-1 lg:grid-cols-3
        gap: 24, // gap-6
        marginBottom: 32,
    },
    chartCard: {
        flex: 2, // lg:col-span-2
        padding: 24, // p-4 md:p-6
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartColumn: {
        flex: 1,
        flexDirection: 'column',
        gap: 24,
    },
    chartCardColumn: {
        flex: 1,
        padding: 24,
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartPlaceholderText: {
        fontSize: 16,
        color: '#64748b', // text-slate-500
        textAlign: 'center',
        marginTop: 10,
    },
    topServicesList: {
        gap: 12, // space-y-3
    },
    topServiceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14, // text-sm
    },
    topServiceText: {
        fontWeight: '500', // font-medium
        color: '#475569', // text-slate-700
    },
    topServiceCount: {
        fontWeight: 'bold',
        color: '#1e293b', // text-slate-800
    },
    noServiceData: {
        fontSize: 14, // text-sm
        color: '#64748b', // text-slate-500
        textAlign: 'center',
    },
    invoiceListItem: {
        width: '100%', // w-full
        paddingHorizontal: 24, // px-6
        paddingVertical: 16, // py-4
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // hover:bg-slate-50 handled by TouchableOpacity activeOpacity
    },
    invoiceListItemCustomerName: {
        fontSize: 16,
        fontWeight: '600', // font-semibold
        color: '#4f46e5', // text-indigo-600
    },
    invoiceListItemDetails: {
        fontSize: 14, // text-sm
        color: '#64748b', // text-slate-500
    },
    invoiceListItemRight: {
        alignItems: 'flex-end',
    },
    invoiceListItemAmount: {
        fontWeight: 'bold',
        color: '#1e293b', // text-slate-800
    },
    emptyStatePadding: {
        padding: 16, // p-4
    }
});