import type { Invoice, AnalyticsData } from '../types';
import { calculateInvoiceTotal, calculateTotalPaid, calculateRemainingBalance } from '../hooks/useInvoices';

export const calculateAnalytics = (invoices: Invoice[]): AnalyticsData => {
    const analytics: AnalyticsData = {
        totalInvoices: invoices.length,
        totalRevenue: 0,
        unpaidBalance: 0,
        totalPayments: 0,
        topServices: [],
        revenueByCustomerType: { customer: 0, garage_service_station: 0, dealer: 0 },
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