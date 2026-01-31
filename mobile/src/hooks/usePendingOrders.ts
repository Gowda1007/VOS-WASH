import { useState, useEffect, useRef } from 'react';
import type { PendingOrder } from '../core/types';
import { apiService, getDataStorage } from '../services';
import { realtimeClient } from '../services/realtimeClient';
import { useNetworkStatus } from './useNetworkStatus';

// Cache key constants
const CACHE_KEY = 'cache:pendingOrders';
const QUEUE_KEY = 'queue:orders';

export const usePendingOrders = (setAppLoading?: (loading: boolean) => void) => {
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [queue, setQueue] = useState<Array<{ id: string; type: 'add' | 'delete'; payload: any }>>([]);
    const [isReplayingQueue, setIsReplayingQueue] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const fetchOrders = (filters?: { q?: string; urgent?: boolean }) => {
        setLoading(true);
        setError(null);
        apiService.getPendingOrders({ q: filters?.q, urgent: filters?.urgent })
            .then(async data => {
                setPendingOrders(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch orders');
                console.error('Error fetching pending orders:', err);
                setPendingOrders([]); // Set to empty on fetch error if no cache
                setLoading(false);
            });
    };

    useEffect(() => {
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
        setAppLoading?.(true);
        try {
            const newOrder = await apiService.addPendingOrder(orderData);
            // Optimistically update local state
            setPendingOrders(prev => [...prev, newOrder]);
            return newOrder;
        } catch (e) {
            console.error('Error adding pending order:', e);
            // Offline or server error: enqueue and optimistic update
            const fallbackOrder = { ...orderData, id: `temp-${Date.now()}` } as PendingOrder;
            setPendingOrders(prev => [...prev, fallbackOrder]);
            setQueue(prev => [...prev, { id: `q-${Date.now()}`, type: 'add', payload: fallbackOrder }]);
            return fallbackOrder;
        } finally {
            setAppLoading?.(false);
        }
    };

    const deletePendingOrder = async (orderId: string) => {
        setAppLoading?.(true);
        try {
            await apiService.deletePendingOrder(orderId);
            // Optimistically remove
            setPendingOrders(prev => prev.filter(order => order.id !== orderId));
        } catch (e) {
            console.error('Error deleting pending order:', e);
            // Optimistic delete + queue
            setPendingOrders(prev => prev.filter(order => order.id !== orderId));
            setQueue(prev => [...prev, { id: `q-${Date.now()}`, type: 'delete', payload: { orderId } }]);
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
            for (const item of copy) {
                try {
                    if (item.type === 'add') {
                        await apiService.addPendingOrder(item.payload);
                    } else if (item.type === 'delete') {
                        await apiService.deletePendingOrder(item.payload.orderId);
                    }
                    // remove successful item from queue
                    setQueue(prev => prev.filter(q => q.id !== item.id));
                } catch (itemError) {
                    console.warn('Failed to replay queue item:', itemError);
                    // keep item in queue for next retry
                }
            }
            await getDataStorage().setItem(QUEUE_KEY, JSON.stringify(queue.filter(q => !copy.map(c => c.id).includes(q.id))));
            if (copy.length > 0) fetchOrders();
        } catch (error) {
            console.error('Queue replay error:', error);
        } finally {
            setIsReplayingQueue(false);
        }
    };

    // Hook into network status to trigger immediate replay on reconnect
    useNetworkStatus(() => {
        console.info('[usePendingOrders] Network reconnected, triggering queue replay...');
        replayQueue();
    });

    // Load queue on start and attempt replay periodically as fallback
    useEffect(() => {
        (async () => {
            try {
                const raw = await getDataStorage().getItem(QUEUE_KEY);
                if (raw) setQueue(JSON.parse(raw));
            } catch { }
        })();

        // Periodic fallback replay (8s interval)
        const interval = setInterval(() => {
            replayQueue();
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    // Persist queue whenever it changes
    useEffect(() => {
        if (queue.length >= 0) {
            getDataStorage().setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => { });
        }
    }, [queue]);

    return {
        pendingOrders,
        loading,
        error,
        addPendingOrder,
        deletePendingOrder,
        fetchOrders
    };
};
