import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Platform, Alert } from 'react-native';
import type { Customer, Invoice } from '../types';
import { Card, Button, Icon, EmptyState } from './Common';
import { calculateInvoiceTotal } from '../hooks/useInvoices';
import { downloadListAsPDF } from '../services/pdfService'; // Updated import to native alert stub
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

interface CustomerListPageProps {
    customers: Customer[];
    invoices: Invoice[];
    onViewCustomer: (customer: Customer) => void;
}

interface CustomerWithStats extends Customer {
    invoiceCount: number;
    totalSpent: number;
}

export const CustomerListPage: React.FC<CustomerListPageProps> = ({ customers, invoices, onViewCustomer }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();
    const { t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';

    const customersWithStats = useMemo(() => {
        return customers.map(customer => {
            const customerInvoices = invoices.filter(inv => inv.customerPhone === customer.phone);
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
            return {
                ...customer,
                invoiceCount: customerInvoices.length,
                totalSpent,
            };
        }).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [customers, invoices]);
    
    const filteredCustomers = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (!query) return customersWithStats;
        return customersWithStats.filter(c =>
            c.name.toLowerCase().includes(query) || c.phone.includes(query)
        );
    }, [searchQuery, customersWithStats]);

    const handleExport = async () => {
        const headers = [t('customer-name'), t('customer-phone'), t('customer-address'), t('total-invoices'), t('total-spent')];
        const data = filteredCustomers.map(c => [
            c.name,
            c.phone,
            c.address,
            c.invoiceCount,
            `₹${c.totalSpent.toLocaleString('en-IN')}`, // Format currency for PDF
        ]);
        const filename = `vos-wash-customers-${new Date().toISOString().split('T')[0]}.pdf`;
        const title = t('customer-list-report-title', 'VOS WASH Customer List Report');
        await downloadListAsPDF(headers, data, filename, title);
        // downloadListAsPDF now shows an Alert, so no need for toast here.
    };

    const hasCustomers = customers.length > 0;
    const hasSearchResults = filteredCustomers.length > 0;

    return (
        <View style={styles.container}>
            <Text style={[styles.infoText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('you-have-unique-customers', 'You have {count} unique customers.').replace('{count}', customers.length.toString())}</Text>

            <Card>
                <View style={[styles.searchExportSection, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
                     <View style={styles.searchInputWrapper}>
                        <TextInput
                            placeholder={t('search-customers-placeholder')}
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
                
                {/* Mobile View */}
                {Platform.OS !== 'web' && (
                    <View>
                        {hasSearchResults ? (
                            <FlatList
                                data={filteredCustomers}
                                keyExtractor={item => item.phone}
                                renderItem={({ item }) => <CustomerCard customer={item} onView={onViewCustomer} isDarkMode={isDarkMode} />}
                                ItemSeparatorComponent={() => <View style={isDarkMode ? styles.cardSeparatorDark : styles.cardSeparatorLight} />}
                            />
                        ) : (
                             <EmptyState 
                                icon="users" 
                                title={hasCustomers ? t('no-customers-found') : t('you-have-no-customers')} 
                                message={hasCustomers ? t('search-returned-no-results') : t('create-invoice-to-add-customer')} 
                            />
                        )}
                    </View>
                )}

                {/* Desktop/Web View - using conditional rendering based on Platform */}
                {Platform.OS === 'web' && (
                    <View style={styles.desktopTableContainer}>
                        {hasCustomers ? (
                            <View>
                                <View style={[styles.tableHeader, isDarkMode ? styles.tableHeaderDark : styles.tableHeaderLight]}>
                                    <Text style={styles.tableHeaderText}>{t('customer-name')}</Text>
                                    <Text style={styles.tableHeaderText}>{t('contact', 'Contact')}</Text>
                                    <Text style={[styles.tableHeaderText, styles.tableHeaderTextCenter]}>{t('invoices')}</Text>
                                    <Text style={[styles.tableHeaderText, styles.tableHeaderTextRight]}>{t('total-spent', 'Total Spent')}</Text>
                                </View>
                                {hasSearchResults ? (
                                    <FlatList
                                        data={filteredCustomers}
                                        keyExtractor={item => item.phone}
                                        renderItem={({ item }) => <CustomerRow customer={item} onView={onViewCustomer} isDarkMode={isDarkMode} />}
                                        ItemSeparatorComponent={() => <View style={isDarkMode ? styles.tableRowSeparatorDark : styles.tableRowSeparatorLight} />}
                                    />
                                ) : (
                                    <EmptyState icon="users" title={t('no-customers-found')} message={t('search-returned-no-results')} />
                                )}
                            </View>
                        ) : (
                            <EmptyState 
                                icon="users" 
                                title={t('you-have-no-customers')} 
                                message={t('create-invoice-to-add-customer')} 
                            />
                        )}
                    </View>
                )}
            </Card>
        </View>
    );
};

interface CustomerRowProps {
    customer: CustomerWithStats; 
    onView: (c: Customer) => void;
    isDarkMode: boolean;
}

const CustomerRow: React.FC<CustomerRowProps> = ({ customer, onView, isDarkMode }) => {
    const { t } = useLanguage();
    return (
    <TouchableOpacity onPress={() => onView(customer)} style={[styles.tableRow, isDarkMode ? styles.tableRowDark : styles.tableRowLight]}>
        <View style={styles.tableCell}>
            <Text style={[styles.customerNameText, isDarkMode ? styles.textSlate100 : styles.textSlate800]}>{customer.name}</Text>
        </View>
        <View style={styles.tableCell}>
            <Text style={[styles.customerPhoneText, isDarkMode ? styles.textSlate300 : styles.textSlate600]}>{customer.phone}</Text>
            {customer.address && customer.address !== 'N/A' && <Text style={[styles.customerAddressText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{customer.address}</Text>}
        </View>
        <Text style={[styles.invoiceCountText, isDarkMode ? styles.textSlate300 : styles.textSlate600]}>{customer.invoiceCount}</Text>
        <Text style={[styles.totalSpentText, isDarkMode ? styles.textSlate100 : styles.textSlate800]}>₹{customer.totalSpent.toLocaleString('en-IN')}</Text>
    </TouchableOpacity>
)};

interface CustomerCardProps {
    customer: CustomerWithStats; 
    onView: (c: Customer) => void;
    isDarkMode: boolean;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onView, isDarkMode }) => {
    const { t } = useLanguage();
    return (
    <TouchableOpacity onPress={() => onView(customer)} style={[styles.customerCard, isDarkMode ? styles.customerCardDark : styles.customerCardLight]}>
        <View style={styles.customerCardHeader}>
            <View>
                <Text style={[styles.customerCardName, isDarkMode ? styles.textSlate100 : styles.textSlate800]}>{customer.name}</Text>
                <Text style={[styles.customerCardPhone, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{customer.phone}</Text>
                {customer.address && customer.address !== 'N/A' && <Text style={[styles.customerCardAddress, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{customer.address}</Text>}
            </View>
            <View style={styles.customerCardStatsRight}>
                <Text style={[styles.customerCardStatLabel, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('invoices')}</Text>
                <Text style={[styles.customerCardStatValue, isDarkMode ? styles.textSlate200 : styles.textSlate700]}>{customer.invoiceCount}</Text>
            </View>
        </View>
        <View style={[styles.customerCardFooter, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
            <Text style={[styles.customerCardStatLabel, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('total-spent', 'Total Spent')}</Text>
            <Text style={[styles.customerCardTotalSpent, isDarkMode ? styles.textSlate100 : styles.textSlate800]}>₹{customer.totalSpent.toLocaleString('en-IN')}</Text>
        </View>
    </TouchableOpacity>
)};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 24, // space-y-6
    },
    infoText: {
        fontSize: 14,
        marginBottom: 24,
    },
    textSlate500: { color: '#64748b' },
    textSlate400: { color: '#94a3b8' },

    card: {
        // Handled by Common.tsx Card component
    },
    searchExportSection: {
        padding: 16,
        flexDirection: 'column',
        gap: 16,
        borderBottomWidth: 1,
        alignItems: 'flex-start',
    },
    borderSlate200: { borderColor: '#e2e8f0' },
    borderSlate700: { borderColor: '#334155' },

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
        width: '100%',
    },
    inputLight: {
        borderColor: '#cbd5e1',
        backgroundColor: '#ffffff',
        color: '#1e293b',
    },
    inputDark: {
        borderColor: '#475569',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
    },
    exportButtonWrapper: {
        width: '100%',
        // md:w-auto on web, but for RN it's full width by default unless flex container
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

    // Mobile Card List (using FlatList)
    cardSeparatorLight: {
        height: 1,
        backgroundColor: '#e2e8f0', // divide-slate-200
        marginVertical: 10,
    },
    cardSeparatorDark: {
        height: 1,
        backgroundColor: '#334155', // dark:divide-slate-700
        marginVertical: 10,
    },

    customerCard: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    customerCardLight: {
        backgroundColor: '#f8fafc', // bg-slate-50
        borderColor: '#e2e8f0', // border-slate-200
    },
    customerCardDark: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // bg-slate-800/50
        borderColor: '#334155', // dark:border-slate-700
    },
    customerCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    customerCardName: {
        fontWeight: 'bold',
    },
    customerCardPhone: {
        fontSize: 14,
    },
    customerCardAddress: {
        fontSize: 12,
        marginTop: 4,
    },
    customerCardStatsRight: {
        alignItems: 'flex-end',
    },
    customerCardStatLabel: {
        fontSize: 12,
    },
    customerCardStatValue: {
        fontWeight: '600',
    },
    customerCardFooter: {
        marginTop: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    customerCardTotalSpent: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    textSlate100: { color: '#f1f5f9' }, // FIX: Defined local color styles
    textSlate800: { color: '#1e293b' }, // FIX: Defined local color styles
    textSlate200: { color: '#e2e8f0' }, // FIX: Defined local color styles
    textSlate700: { color: '#334155' }, // FIX: Defined local color styles
    textSlate300: { color: '#cbd5e1' }, // FIX: Defined local color styles
    textSlate600: { color: '#475569' }, // FIX: Defined local color styles

    // Desktop Table (using FlatList and Views for rows/cells)
    desktopTableContainer: {
        overflow: 'hidden', // simulates no-scrollbar
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
    },
    tableHeaderLight: {
        backgroundColor: '#f8fafc', // bg-slate-50
        borderBottomColor: '#e2e8f0', // border-b-slate-200
    },
    tableHeaderDark: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // dark:bg-slate-800/50
        borderBottomColor: '#334155', // dark:border-slate-700
    },
    tableHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        flex: 1,
    },
    tableHeaderTextCenter: {
        textAlign: 'center',
    },
    tableHeaderTextRight: {
        textAlign: 'right',
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
        padding: 16,
        borderBottomWidth: 1,
    },
    tableRowLight: {
        backgroundColor: '#ffffff', // bg-white
        borderColor: '#e2e8f0', // border-slate-200
    },
    tableRowDark: {
        backgroundColor: '#1e293b', // bg-slate-900 (or similar dark bg for row)
        borderColor: '#334155', // dark:border-slate-700
    },
    tableCell: {
        flex: 1,
        paddingHorizontal: 0, // Reset default FlatList item padding if any
    },
    customerNameText: {
        fontWeight: '600',
    },
    customerPhoneText: {
        fontSize: 14,
    },
    customerAddressText: {
        fontSize: 12,
        marginTop: 4,
    },
    invoiceCountText: {
        flex: 1,
        fontSize: 14,
        textAlign: 'center',
    },
    totalSpentText: {
        flex: 1,
        fontWeight: '600',
        textAlign: 'right',
    },
});