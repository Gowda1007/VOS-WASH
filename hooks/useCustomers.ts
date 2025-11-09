import { useState, useEffect } from 'react';
import type { Customer } from '../types';
import * as apiService from '../services/apiService';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);

    const fetchCustomers = () => {
        apiService.getCustomers()
            .then(setCustomers)
            .catch(error => {
                console.error("Error fetching customers:", error);
                setCustomers([]);
            });
    };

    useEffect(() => {
        // Replace real-time listener with a one-time fetch
        fetchCustomers();
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
        return await apiService.isCustomerExists(phone);
    };

    const deleteCustomer = async (phone: string) => {
        await apiService.deleteCustomer(phone);
        // Manually refresh data after write operation
        fetchCustomers();
    };

    return { customers, addOrUpdateCustomer, addCustomer, isCustomerExists, deleteCustomer };
};