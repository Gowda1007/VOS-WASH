import type { Customer } from '../types';
import { CUSTOMERS_STORAGE_KEY } from '../constants';
import { useLocalStorage } from './useLocalStorage';

export const useCustomers = () => {
    const [customers, setCustomers] = useLocalStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);

    const addOrUpdateCustomer = (newCustomer: Customer) => {
        setCustomers(prevCustomers => {
            const existingCustomerIndex = prevCustomers.findIndex(c => c.phone === newCustomer.phone);
            if (existingCustomerIndex > -1) {
                // Update existing customer
                const updatedCustomers = [...prevCustomers];
                updatedCustomers[existingCustomerIndex] = {
                    ...updatedCustomers[existingCustomerIndex],
                    name: newCustomer.name,
                    address: newCustomer.address
                };
                return updatedCustomers;
            } else {
                // Add new customer
                return [...prevCustomers, newCustomer];
            }
        });
    };

    return { customers, addOrUpdateCustomer };
};
