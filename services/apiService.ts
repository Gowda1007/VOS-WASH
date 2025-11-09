import type { 
    Invoice, 
    Customer,
    ServiceSets,
    AppSettings,
    PendingOrder,
    PaymentMethod
} from '../types';
import { DEFAULT_SERVICE_SETS } from '../constants';

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api`;
console.log('[API] Base URL:', API_BASE_URL); 

// --- API Utility Functions ---

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    const text = await response.text(); // read raw text
    if (!text) {
        // If the response is empty, return an empty array/object based on context.
        // Since most endpoints return arrays, returning [] is safer than {}
        // to prevent `forEach is not a function` errors.
        return [] as T;
    }

    try {
        return JSON.parse(text) as T;
    } catch (e) {
        console.warn("⚠️ Could not parse JSON response:", text);
        // If parsing fails (e.g., server returns HTML), return an empty array
        // as a safe fallback for array-returning endpoints.
        return [] as T;
    }
};


const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        return handleResponse<T>(response);
    } catch (error) {
        console.error(`[APIService] Failed to fetch ${url}:`, error);
        throw error;
    }
};

// --- Invoices ---

export const getInvoices = async (): Promise<Invoice[]> => {
    return apiFetch<Invoice[]>('/invoices');
};

export const addInvoice = async (invoiceData: Invoice): Promise<Invoice> => {
    // Since 'id' is removed from Invoice type, we pass the full Invoice object.
    return apiFetch<Invoice>('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
    });
};

export const updateInvoice = async (invoiceNumber: string, updatedData: Partial<Invoice>): Promise<Invoice | null> => {
    return apiFetch<Invoice | null>(`/invoices/${invoiceNumber}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData),
    });
};


export const recordInvoicePayment = async (
  invoiceNumber: string,
  amount: number,
  method: PaymentMethod,
  referenceNumber?: string
): Promise<Invoice | null> => {
  const paymentData = { amount, method, referenceNumber };

  return await apiFetch<Invoice | null>(`/invoices/${invoiceNumber}/payments`, { 
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
};


export const deleteInvoice = async (invoiceNumber: string): Promise<void> => {
    return apiFetch<void>(`/invoices/${invoiceNumber}`, {
        method: 'DELETE',
    });
};

// --- Customers ---

export const getCustomers = async (): Promise<Customer[]> => {
    return apiFetch<Customer[]>('/customers');
};

export const addOrUpdateCustomer = async (customer: Customer): Promise<Customer> => {
    // The server handles upsert logic based on the 'phone' field in the POST body
    return apiFetch<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(customer),
    });
};


export const deleteCustomer = async (phone: string): Promise<void> => {
    return apiFetch<void>(`/customers/${phone}`, {
        method: 'DELETE',
    });
};

// --- Services (Managed as a single document) ---

export const getServiceSets = async (): Promise<ServiceSets> => {
    const serviceSets = await apiFetch<ServiceSets>('/services');
    
    if (Object.keys(serviceSets).length === 0) {
        // If the server returns an empty object (no service sets found), initialize with defaults
        await saveServiceSets(DEFAULT_SERVICE_SETS);
        return DEFAULT_SERVICE_SETS;
    }
    return serviceSets;
};

export const saveServiceSets = async (newServiceSets: ServiceSets): Promise<ServiceSets> => {
    return apiFetch<ServiceSets>('/services', {
        method: 'POST',
        body: JSON.stringify(newServiceSets),
    });
};

// --- App Settings (Managed as a single document) ---

export const getSettings = async (): Promise<AppSettings> => {
    const settings = await apiFetch<AppSettings>('/settings');
    
    if (Object.keys(settings).length === 0) {
        // If the server returns an empty object (no settings found), return default
        const DEFAULT_SETTINGS: AppSettings = { upiId: '9845418725@ybl' };
        return DEFAULT_SETTINGS;
    }
    return settings;
};

export const saveSettings = async (newSettings: AppSettings): Promise<AppSettings> => {
    return apiFetch<AppSettings>('/settings', {
        method: 'POST',
        body: JSON.stringify(newSettings),
    });
};

// --- Pending Orders ---

export const getPendingOrders = async (): Promise<PendingOrder[]> => {
    return apiFetch<PendingOrder[]>('/pending-orders');
};

export const addPendingOrder = async (orderData: Omit<PendingOrder, 'id'>): Promise<PendingOrder> => {
    return apiFetch<PendingOrder>('/pending-orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
    });
};

export const deletePendingOrder = async (orderId: string): Promise<void> => {
    return apiFetch<void>(`/pending-orders/${orderId}`, {
        method: 'DELETE',
    });
};