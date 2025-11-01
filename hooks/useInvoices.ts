import { useState, useEffect } from 'react';
import type { Invoice, InvoiceStatus, Service, Payment } from '../types';
import * as apiService from '../services/apiService';
import { db } from '../services/firebaseService';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

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
        const invoicesCollection = collection(db, 'invoices');
        // Order by updatedAt timestamp descending for recent invoices first
        const q = query(invoicesCollection, orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedInvoices: Invoice[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Omit<Invoice, 'id'>
            }));
            setInvoices(fetchedInvoices);
        }, (error) => {
            console.error("Error fetching invoices:", error);
            // Optionally use toast.error here if needed
        });

        return () => unsubscribe();
    }, []);

    const addInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
        // We rely on the onSnapshot listener to update the state (setInvoices)
        const newInvoice = await apiService.addInvoice(invoiceData);
        return newInvoice;
    };

    const updateInvoice = async (invoiceId: string, updatedData: Partial<Invoice>): Promise<Invoice | null> => {
        // We rely on the onSnapshot listener to update the state (setInvoices)
        const updatedInvoice = await apiService.updateInvoice(invoiceId, updatedData);
        return updatedInvoice;
    };

    const deleteInvoice = async (invoiceId: string) => {
        // We rely on the onSnapshot listener to update the state (setInvoices)
        await apiService.deleteInvoice(invoiceId);
    };

    return { invoices, addInvoice, updateInvoice, deleteInvoice };
};