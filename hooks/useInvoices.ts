import { useCallback } from 'react';
import type { Invoice, InvoiceStatus } from '../types';
import { INVOICE_STORAGE_KEY } from '../constants';
import { useLocalStorage } from './useLocalStorage';

const calculateStatus = (invoice: Invoice): InvoiceStatus => {
    if (invoice.totals.remainingBalance <= 0) {
        return 'paid';
    }
    const totalPaid = (invoice.totals.total + invoice.financials.oldBalance.amount) - invoice.totals.remainingBalance;
    if (totalPaid > 0) {
        return 'partially_paid';
    }
    return 'unpaid';
};

export const useInvoices = () => {
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);

    const updateInvoiceStatus = useCallback((invoice: Invoice): Invoice => {
        return { ...invoice, status: calculateStatus(invoice) };
    }, []);

    const addInvoice = (invoice: Invoice) => {
        const newInvoice = updateInvoiceStatus(invoice);
        setInvoices([newInvoice, ...invoices]);
    };

    const updateInvoice = (invoiceId: number, updatedInvoiceData: Partial<Invoice>) => {
        const updatedInvoices = invoices.map(inv => {
            if (inv.id === invoiceId) {
                const merged = { ...inv, ...updatedInvoiceData };
                return updateInvoiceStatus(merged);
            }
            return inv;
        });
        setInvoices(updatedInvoices);
    };

    const deleteInvoice = (invoiceId: number) => {
        setInvoices(invoices.filter(inv => inv.id !== invoiceId));
    };
    
    // Ensure all invoices have a status on load
    const processedInvoices = invoices.map(inv => inv.status ? inv : updateInvoiceStatus(inv));

    return { invoices: processedInvoices, addInvoice, updateInvoice, deleteInvoice };
};
