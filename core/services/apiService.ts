// API Service abstraction - can be used by both web and React Native
// Platform-specific HTTP client (fetch for web, axios/fetch for RN) should be injected

import type { 
    Invoice, 
    Customer,
    ServiceSets,
    AppSettings,
    PendingOrder,
    PaymentMethod,
    SyncChangesResponse
} from '../types';

export interface ApiConfig {
    baseURL: string;
    apiKey?: string;
    timeout?: number;
}

export class ApiService {
    private config: ApiConfig;

    constructor(config: ApiConfig) {
        this.config = config;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.config.baseURL}${endpoint}`;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(this.config.apiKey ? { 'x-api-key': this.config.apiKey } : {}),
            ...options.headers,
        };

        try {
            const response = await fetch(url, { ...options, headers });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            if (response.status === 204) {
                return {} as T;
            }

            const text = await response.text();
            if (!text) {
                return [] as T;
            }

            return JSON.parse(text) as T;
        } catch (error) {
            console.error(`[ApiService] Failed to fetch ${url}:`, error);
            throw error;
        }
    }

    // --- Invoices ---

    async getInvoices(): Promise<Invoice[]> {
        return this.request<Invoice[]>('/invoices');
    }

    async addInvoice(invoiceData: Invoice): Promise<Invoice> {
        return this.request<Invoice>('/invoices', {
            method: 'POST',
            body: JSON.stringify(invoiceData),
        });
    }

    async updateInvoice(invoiceNumber: string, updatedData: Partial<Invoice>): Promise<Invoice | null> {
        return this.request<Invoice | null>(`/invoices/${invoiceNumber}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData),
        });
    }

    async recordInvoicePayment(
        invoiceNumber: string,
        amount: number,
        method: PaymentMethod,
        referenceNumber?: string
    ): Promise<Invoice | null> {
        const paymentData = { amount, method, referenceNumber };
        return this.request<Invoice | null>(`/invoices/${invoiceNumber}/payments`, {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    }

    async deleteInvoice(invoiceNumber: string): Promise<void> {
        return this.request<void>(`/invoices/${invoiceNumber}`, {
            method: 'DELETE',
        });
    }

    // --- Customers ---

    async getCustomers(): Promise<Customer[]> {
        return this.request<Customer[]>('/customers');
    }

    async addOrUpdateCustomer(customer: Customer): Promise<Customer> {
        return this.request<Customer>('/customers', {
            method: 'POST',
            body: JSON.stringify(customer),
        });
    }

    async deleteCustomer(phone: string): Promise<void> {
        return this.request<void>(`/customers/${phone}`, {
            method: 'DELETE',
        });
    }

    // --- Services ---

    async getServiceSets(): Promise<ServiceSets> {
        return this.request<ServiceSets>('/services');
    }

    async saveServiceSets(newServiceSets: ServiceSets): Promise<ServiceSets> {
        return this.request<ServiceSets>('/services', {
            method: 'POST',
            body: JSON.stringify(newServiceSets),
        });
    }

    // --- Settings ---

    async getSettings(): Promise<AppSettings> {
        return this.request<AppSettings>('/settings');
    }

    async saveSettings(newSettings: AppSettings): Promise<AppSettings> {
        return this.request<AppSettings>('/settings', {
            method: 'POST',
            body: JSON.stringify(newSettings),
        });
    }

    // --- Pending Orders ---

    async getPendingOrders(): Promise<PendingOrder[]> {
        return this.request<PendingOrder[]>('/pending-orders');
    }

    async addPendingOrder(orderData: Omit<PendingOrder, 'id'>): Promise<PendingOrder> {
        return this.request<PendingOrder>('/pending-orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }

    async deletePendingOrder(orderId: string): Promise<void> {
        return this.request<void>(`/pending-orders/${orderId}`, {
            method: 'DELETE',
        });
    }

    // --- Sync ---

    async getSyncChanges(since: string): Promise<SyncChangesResponse> {
        return this.request<SyncChangesResponse>(`/sync/changes?since=${encodeURIComponent(since)}`);
    }
}
