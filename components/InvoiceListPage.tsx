import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Platform, Alert } from 'react-native';
import type { Invoice, InvoiceStatus } from '../types';
import { Card, Badge, Button, Icon, EmptyState } from './Common';
import { calculateInvoiceTotal, calculateStatus, calculateRemainingBalance, calculateTotalPaid } from '../hooks/useInvoices';
import { downloadListAsPDF } from '../services/pdfService'; // Updated import to native alert stub
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

interface InvoiceListPageProps {
  invoices: Invoice[];
  onDelete: (invoice: Invoice) => void; // FIX: Changed type to Invoice
  onCollect: (invoice: Invoice) => void; // FIX: Changed type to Invoice
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
            const invDate = parseDate(inv.invoiceDate);
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
        <View style={styles.searchExportSection}>
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
                    placeholder={t('start-date', 'Start Date')} // Add translation
                    value={dateRange.start} 
                    onChangeText={text => setDateRange(p => ({...p, start: text}))} 
                    style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                    placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    keyboardType="numeric" // To help with date input
                />
                <TextInput 
                    placeholder={t('end-date', 'End Date')} // Add translation
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

        <View style={styles.desktopTable}>
            {filteredInvoices.length > 0 ? (
                <View>
                    <View style={[styles.tableHeader, isDarkMode ? styles.tableHeaderDark : styles.tableHeaderLight]}>
                        <Text style={styles.tableHeaderText}>{t('customer-name')}</Text>
                        <Text style={styles.tableHeaderText}>{t('invoice-date', 'Date')}</Text>
                        <Text style={[styles.tableHeaderText, styles.tableHeaderAmount]}>{t('invoice-total', 'Amount')}</Text>
                        <Text style={[styles.tableHeaderText, styles.tableHeaderStatus]}>{t('status', 'Status')}</Text>
                        <Text style={styles.tableHeaderText}>{t('actions', 'Actions')}</Text>
                    </View>
                    <FlatList
                        data={filteredInvoices}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item: inv }) => (
                            <InvoiceRow invoice={inv} onDelete={onDelete} onCollect={onCollect} onPreview={onPreview}/>
                        )}
                        ItemSeparatorComponent={() => <View style={isDarkMode ? styles.tableRowSeparatorDark : styles.tableRowSeparatorLight} />} {/* FIX: Wrapped style in View */}
                    />
                </View>
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

const InvoiceRow: React.FC<{invoice: any, onDelete: (invoice: Invoice) => void, onCollect: (invoice: Invoice) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onDelete, onCollect, onPreview }) => { // FIX: Changed id to Invoice
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

const InvoiceCard: React.FC<{invoice: any, onDelete: (invoice: Invoice) => void, onCollect: (invoice: Invoice) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onDelete, onCollect, onPreview }) => { // FIX: Changed id to Invoice
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
    <View style={styles.mobileCardFooter}>
      <Text style={[styles.mobileCardAmount, isDarkMode ? styles.textLight : styles.textDark]}>₹{invoice.totalAmount.toLocaleString('en-IN')}</Text>
      <ActionButtons invoice={invoice} onCollect={onCollect} onDelete={onDelete} onPreview={onPreview} />
    </View>
  </View>
);};

const ActionButtons: React.FC<{invoice: any, onDelete: (invoice: Invoice) => void, onCollect: (invoice: Invoice) => void, onPreview: (inv: Invoice) => void}> = ({ invoice, onCollect, onDelete, onPreview }) => { // FIX: Changed id to Invoice
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const iconColor = isDarkMode ? '#cbd5e1' : '#64748b'; // slate-300 / slate-500
  return (
    <View style={styles.actionButtonsContainer}>
        <TouchableOpacity onPress={() => onPreview(invoice)} style={styles.actionButton} accessibilityLabel="View">
            <Icon name="eye" size={20} style={[styles.actionIcon, {color: iconColor}]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onCollect(invoice)} disabled={invoice.status === 'paid'} style={styles.actionButton} accessibilityLabel="Collect Payment"> {/* FIX: Passed entire invoice object */}
            <Icon name="banknotes" size={20} style={[styles.actionIcon, invoice.status === 'paid' ? styles.disabledIcon : {color: iconColor}]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(invoice)} style={styles.actionButton} accessibilityLabel="Delete"> {/* FIX: Passed entire invoice object */}
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
        borderBottomColor: '#e2e8f0', // border-slate-200
        alignItems: 'flex-start',
    },
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
        color: '#1e293b', // text-slate-800
        width: '100%',
    },
    inputLight: {
        borderColor: '#cbd5e1', // border-slate-300
        backgroundColor: '#ffffff', // bg-white
    },
    inputDark: {
        borderColor: '#475569', // dark:border-slate-600
        backgroundColor: '#0f172a', // dark:bg-slate-900
        color: '#f8fafc', // dark:text-slate-50
    },
    exportButtonWrapper: {
        width: '100%', // w-full md:w-auto
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
        padding: 16, // p-4
        flexDirection: 'column', // sm:flex-row
        gap: 16, // gap-4
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // border-slate-200
    },
    dateRangeInputGroup: {
        flexDirection: 'column', // sm:flex-row
        gap: 8, // gap-2
        flexGrow: 1,
    },
    filterButtonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8, // gap-2
        alignItems: 'center',
    },
    filterButtonBase: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        borderRadius: 6, // rounded-md
        // transition - activeOpacity
        // capitalize
    },
    filterButtonText: {
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
    },
    filterButtonActive: {
        backgroundColor: '#4f46e5', // bg-indigo-600
    },
    filterButtonTextActive: {
        color: '#ffffff', // text-white
    },
    filterButtonInactiveLight: {
        backgroundColor: '#ffffff', // bg-white
        borderColor: '#cbd5e1', // border-slate-300
        borderWidth: 1,
        // hover:bg-slate-100
    },
    filterButtonTextInactiveLight: {
        color: '#475569', // text-slate-600
    },
    filterButtonInactiveDark: {
        backgroundColor: '#334155', // dark:bg-slate-700
        borderColor: '#475569', // dark:border-slate-600
        borderWidth: 1,
        // dark:hover:bg-slate-600
    },
    filterButtonTextInactiveDark: {
        color: '#e2e8f0', // dark:text-slate-200
    },

    mobileList: {
        // md:hidden
        display: Platform.OS === 'web' ? 'none' : 'flex',
    },
    mobileListItemSeparator: {
        height: 1,
        backgroundColor: '#e2e8f0', // divide-slate-200
    },
    
    mobileCardBase: {
        padding: 16, // p-4
        borderRadius: 8, // rounded-lg
        borderWidth: 1,
        // bg-slate-50 dark:bg-slate-800/50
        // border-slate-200 dark:border-slate-700
    },
    mobileCardLight: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
    },
    mobileCardDark: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // bg-slate-800/50
        borderColor: '#334155', // dark:border-slate-700
    },
    mobileCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    mobileCardCustomerName: {
        fontWeight: 'bold',
    },
    mobileCardInvoiceNumber: {
        fontSize: 14,
        color: '#64748b', // text-slate-500
    },
    mobileCardDate: {
        fontSize: 12,
        color: '#64748b', // text-slate-500
    },
    mobileCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 16, // mt-4
        paddingTop: 8, // pt-2
        borderTopWidth: 1,
        borderColor: '#e2e8f0', // border-slate-200
    },
    mobileCardAmount: {
        fontSize: 20, // text-xl
        fontWeight: 'bold',
    },

    desktopTable: {
        // hidden md:block
        display: Platform.OS === 'web' ? 'flex' : 'none',
        overflow: 'hidden', // no-scrollbar
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc', // bg-slate-50
        padding: 16, // p-4
        borderBottomWidth: 1,
    },
    tableHeaderLight: {
        borderBottomColor: '#e2e8f0', // border-b-slate-200
    },
    tableHeaderDark: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // dark:bg-slate-800/50
        borderBottomColor: '#334155', // dark:border-slate-700
    },
    tableHeaderText: {
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
        color: '#475569', // text-slate-600
        flex: 1, // Distribute space
    },
    tableHeaderAmount: {
        textAlign: 'right',
    },
    tableHeaderStatus: {
        textAlign: 'center',
    },
    tableRowSeparatorLight: { // FIX: Renamed and added directly to styles
        height: 1,
        backgroundColor: '#e2e8f0', // border-slate-200
    },
    tableRowSeparatorDark: { // FIX: Renamed and added directly to styles
        height: 1,
        backgroundColor: '#334155', // dark:border-slate-700
    },
    tableRowBase: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, // p-4
        borderBottomWidth: 1,
        // hover:bg-slate-50 dark:hover:bg-slate-800/50
    },
    tableRowLight: {
        borderColor: '#e2e8f0', // border-slate-200
    },
    tableRowDark: {
        borderColor: '#334155', // dark:border-slate-700
        backgroundColor: '#1e293b', // Ensure background for dark mode
    },
    tableCellCustomer: {
        flex: 1,
    },
    tableCellCustomerName: {
        fontWeight: '600', // font-semibold
        color: '#1e293b', // text-slate-800
    },
    tableCellInvoiceNumber: {
        fontSize: 14, // text-sm
        color: '#64748b', // text-slate-500
    },
    tableCellDate: {
        flex: 1,
        fontSize: 14, // text-sm
        color: '#475569', // text-slate-600
    },
    tableCellAmount: {
        flex: 1,
        fontWeight: '600', // font-semibold
        textAlign: 'right',
    },
    tableCellStatus: {
        flex: 1,
        alignItems: 'center',
    },
    tableCellActions: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        justifyContent: 'flex-start',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
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
    textDark: { color: '#1e293b' }, // FIX: Defined local color styles
    textLight: { color: '#f8fafc' }, // FIX: Defined local color styles
});