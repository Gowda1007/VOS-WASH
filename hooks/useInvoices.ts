import { useState, useEffect } from 'react';
import type { Invoice, InvoiceStatus, Service, Payment } from '../types';
import * as apiService from '../services/apiService';

export const calculateInvoiceTotal = (services: Service[]): number => {
    const subtotal = services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
    return Math.round(subtotal);
};

export const calculateTotalPaid = (payments: Payment[]): number => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
};

export const calculateRemainingBalance = (invoice: Invoice): number => {
    const serviceTotal = calculateInvoiceTotal(invoice.services);
    const totalPaid = calculateTotalPaid(invoice.payments);
    const oldBalance = invoice.oldBalance?.amount || 0;
    const advancePaid = invoice.advancePaid?.amount || 0;
    
    return (serviceTotal + oldBalance) - (advancePaid + totalPaid);
};

export const calculateStatus = (invoice: Invoice): InvoiceStatus => {
    const balance = calculateRemainingBalance(invoice);
    if (balance <= 0) {
        return 'paid';
    }
    const totalPaid = calculateTotalPaid(invoice.payments) + (invoice.advancePaid?.amount || 0);
    if (totalPaid > 0) {
        return 'partially_paid';
    }
    return 'unpaid';
};

export const useInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    useEffect(() => {
        const fetchInvoices = async () => {
            const data = await apiService.getInvoices();
            setInvoices(data);
        };
        fetchInvoices();
    }, []);

    const addInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
        const newInvoice = await apiService.addInvoice(invoiceData);
        setInvoices(prev => [newInvoice, ...prev]);
        return newInvoice;
    };

    const updateInvoice = async (invoiceId: number, updatedData: Partial<Invoice>): Promise<Invoice | null> => {
        const updatedInvoice = await apiService.updateInvoice(invoiceId, updatedData);
        if (updatedInvoice) {
            setInvoices(prev => 
                prev.map(inv => 
                    inv.id === invoiceId ? updatedInvoice : inv
                )
            );
        }
        return updatedInvoice;
    };

    const deleteInvoice = async (invoiceId: number) => {
        await apiService.deleteInvoice(invoiceId);
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    };

    return { invoices, addInvoice, updateInvoice, deleteInvoice };
};