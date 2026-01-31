// Core business types - platform agnostic
// Re-exported from main types for portability to React Native

export type CustomerType = 'customer' | 'garage_service_station' | 'dealer';
export type PaymentMethod = 'upi' | 'cash';
export type InvoiceStatus = 'paid' | 'unpaid' | 'partially_paid';
export type Language = 'en' | 'kn';
export type View = 'dashboard' | 'invoices' | 'customers' | 'day-book' | 'reports' | 'settings' | 'new-invoice' | 'customer-detail' | 'take-order';

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
  customerGstNumber?: string;
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
  customerType?: CustomerType;
  gstNumber?: string;
  // Optional trust and identity fields
  photoUri?: string;
  idProofUri?: string;
  trusted?: boolean;
  trustScore?: number;
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
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTagline?: string;
  gstNumber?: string;
  invoiceLanguage?: Language;
  dailyRevenueTarget?: number;
  weeklyRevenueTarget?: number;
  monthlyRevenueTarget?: number;
  notifyOnTargetProgress?: boolean;
  // Feature flags
  enableSpecialDiscount?: boolean;
}

// Optional discount per invoice when enabled in settings
declare module '../types' {
  interface Invoice {
    specialDiscount?: number;
  }
}

export interface AnalyticsData {
  totalRevenue: number;
  totalPayments: number;
  unpaidBalance: number;
  totalInvoices: number;
  totalRawMaterialSpent: number;
  activeCustomers: number;
  pendingAmount: number;
  totalOrders: number;
  unpaidInvoicesCount?: number;
  revenueByCustomerType: Record<CustomerType, number>;
  topServices: [string, number][];
}

export interface SyncChangesResponse {
  invoices: Invoice[];
  customers: Customer[];
  pendingOrders: PendingOrder[];
  serverTime: string;
}
