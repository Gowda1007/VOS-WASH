export type CustomerType = 'customer' | 'garage' | 'dealer';

export type InvoiceStatus = 'paid' | 'partially_paid' | 'unpaid';

export type View = 'dashboard' | 'invoices' | 'customers' | 'settings' | 'reports' | 'new-invoice';

export type PaymentMethod = 'upi' | 'cash';

export interface User {
  role: 'admin' | 'customer';
  phone?: string; // For customer identification
}

export interface Payment {
  amount: number;
  date: string;
  method: PaymentMethod;
}

export interface Service {
  name: string;
  price: number;
  quantity: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerType: CustomerType;
  services: Service[];
  payments: Payment[];
}

export interface Customer {
    phone: string;
    name: string;
    address: string;
}

export interface ManageableService {
    name: string;
    price: number;
}

export type ServiceSets = Record<CustomerType, ManageableService[]>;

export interface AnalyticsData {
    totalInvoices: number;
    totalRevenue: number;
    unpaidBalance: number;
    totalPayments: number;
    topServices: [string, number][];
    revenueByCustomerType: { customer: number; garage: number; dealer: number };
}