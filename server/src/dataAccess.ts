import { ObjectId, Document, WithId } from 'mongodb';
import { getDb } from './db';
import {
    Invoice,
    Customer,
    AppSettings,
    PendingOrder,
    ServiceSets,
    Payment,
    INVOICES_COLLECTION, 
    CUSTOMERS_COLLECTION, 
    SERVICES_COLLECTION, 
    SETTINGS_COLLECTION, 
    PENDING_ORDERS_COLLECTION 
} from './types';

// --- Utility Functions ---

// Converts string ID to ObjectId for MongoDB queries
const toObjectId = (id: string): ObjectId => {
    if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId format: ${id}`);
    }
    return new ObjectId(id);
};

// --- Generic CRUD Operations ---

export async function findAll<T extends Document>(collectionName: string): Promise<WithId<T>[]> {
    const db = getDb();
    return db.collection<T>(collectionName).find({}).toArray() as Promise<WithId<T>[]>;
}

export async function findOne<T extends Document>(collectionName: string, query: object): Promise<WithId<T> | null> {
    const db = getDb();
    return db.collection<T>(collectionName).findOne(query);
}

export async function insertOne<T extends Document & { id?: string }>(collectionName: string, document: Omit<T, '_id'>): Promise<WithId<T>> {
    const db = getDb();
    
    // Add timestamps on creation
    const now = new Date().toISOString();
    const docToInsert = {
        ...document,
        createdAt: now,
        updatedAt: now,
    };

    const result = await db.collection<Omit<T, '_id'>>(collectionName).insertOne(docToInsert as any);
    
    // Return the document, ensuring the client-side 'id' is present if it was provided
    return { ...document, _id: result.insertedId, createdAt: now, updatedAt: now } as unknown as WithId<T>;
}

export async function updateOne<T extends Document>(collectionName: string, id: string, update: Partial<T>): Promise<WithId<T> | null> {
    const db = getDb();
    const objectId = toObjectId(id);
    
    // Remove client-side 'id' field and MongoDB '_id' field from update object
    const { id: _, _id: __, ...updateData } = update as any;
    
    // Add/update timestamp
    const updateWithTimestamp = {
        ...updateData,
        updatedAt: new Date().toISOString(),
    };

    const result = await db.collection<T>(collectionName).findOneAndUpdate(
        { _id: objectId } as any, // Cast to any to satisfy Filter<T> constraint
        { $set: updateWithTimestamp },
        { returnDocument: 'after' }
    ) as any; // Cast result to any to access value property
    
    return result?.value as WithId<T> | null;
}

export async function deleteOne(collectionName: string, id: string): Promise<boolean> {
    const db = getDb();
    const objectId = toObjectId(id);
    const result = await db.collection(collectionName).deleteOne({ _id: objectId });
    return result.deletedCount === 1;
}

// --- Specific Data Access Functions ---

// Settings are unique, we use a fixed key or just find the first one.
export async function getSettings(): Promise<AppSettings | null> {
    const db = getDb();
    return db.collection<AppSettings>(SETTINGS_COLLECTION).findOne({});
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
    const db = getDb();
    // Upsert: try to update the existing document (if _id is present), otherwise insert.
    if (settings._id) {
        const updated = await updateOne<AppSettings>(SETTINGS_COLLECTION, settings._id.toHexString(), settings);
        if (updated) return updated;
    }
    
    // If no _id or update failed, delete existing and insert new (simple upsert for single settings doc)
    await db.collection(SETTINGS_COLLECTION).deleteMany({});
    return insertOne<AppSettings>(SETTINGS_COLLECTION, settings);
}

// ServiceSets are unique, similar to settings
export async function getServiceSets(): Promise<ServiceSets | null> {
    const db = getDb();
    const result = await db.collection<{ _id: ObjectId, data: ServiceSets }>(SERVICES_COLLECTION).findOne({});
    return result ? result.data : null;
}

export async function saveServiceSets(serviceSets: ServiceSets): Promise<ServiceSets> {
    const db = getDb();
    const document = { data: serviceSets };
    
    // Always replace the single service sets document
    await db.collection(SERVICES_COLLECTION).deleteMany({});
    await db.collection(SERVICES_COLLECTION).insertOne(document);
    
    return serviceSets;
}

// Customers use 'phone' as a unique identifier for upsert logic
export async function addOrUpdateCustomer(customer: Customer): Promise<Customer> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.collection<Customer>(CUSTOMERS_COLLECTION).findOneAndUpdate(
        { phone: customer.phone },
        { 
            $set: { ...customer, updatedAt: now },
            $setOnInsert: { createdAt: now }
        },
        { upsert: true, returnDocument: 'after' }
    ) as any; // Cast result to any to access value property
    
    // result.value is of type WithId<Customer> | null
    return result?.value as Customer;
}

export async function deleteCustomerByPhone(phone: string): Promise<boolean> {
    const db = getDb();
    const result = await db.collection(CUSTOMERS_COLLECTION).deleteOne({ phone: phone });
    return result.deletedCount === 1;
}

// Invoices and Pending Orders use client-generated 'id' field for uniqueness, 
// but we rely on MongoDB's _id for internal updates/deletes.
// We will assume the client-side 'id' is unique and use it for initial insertion.

export async function addInvoice(invoice: Omit<Invoice, '_id'>): Promise<WithId<Invoice>> {
    try {
        return insertOne<Invoice>(INVOICES_COLLECTION, invoice as Invoice);
    } catch (error) {
        console.error(`[DataAccess] Failed to add invoice with number ${invoice.invoiceNumber}:`, error);
        throw error;
    }
}

export async function updateInvoice(invoiceNumber: string, update: Partial<Invoice>): Promise<WithId<Invoice> | null> {
    const db = getDb();
    const trimmedInvoiceNumber = invoiceNumber.trim();
    
    // Standardize lookup to use only invoiceNumber, which is passed via the route parameter.
    const { _id: __, ...updateData } = update as any; // Ensure _id is stripped from update payload
    
    // Add/update timestamp
    const updateWithTimestamp = {
        ...updateData,
        updatedAt: new Date().toISOString(),
    };

    const filter = { invoiceNumber: trimmedInvoiceNumber };
    
    console.log(`[DataAccess] Attempting to update invoice by invoiceNumber: ${trimmedInvoiceNumber}`);

    try {
        const result = await db.collection<Invoice>(INVOICES_COLLECTION).findOneAndUpdate(
            filter,
            { $set: updateWithTimestamp },
            { returnDocument: 'after' }
        ) as any; // Cast result to any to access value property
        
        if (!result?.value) {
            console.warn(`[DataAccess] Update failed for invoice ${invoiceNumber}: Document not found.`);
            return null;
        }
        console.log(`[DataAccess] Successfully updated invoice: ${invoiceNumber}`);
        return result.value as WithId<Invoice>;
    } catch (error) {
        console.error(`[DataAccess] Failed to update invoice with number ${invoiceNumber}:`, error);
        throw error;
    }
}

export async function recordPayment(invoiceNumber: string, payment: Payment): Promise<WithId<Invoice> | null> {
    const db = getDb();
    const trimmedInvoiceNumber = invoiceNumber.trim();
    
    const filter = { invoiceNumber: trimmedInvoiceNumber };
    
    console.log(`[DataAccess] Recording payment for invoice: ${trimmedInvoiceNumber}`);

    try {
        const result = await db.collection<Invoice>(INVOICES_COLLECTION).findOneAndUpdate(
            filter,
            { 
                $push: { payments: payment },
                $set: { updatedAt: new Date().toISOString() }
            },
            { returnDocument: 'after' }
        );

        console.log(`[DataAccess] findOneAndUpdate result:`, result);

        // FIX: Check if result exists (not result.value)
        if (result) {
            console.log(`[DataAccess] ✅ Successfully recorded payment for invoice: ${trimmedInvoiceNumber}`);
            return result as WithId<Invoice>;
        } else {
            console.warn(`[DataAccess] ❌ Payment recording failed for invoice ${trimmedInvoiceNumber}: Document not found.`);
            return null;
        }

    } catch (error) {
        console.error(`[DataAccess] ❌ Failed to record payment for ${trimmedInvoiceNumber}:`, error);
        throw error;
    }
}

export async function debugFindInvoice(invoiceNumber: string): Promise<any> {
    const db = getDb();
    const trimmedInvoiceNumber = invoiceNumber.trim();
    
    console.log(`[DEBUG] Looking for invoice: '${trimmedInvoiceNumber}'`);
    
    const result = await db.collection(INVOICES_COLLECTION).findOne({ invoiceNumber: trimmedInvoiceNumber });
    console.log(`[DEBUG] Found invoice:`, result);
    
    const allInvoices = await db.collection(INVOICES_COLLECTION).find({}).toArray();
    console.log(`[DEBUG] All invoices in DB:`, allInvoices.map(inv => ({ 
        invoiceNumber: inv.invoiceNumber, 
        _id: inv._id 
    })));
    
    return result;
}

export async function deleteInvoiceById(invoiceNumber: string): Promise<boolean> {
    const db = getDb();
    const trimmedInvoiceNumber = invoiceNumber.trim();
    try {
        const result = await db.collection(INVOICES_COLLECTION).deleteOne({ invoiceNumber: trimmedInvoiceNumber });
        if (result.deletedCount === 0) {
            console.warn(`[DataAccess] Attempted to delete non-existent invoice with number ${trimmedInvoiceNumber}`);
        }
        return result.deletedCount === 1;
    } catch (error) {
        console.error(`[DataAccess] Failed to delete invoice with number ${trimmedInvoiceNumber}:`, error);
        throw error;
    }
}

export async function getPendingOrders(): Promise<PendingOrder[]> {
    const ordersWithId = await findAll<PendingOrder>(PENDING_ORDERS_COLLECTION);
    
    // Map _id to id (string) for client consumption
    return ordersWithId.map(order => ({
        ...order,
        id: order._id.toHexString(),
    })) as PendingOrder[];
}

export async function addPendingOrder(order: Omit<PendingOrder, '_id'>): Promise<WithId<PendingOrder>> {
    return insertOne<PendingOrder & { id: string }>(PENDING_ORDERS_COLLECTION, order as PendingOrder & { id: string });
}

export async function deletePendingOrderById(id: string): Promise<boolean> {
    const db = getDb();
    // Assuming the client passes the MongoDB _id string (which is mapped to 'id' on retrieval)
    const objectId = toObjectId(id);
    const result = await db.collection(PENDING_ORDERS_COLLECTION).deleteOne({ _id: objectId });
    return result.deletedCount === 1;
}