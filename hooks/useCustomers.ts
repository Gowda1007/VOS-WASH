import { useState, useEffect } from 'react';
import type { Customer } from '../types';
import * as apiService from '../services/apiService';
import { useAsyncStorage } from './useAsyncStorage'; // FIX: Updated import

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        const fetchCustomers = async () => {
            const data = await apiService.getCustomers();
            setCustomers(data);
        };
        fetchCustomers();
    }, []);

    const addOrUpdateCustomer = async (newCustomer: Customer) => {
        const updatedCustomer = await apiService.addOrUpdateCustomer(newCustomer);
        setCustomers(prevCustomers => {
            const existingCustomerIndex = prevCustomers.findIndex(c => c.phone === updatedCustomer.phone);
            if (existingCustomerIndex > -1) {
                const updatedCustomers = [...prevCustomers];
                updatedCustomers[existingCustomerIndex] = updatedCustomer;
                return updatedCustomers;
            } else {
                return [...prevCustomers, updatedCustomer];
            }
        });
    };

    const addCustomer = async (newCustomer: Customer) => {
        const addedCustomer = await apiService.addCustomer(newCustomer);
        setCustomers(prev => [...prev, addedCustomer]);
    };

    const isCustomerExists = async (phone: string): Promise<boolean> => {
        return await apiService.isCustomerExists(phone);
    };

    const deleteCustomer = async (phone: string) => {
        await apiService.deleteCustomer(phone);
        setCustomers(prev => prev.filter(c => c.phone !== phone));
    };

    return { customers, addOrUpdateCustomer, addCustomer, isCustomerExists, deleteCustomer };
};