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


// --- Utility Functions ---

const MOCK_API_DELAY = 200; // ms

// Generic function to get data from localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// Generic function to save data to localStorage
const saveToStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

// --- Mock API Functions ---

// Invoices
export const getInvoices = async (): Promise<Invoice[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const invoices = getFromStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);
    return invoices.sort((a, b) => b.id - a.id);
};

export const addInvoice = async (invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const invoices = getFromStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);
    const newInvoice: Invoice = { ...invoiceData, id: Date.now() };
    saveToStorage(INVOICE_STORAGE_KEY, [newInvoice, ...invoices]);
    return newInvoice;
};

export const updateInvoice = async (invoiceId: number, updatedData: Partial<Invoice>): Promise<Invoice | null> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const invoices = getFromStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);
    let updatedInvoice: Invoice | null = null;
    const newInvoices = invoices.map(inv => {
        if (inv.id === invoiceId) {
            updatedInvoice = { ...inv, ...updatedData };
            return updatedInvoice;
        }
        return inv;
    });
    saveToStorage(INVOICE_STORAGE_KEY, newInvoices);
    return updatedInvoice;
};

export const deleteInvoice = async (invoiceId: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const invoices = getFromStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);
    saveToStorage(INVOICE_STORAGE_KEY, invoices.filter(inv => inv.id !== invoiceId));
};

// Customers
export const getCustomers = async (): Promise<Customer[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);
};

export const addCustomer = async (newCustomer: Customer): Promise<Customer> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const customers = getFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);
    saveToStorage(CUSTOMERS_STORAGE_KEY, [...customers, newCustomer]);
    return newCustomer;
};

export const addOrUpdateCustomer = async (newCustomer: Customer): Promise<Customer> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    let customers = getFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);
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
    saveToStorage(CUSTOMERS_STORAGE_KEY, customers);
    return newCustomer;
};

export const isCustomerExists = async (phone: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const customers = getFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, []);
    return customers.some(c => c.phone === phone);
};

// Services
export const getServiceSets = async (): Promise<ServiceSets> => {
     await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<ServiceSets>(SERVICES_STORAGE_KEY, DEFAULT_SERVICE_SETS);
};

export const saveServiceSets = async (newServiceSets: ServiceSets): Promise<ServiceSets> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    saveToStorage(SERVICES_STORAGE_KEY, newServiceSets);
    return newServiceSets;
};

// App Settings
export const getSettings = async (): Promise<AppSettings> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<AppSettings>(APP_SETTINGS_STORAGE_KEY, { upiId: '9845418725@ybl' });
};

export const saveSettings = async (newSettings: AppSettings): Promise<AppSettings> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    saveToStorage(APP_SETTINGS_STORAGE_KEY, newSettings);
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
    saveToStorage(PENDING_ORDERS_STORAGE_KEY, [newOrder, ...orders]);
    return newOrder;
};

export const deletePendingOrder = async (orderId: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const orders = await getPendingOrders();
    saveToStorage(PENDING_ORDERS_STORAGE_KEY, orders.filter(o => o.id !== orderId));
};
