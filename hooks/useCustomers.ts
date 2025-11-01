import { useState, useEffect } from 'react';
import type { Customer } from '../types';
import * as apiService from '../services/apiService';
import { db } from '../services/firebaseService';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        const customersCollection = collection(db, 'customers');
        // Order by name ascending
        const q = query(customersCollection, orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedCustomers: Customer[] = snapshot.docs.map(doc => ({
                phone: doc.id, // Customer phone is used as document ID
                ...doc.data() as Omit<Customer, 'phone'>
            }));
            setCustomers(fetchedCustomers);
        }, (error) => {
            console.error("Error fetching customers:", error);
        });

        return () => unsubscribe();
    }, []);

    const addOrUpdateCustomer = async (newCustomer: Customer) => {
        // We rely on the onSnapshot listener to update the state (setCustomers)
        await apiService.addOrUpdateCustomer(newCustomer);
    };

    // addCustomer is redundant since addOrUpdateCustomer handles both creation and update
    // but we keep the function signature for compatibility if it's used elsewhere.
    const addCustomer = async (newCustomer: Customer) => {
        await apiService.addOrUpdateCustomer(newCustomer);
    };

    const isCustomerExists = async (phone: string): Promise<boolean> => {
        return await apiService.isCustomerExists(phone);
    };

    const deleteCustomer = async (phone: string) => {
        // We rely on the onSnapshot listener to update the state (setCustomers)
        await apiService.deleteCustomer(phone);
    };

    return { customers, addOrUpdateCustomer, addCustomer, isCustomerExists, deleteCustomer };
};