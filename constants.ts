import type { ServiceSets, CustomerType } from './types';

export const INVOICE_STORAGE_KEY = 'vosWashInvoices_v2';
export const CUSTOMERS_STORAGE_KEY = 'vosWashCustomers_v2';
export const SERVICES_STORAGE_KEY = 'vosWashServices_v2';
export const APP_SETTINGS_STORAGE_KEY = 'vosWashAppSettings_v2';
export const PENDING_ORDERS_STORAGE_KEY = 'vosWashPendingOrders_v1';
// Fix: Add storage keys for auth, products, and orders
export const AUTH_SESSION_KEY = 'vosWashAuthSession_v1';
export const PRODUCTS_STORAGE_KEY = 'vosWashProducts_v1';
export const ORDERS_STORAGE_KEY = 'vosWashOrders_v1';


export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  customer: 'Customer',
  garage_service_station: 'Garage / Service Station',
  dealer: 'Dealer',
};

export const DEFAULT_SERVICE_SETS: ServiceSets = {
    garage_service_station: [
        { name: "Interior & Exterior", price: 250 },
        { name: "Fiber Shine", price: 200 },
        { name: "Bright Wash", price: 180 },
        { name: "Gold and Silver", price: 80 },
        { name: "Spray Gun", price: 50 },
    ],
    dealer: [
        { name: "Interior & Exterior", price: 200 },
        { name: "Fiber Shine", price: 140 },
        { name: "Bright Wash", price: 130 },
        { name: "Gold and Silver", price: 50 },
        { name: "Spray Gun", price: 50 },
    ],
    customer: [
        { name: "Interior & Exterior", price: 250 },
        { name: "Fiber Shine", price: 250 },
        { name: "Bright Wash", price: 200 },
        { name: "Gold and Silver", price: 90 },
        { name: "Spray Gun", price: 50 },
    ],
};
