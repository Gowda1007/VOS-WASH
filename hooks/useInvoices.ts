import { useState, useEffect } from 'react';
import type { Invoice, InvoiceStatus, Service, Payment } from '../types';
import * as apiService from '../services/apiService';

// ---------- ID Generation Utilities ----------

const generateAlphanumericId = (length: number = 6): string => {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export const getUniqueInvoiceNumber = (existingInvoices: Invoice[]): string => {
    const existingNumbers = new Set(existingInvoices.map(inv => inv.invoiceNumber));
    let newNumber;
    do {
        newNumber = generateAlphanumericId(6);
    } while (existingNumbers.has(newNumber));
    return newNumber;
};

// ---------- Utility Calculations ----------
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
    const balance = (serviceTotal + oldBalance) - (advancePaid + totalPaid);
    return Math.round(balance);
};

export const calculateStatus = (invoice: Invoice): InvoiceStatus => {
    const balance = calculateRemainingBalance(invoice);
    if (balance <= 0) return 'paid';
    const totalPaid = calculateTotalPaid(invoice.payments) + (invoice.advancePaid?.amount || 0);
    if (totalPaid > 0) return 'partially_paid';
    return 'unpaid';
};

// ---------- Main Hook ----------
export const useInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const fetchInvoices = () => {
        apiService.getInvoices()
            .then(setInvoices)
            .catch(error => {
                console.error("Error fetching invoices:", error);
                setInvoices([]);
            });
    };

    // Function to update local state without triggering an API call
    const syncInvoiceLocal = (updatedInvoice: Invoice) => {
        setInvoices(prev =>
            prev.map(inv =>
                inv.invoiceNumber === updatedInvoice.invoiceNumber ? updatedInvoice : inv
            )
        );
    };

    useEffect(() => {
        fetchInvoices(); // fetch once on mount
    }, []);

    const addInvoice = async (invoiceData: Invoice) => {
        try {
            const newInvoice = await apiService.addInvoice(invoiceData);
            // Immediately update local state with the new invoice to prevent race conditions
            setInvoices(prev => [...prev, newInvoice]);
            // Background refresh to ensure full synchronization
            fetchInvoices();
            return newInvoice;
        } catch (error) {
            console.error("Error adding invoice:", error);
            throw error;
        }
    };

    // Use invoiceNumber as the sole identifier
   const updateInvoice = async (invoiceNumber: string, updatedData: Partial<Invoice>): Promise<Invoice | null> => {
    if (!invoiceNumber) {
        const error = new Error("Cannot update invoice: Invoice Number is missing.");
        console.error(error);
        throw error;
    }

    try {
        // 1️⃣ Try updating the invoice normally
        const updatedInvoice = await apiService.updateInvoice(invoiceNumber, updatedData);

        // 2️⃣ If API couldn’t find the invoice, return null
        if (!updatedInvoice) {
            console.warn(`[updateInvoice] Update failed for invoice ${invoiceNumber}: Document not found.`);
            return null;
        }

        // 3️⃣ Update local state immediately with latest data
        setInvoices(prev =>
            prev.map(inv =>
                inv.invoiceNumber === updatedInvoice.invoiceNumber ? updatedInvoice : inv
            )
        );

        // 4️⃣ Background refresh to ensure perfect sync
        fetchInvoices();

        console.info(`[updateInvoice] Successfully updated invoice ${invoiceNumber}`);
        return updatedInvoice;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error updating invoice ${invoiceNumber}: ${errorMessage}`);

        // Return null on any error to prevent uncaught promise rejections and simplify error handling upstream.
        return null;
    }
};


    const deleteInvoice = async (invoiceNumber: string) => {
        try {
            await apiService.deleteInvoice(invoiceNumber);
            // Immediately update local state
            setInvoices(prev => prev.filter(inv => inv.invoiceNumber !== invoiceNumber));
            // Background refresh to ensure full synchronization
            fetchInvoices();
        } catch (error) {
            console.error(`Error deleting invoice ${invoiceNumber}:`, error);
            throw error;
        }
    };

    return { invoices, addInvoice, updateInvoice, deleteInvoice, fetchInvoices, syncInvoiceLocal };
};
