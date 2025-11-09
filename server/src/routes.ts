import { Router, Request, Response } from 'express';
import { 
    findAll, 
    addInvoice,
    updateInvoice,
    deleteInvoiceById,
    recordPayment,
    addOrUpdateCustomer,
    deleteCustomerByPhone,
    getServiceSets,
    saveServiceSets,
    getSettings,
    saveSettings,
    addPendingOrder,
    deletePendingOrderById,
    getPendingOrders
} from './dataAccess';
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

const router = Router();

// --- Invoices ---

router.get('/invoices', async (req: Request, res: Response) => {
    try {
        const invoices = await findAll<Invoice>(INVOICES_COLLECTION);
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).send('Failed to fetch invoices');
    }
});

router.post('/invoices', async (req: Request, res: Response) => {
    console.log('POST /api/invoices received. Body:', req.body);
    try {
        const newInvoice = req.body as Omit<Invoice, '_id'>;
        const insertedInvoice = await addInvoice(newInvoice);
        console.log('Invoice successfully inserted:', insertedInvoice._id);
        res.status(201).json(insertedInvoice);
    } catch (error) {
        console.error('Error adding invoice:', error);
        res.status(500).send('Failed to add invoice');
    }
});

router.put('/invoices/:invoiceNumber', async (req: Request, res: Response) => {
    try {
        const { invoiceNumber } = req.params;
        const updateData = req.body as Partial<Invoice>;
        const updatedInvoice = await updateInvoice(invoiceNumber, updateData);
        if (updatedInvoice) {
            res.json(updatedInvoice);
        } else {
            res.status(404).send('Invoice not found');
        }
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).send('Failed to update invoice');
    }
});

router.post('/invoices/:invoiceNumber/payments', async (req: Request, res: Response) => {
    try {
        const { invoiceNumber } = req.params;
        // The payment payload now only contains amount, method, and referenceNumber
        const restOfPaymentData = req.body as Omit<Payment, 'date'>;
        
        // Add current date to payment object
        const payment: Payment = {
            ...restOfPaymentData,
            date: new Date().toISOString(),
        };

        // Pass only invoiceNumber and payment data to dataAccess
        const updatedInvoice = await recordPayment(invoiceNumber, payment);
        
        if (updatedInvoice) {
            res.json(updatedInvoice);
        } else {
            // This handles the "Invoice not found" error specifically for payment recording
            res.status(404).send(`Failed to record payment for ${invoiceNumber}. Invoice not found.`);
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).send('Failed to record payment');
    }
});

router.delete('/invoices/:invoiceNumber', async (req: Request, res: Response) => {
    try {
        const { invoiceNumber } = req.params;
        const success = await deleteInvoiceById(invoiceNumber);
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).send('Invoice not found');
        }
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).send('Failed to delete invoice');
    }
});

// --- Customers ---

router.get('/customers', async (req: Request, res: Response) => {
    try {
        const customers = await findAll<Customer>(CUSTOMERS_COLLECTION);
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).send('Failed to fetch customers');
    }
});

router.post('/customers', async (req: Request, res: Response) => {
    try {
        const customer = req.body as Customer;
        const savedCustomer = await addOrUpdateCustomer(customer);
        res.status(201).json(savedCustomer);
    } catch (error) {
        console.error('Error adding/updating customer:', error);
        res.status(500).send('Failed to add/update customer');
    }
});

router.delete('/customers/:phone', async (req: Request, res: Response) => {
    try {
        const { phone } = req.params;
        const success = await deleteCustomerByPhone(phone);
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).send('Customer not found');
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).send('Failed to delete customer');
    }
});

// --- Services (ServiceSets) ---

router.get('/services', async (req: Request, res: Response) => {
    try {
        const serviceSets = await getServiceSets();
        res.json(serviceSets || {});
    } catch (error) {
        console.error('Error fetching service sets:', error);
        res.status(500).send('Failed to fetch service sets');
    }
});

router.post('/services', async (req: Request, res: Response) => {
    try {
        const serviceSets = req.body as ServiceSets;
        const savedServiceSets = await saveServiceSets(serviceSets);
        res.status(200).json(savedServiceSets);
    } catch (error) {
        console.error('Error saving service sets:', error);
        res.status(500).send('Failed to save service sets');
    }
});

// --- Settings ---

router.get('/settings', async (req: Request, res: Response) => {
    try {
        const settings = await getSettings();
        res.json(settings || {});
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).send('Failed to fetch settings');
    }
});

router.post('/settings', async (req: Request, res: Response) => {
    try {
        const settings = req.body as AppSettings;
        const savedSettings = await saveSettings(settings);
        res.status(200).json(savedSettings);
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).send('Failed to save settings');
    }
});

// --- Pending Orders ---

router.get('/pending-orders', async (req: Request, res: Response) => {
    try {
        const orders = await getPendingOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).send('Failed to fetch pending orders');
    }
});

router.post('/pending-orders', async (req: Request, res: Response) => {
    try {
        const newOrder = req.body as Omit<PendingOrder, '_id'>;
        const insertedOrder = await addPendingOrder(newOrder);
        res.status(201).json(insertedOrder);
    } catch (error) {
        console.error('Error adding pending order:', error);
        res.status(500).send('Failed to add pending order');
    }
});

router.delete('/pending-orders/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const success = await deletePendingOrderById(id);
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).send('Pending order not found');
        }
    } catch (error) {
        console.error('Error deleting pending order:', error);
        res.status(500).send('Failed to delete pending order');
    }
});

// --- Sync Endpoint ---

router.get('/sync/changes', async (req: Request, res: Response) => {
    try {
        const { since } = req.query;
        
        if (!since || typeof since !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid "since" parameter (ISO timestamp required)' });
        }

        const sinceDate = new Date(since);
        if (isNaN(sinceDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format for "since" parameter' });
        }

        // Fetch all documents updated after the given timestamp
        const [changedInvoices, changedCustomers, changedOrders] = await Promise.all([
            findAll<Invoice>(INVOICES_COLLECTION),
            findAll<Customer>(CUSTOMERS_COLLECTION),
            getPendingOrders(),
        ]);

        // Filter by updatedAt
        const invoices = changedInvoices.filter(inv => 
            inv.updatedAt && new Date(inv.updatedAt) > sinceDate
        );
        const customers = changedCustomers.filter(cust => 
            cust.updatedAt && new Date(cust.updatedAt) > sinceDate
        );
        const pendingOrders = changedOrders.filter(order => 
            order.updatedAt && new Date(order.updatedAt) > sinceDate
        );

        res.json({
            invoices,
            customers,
            pendingOrders,
            serverTime: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching sync changes:', error);
        res.status(500).send('Failed to fetch sync changes');
    }
});


export default router;