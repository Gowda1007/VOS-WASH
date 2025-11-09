import { useState, useEffect } from 'react';
import type { Invoice } from '../core/types';
import { apiService, dataStorage } from '../services';
import { realtimeClient } from '../services/realtimeClient';

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

// ---------- Main Hook ----------

export const useInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoices = (filters?: { q?: string; status?: 'paid'|'unpaid'|'partially_paid'|'all'|'outstanding'; from?: string; to?: string }) => {
        setLoading(true);
        setError(null);
        const params: any = {};
        if (filters?.q) params.q = filters.q;
        if (filters?.status && filters.status !== 'all') {
            if (filters.status === 'outstanding') params.outstanding = true; else params.status = filters.status;
        }
        if (filters?.from) params.from = filters.from;
        if (filters?.to) params.to = filters.to;
        apiService.getInvoices(params)
            .then(async data => {
                setInvoices(data);
                try { await dataStorage.setItem('cache:invoices', JSON.stringify(data)); } catch {}
                setLoading(false);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
                console.error("Error fetching invoices:", err);
                dataStorage.getItem('cache:invoices').then(cached => {
                    if (cached) {
                        try { setInvoices(JSON.parse(cached)); } catch { setInvoices([]); }
                    } else {
                        setInvoices([]);
                    }
                });
                setLoading(false);
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
        // hydrate from cache first
        dataStorage.getItem('cache:invoices').then(cached => {
            if (cached) {
                try { setInvoices(JSON.parse(cached)); } catch {}
            }
        });
        fetchInvoices(); // initial load
        const baseUrl = (process.env.EXPO_PUBLIC_WS_URL || (apiService as any).config?.baseURL?.replace(/\/api$/, '')) as string;
        realtimeClient.connect(baseUrl);
        const unsubscribe = realtimeClient.subscribe('invoices:', () => fetchInvoices());
        const interval = setInterval(() => {
            if (!realtimeClient.isConnected()) fetchInvoices();
        }, 30000); // fallback polling only if realtime disconnected
        return () => { clearInterval(interval); unsubscribe(); };
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

            // 2️⃣ If API couldn't find the invoice, return null
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

    return { 
        invoices, 
        loading, 
        error, 
        addInvoice, 
        updateInvoice, 
        deleteInvoice, 
        fetchInvoices, 
        syncInvoiceLocal 
    };
};
