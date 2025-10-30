import type { 
    Invoice, 
    Customer, 
    ServiceSets, 
    AppSettings,
    PendingOrder
} from '../types';
import { 
    INVOICE_STORAGE_KEY, 
    CUSTOMERS_STORAGE_KEY, 
    SERVICES_STORAGE_KEY, 
    APP_SETTINGS_STORAGE_KEY,
    PENDING_ORDERS_STORAGE_KEY,
    DEFAULT_SERVICE_SETS
} from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';


// --- Utility Functions ---

const MOCK_API_DELAY = 200; // ms

// Generic function to get data from AsyncStorage
const getFromStorage = async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
        const item = await AsyncStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from AsyncStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// Generic function to save data to AsyncStorage
const saveToStorage = async <T>(key: string, value: T): Promise<void> => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to AsyncStorage key “${key}”:`, error);
    }
};

// --- Mock API Functions ---

// Invoices
export const getInvoices = async (): Promise<Invoice[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const invoices = await getFromStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);
    return invoices.sort((a, b) => b.id - a.id);
};

export const addInvoice = async (invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const invoices = await getFromStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);
    const newInvoice: Invoice = { ...invoiceData, id: Date.now() };
    await saveToStorage(INVOICE_STORAGE_KEY, [newInvoice, ...invoices]);
    return newInvoice;
};

export const updateInvoice = async (invoiceId: number, updatedData: Partial<Invoice>): Promise<Invoice | null> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const invoices = await getFromStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);
    let updatedInvoice: Invoice | null = null;
    const newInvoices = invoices.map(inv => {
        if (inv.id === invoiceId) {
            updatedInvoice = { ...inv, ...updatedData };
            return updatedInvoice;
        }
        return inv;
    });
    await saveToStorage(INVOICE_STORAGE_KEY, newInvoices);
    return updatedInvoice;
};

export const deleteInvoice = async (invoiceId: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const invoices = await getFromStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);
    await saveToStorage(INVOICE_STORAGE_KEY, invoices.filter(inv => inv.id !== invoiceId));
};

// Customers
export const getCustomers = async (): Promise<Customer[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);
};

export const addCustomer = async (newCustomer: Customer): Promise<Customer> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const customers = await getFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);
    await saveToStorage(CUSTOMERS_STORAGE_KEY, [...customers, newCustomer]);
    return newCustomer;
};

export const addOrUpdateCustomer = async (newCustomer: Customer): Promise<Customer> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    let customers = await getFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);
    const existingCustomerIndex = customers.findIndex(c => c.phone === newCustomer.phone);
    if (existingCustomerIndex > -1) {
        const existingCustomer = customers[existingCustomerIndex];
        customers[existingCustomerIndex] = {
            ...existingCustomer,
            name: newCustomer.name,
            address: newCustomer.address && newCustomer.address.trim() !== '' ? newCustomer.address : existingCustomer.address
        };
    } else {
        customers.push(newCustomer);
    }
    await saveToStorage(CUSTOMERS_STORAGE_KEY, customers);
    return newCustomer;
};

export const isCustomerExists = async (phone: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const customers = await getFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);
    return customers.some(c => c.phone === phone);
};

export const deleteCustomer = async (phone: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const customers = await getFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);
    await saveToStorage(CUSTOMERS_STORAGE_KEY, customers.filter(c => c.phone !== phone));
};

// Services
export const getServiceSets = async (): Promise<ServiceSets> => {
     await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<ServiceSets>(SERVICES_STORAGE_KEY, DEFAULT_SERVICE_SETS);
};

export const saveServiceSets = async (newServiceSets: ServiceSets): Promise<ServiceSets> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    await saveToStorage(SERVICES_STORAGE_KEY, newServiceSets);
    return newServiceSets;
};

// App Settings
export const getSettings = async (): Promise<AppSettings> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<AppSettings>(APP_SETTINGS_STORAGE_KEY, { upiId: '9845418725@ybl' });
};

export const saveSettings = async (newSettings: AppSettings): Promise<AppSettings> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    await saveToStorage(APP_SETTINGS_STORAGE_KEY, newSettings);
    return newSettings;
};

// Pending Orders
export const getPendingOrders = async (): Promise<PendingOrder[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<PendingOrder[]>(PENDING_ORDERS_STORAGE_KEY, []);
};

export const addPendingOrder = async (orderData: Omit<PendingOrder, 'id'>): Promise<PendingOrder> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const orders = await getPendingOrders();
    const newOrder: PendingOrder = { ...orderData, id: Date.now() };
    await saveToStorage(PENDING_ORDERS_STORAGE_KEY, [newOrder, ...orders]);
    return newOrder;
};

export const deletePendingOrder = async (orderId: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const orders = await getPendingOrders();
    await saveToStorage(PENDING_ORDERS_STORAGE_KEY, orders.filter(o => o.id !== orderId));
};
