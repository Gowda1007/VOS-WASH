import type { Customer } from '../types';
import { CUSTOMERS_STORAGE_KEY } from '../constants';
import { useLocalStorage } from './useLocalStorage';

export const useCustomers = () => {
    const [customers, setCustomers] = useLocalStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);

    const addOrUpdateCustomer = (newCustomer: Customer) => {
        setCustomers(prevCustomers => {
            const existingCustomerIndex = prevCustomers.findIndex(c => c.phone === newCustomer.phone);
            if (existingCustomerIndex > -1) {
                // Update existing customer, but don't overwrite with blank address
                const updatedCustomers = [...prevCustomers];
                const existingCustomer = updatedCustomers[existingCustomerIndex];
                updatedCustomers[existingCustomerIndex] = {
                    ...existingCustomer,
                    name: newCustomer.name,
                    // Only update address if a new one is provided
                    address: newCustomer.address && newCustomer.address.trim() !== '' ? newCustomer.address : existingCustomer.address
                };
                return updatedCustomers;
            } else {
                // Add new customer
                return [...prevCustomers, newCustomer];
            }
        });
    };

    const addCustomer = (newCustomer: Customer) => {
        setCustomers(prev => [...prev, newCustomer]);
    };

    const isCustomerExists = (phone: string): boolean => {
        return customers.some(c => c.phone === phone);
    };

    return { customers, addOrUpdateCustomer, addCustomer, isCustomerExists };
};
