import { useState, useEffect } from 'react';
import type { PendingOrder } from '../types';
import * as apiService from '../services/apiService';
export const usePendingOrders = () => {
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

    const fetchOrders = () => {
        apiService.getPendingOrders()
            .then(setPendingOrders)
            .catch(error => {
                console.error("Error fetching pending orders:", error);
                setPendingOrders([]);
            });
    };

    useEffect(() => {
        // Replace real-time listener with a one-time fetch
        fetchOrders();
        
        // NOTE: If real-time sync is required, a polling mechanism or WebSockets must be implemented here.
        // For now, we rely on manual refresh or state updates after CRUD operations.
    }, []);

    const addPendingOrder = async (orderData: Omit<PendingOrder, 'id'>) => {
        const newOrder = await apiService.addPendingOrder(orderData);
        // Manually refresh data after write operation
        fetchOrders();
        return newOrder;
    };
    
    const deletePendingOrder = async (orderId: string) => {
        await apiService.deletePendingOrder(orderId);
        // Immediately update local state
        setPendingOrders(prev => prev.filter(order => order.id !== orderId));
        // Background refresh to ensure full synchronization
        fetchOrders();
    };

    return { pendingOrders, addPendingOrder, deletePendingOrder };
};
