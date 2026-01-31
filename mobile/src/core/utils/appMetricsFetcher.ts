import { RawMaterialService } from '../services/rawMaterialService';
import { ApiService } from '../services/apiService';
import { Invoice, Service, Payment } from '../types';
import { RawMaterial } from '../types/investmentTypes';

// We rely on the singletons defined in mobile/src/services/index.ts
// We import the types here but assume the singletons will be passed in or imported by the caller.

export interface AppMetrics {
  pendingOrdersCount: number;
  unpaidInvoicesCount: number;
  lowStockItemsCount: number;
  totalUnpaidAmount: number; // Placeholder for future use, though not used in the JSON yet
}

const LOW_STOCK_THRESHOLD = 2; 

/**
 * Calculates metrics from the raw list of invoices.
 * @param invoices 
 * @returns 
 */
function calculateInvoiceMetrics(invoices: Invoice[]) {
  let unpaidCount = 0;
  let totalUnpaid = 0;

  for (const invoice of invoices) {
    const totalAmount = invoice.services.reduce((sum: number, s: Service) => sum + s.price * s.quantity, 0);
    const totalPaid = invoice.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);

    if (totalPaid < totalAmount) {
      unpaidCount++;
      totalUnpaid += (totalAmount - totalPaid);
    }
  }

  return { unpaidCount, totalUnpaid };
}


/**
 * Fetches key business metrics from the API services.
 * NOTE: This function requires ApiService to fetch Orders and Invoices, 
 * and RawMaterialService to fetch raw material stock.
 */
export async function getAppMetrics(apiService: ApiService, rawMaterialService: RawMaterialService): Promise<AppMetrics> {
  try {
    // 1. Fetch Invoices and calculate unpaid metrics
    const allInvoices = await apiService.getInvoices({ status: 'outstanding' }); // Filter for only outstanding
    const { unpaidCount, totalUnpaid } = calculateInvoiceMetrics(allInvoices);
    
    // 2. Fetch Pending Orders Count
    const pendingOrders = await apiService.getPendingOrders();
    const pendingOrdersCount = pendingOrders.length;
    
    // 3. Fetch Raw Materials and count low stock items
    const rawMaterials = await rawMaterialService.getRawMaterials();
    const lowStockItemsCount = rawMaterials.filter((rm: RawMaterial) => rm.quantity < LOW_STOCK_THRESHOLD).length;

    return {
      pendingOrdersCount,
      unpaidInvoicesCount: unpaidCount,
      lowStockItemsCount,
      totalUnpaidAmount: totalUnpaid,
    };
  } catch (error) {
    console.error("Failed to fetch app metrics for notifications:", error);
    // Return zero counts on failure to prevent notification crashes
    return {
      pendingOrdersCount: 0,
      unpaidInvoicesCount: 0,
      lowStockItemsCount: 0,
      totalUnpaidAmount: 0,
    };
  }
}