import { ObjectId } from 'mongodb';

// Replicating necessary types from client/types.ts for server-side use
export type CustomerType = 'customer' | 'garage_service_station' | 'dealer';
export type PaymentMethod = 'upi' | 'cash';

export interface Payment {
  amount: number;
  date: string;
  method: PaymentMethod;
  referenceNumber?: string; // UPI reference number or similar
}

export interface Service {
  name: string;
  price: number;
  quantity: number;
  isCustom?: boolean;
}

export interface Invoice {
  _id?: ObjectId; 
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
  language?: string;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

export interface PendingOrder {
  _id?: ObjectId; // MongoDB ID
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
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

export interface Customer {
    _id?: ObjectId; // MongoDB ID
    phone: string; // Used as unique identifier/key
    name: string;
    address: string;
    createdAt?: string; // ISO timestamp
    updatedAt?: string; // ISO timestamp
}

export interface ManageableService {
    name: string;
    price: number;
}

export type ServiceSets = Record<CustomerType, ManageableService[]>;

export interface AppSettings {
    _id?: ObjectId; // MongoDB ID
    upiId: string;
}

// Collection names
export const INVOICES_COLLECTION = 'invoices';
export const CUSTOMERS_COLLECTION = 'customers';
export const SERVICES_COLLECTION = 'services';
export const SETTINGS_COLLECTION = 'settings';
export const PENDING_ORDERS_COLLECTION = 'pendingOrders';