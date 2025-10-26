export type CustomerType = 'customer' | 'garage' | 'dealer';

export type InvoiceStatus = 'paid' | 'partially_paid' | 'unpaid';

export type View = 'dashboard' | 'invoices' | 'customers' | 'settings' | 'new-invoice';

export interface Service {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Financials {
  oldBalance: { amount: number; date: string; included: boolean };
  advancePaid: { amount: number; date: string; included: boolean };
  nowPaid: { amount: number; included: boolean };
}

export interface Totals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  remainingBalance: number;
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
  financials: Financials;
  totals: Totals;
  status: InvoiceStatus;
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
    // FIX: Add missing properties for detailed analytics.
    totalOldBalance: number;
    totalAdvancePaid: number;
    topServices: [string, number][];
    revenueByCustomerType: { customer: number; garage: number; dealer: number };
}