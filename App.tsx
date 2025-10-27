import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from './components/MainLayout';
import { DashboardPage } from './components/DashboardPage';
import { InvoiceListPage } from './components/InvoiceListPage';
import { CustomerListPage } from './components/CustomerListPage';
import { CustomerDetailPage } from './components/CustomerDetailPage';
import { SettingsPage } from './components/SettingsPage';
import { InvoiceFormPage } from './components/InvoiceFormPage';
import { OrderFormPage } from './components/OrderFormPage';
import { ConfirmationModal, ConfirmModalState } from './components/ConfirmationModal';
import { SplashScreen } from './components/SplashScreen';
import { ReportsPage } from './components/ReportsPage';
import { DayBookPage } from './components/DayBookPage';
import { InvoicePreviewOverlay } from './components/InvoicePreviewOverlay';

import type { Invoice, View, Payment, Customer, PendingOrder } from './types';
import { useInvoices } from './hooks/useInvoices';
import { useCustomers } from './hooks/useCustomers';
import { useServices } from './hooks/useServices';
import { useAppSettings } from './hooks/useAppSettings';
import { usePendingOrders } from './hooks/usePendingOrders';
import { calculateAnalytics } from './services/analyticsService';

const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    invoices: 'Invoices',
    customers: 'Customers',
    settings: 'Settings',
    reports: 'Financial Reports',
    'new-invoice': 'New Invoice',
    'take-order': 'Take Order',
    'customer-detail': 'Customer Details',
    'day-book': 'Day Book',
};

const App: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('dashboard');
    const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
    const { customers, addOrUpdateCustomer } = useCustomers();
    const { serviceSets, saveServiceSets } = useServices();
    const { pendingOrders, addPendingOrder, deletePendingOrder } = usePendingOrders();
    const { settings, saveSettings } = useAppSettings();

    const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>({ isOpen: false });
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
    const [orderToConvert, setOrderToConvert] = useState<PendingOrder | null>(null);
    
    const analytics = useMemo(() => calculateAnalytics(invoices), [invoices]);

    useEffect(() => {
        setTimeout(() => setLoading(false), 5000);
    }, []);

    const handleNavigate = (newView: View) => {
        setInvoiceToEdit(null);
        setSelectedCustomer(null);
        setOrderToConvert(null);
        setView(newView);
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

    const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate'>) => {
        addOrUpdateCustomer({
            phone: invoiceData.customerPhone,
            name: invoiceData.customerName,
            address: invoiceData.customerAddress
        });
        
        const newInvoice: Omit<Invoice, 'id'> = {
            ...invoiceData,
            invoiceNumber: generateInvoiceNumber(invoices),
            invoiceDate: new Date().toLocaleDateString("en-IN"),
        };
        
        addInvoice(newInvoice);
        
        if (orderToConvert) {
            deletePendingOrder(orderToConvert.id);
            setOrderToConvert(null);
        }
        
        setInvoiceToEdit(null);
        setView('invoices');
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


    const handleDeleteRequest = (invoiceId: number) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            setConfirmModalState({
                isOpen: true,
                action: 'delete',
                invoice,
                title: 'Confirm Deletion',
                message: `Are you sure you want to permanently delete invoice #${invoice.invoiceNumber}? This action cannot be undone.`,
                onConfirm: () => {
                    deleteInvoice(invoiceId);
                    setConfirmModalState({ isOpen: false });
                },
            });
        }
    };
    
    const handleCollectRequest = (invoiceId: number) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            setConfirmModalState({
                isOpen: true,
                action: 'collect',
                invoice,
                title: 'Collect Balance',
                message: `Record a payment for invoice #${invoice.invoiceNumber}.`,
                onConfirm: (amount, method) => {
                    const newPayment: Payment = {
                        amount,
                        method,
                        date: new Date().toLocaleDateString("en-IN")
                    };
                    const updatedPayments = [...invoice.payments, newPayment];
                    updateInvoice(invoiceId, { payments: updatedPayments });
                    setConfirmModalState({ isOpen: false });
                    if (previewInvoice && previewInvoice.id === invoiceId) {
                        setPreviewInvoice({ ...invoice, payments: updatedPayments });
                    }
                },
            });
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'dashboard': return <DashboardPage analytics={analytics} recentInvoices={invoices.slice(0, 5)} pendingOrders={pendingOrders} onPreviewInvoice={handlePreviewInvoice} onGenerateInvoice={handleGenerateInvoiceFromOrder} />;
            case 'invoices': return <InvoiceListPage invoices={invoices} onDelete={handleDeleteRequest} onCollect={handleCollectRequest} onPreview={handlePreviewInvoice} />;
            case 'customers': return <CustomerListPage customers={customers} invoices={invoices} onViewCustomer={handleViewCustomer} />;
            case 'customer-detail': 
                if (!selectedCustomer) {
                    setView('customers');
                    return null;
                }
                const customerTitle = selectedCustomer ? `${selectedCustomer.name}` : 'Customer Details';
                viewTitles['customer-detail'] = customerTitle;

                return <CustomerDetailPage 
                    customer={selectedCustomer} 
                    invoices={invoices.filter(i => i.customerPhone === selectedCustomer.phone)}
                    onNavigateBack={() => handleNavigate('customers')}
                    onCollectInvoice={handleCollectRequest}
                    onPreviewInvoice={handlePreviewInvoice}
                />;
            case 'day-book': return <DayBookPage invoices={invoices} onPreviewInvoice={handlePreviewInvoice} onCollectInvoice={handleCollectRequest} />;
            case 'settings': return <SettingsPage serviceSets={serviceSets} onSaveServices={saveServiceSets} appSettings={settings} onSaveSettings={saveSettings} />;
            case 'reports': return <ReportsPage invoices={invoices} />;
            case 'new-invoice': return <InvoiceFormPage onSave={handleSaveInvoice} existingInvoice={invoiceToEdit} customers={customers} serviceSets={serviceSets} invoices={invoices} pendingOrder={orderToConvert} />;
            case 'take-order': return <OrderFormPage onSave={handleSaveOrder} customers={customers} serviceSets={serviceSets} appSettings={settings} />;
            default: return <DashboardPage analytics={analytics} recentInvoices={invoices.slice(0,5)} pendingOrders={pendingOrders} onPreviewInvoice={handlePreviewInvoice} onGenerateInvoice={handleGenerateInvoiceFromOrder} />;
        }
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
                pageTitle={viewTitles[view] || 'VOS WASH'}
            >
                {renderContent()}
            </MainLayout>
            <ConfirmationModal state={confirmModalState} setState={setConfirmModalState} />
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