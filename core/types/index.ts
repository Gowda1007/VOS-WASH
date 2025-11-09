// Core business types - platform agnostic
// Re-exported from main types for portability to React Native

export type CustomerType = 'customer' | 'garage_service_station' | 'dealer';
export type PaymentMethod = 'upi' | 'cash';
export type InvoiceStatus = 'paid' | 'unpaid' | 'partially_paid';
export type Language = 'en' | 'kn';
export type View =  'dashboard' | 'invoices' | 'customers' | 'day-book' | 'reports' | 'settings' | 'new-invoice' | 'customer-detail' | 'take-order';

export interface Payment {
  amount: number;
  date: string;
  method: PaymentMethod;
  referenceNumber?: string;
}

export interface Service {
  name: string;
  price: number;
  quantity: number;
  isCustom?: boolean;
}

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerType: CustomerType;
  services: Service[];
  payments: Payment[];
  oldBalance?: { amount: number; date?: string };
  advancePaid?: { amount: number; date?: string };
  language?: Language;
  createdAt?: string;
  updatedAt?: string;
}

export interface PendingOrder {
  id: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerType: CustomerType;
  services: Service[];
  advancePaid: { amount: number; date?: string };
  dueDate?: string;
  isUrgent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  phone: string;
  name: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManageableService {
  name: string;
  price: number;
}

export type ServiceSets = Record<CustomerType, ManageableService[]>;

export interface AppSettings {
  upiId: string;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalPayments: number;
  unpaidBalance: number;
  totalInvoices: number;
  activeCustomers: number;
  pendingAmount: number;
  totalOrders: number;
  revenueByCustomerType: Record<CustomerType, number>;
  topServices: [string, number][];
}

export interface SyncChangesResponse {
  invoices: Invoice[];
  customers: Customer[];
  pendingOrders: PendingOrder[];
  serverTime: string;
}
