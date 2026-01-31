import { useState, useEffect } from 'react';
import type { Invoice } from '../core/types';
import { apiService, getDataStorage } from '../services';
import { realtimeClient } from '../services/realtimeClient';
import { useNetworkStatus } from './useNetworkStatus';

// ---------- ID Generation Utilities ----------
const generateAlphanumericId = (length: number = 7): string => {
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
        newNumber = generateAlphanumericId(7);
    } while (existingNumbers.has(newNumber));
    return newNumber;
};

// ---------- Main Hook ----------

export const useInvoices = (setAppLoading?: (loading: boolean) => void) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addLoading, setAddLoading] = useState(false); // New loading state for add
    const [updateLoading, setUpdateLoading] = useState(false); // New loading state for update
    const [deleteLoading, setDeleteLoading] = useState(false); // New loading state for delete
    const [paymentLoading, setPaymentLoading] = useState(false); // New loading state for payment
    const [queue, setQueue] = useState<Array<{ id: string; type: 'add' | 'update' | 'delete' | 'payment'; payload: any }>>([]);
    const [isReplayingQueue, setIsReplayingQueue] = useState(false);

    const fetchInvoices = (filters?: { q?: string; status?: 'paid' | 'unpaid' | 'partially_paid' | 'all' | 'outstanding'; from?: string; to?: string }) => {
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
                setLoading(false);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
                console.error("Error fetching invoices:", err);
                setInvoices([]); // Set to empty on fetch error if no cache
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
        setAppLoading?.(true);
        setAddLoading(true);
        try {
            console.log(`[addInvoice] Creating invoice: ${invoiceData.invoiceNumber}`);
            const newInvoice = await apiService.addInvoice(invoiceData);
            console.log(`[addInvoice] ✅ Successfully created invoice: ${newInvoice.invoiceNumber}`);
            setInvoices(prev => [...prev, newInvoice]);
            return newInvoice;
        } catch (error) {
            // Offline or server error: enqueue and optimistic update
            console.warn(`[addInvoice] ⚠️ Failed to create invoice ${invoiceData.invoiceNumber}, queuing for retry:`, error);
            const fallback = invoiceData;
            setInvoices(prev => [...prev, fallback]);
            const qItem = { id: `q-${Date.now()}`, type: 'add' as const, payload: fallback };
            setQueue(prev => [...prev, qItem]);
            try { await getDataStorage().setItem('queue:invoices', JSON.stringify([...queue, qItem])); } catch { } // Re-added queue persistence
            return fallback;
        } finally {
            setAddLoading(false);
            setAppLoading?.(false);
        }
    };

    // Use invoiceNumber as the sole identifier
    const updateInvoice = async (invoiceNumber: string, updatedData: Partial<Invoice>): Promise<Invoice | null> => {
        if (!invoiceNumber) {
            const error = new Error("Cannot update invoice: Invoice Number is missing.");
            console.error(error);
            throw error;
        }

        setAppLoading?.(true);
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

            // Background refresh to ensure perfect sync - removed redundant fetch

            console.info(`[updateInvoice] Successfully updated invoice ${invoiceNumber}`);
            return updatedInvoice;

        } catch (error) {
            // Optimistic local update + queue for retry
            setInvoices(prev => prev.map(inv => inv.invoiceNumber === invoiceNumber ? { ...inv, ...updatedData } as Invoice : inv));
            const baseInvoice = invoices.find(i => i.invoiceNumber === invoiceNumber);
            const qItem = { id: `q-${Date.now()}`, type: 'update' as const, payload: { invoiceNumber, updatedData, baseInvoice } };
            setQueue(prev => [...prev, qItem]);
            // Removed cache persistence here; queue remains for offline sync only
            return { ...(baseInvoice as Invoice), ...(updatedData as any) };
        } finally {
            setAppLoading?.(false);
        }
    };

    const deleteInvoice = async (invoiceNumber: string) => {
        setAppLoading?.(true);
        try {
            await apiService.deleteInvoice(invoiceNumber);
            setInvoices(prev => prev.filter(inv => inv.invoiceNumber !== invoiceNumber));
        } catch (error) {
            // Optimistic delete + queue
            setInvoices(prev => prev.filter(inv => inv.invoiceNumber !== invoiceNumber));
            const qItem = { id: `q-${Date.now()}`, type: 'delete' as const, payload: { invoiceNumber } };
            setQueue(prev => [...prev, qItem]);
            // Removed cache persistence here; queue remains for offline sync only
        } finally {
            setAppLoading?.(false);
        }
    };

    // Payment helper (queue-aware)
    const recordPayment = async (invoiceNumber: string, amount: number, method: any, referenceNumber?: string) => {
        setAppLoading?.(true);
        try {
            const updated = await apiService.recordInvoicePayment(invoiceNumber, amount, method, referenceNumber);
            if (updated) {
                setInvoices(prev => prev.map(inv => inv.invoiceNumber === invoiceNumber ? updated : inv));
            }
            return updated;
        } catch (error) {
            // Optimistic local append and queue
            const payment = { amount, method, referenceNumber, date: new Date().toISOString() };
            setInvoices(prev => prev.map(inv => inv.invoiceNumber === invoiceNumber ? { ...inv, payments: [...(inv.payments || []), payment] } : inv));
            const baseInvoice = invoices.find(i => i.invoiceNumber === invoiceNumber);
            const qItem = { id: `q-${Date.now()}`, type: 'payment' as const, payload: { invoiceNumber, payment, baseInvoice } };
            setQueue(prev => [...prev, qItem]);
            // Removed cache persistence here; queue remains for offline sync only
            return null;
        } finally {
            setAppLoading?.(false);
        }
    };

    // Queue replay function
    const replayQueue = async () => {
        if (queue.length === 0 || isReplayingQueue) return;

        setIsReplayingQueue(true);
        try {
            const copy = [...queue];
            const failedAddNumbers = new Set<string>();
            for (const item of copy) {
                try {
                    if (item.type === 'add') {
                        console.log(`[replayQueue] Replaying ADD for invoice: ${item.payload.invoiceNumber}`);
                        await apiService.addInvoice(item.payload);
                        console.log(`[replayQueue] ✅ ADD successful: ${item.payload.invoiceNumber}`);
                    } else if (item.type === 'update') {
                        if (failedAddNumbers.has(item.payload.invoiceNumber)) throw new Error('Previous add failed for this invoice');
                        console.log(`[replayQueue] Replaying UPDATE for invoice: ${item.payload.invoiceNumber}`);
                        try {
                            await apiService.updateInvoice(item.payload.invoiceNumber, item.payload.updatedData);
                            console.log(`[replayQueue] ✅ UPDATE successful: ${item.payload.invoiceNumber}`);
                        } catch (e: any) {
                            const msg = String(e?.message || '');
                            if ((msg.includes('404') || msg.includes('not found')) && item.payload.baseInvoice) {
                                // Attempt fallback creation then update
                                console.warn(`[replayQueue] 404 on UPDATE; recreating invoice: ${item.payload.invoiceNumber}`);
                                await apiService.addInvoice(item.payload.baseInvoice);
                                console.log(`[replayQueue] ✅ Recreated base invoice, retrying UPDATE: ${item.payload.invoiceNumber}`);
                                await apiService.updateInvoice(item.payload.invoiceNumber, item.payload.updatedData);
                                console.log(`[replayQueue] ✅ UPDATE successful after recreate: ${item.payload.invoiceNumber}`);
                            } else {
                                throw e;
                            }
                        }
                    } else if (item.type === 'delete') {
                        console.log(`[replayQueue] Replaying DELETE for invoice: ${item.payload.invoiceNumber}`);
                        await apiService.deleteInvoice(item.payload.invoiceNumber);
                        console.log(`[replayQueue] ✅ DELETE successful: ${item.payload.invoiceNumber}`);
                    } else if (item.type === 'payment') {
                        if (failedAddNumbers.has(item.payload.invoiceNumber)) throw new Error('Previous add failed for this invoice');
                        const p = item.payload.payment;
                        console.log(`[replayQueue] Replaying PAYMENT for invoice: ${item.payload.invoiceNumber}, amount: ${p.amount}`);
                        try {
                            await apiService.recordInvoicePayment(item.payload.invoiceNumber, p.amount, p.method, p.referenceNumber);
                            console.log(`[replayQueue] ✅ PAYMENT successful: ${item.payload.invoiceNumber}`);
                        } catch (e: any) {
                            const msg = String(e?.message || '');
                            if ((msg.includes('404') || msg.includes('not found')) && item.payload.baseInvoice) {
                                console.warn(`[replayQueue] 404 on PAYMENT; recreating invoice: ${item.payload.invoiceNumber}`);
                                await apiService.addInvoice(item.payload.baseInvoice);
                                console.log(`[replayQueue] ✅ Recreated base invoice, retrying PAYMENT: ${item.payload.invoiceNumber}`);
                                await apiService.recordInvoicePayment(item.payload.invoiceNumber, p.amount, p.method, p.referenceNumber);
                                console.log(`[replayQueue] ✅ PAYMENT successful after recreate: ${item.payload.invoiceNumber}`);
                            } else {
                                throw e;
                            }
                        }
                    }
                    setQueue(prev => prev.filter(q => q.id !== item.id));
                } catch (itemError: any) {
                    console.error(`[replayQueue] ❌ Failed to replay ${item.type} for invoice ${item.type === 'add' ? item.payload.invoiceNumber : item.payload.invoiceNumber}:`, itemError?.message || itemError);
                    if (item.type === 'add') {
                        failedAddNumbers.add(item.payload.invoiceNumber);
                    }
                }
            }
            await getDataStorage().setItem('queue:invoices', JSON.stringify(queue.filter(q => !copy.map(c => c.id).includes(q.id)))); // Persist updated queue
            if (copy.length > 0) fetchInvoices(); // Trigger a refetch after replay if items were processed
        } catch (error) {
            console.error('Queue replay error:', error);
        } finally {
            setIsReplayingQueue(false);
        }
    };

    // Hook into network status to trigger immediate replay on reconnect
    useNetworkStatus(() => {
        console.info('[useInvoices] Network reconnected, triggering queue replay...');
        replayQueue();
    });

    // Load queue on start and attempt replay periodically as fallback
    useEffect(() => {
        (async () => {
            // Load queue on start
            try {
                const raw = await getDataStorage().getItem('queue:invoices');
                if (raw) {
                    const loadedQueue = JSON.parse(raw);
                    console.log(`[useInvoices] Loaded ${loadedQueue.length} queued items from storage`);
                    setQueue(loadedQueue);
                }
            } catch (err) {
                console.error('[useInvoices] Failed to load queue:', err);
            }
        })();

        // Periodic fallback replay (8s interval)
        const interval = setInterval(() => {
            replayQueue();
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    // Persist queue whenever it changes
    useEffect(() => {
        // Only persist if queue actually changes to avoid unnecessary storage writes
        // This is important for the offline sync queue
        getDataStorage().setItem('queue:invoices', JSON.stringify(queue)).catch(() => { });
    }, [queue]);

    return {
        invoices,
        loading,
        error,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        fetchInvoices,
        syncInvoiceLocal,
        recordPayment,
        addLoading,    // Export new loading states
        updateLoading,
        deleteLoading,
        paymentLoading,
    };
};
