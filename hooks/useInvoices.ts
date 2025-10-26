import { useLocalStorage } from './useLocalStorage';
import type { Invoice, InvoiceStatus, Service, Payment } from '../types';
import { INVOICE_STORAGE_KEY } from '../constants';

export const calculateInvoiceTotal = (services: Service[]): number => {
    const subtotal = services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
    // As per original logic, tax and discount cancel out, so total is rounded subtotal.
    return Math.round(subtotal);
};

export const calculateTotalPaid = (payments: Payment[]): number => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
};

export const calculateRemainingBalance = (invoice: Invoice): number => {
    const total = calculateInvoiceTotal(invoice.services);
    const paid = calculateTotalPaid(invoice.payments);
    return total - paid;
};

export const calculateStatus = (invoice: Invoice): InvoiceStatus => {
    const balance = calculateRemainingBalance(invoice);
    if (balance <= 0) {
        return 'paid';
    }
    const totalPaid = calculateTotalPaid(invoice.payments);
    if (totalPaid > 0) {
        return 'partially_paid';
    }
    return 'unpaid';
};


export const useInvoices = () => {
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);

    const addInvoice = (invoiceData: Omit<Invoice, 'id'>) => {
        const newInvoice: Invoice = {
            id: Date.now(),
            ...invoiceData,
        };
        setInvoices(prev => [newInvoice, ...prev]);
    };

    const updateInvoice = (invoiceId: number, updatedData: Partial<Invoice>) => {
        setInvoices(prev => 
            prev.map(inv => 
                inv.id === invoiceId ? { ...inv, ...updatedData } : inv
            )
        );
    };

    const deleteInvoice = (invoiceId: number) => {
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    };

    return { invoices, addInvoice, updateInvoice, deleteInvoice };
};