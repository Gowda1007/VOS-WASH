import { useState, useEffect } from 'react';
import type { PendingOrder } from '../types';
import * as apiService from '../services/apiService';
import { db } from '../services/firebaseService';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export const usePendingOrders = () => {
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

    useEffect(() => {
        const ordersCollection = collection(db, 'pendingOrders');
        // Order by orderDate or updatedAt descending
        const q = query(ordersCollection, orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders: PendingOrder[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Omit<PendingOrder, 'id'>
            }));
            setPendingOrders(fetchedOrders);
        }, (error) => {
            console.error("Error fetching pending orders:", error);
        });

        return () => unsubscribe();
    }, []);

    const addPendingOrder = async (orderData: Omit<PendingOrder, 'id'>) => {
        // We rely on the onSnapshot listener to update the state (setPendingOrders)
        const newOrder = await apiService.addPendingOrder(orderData);
        return newOrder;
    };
    
    const deletePendingOrder = async (orderId: string) => {
        // We rely on the onSnapshot listener to update the state (setPendingOrders)
        await apiService.deletePendingOrder(orderId);
    };

    return { pendingOrders, addPendingOrder, deletePendingOrder };
};
