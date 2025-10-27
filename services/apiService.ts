import type { 
    Invoice, 
    Customer, 
    ServiceSets, 
    Product, 
    Order, 
    AppSettings,
    User,
    PendingOrder
} from '../types';
import { 
    INVOICE_STORAGE_KEY, 
    CUSTOMERS_STORAGE_KEY, 
    SERVICES_STORAGE_KEY, 
    PRODUCTS_STORAGE_KEY, 
    ORDERS_STORAGE_KEY, 
    APP_SETTINGS_STORAGE_KEY,
    PENDING_ORDERS_STORAGE_KEY,
    ADMIN_PASSWORD_STORAGE_KEY,
    DEFAULT_SERVICE_SETS
} from '../constants';

const AUTH_KEY = 'vosWashProUser';

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

// Authentication
export const getCurrentUser = async (): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<User | null>(AUTH_KEY, null);
};

export const adminLogin = async (password: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const storedPassword = getFromStorage<string>(ADMIN_PASSWORD_STORAGE_KEY, 'admin');
    if (password === storedPassword) {
        const adminUser: User = { role: 'admin' };
        saveToStorage(AUTH_KEY, adminUser);
        return adminUser;
    }
    return null;
};

export const updateAdminPassword = async (newPassword: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    saveToStorage(ADMIN_PASSWORD_STORAGE_KEY, newPassword);
};

export const customerLogin = async (phone: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, you'd validate the customer exists in the DB
    const customerUser: User = { role: 'customer', phone };
    saveToStorage(AUTH_KEY, customerUser);
    return customerUser;
};

export const logout = (): void => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('selectedRole');
};

// Invoices
export const getInvoices = async (): Promise<Invoice[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<Invoice[]>(INVOICE_STORAGE_KEY, []);
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

// Products
const initialProducts: Product[] = [
    { id: 1, name: "Premium Car Shampoo", price: 500, description: "A high-quality, pH-neutral car shampoo that provides a thick lather.", image: "/shampoo.png" },
    { id: 2, name: "Microfiber Towel Set", price: 800, description: "Set of 3 ultra-soft, absorbent microfiber towels for drying and polishing.", image: "/towel.png" },
    { id: 3, name: "All-Purpose Cleaner", price: 450, description: "Versatile cleaner for both interior and exterior surfaces.", image: "/cleaner.png" },
];

export const getProducts = async (): Promise<Product[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<Product[]>(PRODUCTS_STORAGE_KEY, initialProducts);
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const products = getFromStorage<Product[]>(PRODUCTS_STORAGE_KEY, initialProducts);
    const newProduct: Product = { ...productData, id: Date.now() };
    saveToStorage(PRODUCTS_STORAGE_KEY, [newProduct, ...products]);
    return newProduct;
};

export const updateProduct = async (productId: number, updatedData: Partial<Product>): Promise<Product | null> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const products = getFromStorage<Product[]>(PRODUCTS_STORAGE_KEY, initialProducts);
    let updatedProduct: Product | null = null;
    const newProducts = products.map(p => {
        if (p.id === productId) {
            updatedProduct = { ...p, ...updatedData };
            return updatedProduct;
        }
        return p;
    });
    saveToStorage(PRODUCTS_STORAGE_KEY, newProducts);
    return updatedProduct;
};

export const deleteProduct = async (productId: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const products = getFromStorage<Product[]>(PRODUCTS_STORAGE_KEY, initialProducts);
    saveToStorage(PRODUCTS_STORAGE_KEY, products.filter(p => p.id !== productId));
};

// Orders
export const getOrders = async (): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<Order[]>(ORDERS_STORAGE_KEY, []);
};

export const addOrder = async (orderData: Omit<Order, 'id'>): Promise<Order> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const orders = getFromStorage<Order[]>(ORDERS_STORAGE_KEY, []);
    const newOrder: Order = { ...orderData, id: Date.now() };
    saveToStorage(ORDERS_STORAGE_KEY, [newOrder, ...orders]);
    return newOrder;
};

export const updateOrder = async (orderId: number, updatedData: Partial<Order>): Promise<Order | null> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const orders = getFromStorage<Order[]>(ORDERS_STORAGE_KEY, []);
    let updatedOrder: Order | null = null;
    const newOrders = orders.map(o => {
        if (o.id === orderId) {
            updatedOrder = { ...o, ...updatedData };
            return updatedOrder;
        }
        return o;
    });
    saveToStorage(ORDERS_STORAGE_KEY, newOrders);
    return updatedOrder;
};

// App Settings
export const getSettings = async (): Promise<AppSettings> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return getFromStorage<AppSettings>(APP_SETTINGS_STORAGE_KEY, { upiId: 'your-upi-id@okhdfcbank' });
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