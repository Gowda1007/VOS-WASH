import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Platform, Alert } from 'react-native';
import type { Invoice, InvoiceStatus } from '../types';
import { Card, Badge, Button, Icon, EmptyState } from './Common';
import { calculateInvoiceTotal, calculateStatus, calculateRemainingBalance, calculateTotalPaid } from '../hooks/useInvoices';
import { downloadListAsPDF } from '../services/pdfService';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

interface InvoiceListPageProps {
  invoices: Invoice[];
  onDelete: (invoice: Invoice) => void;
  onCollect: (invoice: Invoice) => void;
  onPreview: (invoice: Invoice) => void;
  initialFilter?: 'all' | InvoiceStatus | 'outstanding';
}

type FilterStatus = 'all' | InvoiceStatus | 'outstanding';

const parseDate = (dateString: string): Date | null => {
    // Assuming dateString is DD/MM/YYYY
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
};

export const InvoiceListPage: React.FC<InvoiceListPageProps> = ({ invoices, onDelete, onCollect, onPreview, initialFilter = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialFilter);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const toast = useToast();
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  const processedInvoices = useMemo(() => {
    return invoices.map(inv => ({
      ...inv,
      totalAmount: calculateInvoiceTotal(inv.services),
      status: calculateStatus(inv),
    }));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return processedInvoices
      .filter(inv => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = inv.customerName.toLowerCase().includes(query) ||
                             inv.customerPhone.includes(query) ||
                             inv.invoiceNumber.toLowerCase().includes(query);
        
        const matchesStatus = filterStatus === 'all' ||
                              (filterStatus === 'outstanding' && (inv.status === 'unpaid' || inv.status === 'partially_paid')) ||
                              inv.status === filterStatus;
        
        const matchesDate = (() => {
            if (!dateRange.start && !dateRange.end) return true;
            const invDate = parseDate(inv.invoiceDate) || new Date(0);
            if (!invDate) return false;

            const startDate = dateRange.start ? new Date(dateRange.start) : null;
            if (startDate) startDate.setHours(0, 0, 0, 0);

            const endDate = dateRange.end ? new Date(dateRange.end) : null;
            if (endDate) endDate.setHours(23, 59, 59, 999);


            if (startDate && endDate) return invDate >= startDate && invDate <= endDate;
            if (startDate) return invDate >= startDate;
            if (endDate) return invDate <= endDate;
            return true;
        })();

        return matchesQuery && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const dateA = parseDate(a.invoiceDate) || new Date(0);
        const dateB = parseDate(b.invoiceDate) || new Date(0);
        return dateB.getTime() - dateA.getTime(); // Sort by date descending
      });
  }, [processedInvoices, searchQuery, filterStatus, dateRange]);
  
  const handleExport = async () => {
    const headers = [t('invoice-number', 'Invoice #'), t('invoice-date', 'Date'), t('customer-name'), t('customer-phone'), t('total-amount'), t('paid-amount'), t('balance-due-label'), t('status', 'Status')];
    const data = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.invoiceDate,
      inv.customerName,
      inv.customerPhone,
      `₹${inv.totalAmount.toLocaleString('en-IN')}`,
      `₹${calculateTotalPaid(inv.payments).toLocaleString('en-IN')}`,
      `₹${calculateRemainingBalance(inv).toLocaleString('en-IN')}`,
      t(inv.status), // Translate status for PDF
    ]);
    const filename = `vos-wash-invoices-${new Date().toISOString().split('T')[0]}.pdf`;
    const title = t('invoice-list-report-title', 'VOS WASH Invoice List Report');
    await downloadListAsPDF(headers, data, filename, title);
    // Since downloadListAsPDF now shows an Alert, no need for toast here.
  };

  return (
    <View style={styles.container}>
       <Text style={styles.infoText}>{t('you-have-total-invoices', 'You have {count} total invoices.').replace('{count}', invoices.length.toString())}</Text>

      <Card style={styles.card}>
        <View style={[styles.searchExportSection, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
            <View style={styles.searchInputWrapper}>
                <TextInput
                  placeholder={t('search-invoices-placeholder')}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
                  placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                />
            </View>
            <View style={styles.exportButtonWrapper}>
                 <Button onPress={handleExport} variant="secondary" style={styles.fullWidthButton}>
                    <Icon name="document-duplicate" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight} />
                    <Text>{t('export-pdf', 'Export PDF')}</Text>
                </Button>
            </View>
        </View>
        <View style={styles.filterSection}>
             <View style={styles.dateRangeInputGroup}>
                <TextInput 
                    placeholder={t('start-date', 'Start Date')}
                    value={dateRange.start} 
                    onChangeText={text => setDateRange(p => ({...p, start: text}))} 
                    style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                    placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    keyboardType="numeric" // To help with date input
                />
                <TextInput 
                    placeholder={t('end-date', 'End Date')}
                    value={dateRange.end} 
                    onChangeText={text => setDateRange(p => ({...p, end: text}))} 
                    style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                    placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    keyboardType="numeric" // To help with date input
                />
            </View>
            <View style={styles.filterButtonGroup}>
                {(['all', 'unpaid', 'partially_paid', 'paid'] as FilterStatus[]).map(status => (
                    <FilterButton 
                        key={status} 
                        label={t(status)}
                        isActive={filterStatus === status}
                        onClick={() => setFilterStatus(status)}
                    />
                ))}
            </View>
        </View>
        
        {/* Always render mobile list as default for RN */}
        <View style={styles.mobileList}>
          {filteredInvoices.length > 0 ? (
            <FlatList
              data={filteredInvoices}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item: inv }) => (
                <InvoiceCard invoice={inv} onDelete={onDelete} onCollect={onCollect} onPreview={onPreview}/>
              )}
              ItemSeparatorComponent={() => <View style={styles.mobileListItemSeparator} />}
            />
          ) : (
              <EmptyState icon="document-text" title={t('no-invoices-found')} message={t('adjust-filters-message')} />
          )}
        </View>
      </Card>
    </View>
  );
};

const FilterButton: React.FC<{label: string; isActive: boolean; onClick: () => void}> = ({label, isActive, onClick}) => {
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    return (
        <TouchableOpacity 
            onPress={onClick} 
            style={[
                styles.filterButtonBase, 
                isActive ? styles.filterButtonActive : (isDarkMode ? styles.filterButtonInactiveDark : styles.filterButtonInactiveLight)
            ]}
        >
            <Text style={[
                styles.filterButtonText, 
                isActive ? styles.filterButtonTextActive : (isDarkMode ? styles.filterButtonTextInactiveDark : styles.filterButtonTextInactiveLight)
            ]}>{label}</Text>
        </TouchableOpacity>
    );
};

const InvoiceRow: React.FC<{invoice: any, onDelete: (invoice: Invoice) => void, onCollect: (invoice: Invoice) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onDelete, onCollect, onPreview }) => {
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    return (
    <TouchableOpacity onPress={() => onPreview(invoice)} style={[styles.tableRowBase, isDarkMode ? styles.tableRowDark : styles.tableRowLight]}>
        <View style={styles.tableCellCustomer}>
            <Text style={[styles.tableCellCustomerName, isDarkMode ? styles.textLight : styles.textDark]}>{invoice.customerName}</Text>
            <Text style={styles.tableCellInvoiceNumber}>#{invoice.invoiceNumber}</Text>
        </View>
        <Text style={styles.tableCellDate}>{invoice.invoiceDate}</Text>
        <Text style={[styles.tableCellAmount, isDarkMode ? styles.textLight : styles.textDark]}>₹{invoice.totalAmount.toLocaleString('en-IN')}</Text>
        <View style={styles.tableCellStatus}>
            <StatusBadge status={invoice.status} />
        </View>
        <View style={styles.tableCellActions}>
            <ActionButtons invoice={invoice} onCollect={onCollect} onDelete={onDelete} onPreview={onPreview} />
        </View>
    </TouchableOpacity>
);};

const InvoiceCard: React.FC<{invoice: any, onDelete: (invoice: Invoice) => void, onCollect: (invoice: Invoice) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onDelete, onCollect, onPreview }) => {
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    return (
  <View style={[styles.mobileCardBase, isDarkMode ? styles.mobileCardDark : styles.mobileCardLight]}>
    <View style={styles.mobileCardHeader}>
      <View>
        <Text style={[styles.mobileCardCustomerName, isDarkMode ? styles.textLight : styles.textDark]}>{invoice.customerName}</Text>
        <Text style={styles.mobileCardInvoiceNumber}>#{invoice.invoiceNumber}</Text>
        <Text style={styles.mobileCardDate}>{invoice.invoiceDate}</Text>
      </View>
      <StatusBadge status={invoice.status} />
    </View>
    <View style={[styles.mobileCardFooter, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
      <Text style={[styles.mobileCardAmount, isDarkMode ? styles.textLight : styles.textDark]}>₹{invoice.totalAmount.toLocaleString('en-IN')}</Text>
      <ActionButtons invoice={invoice} onCollect={onCollect} onDelete={onDelete} onPreview={onPreview} />
    </View>
  </View>
);};

const ActionButtons: React.FC<{invoice: any, onDelete: (invoice: Invoice) => void, onCollect: (invoice: Invoice) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onCollect, onDelete, onPreview }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const iconColor = isDarkMode ? '#cbd5e1' : '#64748b'; // slate-300 / slate-500
  return (
    <View style={styles.actionButtonsContainer}>
        <TouchableOpacity onPress={() => onPreview(invoice)} style={styles.actionButton} accessibilityLabel="View">
            <Icon name="eye" size={20} style={[styles.actionIcon, {color: iconColor}]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onCollect(invoice)} disabled={invoice.status === 'paid'} style={styles.actionButton} accessibilityLabel="Collect Payment">
            <Icon name="banknotes" size={20} style={[styles.actionIcon, invoice.status === 'paid' ? styles.disabledIcon : {color: iconColor}]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(invoice)} style={styles.actionButton} accessibilityLabel="Delete">
            <Icon name="trash" size={20} style={[styles.actionIcon, {color: iconColor}]} />
        </TouchableOpacity>
    </View>
);};

const StatusBadge: React.FC<{status: InvoiceStatus}> = ({ status }) => {
  const { t } = useLanguage();
  if (status === 'paid') return <Badge color="green">{t('paid')}</Badge>;
  if (status === 'partially_paid') return <Badge color="amber">{t('partially_paid')}</Badge>;
  return <Badge color="red">{t('unpaid')}</Badge>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 24,
    },
    infoText: {
        fontSize: 14,
        color: '#64748b', // text-slate-500
        marginBottom: 24, // space-y-6
    },
    card: {
        // Card styling handled by Common.tsx
    },
    searchExportSection: {
        padding: 16, // p-4
        flexDirection: 'column', // md:flex-row
        gap: 16, // gap-4
        borderBottomWidth: 1,
        // Fix: Removed direct borderBottomColor, now handled by conditional styles
        alignItems: 'flex-start',
    },
    // Fix: Added missing border and text styles
    borderSlate200: { borderColor: '#e2e8f0' },
    borderSlate700: { borderColor: '#334155' },
    textSlate400: { color: '#94a3b8' },
    textSlate500: { color: '#64748b' },

    searchInputWrapper: {
        flexGrow: 1,
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1e293b', // text
    },
    inputLight: {
        borderColor: '#cbd5e1', // border-slate-300
        backgroundColor: '#ffffff', // bg-white
        color: '#1e293b', // text-slate-800
    },
    inputDark: {
        borderColor: '#475569', // dark:border-slate-600
        backgroundColor: '#0f172a', // dark:bg-slate-900
        color: '#f8fafc', // dark:text-slate-200
    },
    exportButtonWrapper: {
        width: '100%',
    },
    fullWidthButton: {
        width: '100%',
    },
    iconLight: {
        color: '#1e293b',
    },
    iconDark: {
        color: '#e2e8f0',
    },
    filterSection: {
        padding: 16,
        flexDirection: 'column', // md:flex-row
        gap: 16, // md:gap-4
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // border-slate-200
    },
    dateRangeInputGroup: {
        flexDirection: 'row',
        gap: 16,
        flexGrow: 1,
    },
    filterButtonGroup: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    mobileList: {
        padding: 16,
    },
    mobileListItemSeparator: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 12,
    },

    filterButtonBase: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999, // rounded-full
    },
    filterButtonActive: {
        backgroundColor: '#4f46e5', // bg-indigo-600
    },
    filterButtonInactiveLight: {
        backgroundColor: '#e2e8f0', // bg-slate-200
    },
    filterButtonInactiveDark: {
        backgroundColor: '#334155', // dark:bg-slate-700
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    filterButtonTextActive: {
        color: '#ffffff', // text-white
    },
    filterButtonTextInactiveLight: {
        color: '#1e293b', // text-slate-800
    },
    filterButtonTextInactiveDark: {
        color: '#e2e8f0', // dark:text-slate-200
    },

    // Desktop Table Styles (Currently commented out in render, but styles are defined)
    desktopTable: {
        // These styles would be applied to the container if `Platform.OS === 'web'` was active
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 16, // p-4
        backgroundColor: '#f8fafc', // bg-slate-50
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
        flex: 1,
    },
    tableHeaderAmount: {
        textAlign: 'right',
    },
    tableHeaderStatus: {
        textAlign: 'center',
    },
    tableRowSeparatorLight: {
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    tableRowSeparatorDark: {
        height: 1,
        backgroundColor: '#334155',
    },
    tableRowBase: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, // p-4
        borderBottomWidth: 1,
    },
    tableRowLight: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
    },
    tableRowDark: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    tableCellCustomer: {
        flex: 1.5, // Wider column for customer info
    },
    tableCellCustomerName: {
        fontWeight: '600',
    },
    tableCellInvoiceNumber: {
        fontSize: 12,
        color: '#64748b', // text-slate-500
    },
    tableCellDate: {
        flex: 1,
        fontSize: 14,
        color: '#64748b', // text-slate-500
    },
    tableCellAmount: {
        flex: 0.7,
        textAlign: 'right',
        fontWeight: '600',
    },
    tableCellStatus: {
        flex: 0.8,
        alignItems: 'center',
    },
    tableCellActions: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 8, // gap-2
    },

    // Mobile Card Styles
    mobileCardBase: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    mobileCardLight: {
        backgroundColor: '#ffffff', // bg-white
        borderColor: '#e2e8f0', // border-slate-200
    },
    mobileCardDark: {
        backgroundColor: '#1e293b', // bg-slate-800
        borderColor: '#334155', // dark:border-slate-700
    },
    mobileCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    mobileCardCustomerName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    mobileCardInvoiceNumber: {
        fontSize: 12,
        color: '#64748b',
    },
    mobileCardDate: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    mobileCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    mobileCardAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Action Buttons
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 8, // gap-2
    },
    actionButton: {
        padding: 8, // p-2
        borderRadius: 6, // rounded-md
    },
    actionIcon: {
        color: '#64748b', // text-slate-500
    },
    disabledIcon: {
        opacity: 0.3,
    },

    // Common Text Colors (moved here to avoid repetition, could be global in a larger app)
    textLight: { color: '#f8fafc' }, // dark:text-slate-100
    textDark: { color: '#1e293b' }, // text-slate-800
});