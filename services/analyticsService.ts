import type { Invoice, AnalyticsData } from '../types';
import { calculateInvoiceTotal, calculateTotalPaid, calculateRemainingBalance } from '../hooks/useInvoices';

export const calculateAnalytics = (invoices: Invoice[]): AnalyticsData => {
    const analytics: AnalyticsData = {
        totalInvoices: invoices.length,
        totalRevenue: 0,
        unpaidBalance: 0,
        totalPayments: 0,
        topServices: [],
        revenueByCustomerType: { customer: 0, garage: 0, dealer: 0 },
    };

    const serviceCounts: { [key: string]: number } = {};

    invoices.forEach(inv => {
        const invoiceTotal = calculateInvoiceTotal(inv.services);
        analytics.totalRevenue += invoiceTotal;
        
        const remainingBalance = calculateRemainingBalance(inv);
        if (remainingBalance > 0) {
            analytics.unpaidBalance += remainingBalance;
        }

        analytics.totalPayments += calculateTotalPaid(inv.payments);

        if (analytics.revenueByCustomerType[inv.customerType] !== undefined) {
             analytics.revenueByCustomerType[inv.customerType] += invoiceTotal;
        }
        
        inv.services.forEach(service => {
            serviceCounts[service.name] = (serviceCounts[service.name] || 0) + service.quantity;
        });
    });

    analytics.topServices = Object.entries(serviceCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5);

    return analytics;
};

export const filterAndGroupInvoicesForChart = (period: 'day' | 'week' | 'month' | 'year', allInvoices: Invoice[], dateField: 'invoiceDate' = 'invoiceDate') => {
    const getStartOfPeriod = (p: 'day' | 'week' | 'month' | 'year'): Date => {
        const now = new Date();
        const start = new Date(now);
        if (p === 'day') start.setHours(0, 0, 0, 0);
        else if (p === 'week') {
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
        } else if (p === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        } else if (p === 'year') {
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
        }
        return start;
    };
    
    let labels: string[] = [];
    const now = new Date();

    if (period === 'day') labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    else if (period === 'week') labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    else if (period === 'month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
    } else if (period === 'year') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    const dataMap = new Map<string, number>(labels.map(l => [l, 0]));

    allInvoices.forEach(inv => {
        // Date is DD/MM/YYYY, need to parse it correctly
        const dateParts = inv[dateField].split('/');
        if (dateParts.length !== 3) return;
        const invDate = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0]);

        if (invDate >= getStartOfPeriod(period)) {
            const invoiceTotal = calculateInvoiceTotal(inv.services);
            let key: string | undefined;

            if (period === 'day' && invDate.toDateString() === now.toDateString()) key = `${invDate.getHours()}:00`;
            else if (period === 'week') key = labels[invDate.getDay()];
            else if (period === 'month' && invDate.getMonth() === now.getMonth()) key = String(invDate.getDate());
            else if (period === 'year' && invDate.getFullYear() === now.getFullYear()) key = labels[invDate.getMonth()];

            if (key && dataMap.has(key)) {
                dataMap.set(key, (dataMap.get(key) || 0) + invoiceTotal);
            }
        }
    });
    
    const datasets = [{ data: Array.from(dataMap.values()) }];
    return { labels, datasets };
};