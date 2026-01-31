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

        console.log(`🌐 [ApiService] ${options.method || 'GET'} ${url}`, {
            hasApiKey: !!this.config.apiKey,
            apiKeyPrefix: this.config.apiKey?.substring(0, 8),
        });

        try {
            const response = await fetch(url, { ...options, headers });

            console.log(`📡 [ApiService] Response status: ${response.status} for ${endpoint}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ [ApiService] Error response:`, errorText);
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
            console.error(`❌ [ApiService] Failed to fetch ${url}:`, error);
            throw error;
        }
    }

    async get<T>(endpoint: string, params?: Record<string, any>): Promise<{ data: T }> {
        const query = new URLSearchParams();
        for (const key in params) {
            if (params[key] !== undefined) {
                query.append(key, String(params[key]));
            }
        }
        const qs = query.toString();
        const url = `${endpoint}${qs ? `?${qs}` : ''}`;
        const data = await this.request<T>(url);
        return { data };
    }

    async post<T>(endpoint: string, payload: any): Promise<{ data: T }> {
        const data = await this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return { data };
    }

    async put<T>(endpoint: string, payload: any): Promise<{ data: T }> {
        const data = await this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        return { data };
    }

    async delete<T>(endpoint: string): Promise<void> {
        await this.request<T>(endpoint, {
            method: 'DELETE',
        });
    }

    // --- Invoices ---

    async getInvoices(params?: { q?: string; status?: string; outstanding?: boolean; from?: string; to?: string }): Promise<Invoice[]> {
        const query = new URLSearchParams();
        if (params?.q) query.append('q', params.q);
        if (params?.status) query.append('status', params.status);
        if (params?.outstanding) query.append('outstanding', 'true');
        if (params?.from) query.append('from', params.from);
        if (params?.to) query.append('to', params.to);
        const qs = query.toString();
        return this.request<Invoice[]>(`/invoices${qs ? `?${qs}` : ''}`);
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

    async getCustomers(params?: { q?: string }): Promise<Customer[]> {
        const query = new URLSearchParams();
        if (params?.q) query.append('q', params.q);
        const qs = query.toString();
        return this.request<Customer[]>(`/customers${qs ? `?${qs}` : ''}`);
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

    async getPendingOrders(params?: { q?: string; urgent?: boolean }): Promise<PendingOrder[]> {
        const query = new URLSearchParams();
        if (params?.q) query.append('q', params.q);
        if (params?.urgent) query.append('urgent', 'true');
        const qs = query.toString();
        return this.request<PendingOrder[]>(`/pending-orders${qs ? `?${qs}` : ''}`);
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

    // --- Bot Triggers ---

    async sendBotInvoice(phone: string, amount: number, serviceName: string): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>('/bot/send-invoice', {
            method: 'POST',
            body: JSON.stringify({ phone, amount, serviceName }),
        });
    }

    async requestBotPayment(phone: string, amount: number): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>('/bot/request-payment', {
            method: 'POST',
            body: JSON.stringify({ phone, amount }),
        });
    }
}
