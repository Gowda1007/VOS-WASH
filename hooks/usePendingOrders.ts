import { useState, useEffect } from 'react';
import type { PendingOrder } from '../types';
import * as apiService from '../services/apiService';

export const usePendingOrders = () => {
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            const data = await apiService.getPendingOrders();
            setPendingOrders(data);
        };
        fetchOrders();
    }, []);

    const addPendingOrder = async (orderData: Omit<PendingOrder, 'id'>) => {
        const newOrder = await apiService.addPendingOrder(orderData);
        setPendingOrders(prev => [newOrder, ...prev]);
        return newOrder;
    };
    
    const deletePendingOrder = async (orderId: number) => {
        await apiService.deletePendingOrder(orderId);
        setPendingOrders(prev => prev.filter(order => order.id !== orderId));
    };

    return { pendingOrders, addPendingOrder, deletePendingOrder };
};
