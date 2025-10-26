import { useLocalStorage } from './useLocalStorage';
import type { Order } from '../types';
import { ORDERS_STORAGE_KEY } from '../constants';

export const useOrders = () => {
    const [orders, setOrders] = useLocalStorage<Order[]>(ORDERS_STORAGE_KEY, []);

    const addOrder = (orderData: Omit<Order, 'id'>) => {
        const newOrder: Order = {
            id: Date.now(),
            ...orderData,
        };
        setOrders(prev => [newOrder, ...prev]);
    };

    const updateOrder = (orderId: number, updatedData: Partial<Omit<Order, 'id'>>) => {
        setOrders(prev => 
            prev.map(o => 
                o.id === orderId ? { ...o, ...updatedData } : o
            )
        );
    };

    return { orders, addOrder, updateOrder };
};
