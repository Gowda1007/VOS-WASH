import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform } from 'react-native';
import type { Invoice, Payment } from '../types';
import { Card, Icon, Badge } from './Common';
import { calculateInvoiceTotal } from '../hooks/useInvoices';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

interface DayBookPageProps {
    invoices: Invoice[];
    onPreviewInvoice: (invoice: Invoice) => void;
    // onCollectInvoice: (invoiceId: number) => void; // Removed, not relevant for DayBook as per App.tsx
}

interface StatCardProps {
    title: string;
    value: string | number;
    isDarkMode: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, isDarkMode }) => (
    <Card style={styles.statCard}>
        <Text style={[styles.statCardTitle, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{title}</Text>
        <Text style={[styles.statCardValue, isDarkMode ? styles.textSlate100 : styles.textSlate800]}>{value}</Text>
    </Card>
);

const toISODateString = (date: Date) => {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
};

export const DayBookPage: React.FC<DayBookPageProps> = ({ invoices, onPreviewInvoice }) => {
    const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));
    const { t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';

    const dayBookData = useMemo(() => {
        const date = new Date(selectedDate);
        // Adjust for timezone if necessary, assuming selectedDate is YYYY-MM-DD local
        // Setting to midnight local time for consistent comparison
        date.setHours(0, 0, 0, 0); 
        
        // Format for invoice.invoiceDate which is DD/MM/YYYY
        const dateStringForComparison = date.toLocaleDateString("en-IN"); 

        const invoicesForDay = invoices.filter(inv => inv.invoiceDate === dateStringForComparison);
        
        const paymentsForDay: (Payment & { invoice: Invoice })[] = [];
        invoices.forEach(inv => {
            inv.payments.forEach(p => {
                if (p.date === dateStringForComparison) {
                    paymentsForDay.push({ ...p, invoice: inv });
                }
            });
        });

        const revenue = invoicesForDay.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
        const collections = paymentsForDay.reduce((sum, p) => sum + p.amount, 0);
        const cashCollections = paymentsForDay.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
        const upiCollections = paymentsForDay.filter(p => p.method === 'upi').reduce((sum, p) => sum + p.amount, 0);

        return {
            date: dateStringForComparison,
            invoices: invoicesForDay,
            payments: paymentsForDay,
            stats: {
                revenue,
                collections,
                newInvoices: invoicesForDay.length,
                cashCollections,
                upiCollections
            }
        };
    }, [selectedDate, invoices]);

    return (
        <View style={styles.container}>
            <View style={styles.headerSection}>
                 <Text style={[styles.descriptionText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('day-book-description')}</Text>
                 <TextInput 
                    value={selectedDate} 
                    onChangeText={setSelectedDate} // Assuming user types YYYY-MM-DD
                    style={[styles.dateInput, isDarkMode ? styles.inputDark : styles.inputLight]} 
                    placeholder={t('date-placeholder', 'YYYY-MM-DD')}
                    placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    keyboardType="number-pad" // Hint for number input
                />
            </View>

            <View style={styles.statCardsGrid}>
                <StatCard title={t('total-revenue')} value={`₹${dayBookData.stats.revenue.toLocaleString('en-IN')}`} isDarkMode={isDarkMode}/>
                <StatCard title={t('collected')} value={`₹${dayBookData.stats.collections.toLocaleString('en-IN')}`} isDarkMode={isDarkMode}/>
                <StatCard title={t('new-invoices')} value={dayBookData.stats.newInvoices} isDarkMode={isDarkMode}/>
                 <StatCard title={t('cash-upi', 'Cash / UPI')} value={`₹${dayBookData.stats.cashCollections} / ₹${dayBookData.stats.upiCollections}`} isDarkMode={isDarkMode}/>
            </View>
            
            <View style={styles.dataGrid}>
                <Card style={styles.cardItem}>
                    <View style={[styles.cardHeader, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
                        <Text style={[styles.cardTitle, isDarkMode ? styles.textLight : styles.textDark]}>{t('invoices-created')}</Text>
                    </View>
                     <View style={styles.listContainer}>
                        {dayBookData.invoices.length > 0 ? (
                            <FlatList
                                data={dayBookData.invoices}
                                keyExtractor={item => item.id.toString()}
                                renderItem={({ item: inv }) => (
                                    <View style={[styles.listItem, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
                                        <Text style={[styles.listItemText, isDarkMode ? styles.textLight : styles.textDark]}>{inv.customerName}</Text>
                                        <Text style={[styles.listItemAmount, isDarkMode ? styles.textLight : styles.textDark]}>₹{calculateInvoiceTotal(inv.services)}</Text>
                                        <TouchableOpacity onPress={() => onPreviewInvoice(inv)} style={styles.listItemButton}>
                                            <Icon name="eye" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight}/>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        ) : (
                            <Text style={[styles.emptyListText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('no-invoices-on-day')}</Text>
                        )}
                     </View>
                </Card>
                 <Card style={styles.cardItem}>
                    <View style={[styles.cardHeader, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
                        <Text style={[styles.cardTitle, isDarkMode ? styles.textLight : styles.textDark]}>{t('payments-collected')}</Text>
                    </View>
                     <View style={styles.listContainer}>
                        {dayBookData.payments.length > 0 ? (
                            <FlatList
                                data={dayBookData.payments}
                                keyExtractor={(item, index) => `${item.invoice.id}-${index}`}
                                renderItem={({ item: p, index }) => (
                                     <View key={`${p.invoice.id}-${index}`} style={[styles.listItem, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
                                        <Text style={[styles.listItemText, isDarkMode ? styles.textLight : styles.textDark]}>{p.invoice.customerName} <Text style={styles.invoiceNumberSmall}>(#{p.invoice.invoiceNumber})</Text></Text>
                                        <Text style={[styles.listItemAmount, isDarkMode ? styles.textLight : styles.textDark]}>₹{p.amount}</Text>
                                        <Badge color={p.method === 'cash' ? 'green' : 'blue'}>{p.method}</Badge>
                                    </View>
                                )}
                            />
                        ) : (
                            <Text style={[styles.emptyListText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('no-payments-on-day')}</Text>
                        )}
                     </View>
                </Card>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 24, // space-y-6
    },
    headerSection: {
        flexDirection: 'column', // sm:flex-row
        justifyContent: 'space-between',
        alignItems: 'flex-start', // sm:items-center
        gap: 16, // gap-4
        marginBottom: 24, // space-y-6
    },
    descriptionText: {
        fontSize: 14,
    },
    textSlate500: { color: '#64748b' },
    textSlate400: { color: '#94a3b8' },

    dateInput: {
        width: '100%', // w-full sm:w-auto
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-3
        fontSize: 16, // text-base
        borderWidth: 1,
        borderRadius: 8, // rounded-lg
    },
    inputLight: {
        borderColor: '#cbd5e1', // border-slate-300
        backgroundColor: '#ffffff', // bg-white
        color: '#1e293b', // text-slate-800
    },
    inputDark: {
        borderColor: '#475569', // dark:border-slate-600
        backgroundColor: '#0f172a', // dark:bg-slate-900
        color: '#f8fafc', // dark:text-slate-50
    },

    statCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16, // gap-4
        marginBottom: 32, // space-y-8
    },
    statCard: {
        flex: 1,
        minWidth: '48%', // Approx 2 columns for smaller screens
        padding: 16, // p-4
        alignItems: 'center',
    },
    statCardTitle: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
    },
    statCardValue: {
        fontSize: 24, // text-2xl
        fontWeight: 'bold',
    },
    textSlate100: { color: '#f1f5f9' },
    textSlate800: { color: '#1e293b' },

    dataGrid: {
        flexDirection: 'column', // grid grid-cols-1 lg:grid-cols-2
        gap: 32, // gap-8
    },
    cardItem: {
        flex: 1,
    },
    cardHeader: {
        padding: 16, // p-4
        borderBottomWidth: 1,
    },
    borderSlate200: { borderColor: '#e2e8f0' },
    borderSlate700: { borderColor: '#334155' },

    cardTitle: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
    },
    textLight: { color: '#f8fafc' },
    textDark: { color: '#1e293b' },

    listContainer: {
        // overflow-x-auto no-scrollbar - FlatList handles scrolling
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12, // p-3
        borderTopWidth: 1, // simulates border-t
    },
    listItemText: {
        flex: 1,
        color: '#1e293b', // default text
    },
    invoiceNumberSmall: {
        fontSize: 12, // text-xs
        color: '#94a3b8', // text-slate-400
    },
    listItemAmount: {
        fontWeight: '600', // font-semibold
        marginRight: 16, // Equivalent to space between amount and badge
    },
    listItemButton: {
        padding: 4,
    },
    iconDark: { color: '#e2e8f0' },
    iconLight: { color: '#1e293b' },

    emptyListText: {
        padding: 32, // p-8
        textAlign: 'center',
        fontSize: 14,
    },
});