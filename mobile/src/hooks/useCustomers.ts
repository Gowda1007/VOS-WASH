import { useState, useEffect } from 'react';
import type { Customer } from '../core/types';
import { apiService, dataStorage } from '../services';
import { realtimeClient } from '../services/realtimeClient';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCustomers = (filters?: { q?: string }) => {
        setLoading(true);
        setError(null);
        apiService.getCustomers({ q: filters?.q })
            .then(async data => {
                setCustomers(data);
                try { await dataStorage.setItem('cache:customers', JSON.stringify(data)); } catch {}
                setLoading(false);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch customers');
                console.error("Error fetching customers:", err);
                dataStorage.getItem('cache:customers').then(cached => {
                    if (cached) {
                        try { setCustomers(JSON.parse(cached)); } catch { setCustomers([]); }
                    } else {
                        setCustomers([]);
                    }
                });
                setLoading(false);
            });
    };

    useEffect(() => {
        // hydrate from cache first
        dataStorage.getItem('cache:customers').then(cached => { if (cached) { try { setCustomers(JSON.parse(cached)); } catch {} } });
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
        await apiService.addOrUpdateCustomer(newCustomer);
        // Manually refresh data after write operation
        fetchCustomers();
    };

    // addCustomer is redundant since addOrUpdateCustomer handles both creation and update
    // but we keep the function signature for compatibility if it's used elsewhere.
    const addCustomer = async (newCustomer: Customer) => {
        await apiService.addOrUpdateCustomer(newCustomer);
        // Manually refresh data after write operation
        fetchCustomers();
    };

    const isCustomerExists = async (phone: string): Promise<boolean> => {
        // Check if customer exists in local state
        const exists = customers.some(c => c.phone === phone);
        if (exists) return true;
        
        // If not in local state, fetch from API
        try {
            const allCustomers = await apiService.getCustomers();
            return allCustomers.some(c => c.phone === phone);
        } catch (error) {
            console.error('Error checking customer existence:', error);
            return false;
        }
    };

    const deleteCustomer = async (phone: string) => {
        await apiService.deleteCustomer(phone);
        // Manually refresh data after write operation
        fetchCustomers();
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
