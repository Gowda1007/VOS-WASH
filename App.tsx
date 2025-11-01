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
import { useInvoices } from './hooks/useInvoices';
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
    const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
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

    const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate'>): Promise<Invoice> => {
        await addOrUpdateCustomer({
            phone: invoiceData.customerPhone,
            name: invoiceData.customerName,
            address: invoiceData.customerAddress
        });
        
        const newInvoiceData: Omit<Invoice, 'id'> = {
            ...invoiceData,
            invoiceNumber: generateInvoiceNumber(invoices),
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
    
    const handleUpdatePayment = async (invoiceId: string, amount: number, method: PaymentMethod): Promise<Invoice | null> => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return null;

        const newPayment: Payment = { amount, method, date: new Date().toLocaleDateString("en-IN") };
        const updatedPayments = [...invoice.payments, newPayment];
        
        const updatedInvoice = await updateInvoice(invoiceId, { payments: updatedPayments });
        if (updatedInvoice) {
            if (previewInvoice && previewInvoice.id === invoiceId) {
                setPreviewInvoice(updatedInvoice);
            }
        }
        return updatedInvoice;
    };


    const handleDeleteRequest = (invoiceId: string) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            setConfirmModalState({
                isOpen: true,
                action: 'delete',
                invoice,
                title: t('confirm-deletion-title'),
                message: t('confirm-deletion-message', 'Are you sure you want to permanently delete invoice #{invoiceNumber}? This action cannot be undone.').replace('{invoiceNumber}', invoice.invoiceNumber),
                onConfirm: () => {
                    deleteInvoice(invoiceId);
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
    
    const handleCollectRequest = (invoiceId: string) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            setConfirmModalState({
                isOpen: true,
                action: 'collect',
                invoice,
                title: t('collect-balance-title'),
                message: t('collect-balance-message').replace('{invoiceNumber}', invoice.invoiceNumber),
                onConfirm: async (amount: number, method: PaymentMethod) => {
                    await handleUpdatePayment(invoiceId, amount, method);
                    setConfirmModalState({ isOpen: false });
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
                    onCollect={handleCollectRequest} 
                />
            )}
        </>
    );
};

const generateInvoiceNumber = (existingInvoices: Invoice[]): string => {
    const existingNumbers = new Set(existingInvoices.map(inv => inv.invoiceNumber));
    let newNumber;
    do {
        newNumber = Math.floor(Math.random() * 900000 + 100000).toString();
    } while (existingNumbers.has(newNumber));
    return newNumber;
};


export default App;