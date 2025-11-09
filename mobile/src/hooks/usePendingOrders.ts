import { useState, useEffect, useRef } from 'react';
import type { PendingOrder } from '../core/types';
import { apiService, dataStorage } from '../services';
import { realtimeClient } from '../services/realtimeClient';

// Cache key constant
const CACHE_KEY = 'cache:pendingOrders';

export const usePendingOrders = () => {
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const fetchOrders = (filters?: { q?: string; urgent?: boolean }) => {
        setLoading(true);
        setError(null);
        apiService.getPendingOrders({ q: filters?.q, urgent: filters?.urgent })
            .then(async data => {
                setPendingOrders(data);
                try { await dataStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
                setLoading(false);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch orders');
                console.error('Error fetching pending orders:', err);
                // Fallback to cache
                dataStorage.getItem(CACHE_KEY).then(cached => {
                    if (cached) {
                        try { setPendingOrders(JSON.parse(cached)); } catch { setPendingOrders([]); }
                    } else {
                        setPendingOrders([]);
                    }
                });
                setLoading(false);
            });
    };

    useEffect(() => {
        // Hydrate from cache first for faster UI
        dataStorage.getItem(CACHE_KEY).then(cached => { if (cached) { try { setPendingOrders(JSON.parse(cached)); } catch {} } });
        fetchOrders(); // initial load

        // Establish realtime connection (singleton) & subscription
    const baseUrl = (process.env.EXPO_PUBLIC_WS_URL || (apiService as any).config?.baseURL?.replace(/\/api$/, '')) as string;
    realtimeClient.connect(baseUrl);
        const unsubscribe = realtimeClient.subscribe('orders:', () => {
            // On any orders:* event, refresh from server
            fetchOrders();
        });

        // Polling fallback: slower interval, skip if WS is healthy
        pollingRef.current = setInterval(() => {
            // Skip frequent polling when realtime is connected
            if (!realtimeClient.isConnected()) fetchOrders();
        }, 60000); // 60s fallback polling

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            unsubscribe();
        };
    }, []);

    const addPendingOrder = async (orderData: Omit<PendingOrder, 'id'>) => {
        try {
            const newOrder = await apiService.addPendingOrder(orderData);
            // Optimistically update local state
            setPendingOrders(prev => [...prev, newOrder]);
            // Background refresh to ensure full sync
            fetchOrders();
            return newOrder;
        } catch (e) {
            console.error('Error adding pending order:', e);
            throw e;
        }
    };

    const deletePendingOrder = async (orderId: string) => {
        try {
            await apiService.deletePendingOrder(orderId);
            // Optimistically remove
            setPendingOrders(prev => prev.filter(order => order.id !== orderId));
            // Background refresh
            fetchOrders();
        } catch (e) {
            console.error('Error deleting pending order:', e);
            throw e;
        }
    };

    return {
        pendingOrders,
        loading,
        error,
        addPendingOrder,
        deletePendingOrder,
        fetchOrders
    };
};
