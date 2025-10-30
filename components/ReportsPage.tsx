import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { Invoice } from '../types';
import { Card, Button, Icon } from './Common';
import { calculateInvoiceTotal, calculateTotalPaid } from '../hooks/useInvoices';
import { downloadPDF } from '../services/pdfService'; // This will trigger native Alert
import { useToast } from '../hooks/useToast'; // Still used for non-critical success messages if needed
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

type ReportPeriod = 'this_month' | 'last_month' | 'this_year';

interface StatCardProps {
    title: string;
    value: string | number;
    isDarkMode: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, isDarkMode }) => (
    <View style={[styles.statCard, isDarkMode ? styles.statCardDark : styles.statCardLight]}>
        <Text style={[styles.statCardTitle, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{title}</Text>
        <Text style={[styles.statCardValue, isDarkMode ? styles.textSlate100 : styles.textSlate800]}>{value}</Text>
    </View>
);

export const ReportsPage: React.FC<{ invoices: Invoice[] }> = ({ invoices }) => {
    const [period, setPeriod] = useState<ReportPeriod>('this_month');
    const { resolvedTheme } = useTheme();
    const { t } = useLanguage();
    const isDarkMode = resolvedTheme === 'dark';
    const toast = useToast(); // Kept for potential future use or non-PDF related toasts

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999); // Set end date to end of day

        switch (period) {
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0); // End of last month
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        const filteredInvoices = invoices.filter(inv => {
            // Assuming invoiceDate is "DD/MM/YYYY"
            const [day, month, year] = inv.invoiceDate.split('/').map(Number);
            const invDate = new Date(year, month - 1, day);
            invDate.setHours(0, 0, 0, 0); // Normalize invoice date to start of day for comparison
            return invDate >= startDate && invDate <= endDate;
        });

        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
        const totalCollected = filteredInvoices.reduce((sum, inv) => sum + calculateTotalPaid(inv.payments), 0);

        return {
            invoices: filteredInvoices,
            stats: {
                totalRevenue,
                totalCollected,
                invoiceCount: filteredInvoices.length,
            },
        };
    }, [invoices, period]);

    // handleDownload will now call the stubbed PDF service which shows an alert
    const handleDownload = async () => {
        const periodText = t(period);
        // The PDF service will internally show an Alert. No elementToPrint is needed for RN stub.
        await downloadPDF({ invoiceNumber: period, customerName: 'Report' }, undefined); 
        // No toast.success here, as the Alert from pdfService is sufficient.
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.headerControls}>
                <Text style={[styles.descriptionText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('analyze-revenue-and-collections')}</Text>
                <View style={styles.periodButtons}>
                    {(['this_month', 'last_month', 'this_year'] as ReportPeriod[]).map(p => (
                        <TouchableOpacity 
                            key={p} 
                            onPress={() => setPeriod(p)} 
                            style={[
                                styles.periodButton, 
                                period === p ? (isDarkMode ? styles.periodButtonActiveDark : styles.periodButtonActiveLight) : (isDarkMode ? styles.periodButtonInactiveDark : styles.periodButtonInactiveLight)
                            ]}
                        >
                            <Text style={[
                                styles.periodButtonText,
                                period === p ? (isDarkMode ? styles.textWhite : styles.textIndigo700) : (isDarkMode ? styles.textSlate400 : styles.textSlate500)
                            ]}>{t(p)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            
            <View style={styles.reportContentWrapper}>
                 <View style={styles.downloadButtonContainer}>
                    <Button onPress={handleDownload} variant="secondary">
                        <Icon name="document-duplicate" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight} /> 
                        <Text>{t('download-pdf')}</Text>
                    </Button>
                </View>
                <Card style={[styles.reportCard, isDarkMode ? styles.reportCardDark : styles.reportCardLight]}>
                    <View style={styles.statsGrid}>
                        <StatCard title={t('total-revenue')} value={`₹${filteredData.stats.totalRevenue.toLocaleString()}`} isDarkMode={isDarkMode}/>
                        <StatCard title={t('collected')} value={`₹${filteredData.stats.totalCollected.toLocaleString()}`} isDarkMode={isDarkMode}/>
                        <StatCard title={t('invoices-issued')} value={filteredData.stats.invoiceCount} isDarkMode={isDarkMode}/>
                    </View>
                    
                    <Text style={[styles.chartTitle, isDarkMode ? styles.textLight : styles.textDark]}>{t('cashflow-trend')}</Text>
                    <View style={styles.chartPlaceholder}>
                        <Text style={[styles.chartPlaceholderText, isDarkMode ? styles.textSlate500 : styles.textSlate500]}>{t('chart-unavailable-rn')}</Text>
                    </View>
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 24, // space-y-6
    },
    headerControls: {
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

    periodButtons: {
        flexDirection: 'row',
        gap: 8, // gap-2
    },
    periodButton: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        borderRadius: 8, // rounded-lg
        // capitalize
    },
    periodButtonText: {
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
    },
    periodButtonActiveLight: {
        backgroundColor: '#4f46e5', // bg-indigo-600
    },
    textWhite: { color: '#ffffff' },
    textIndigo700: { color: '#1d4ed8' }, // for active light mode button text

    periodButtonInactiveLight: {
        backgroundColor: '#ffffff', // bg-white
    },
    periodButtonInactiveDark: {
        backgroundColor: '#334155', // dark:bg-slate-700
    },

    periodButtonActiveDark: {
        backgroundColor: '#4f46e5', // bg-indigo-600 (or similar vibrant color)
    },
    
    reportContentWrapper: {
        // Equivalent to id="report-content-wrapper"
    },
    downloadButtonContainer: {
        alignItems: 'flex-end', // text-right
        marginBottom: 16, // mb-4
    },
    iconDark: { color: '#e2e8f0' },
    iconLight: { color: '#1e293b' },

    reportCard: {
        padding: 24, // p-4 sm:p-6
    },
    reportCardLight: {
        backgroundColor: '#ffffff', // bg-white
    },
    reportCardDark: {
        backgroundColor: '#1e293b', // dark:bg-slate-800
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24, // gap-6
        marginBottom: 32, // mb-8
    },
    statCard: {
        flex: 1,
        minWidth: '30%', // Approx 3 columns
        padding: 16, // p-4
        borderRadius: 8, // rounded-lg
        alignItems: 'center',
    },
    statCardLight: {
        backgroundColor: '#f1f5f9', // bg-slate-100
    },
    statCardDark: {
        backgroundColor: 'rgba(15, 23, 42, 0.5)', // dark:bg-slate-900/50
    },
    statCardTitle: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
    },
    statCardValue: {
        fontSize: 24, // text-3xl
        fontWeight: 'bold',
    },
    textSlate100: { color: '#f1f5f9' },
    textSlate800: { color: '#1e293b' },

    chartTitle: {
        fontSize: 20, // text-xl
        fontWeight: 'bold',
        marginBottom: 16, // mb-4
    },
    textLight: { color: '#f8fafc' },
    textDark: { color: '#1e293b' },

    chartPlaceholder: {
        height: 384, // h-96
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)', // A light gray box
        borderRadius: 8,
    },
    chartPlaceholderText: {
        fontSize: 16,
        textAlign: 'center',
    },
});