import { useState, useEffect } from 'react';
import type { Customer } from '../core/types';
import { apiService } from '../services';
import { realtimeClient } from '../services/realtimeClient';

export const useCustomers = (setAppLoading?: (loading: boolean) => void) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCustomers = (filters?: { q?: string }) => {
        setLoading(true);
        setError(null);
        apiService.getCustomers({ q: filters?.q })
            .then(async data => {
                setCustomers(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch customers');
                console.error("Error fetching customers:", err);
                setCustomers([]); // Set to empty on fetch error if no cache
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCustomers();
        // realtime
        const baseUrl = (process.env.EXPO_PUBLIC_WS_URL || (apiService as any).config?.baseURL?.replace(/\/api$/, '')) as string;
        realtimeClient.connect(baseUrl);
        const unsubscribe = realtimeClient.subscribe('customers:', () => fetchCustomers());

        const interval = setInterval(() => {
            if (!realtimeClient.isConnected()) fetchCustomers();
        }, 60000); // reduced polling

        return () => { clearInterval(interval); unsubscribe(); };
    }, []);

    const addOrUpdateCustomer = async (newCustomer: Customer) => {
        setAppLoading?.(true);
        try {
            const updated = await apiService.addOrUpdateCustomer(newCustomer);
            setCustomers(prev => {
                const existingIndex = prev.findIndex(c => c.phone === updated.phone);
                if (existingIndex > -1) {
                    return prev.map((c, i) => i === existingIndex ? updated : c);
                }
                return [...prev, updated];
            });
        } finally {
            setAppLoading?.(false);
        }
    };

    // addCustomer is redundant since addOrUpdateCustomer handles both creation and update
    // but we keep the function signature for compatibility if it's used elsewhere.
    const addCustomer = async (newCustomer: Customer) => {
        // Delegate to addOrUpdateCustomer for unified logic
        await addOrUpdateCustomer(newCustomer);
    };

    const isCustomerExists = async (phone: string): Promise<boolean> => {
        // Check if customer exists in local state
        const exists = customers.some(c => c.phone === phone);
        if (exists) return true;

        // If not in local state, fetch from API
        setAppLoading?.(true);
        try {
            const allCustomers = await apiService.getCustomers();
            return allCustomers.some(c => c.phone === phone);
        } catch (error) {
            console.error('Error checking customer existence:', error);
            return false;
        } finally {
            setAppLoading?.(false);
        }
    };

    const deleteCustomer = async (phone: string) => {
        setAppLoading?.(true);
        try {
            await apiService.deleteCustomer(phone);
            setCustomers(prev => prev.filter(c => c.phone !== phone));
        } finally {
            setAppLoading?.(false);
        }
    };

    return {
        customers,
        loading,
        error,
        addOrUpdateCustomer,
        addCustomer,
        isCustomerExists,
        deleteCustomer
    };
};
