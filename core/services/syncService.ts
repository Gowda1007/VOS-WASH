// Sync Service for incremental data synchronization
// Tracks last sync timestamp and fetches only changed data

import type { Invoice, Customer, PendingOrder, SyncChangesResponse } from '../types';
import type { ApiService } from './apiService';
import type { DataStorageAdapter } from '../adapters/storageAdapter';

const LAST_SYNC_KEY = 'lastSyncTimestamp';

export interface SyncState {
    lastSyncedAt: string | null;
    isSyncing: boolean;
    lastSyncError: string | null;
}

export interface SyncResult {
    success: boolean;
    invoicesUpdated: number;
    customersUpdated: number;
    ordersUpdated: number;
    serverTime: string;
    error?: string;
}

export class SyncService {
    private apiService: ApiService;
    private storage: DataStorageAdapter;
    private syncState: SyncState = {
        lastSyncedAt: null,
        isSyncing: false,
        lastSyncError: null,
    };

    constructor(apiService: ApiService, storage: DataStorageAdapter) {
        this.apiService = apiService;
        this.storage = storage;
    }

    /**
     * Initialize sync service - load last sync timestamp
     */
    async initialize(): Promise<void> {
        const lastSync = await this.storage.getItem(LAST_SYNC_KEY);
        if (lastSync) {
            this.syncState.lastSyncedAt = lastSync;
        }
    }

    /**
     * Get current sync state
     */
    getSyncState(): SyncState {
        return { ...this.syncState };
    }

    /**
     * Perform incremental sync - fetch changes since last sync
     * @param onProgress Optional callback for progress updates
     * @returns Sync result
     */
    async sync(
        onProgress?: (message: string) => void
    ): Promise<SyncResult> {
        if (this.syncState.isSyncing) {
            return {
                success: false,
                invoicesUpdated: 0,
                customersUpdated: 0,
                ordersUpdated: 0,
                serverTime: new Date().toISOString(),
                error: 'Sync already in progress',
            };
        }

        this.syncState.isSyncing = true;
        this.syncState.lastSyncError = null;

        try {
            onProgress?.('Starting sync...');

            // Determine sync timestamp - if never synced, use epoch
            const sinceTimestamp = this.syncState.lastSyncedAt || '1970-01-01T00:00:00.000Z';
            
            onProgress?.('Fetching changes from server...');
            
            // Fetch changes from server
            const changes: SyncChangesResponse = await this.apiService.getSyncChanges(sinceTimestamp);

            onProgress?.('Processing changes...');

            // Update last sync timestamp
            await this.storage.setItem(LAST_SYNC_KEY, changes.serverTime);
            this.syncState.lastSyncedAt = changes.serverTime;

            onProgress?.('Sync complete!');

            const result: SyncResult = {
                success: true,
                invoicesUpdated: changes.invoices.length,
                customersUpdated: changes.customers.length,
                ordersUpdated: changes.pendingOrders.length,
                serverTime: changes.serverTime,
            };

            this.syncState.isSyncing = false;
            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
            this.syncState.lastSyncError = errorMessage;
            this.syncState.isSyncing = false;

            onProgress?.(`Sync failed: ${errorMessage}`);

            return {
                success: false,
                invoicesUpdated: 0,
                customersUpdated: 0,
                ordersUpdated: 0,
                serverTime: new Date().toISOString(),
                error: errorMessage,
            };
        }
    }

    /**
     * Force full sync by resetting last sync timestamp
     */
    async resetSync(): Promise<void> {
        await this.storage.removeItem(LAST_SYNC_KEY);
        this.syncState.lastSyncedAt = null;
        this.syncState.lastSyncError = null;
    }

    /**
     * Merge server changes with local data
     * This is a helper method - actual merge logic depends on your state management
     * 
     * @param localInvoices Current local invoices
     * @param serverChanges Server changes
     * @returns Merged invoices
     */
    static mergeInvoices(
        localInvoices: Invoice[],
        serverChanges: Invoice[]
    ): Invoice[] {
        // Create a map for quick lookup
        const localMap = new Map(localInvoices.map(inv => [inv.invoiceNumber, inv]));

        // Process server changes
        serverChanges.forEach(serverInvoice => {
            const local = localMap.get(serverInvoice.invoiceNumber);

            // If no local copy or server is newer, use server version
            if (!local || 
                (serverInvoice.updatedAt && local.updatedAt && 
                 new Date(serverInvoice.updatedAt) > new Date(local.updatedAt))) {
                localMap.set(serverInvoice.invoiceNumber, serverInvoice);
            }
        });

        return Array.from(localMap.values());
    }

    /**
     * Merge customers (similar logic to invoices)
     */
    static mergeCustomers(
        localCustomers: Customer[],
        serverChanges: Customer[]
    ): Customer[] {
        const localMap = new Map(localCustomers.map(cust => [cust.phone, cust]));

        serverChanges.forEach(serverCustomer => {
            const local = localMap.get(serverCustomer.phone);

            if (!local || 
                (serverCustomer.updatedAt && local.updatedAt && 
                 new Date(serverCustomer.updatedAt) > new Date(local.updatedAt))) {
                localMap.set(serverCustomer.phone, serverCustomer);
            }
        });

        return Array.from(localMap.values());
    }

    /**
     * Merge pending orders (similar logic to invoices)
     */
    static mergePendingOrders(
        localOrders: PendingOrder[],
        serverChanges: PendingOrder[]
    ): PendingOrder[] {
        const localMap = new Map(localOrders.map(order => [order.id, order]));

        serverChanges.forEach(serverOrder => {
            const local = localMap.get(serverOrder.id);

            if (!local || 
                (serverOrder.updatedAt && local.updatedAt && 
                 new Date(serverOrder.updatedAt) > new Date(local.updatedAt))) {
                localMap.set(serverOrder.id, serverOrder);
            }
        });

        return Array.from(localMap.values());
    }
}
