import { db } from './firebaseService';
import { 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    getDoc, 
    query, 
    where, 
    getDocs,
    serverTimestamp,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import type { 
    Invoice, 
    Customer, 
    ServiceSets, 
    AppSettings,
    PendingOrder
} from '../types';
import { DEFAULT_SERVICE_SETS } from '../constants';

// --- Firestore Collection References ---
const INVOICES_COLLECTION = 'invoices';
const CUSTOMERS_COLLECTION = 'customers';
const SERVICES_COLLECTION = 'services';
const SETTINGS_COLLECTION = 'settings';
const PENDING_ORDERS_COLLECTION = 'pendingOrders';

// --- Generic CRUD Operations ---

// Saves or updates a document. If id is provided, it updates; otherwise, it creates a new document with a generated ID.
const saveDocument = async <T extends { id?: string }>(collectionName: string, data: Omit<T, 'id'> & { id?: string }): Promise<T> => {
    const docRef = data.id ? doc(db, collectionName, data.id) : doc(collection(db, collectionName));
    const id = docRef.id;
    
    // Clean data for Firestore (remove undefined/null fields if necessary, add timestamp)
    const dataToSave = {
        ...data,
        id: id,
        updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, dataToSave);
    // Use double assertion to satisfy TypeScript compiler for complex generic return type
    return { ...dataToSave, id } as unknown as T;
};

const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, collectionName, id));
};

// --- Invoices ---

// Note: getInvoices is replaced by real-time listener in useInvoices.ts
export const addInvoice = async (invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> => {
    return saveDocument<Invoice>(INVOICES_COLLECTION, invoiceData);
};

export const updateInvoice = async (invoiceId: string, updatedData: Partial<Invoice>): Promise<Invoice | null> => {
    // We rely on the real-time listener in useInvoices to update the state.
    // This function only performs the write operation.
    const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
    const dataToSave = { ...updatedData, updatedAt: serverTimestamp() };
    await setDoc(docRef, dataToSave, { merge: true });
    
    // Fetch the updated document to return (optional, but useful for immediate feedback)
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { ...docSnap.data() as Invoice, id: docSnap.id } : null;
};

export const deleteInvoice = async (invoiceId: string): Promise<void> => {
    await deleteDocument(INVOICES_COLLECTION, invoiceId);
};

// --- Customers ---

// Note: getCustomers is replaced by real-time listener in useCustomers.ts
export const addOrUpdateCustomer = async (customer: Customer): Promise<Customer> => {
    // Use phone number as the document ID for customers for easy lookup/update
    const docRef = doc(db, CUSTOMERS_COLLECTION, customer.phone);
    
    const dataToSave = {
        ...customer,
        updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, dataToSave, { merge: true });
    return customer;
};

export const isCustomerExists = async (phone: string): Promise<boolean> => {
    const docSnap = await getDoc(doc(db, CUSTOMERS_COLLECTION, phone));
    return docSnap.exists();
};

export const deleteCustomer = async (phone: string): Promise<void> => {
    await deleteDocument(CUSTOMERS_COLLECTION, phone);
};

// --- Services (Managed as a single document for simplicity) ---

const SERVICES_DOC_ID = 'service_sets';

export const getServiceSets = async (): Promise<ServiceSets> => {
    const docSnap = await getDoc(doc(db, SETTINGS_COLLECTION, SERVICES_DOC_ID));
    if (docSnap.exists()) {
        return docSnap.data() as ServiceSets;
    }
    // Initialize if not found
    await setDoc(doc(db, SETTINGS_COLLECTION, SERVICES_DOC_ID), DEFAULT_SERVICE_SETS);
    return DEFAULT_SERVICE_SETS;
};

export const saveServiceSets = async (newServiceSets: ServiceSets): Promise<ServiceSets> => {
    await setDoc(doc(db, SETTINGS_COLLECTION, SERVICES_DOC_ID), newServiceSets);
    return newServiceSets;
};

// --- App Settings (Managed as a single document) ---

const APP_SETTINGS_DOC_ID = 'app_settings';
const DEFAULT_SETTINGS: AppSettings = { upiId: '9845418725@ybl' };

export const getSettings = async (): Promise<AppSettings> => {
    const docSnap = await getDoc(doc(db, SETTINGS_COLLECTION, APP_SETTINGS_DOC_ID));
    if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
    }
    // Initialize if not found
    await setDoc(doc(db, SETTINGS_COLLECTION, APP_SETTINGS_DOC_ID), DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
};

export const saveSettings = async (newSettings: AppSettings): Promise<AppSettings> => {
    await setDoc(doc(db, SETTINGS_COLLECTION, APP_SETTINGS_DOC_ID), newSettings);
    return newSettings;
};

// --- Pending Orders ---

// Note: getPendingOrders is replaced by real-time listener in usePendingOrders.ts
export const addPendingOrder = async (orderData: Omit<PendingOrder, 'id'>): Promise<PendingOrder> => {
    return saveDocument<PendingOrder>(PENDING_ORDERS_COLLECTION, orderData);
};

export const deletePendingOrder = async (orderId: string): Promise<void> => {
    await deleteDocument(PENDING_ORDERS_COLLECTION, orderId);
};