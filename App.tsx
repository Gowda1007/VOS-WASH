import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from './components/MainLayout';
import { DashboardPage } from './components/DashboardPage';
import { InvoiceListPage } from './components/InvoiceListPage';
import { CustomerListPage } from './components/CustomerListPage';
import { CustomerDetailPage } from './components/CustomerDetailPage';
import { SettingsPage } from './components/SettingsPage';
import { InvoiceFormPage } from './components/InvoiceFormPage';
import { OrderFormPage } from './components/OrderFormPage';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SplashScreen } from './components/SplashScreen';
import { ReportsPage } from './components/ReportsPage';
import { DayBookPage } from './components/DayBookPage';
import { InvoicePreviewOverlay } from './components/InvoicePreviewOverlay';

import type { Invoice, View, Payment, Customer, PendingOrder, PaymentMethod, InvoiceStatus, ConfirmModalState } from './types';
import { useInvoices, getUniqueInvoiceNumber } from './hooks/useInvoices';
import { recordInvoicePayment } from './services/apiService';
import { useCustomers } from './hooks/useCustomers';
import { useServices } from './hooks/useServices';
import { useAppSettings } from './hooks/useAppSettings';
import { usePendingOrders } from './hooks/usePendingOrders';
import { calculateAnalytics } from './services/analyticsService';
import { useLanguage } from './hooks/useLanguage';
import { useToast } from './hooks/useToast';
import { useNetworkStatus } from './hooks/useNetworkStatus';


const App: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('dashboard');
    const { invoices, addInvoice, updateInvoice, deleteInvoice, syncInvoiceLocal } = useInvoices();
    const { customers, addOrUpdateCustomer, deleteCustomer } = useCustomers();
    const { serviceSets, saveServiceSets } = useServices();
    const { pendingOrders, addPendingOrder, deletePendingOrder } = usePendingOrders();
    const { settings, saveSettings } = useAppSettings();
    const { t } = useLanguage();
    const toast = useToast();
    useNetworkStatus(); // Start monitoring network status and display toasts

    const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>({ isOpen: false });
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
    const [orderToConvert, setOrderToConvert] = useState<PendingOrder | null>(null);
    const [invoiceListFilter, setInvoiceListFilter] = useState<'all' | InvoiceStatus | 'outstanding'>('all');
    
    const analytics = useMemo(() => calculateAnalytics(invoices), [invoices]);
    
    const viewTitles: Record<View, string> = useMemo(() => ({
        dashboard: t('page-title-dashboard', 'Dashboard'),
        invoices: t('page-title-invoices', 'Invoices'),
        customers: t('page-title-customers', 'Customers'),
        settings: t('page-title-settings', 'Settings'),
        reports: t('page-title-reports', 'Financial Reports'),
        'new-invoice': t('page-title-new-invoice', 'New Invoice'),
        'take-order': t('page-title-take-order', 'Take Order'),
        'customer-detail': t('page-title-customer-detail', 'Customer Details'),
        'day-book': t('page-title-day-book', 'Day Book'),
    }), [t]);

    useEffect(() => {
        setTimeout(() => setLoading(false), 5000);
    }, []);

    const handleNavigate = (newView: View) => {
        setInvoiceToEdit(null);
        setSelectedCustomer(null);
        setOrderToConvert(null);
        if (newView !== 'invoices') {
            setInvoiceListFilter('all');
        }
        setView(newView);
    };

    const handleNavigateToUnpaid = () => {
        setInvoiceListFilter('outstanding');
        setView('invoices');
    };

    const handleStartNewInvoice = () => {
        setOrderToConvert(null);
        setInvoiceToEdit(null);
        setView('new-invoice');
    };
    
    const handleStartTakeOrder = () => {
        setOrderToConvert(null);
        setInvoiceToEdit(null);
        setView('take-order');
    }

    const handleGenerateInvoiceFromOrder = (order: PendingOrder) => {
        setOrderToConvert(order);
        setView('new-invoice');
    };

    const handleViewCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setView('customer-detail');
    };
    
    const handlePreviewInvoice = (invoice: Invoice) => {
        setPreviewInvoice(invoice);
    };

    const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'invoiceNumber' | 'invoiceDate'>): Promise<Invoice> => {
        await addOrUpdateCustomer({
            phone: invoiceData.customerPhone,
            name: invoiceData.customerName,
            address: invoiceData.customerAddress
        });
        
        // Generate unique invoice number
        const uniqueInvoiceNumber = getUniqueInvoiceNumber(invoices);

        const newInvoiceData: Invoice = {
            ...invoiceData,
            invoiceNumber: uniqueInvoiceNumber,
            invoiceDate: new Date().toLocaleDateString("en-IN"),
        };
        
        const savedInvoice = await addInvoice(newInvoiceData);
        
        if (orderToConvert) {
            await deletePendingOrder(orderToConvert.id);
            setOrderToConvert(null);
        }
        
        setInvoiceToEdit(null);
        return savedInvoice;
    };

    const handleSaveOrder = (orderData: Omit<PendingOrder, 'id'>) => {
        addOrUpdateCustomer({
            phone: orderData.customerPhone,
            name: orderData.customerName,
            address: orderData.customerAddress
        });
        addPendingOrder(orderData);
        setView('dashboard');
    }
    
const handleUpdatePayment = async (invoiceNumber: string, amount: number, method: PaymentMethod, referenceNumber?: string): Promise<Invoice | null> => {
    try {
        // Use the dedicated API function for recording payment
        const updatedInvoice = await recordInvoicePayment(
            invoiceNumber,
            amount,
            method,
            referenceNumber
        );
        
        if (!updatedInvoice) {
            // If the invoice is not found (404 from API), recordInvoicePayment returns null.
            console.error(`[App] Failed to retrieve updated invoice ${invoiceNumber} after payment (Document not found).`);
            toast.error(`Failed to record payment for ${invoiceNumber}. Invoice not found.`);
            return null;
        }
        
        // Sync local state immediately with the updated invoice returned from the dedicated API call
        syncInvoiceLocal(updatedInvoice);
        
        toast.success(`Payment recorded for ${invoiceNumber}`);
        return updatedInvoice;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[App] Error recording payment for invoice ${invoiceNumber}: ${errorMessage}`);
        
        // The API service handles 404 errors by returning null. If we get here, it's a different error.
        toast.error(`Failed to record payment for ${invoiceNumber}. ${errorMessage}`);
        
        // Return null on any error to prevent uncaught promise rejections in calling components (like onClick handlers).
        return null;
    }
};



    const handleDeleteRequest = (invoiceNumber: string) => {
        const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
        if (invoice) {
            setConfirmModalState({
                isOpen: true,
                action: 'delete',
                invoice,
                title: t('confirm-deletion-title'),
                message: t('confirm-deletion-message', 'Are you sure you want to permanently delete invoice #{invoiceNumber}? This action cannot be undone.').replace('{invoiceNumber}', invoiceNumber),
                onConfirm: () => {
                    deleteInvoice(invoiceNumber);
                    setConfirmModalState({ isOpen: false });
                },
            });
        }
    };
    
    const handleDeleteOrderRequest = (orderId: string) => {
        const order = pendingOrders.find(o => o.id === orderId);
        if (order) {
            setConfirmModalState({
                isOpen: true,
                action: 'deleteOrder',
                order,
                title: t('confirm-order-deletion-title'),
                message: t('confirm-order-deletion-message').replace('{customerName}', order.customerName),
                onConfirm: () => {
                    deletePendingOrder(orderId);
                    setConfirmModalState({ isOpen: false });
                    toast.success(t('delete-order-success'));
                },
            });
        }
    };

    const handleDeleteCustomerRequest = (customer: Customer) => {
        setConfirmModalState({
            isOpen: true,
            action: 'deleteCustomer',
            customer,
            title: t('confirm-customer-deletion-title'),
            message: t('confirm-customer-deletion-message', 'Are you sure you want to permanently delete customer {customerName} and their associated data? This action cannot be undone.').replace('{customerName}', customer.name),
            onConfirm: async () => {
                await deleteCustomer(customer.phone);
                setConfirmModalState({ isOpen: false });
                toast.success(t('delete-customer-success'));
                handleNavigate('customers'); // Go back to customer list after deletion
            },
        });
    };
    
    const handleCollectRequest = (invoiceNumber: string) => {
        if (!invoiceNumber) {
            console.error("[App] Attempted to collect payment with undefined or empty invoiceNumber.");
            toast.error(t('error-missing-invoice-id', 'Cannot collect payment: Invoice Number is missing.'));
            return;
        }
        const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
        if (invoice) {
            setConfirmModalState({
                isOpen: true,
                action: 'collect',
                invoice,
                title: t('collect-balance-title'),
                message: t('collect-balance-message').replace('{invoiceNumber}', invoiceNumber),
                onConfirm: async (amount: number, method: PaymentMethod, referenceNumber?: string) => {
                    try {
                        const updatedInvoice = await handleUpdatePayment(invoiceNumber, amount, method, referenceNumber);
                        
                        // If payment was successful and we have the updated invoice, update the preview state
                        if (updatedInvoice) {
                            setPreviewInvoice(updatedInvoice);
                        }
                    } catch (error) {
                        // Error is already logged and toasted in handleUpdatePayment, just catch the rejection
                        console.log(`[App] Payment confirmation failed for ${invoiceNumber}.`);
                    } finally {
                        setConfirmModalState({ isOpen: false });
                    }
                },
            });
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'dashboard': return <DashboardPage analytics={analytics} recentInvoices={invoices.slice(0, 5)} pendingOrders={pendingOrders} onPreviewInvoice={handlePreviewInvoice} onGenerateInvoice={handleGenerateInvoiceFromOrder} onDeleteOrder={handleDeleteOrderRequest} onNavigateToUnpaid={handleNavigateToUnpaid} />;
            case 'invoices': return <InvoiceListPage invoices={invoices} onDelete={handleDeleteRequest} onCollect={handleCollectRequest} onPreview={handlePreviewInvoice} initialFilter={invoiceListFilter} />;
            case 'customers': return <CustomerListPage customers={customers} invoices={invoices} onViewCustomer={handleViewCustomer} />;
            case 'customer-detail': 
                if (!selectedCustomer) {
                    setView('customers');
                    return null;
                }
                return <CustomerDetailPage 
                    customer={selectedCustomer} 
                    invoices={invoices.filter(i => i.customerPhone === selectedCustomer.phone)}
                    onNavigateBack={() => handleNavigate('customers')}
                    onCollectInvoice={handleCollectRequest}
                    onPreviewInvoice={handlePreviewInvoice}
                    onDeleteCustomer={handleDeleteCustomerRequest}
                />;
            case 'day-book': return <DayBookPage invoices={invoices} onPreviewInvoice={handlePreviewInvoice} onCollectInvoice={handleCollectRequest} />;
            case 'settings': return <SettingsPage serviceSets={serviceSets} onSaveServices={saveServiceSets} appSettings={settings} onSaveSettings={saveSettings} />;
            case 'reports': return <ReportsPage invoices={invoices} />;
            case 'new-invoice': return <InvoiceFormPage 
                                            onSave={handleSaveInvoice} 
                                            onUpdatePayment={handleUpdatePayment}
                                            onComplete={() => setView('invoices')}
                                            existingInvoice={invoiceToEdit} 
                                            customers={customers} 
                                            serviceSets={serviceSets} 
                                            invoices={invoices} 
                                            pendingOrder={orderToConvert}
                                            appSettings={settings} 
                                        />;
            case 'take-order': return <OrderFormPage onSave={handleSaveOrder} customers={customers} serviceSets={serviceSets} appSettings={settings} />;
            default: return <DashboardPage analytics={analytics} recentInvoices={invoices.slice(0,5)} pendingOrders={pendingOrders} onPreviewInvoice={handlePreviewInvoice} onGenerateInvoice={handleGenerateInvoiceFromOrder} onDeleteOrder={handleDeleteOrderRequest} onNavigateToUnpaid={handleNavigateToUnpaid} />;
        }
    };
    
    const getPageTitle = () => {
        if (view === 'customer-detail' && selectedCustomer) {
            return selectedCustomer.name;
        }
        return viewTitles[view] || 'VOS WASH';
    };


    if (loading) {
        return <SplashScreen />;
    }
    
    return (
        <>
            <MainLayout 
                currentView={view} 
                onNavigate={handleNavigate} 
                onNewInvoice={handleStartNewInvoice}
                onTakeOrder={handleStartTakeOrder}
                pageTitle={getPageTitle()}
            >
                {renderContent()}
            </MainLayout>
            <ConfirmationModal state={confirmModalState} setState={setConfirmModalState} appSettings={settings} />
            {previewInvoice && (
                <InvoicePreviewOverlay 
                    invoice={previewInvoice} 
                    onClose={() => setPreviewInvoice(null)}
                    onCollect={() => handleCollectRequest(previewInvoice.invoiceNumber || '')}
                />
            )}
        </>
    );
};



export default App;