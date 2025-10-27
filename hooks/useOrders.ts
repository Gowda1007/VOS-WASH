import { useState, useEffect } from 'react';
import type { Order } from '../types';
import * as apiService from '../services/apiService';

export const useOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            const data = await apiService.getOrders();
            setOrders(data);
        };
        fetchOrders();
    }, []);

    const addOrder = async (orderData: Omit<Order, 'id'>) => {
        const newOrder = await apiService.addOrder(orderData);
        setOrders(prev => [newOrder, ...prev]);
    };

    const updateOrder = async (orderId: number, updatedData: Partial<Omit<Order, 'id'>>) => {
        const updatedOrder = await apiService.updateOrder(orderId, updatedData);
        if (updatedOrder) {
            setOrders(prev => 
                prev.map(o => 
                    o.id === orderId ? updatedOrder : o
                )
            );
        }
    };

    return { orders, addOrder, updateOrder };
};