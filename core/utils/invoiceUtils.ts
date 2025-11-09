// Platform-agnostic invoice calculation utilities

import type { Invoice, Service, InvoiceStatus } from '../types';

export const calculateInvoiceTotal = (services: Service[]): number => {
    const subtotal = services.reduce((sum, s) => sum + s.price * s.quantity, 0);
    const tax = subtotal * 0.18; // 18% GST
    return subtotal + tax;
};

export const calculateStatus = (invoice: Invoice): InvoiceStatus => {
    const totalDue = calculateTotalDue(invoice);
    const totalPaid = calculateTotalPaid(invoice);

    if (totalPaid >= totalDue) return 'paid';
    if (totalPaid > 0) return 'partially_paid';
    return 'unpaid';
};

export const calculateTotalDue = (invoice: Invoice): number => {
    const serviceTotal = calculateInvoiceTotal(invoice.services);
    const oldBalance = invoice.oldBalance?.amount || 0;
    const advancePaid = invoice.advancePaid?.amount || 0;
    return serviceTotal + oldBalance - advancePaid;
};

export const calculateTotalPaid = (invoice: Invoice): number => {
    return invoice.payments.reduce((sum, p) => sum + p.amount, 0);
};

export const calculateRemainingBalance = (invoice: Invoice): number => {
    const totalDue = calculateTotalDue(invoice);
    const totalPaid = calculateTotalPaid(invoice);
    return Math.max(0, totalDue - totalPaid);
};

export const generateUniqueInvoiceNumber = (existingInvoices: Invoice[]): string => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    const prefix = `${year}${month}${day}`;

    const invoicesForToday = existingInvoices.filter(inv => inv.invoiceNumber.startsWith(prefix));
    const maxCounter = invoicesForToday.reduce((max, inv) => {
        const counter = parseInt(inv.invoiceNumber.slice(-3), 10);
        return isNaN(counter) ? max : Math.max(max, counter);
    }, 0);

    const newCounter = (maxCounter + 1).toString().padStart(3, '0');
    return `${prefix}${newCounter}`;
};

export const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const capitalizeWords = (str: string): string => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};
