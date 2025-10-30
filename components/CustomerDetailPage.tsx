import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import type { Customer, Invoice, InvoiceStatus } from '../types';
import { Card, Button, Icon, Badge } from './Common';
import { calculateInvoiceTotal, calculateStatus } from '../hooks/useInvoices';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

interface CustomerDetailPageProps {
    customer: Customer;
    invoices: Invoice[];
    onNavigateBack: () => void;
    onCollectInvoice: (invoiceId: number) => void;
    onPreviewInvoice: (invoice: Invoice) => void;
    onDeleteCustomer: (customer: Customer) => void; // New prop
}

interface KpiCardProps {
    title: string;
    value: string | number;
    isDarkMode: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, isDarkMode }) => (
    <Card style={styles.kpiCard}>
        <Text style={[styles.kpiCardTitle, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{title}</Text>
        <Text style={[styles.kpiCardValue, isDarkMode ? styles.textSlate100 : styles.textSlate800]}>{value}</Text>
    </Card>
);

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customer, invoices, onNavigateBack, onCollectInvoice, onPreviewInvoice, onDeleteCustomer }) => {
    const { t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    
    const stats = React.useMemo(() => {
        const totalSpent = invoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
        const avgInvoiceValue = invoices.length > 0 ? totalSpent / invoices.length : 0;
        return {
            totalSpent: `₹${totalSpent.toLocaleString('en-IN')}`,
            totalInvoices: invoices.length,
            avgInvoiceValue: `₹${avgInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        };
    }, [invoices]);

    return (
        <View style={styles.container}>
            <View style={styles.headerSection}>
                 <View>
                    <Text style={[styles.customerPhone, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{customer.phone}</Text>
                    <Text style={[styles.customerAddress, isDarkMode ? styles.textSlate400 : styles.textSlate600]}>{customer.address}</Text>
                </View>
                <Button onPress={onNavigateBack} variant="secondary">
                    <Icon name="arrow-left" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight}/>
                    <Text>{t('back-to-customers', 'Back to Customers')}</Text>
                </Button>
            </View>
            
            <View style={styles.kpiGrid}>
                <KpiCard title={t('total-spent', 'Total Spent')} value={stats.totalSpent} isDarkMode={isDarkMode}/>
                <KpiCard title={t('total-invoices')} value={stats.totalInvoices} isDarkMode={isDarkMode}/>
                <KpiCard title={t('avg-invoice-value', 'Avg. Invoice Value')} value={stats.avgInvoiceValue} isDarkMode={isDarkMode}/>
            </View>

            <Card style={styles.invoiceHistoryCard}>
                <View style={[styles.invoiceHistoryHeader, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
                    <Text style={[styles.invoiceHistoryTitle, isDarkMode ? styles.textLight : styles.textDark]}>{t('invoice-history', 'Invoice History')}</Text>
                </View>
                <View style={styles.invoiceHistoryContent}>
                    <InvoicesList invoices={invoices} onPreview={onPreviewInvoice} onCollect={onCollectInvoice} isDarkMode={isDarkMode}/>
                </View>
            </Card>

            <View style={styles.deleteCustomerButtonContainer}>
                <Button onPress={() => onDeleteCustomer(customer)} variant="danger">
                    <Icon name="trash" size={20} style={styles.deleteIcon}/>
                    <Text>{t('delete-customer')}</Text>
                </Button>
            </View>
        </View>
    );
};

interface InvoicesListProps {
    invoices: Invoice[];
    onPreview: (inv: Invoice) => void;
    onCollect: (id: number) => void;
    isDarkMode: boolean;
}

const InvoicesList: React.FC<InvoicesListProps> = ({ invoices, onPreview, onCollect, isDarkMode }) => {
    const { t } = useLanguage();

    if (invoices.length === 0) {
        return <Text style={[styles.noInvoicesText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('no-invoices-for-customer', 'No invoices found for this customer.')}</Text>;
    }

    return (
        <View style={styles.tableContainer}>
            <View style={[styles.tableHeader, isDarkMode ? styles.tableHeaderDark : styles.tableHeaderLight]}>
                <Text style={styles.tableHeaderText}>{t('invoice-number', 'Invoice #')}</Text>
                <Text style={styles.tableHeaderText}>{t('invoice-date', 'Date')}</Text>
                <Text style={[styles.tableHeaderText, styles.tableHeaderTextRight]}>{t('amount', 'Amount')}</Text>
                <Text style={[styles.tableHeaderText, styles.tableHeaderTextCenter]}>{t('status', 'Status')}</Text>
                <Text style={styles.tableHeaderText}>{t('actions', 'Actions')}</Text>
            </View>
            <FlatList
                data={invoices}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => <InvoiceRow invoice={item} onPreview={onPreview} onCollect={onCollect} isDarkMode={isDarkMode}/>}
                ItemSeparatorComponent={() => <View style={isDarkMode ? styles.tableRowSeparatorDark : styles.tableRowSeparatorLight} />}
            />
        </View>
    );
};

interface InvoiceRowProps {
    invoice: Invoice;
    onPreview: (inv: Invoice) => void;
    onCollect: (id: number) => void;
    isDarkMode: boolean;
}

const InvoiceRow: React.FC<InvoiceRowProps> = ({ invoice, onPreview, onCollect, isDarkMode }) => {
    const total = calculateInvoiceTotal(invoice.services);
    const status = calculateStatus(invoice);
    return (
        <View style={[styles.tableRow, isDarkMode ? styles.tableRowDark : styles.tableRowLight]}>
            <Text style={[styles.invoiceNumberText, isDarkMode ? styles.textLight : styles.textDark]}>#{invoice.invoiceNumber}</Text>
            <Text style={[styles.invoiceDateText, isDarkMode ? styles.textSlate300 : styles.textSlate600]}>{invoice.invoiceDate}</Text>
            <Text style={[styles.amountText, isDarkMode ? styles.textLight : styles.textDark]}>₹{total.toLocaleString('en-IN')}</Text>
            <View style={styles.statusCell}><StatusBadge status={status}/></View>
            <View style={styles.actionsCell}>
                <TouchableOpacity onPress={() => onPreview(invoice)} style={styles.actionButton} accessibilityLabel="View">
                    <Icon name="eye" size={20} style={[styles.actionIcon, isDarkMode ? styles.iconDark : styles.iconLight]}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onCollect(invoice.id)} disabled={status === 'paid'} style={styles.actionButton} accessibilityLabel="Collect Payment">
                    <Icon name="banknotes" size={20} style={[styles.actionIcon, status === 'paid' ? styles.disabledIcon : (isDarkMode ? styles.iconDark : styles.iconLight)]}/>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const StatusBadge: React.FC<{status: InvoiceStatus}> = ({ status }) => {
  const { t } = useLanguage();
  if (status === 'paid') return <Badge color="green">{t('paid')}</Badge>;
  if (status === 'partially_paid') return <Badge color="amber">{t('partially_paid')}</Badge>;
  return <Badge color="red">{t('unpaid')}</Badge>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 24, // space-y-6
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24, // space-y-6
    },
    customerPhone: {
        fontSize: 14,
    },
    textSlate500: { color: '#64748b' },
    textSlate400: { color: '#94a3b8' },
    customerAddress: {
        fontSize: 14,
        maxWidth: 768, // max-w-2xl
    },
    textSlate600: { color: '#475569' },
    iconLight: { color: '#1e293b' },
    iconDark: { color: '#e2e8f0' },

    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16, // gap-4
        marginBottom: 24, // space-y-6
    },
    kpiCard: {
        flex: 1, // for responsive grid
        minWidth: '48%', // Ensure 2 cols on small screen, adjust for 3 on larger
        padding: 16,
        alignItems: 'center',
    },
    kpiCardTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    kpiCardValue: {
        fontSize: 24, // text-2xl
        fontWeight: 'bold',
    },
    textSlate800: { color: '#1e293b' },
    textSlate100: { color: '#f1f5f9' },

    invoiceHistoryCard: {
        marginBottom: 24, // space-y-6
    },
    invoiceHistoryHeader: {
        padding: 16, // p-4
        borderBottomWidth: 1,
    },
    borderSlate200: { borderColor: '#e2e8f0' },
    borderSlate700: { borderColor: '#334155' },
    invoiceHistoryTitle: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
    },
    textLight: { color: '#f8fafc' },
    textDark: { color: '#1e293b' },

    invoiceHistoryContent: {
        // No extra padding here as FlatList items will have padding
    },
    noInvoicesText: {
        padding: 32, // p-8
        textAlign: 'center',
        fontSize: 14,
    },

    tableContainer: {
        // Equivalent to overflow-x-auto no-scrollbar
        // FlatList handles scrolling natively
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc', // bg-slate-50
        padding: 16, // p-4
        borderBottomWidth: 1,
    },
    tableHeaderLight: {
        borderBottomColor: '#e2e8f0',
    },
    tableHeaderDark: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // dark:bg-slate-800/50
        borderBottomColor: '#334155',
    },
    tableHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        flex: 1, // Distribute space
    },
    tableHeaderTextRight: {
        textAlign: 'right',
    },
    tableHeaderTextCenter: {
        textAlign: 'center',
    },

    tableRowSeparatorLight: {
        height: 1,
        backgroundColor: '#e2e8f0', // border-slate-200
    },
    tableRowSeparatorDark: {
        height: 1,
        backgroundColor: '#334155', // dark:border-slate-700
    },

    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, // p-4
        borderBottomWidth: 1,
    },
    tableRowLight: {
        backgroundColor: '#ffffff', // bg-white
        borderColor: '#e2e8f0',
    },
    tableRowDark: {
        backgroundColor: '#1e293b', // bg-slate-900 (or similar dark bg)
        borderColor: '#334155',
    },
    invoiceNumberText: {
        flex: 1,
        fontWeight: '600',
    },
    invoiceDateText: {
        flex: 1,
        fontSize: 14,
    },
    textSlate300: { color: '#cbd5e1' },

    amountText: {
        flex: 1,
        textAlign: 'right',
        fontWeight: '600',
    },
    statusCell: {
        flex: 1,
        alignItems: 'center',
    },
    actionsCell: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        justifyContent: 'flex-start',
    },
    actionButton: {
        padding: 4,
    },
    actionIcon: {
        color: '#64748b', // text-slate-500
    },
    disabledIcon: {
        opacity: 0.3,
    },

    deleteCustomerButtonContainer: {
        textAlign: 'center',
        marginTop: 24, // mt-6
        alignItems: 'center', // for centering the button
    },
    deleteIcon: {
        color: '#ffffff', // text-white
    }
});