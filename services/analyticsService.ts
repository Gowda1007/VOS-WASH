import type { Invoice, AnalyticsData } from '../types';

export const calculateAnalytics = (invoices: Invoice[]): AnalyticsData => {
    const analytics: AnalyticsData = {
        totalInvoices: invoices.length,
        totalRevenue: 0,
        unpaidBalance: 0,
        totalPayments: 0,
        // FIX: Initialize new analytics properties.
        totalOldBalance: 0,
        totalAdvancePaid: 0,
        topServices: [],
        revenueByCustomerType: { customer: 0, garage: 0, dealer: 0 },
    };

    const serviceCounts: { [key: string]: number } = {};

    invoices.forEach(inv => {
        analytics.totalRevenue += inv.totals.total;
        
        if (inv.totals.remainingBalance > 0) {
            analytics.unpaidBalance += inv.totals.remainingBalance;
        }

        // FIX: Correctly calculate total paid by checking if old balance was included.
        const totalPaid = (inv.totals.total + (inv.financials.oldBalance.included ? inv.financials.oldBalance.amount : 0)) - inv.totals.remainingBalance;
        analytics.totalPayments += totalPaid;

        // FIX: Calculate total old balance and advance paid amounts.
        if (inv.financials.oldBalance.included) {
            analytics.totalOldBalance += inv.financials.oldBalance.amount;
        }
        if (inv.financials.advancePaid.included) {
            analytics.totalAdvancePaid += inv.financials.advancePaid.amount;
        }

        if (analytics.revenueByCustomerType[inv.customerType] !== undefined) {
             analytics.revenueByCustomerType[inv.customerType] += inv.totals.total;
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

export const filterAndGroupInvoicesForChart = (period: 'day' | 'week' | 'month', allInvoices: Invoice[]) => {
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
    
    const startTime = getStartOfPeriod(period);
    const dataMap: { [key: string]: number } = {};
    let labels: string[] = [];
    const now = new Date();

    if (period === 'day') {
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        labels.forEach((_, i) => dataMap[i] = 0);
    } else if (period === 'week') {
        labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels.forEach((_, i) => dataMap[i] = 0);
    } else if (period === 'month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
        labels.forEach((_, i) => dataMap[i+1] = 0);
    }

    allInvoices.forEach(inv => {
        if (inv.id >= startTime.getTime()) {
            const invDate = new Date(inv.id);
            let key: number | undefined;
            if (period === 'day') key = invDate.getHours();
            else if (period === 'week') key = invDate.getDay();
            else if (period === 'month') key = invDate.getDate();

            if (key !== undefined && dataMap[key] !== undefined) {
                dataMap[key] += inv.totals.total;
            }
        }
    });
    
    const datasets = Object.values(dataMap);
    return { labels, datasets: [{ data: datasets }] };
};