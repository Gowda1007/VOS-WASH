export type CustomerType = 'customer' | 'garage_service_station' | 'dealer';

export type InvoiceStatus = 'paid' | 'partially_paid' | 'unpaid';

export type View = 'dashboard' | 'invoices' | 'customers' | 'settings' | 'reports' | 'new-invoice' | 'customer-detail' | 'day-book' | 'take-order';

export type PaymentMethod = 'upi' | 'cash';

export interface Payment {
  amount: number;
  date: string;
  method: PaymentMethod;
}

export interface Service {
  name: string;
  price: number;
  quantity: number;
  isCustom?: boolean;
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
  oldBalance?: { amount: number; date?: string };
  advancePaid?: { amount: number; date?: string };
}

export interface PendingOrder {
  id: number;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerType: CustomerType;
  services: Service[];
  advancePaid: { amount: number };
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
    revenueByCustomerType: { customer: number; garage_service_station: number; dealer: number };
}

export interface AppSettings {
  upiId: string;
}
// Fix: Added missing type definitions for User, Product, and Order related entities.
export interface User {
  role: 'admin' | 'customer';
  phone?: string;
  name?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string; // base64 data URL
}

export type OrderStatus = 'pending_payment' | 'processing' | 'shipped' | 'cancelled';

export interface ShippingDetails {
    courier: string;
    trackingNumber: string;
    photo: string; // base64 data URL
    date: string;
}

export interface Order {
    id: number;
    orderDate: string;
    customerPhone: string;
    customerName: string;
    products: (Product & { quantity: number })[];
    totalAmount: number;
    status: OrderStatus;
    shippingDetails?: ShippingDetails;
}
