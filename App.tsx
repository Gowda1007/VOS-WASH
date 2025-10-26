import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from './components/MainLayout';
import { DashboardPage } from './components/DashboardPage';
import { InvoiceListPage } from './components/InvoiceListPage';
import { CustomerListPage } from './components/CustomerListPage';
import { SettingsPage } from './components/SettingsPage';
import { InvoiceFormPage } from './components/InvoiceFormPage';
import { ConfirmationModal, ConfirmModalState } from './components/ConfirmationModal';
import { SplashScreen } from './components/SplashScreen';
import { LoginPage } from './components/LoginPage';
import { RoleSelectionPage } from './components/RoleSelectionPage';
import { CustomerLoginPage } from './components/CustomerLoginPage';
import { CustomerDashboard } from './components/CustomerDashboard';
import { ReportsPage } from './components/ReportsPage';
import { ProductManagementPage } from './components/ProductManagementPage';
import { OrderManagementPage } from './components/OrderManagementPage';

import type { Invoice, View, Payment, PaymentMethod, Customer, Product, Order, ShippingDetails } from './types';
import { useInvoices } from './hooks/useInvoices';
import { useCustomers } from './hooks/useCustomers';
import { useServices } from './hooks/useServices';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';
import { useAppSettings } from './hooks/useAppSettings';
import { calculateAnalytics } from './services/analyticsService';

const App: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const [roleNotSelected, setRoleNotSelected] = useState(true);

    const [view, setView] = useState<View>('dashboard');
    const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
    const { customers, addCustomer, addOrUpdateCustomer, isCustomerExists } = useCustomers();
    const { serviceSets, saveServiceSets } = useServices();
    const { products, addProduct, updateProduct, deleteProduct } = useProducts();
    const { orders, addOrder, updateOrder } = useOrders();
    const { settings, saveSettings } = useAppSettings();

    const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>({ isOpen: false });
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

    const analytics = useMemo(() => calculateAnalytics(invoices), [invoices]);

    useEffect(() => {
        setTimeout(() => setLoading(false), 2500);
    }, []);

    const handleNavigate = (newView: View) => {
        setInvoiceToEdit(null);
        setView(newView);
    };

    const handleStartNewInvoice = () => {
        setInvoiceToEdit(null);
        setView('new-invoice');
    };
    
    const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate' | 'payments'>, initialPayment?: { amount: number, method: PaymentMethod }) => {
        addOrUpdateCustomer({
            phone: invoiceData.customerPhone,
            name: invoiceData.customerName,
            address: invoiceData.customerAddress
        });

        const finalPayments = initialPayment && initialPayment.amount > 0 ? [{ ...initialPayment, date: new Date().toLocaleDateString("en-IN") }] : [];
        
        const newInvoice: Omit<Invoice, 'id'> = {
            ...invoiceData,
            invoiceNumber: generateInvoiceNumber(invoices),
            invoiceDate: new Date().toLocaleDateString("en-IN"),
            payments: finalPayments,
        };
        
        addInvoice(newInvoice);
        
        setInvoiceToEdit(null);
        setView('invoices');
    };

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
                },
            });
        }
    };

    const renderAdminContent = () => {
        switch (view) {
            case 'dashboard': return <DashboardPage analytics={analytics} recentInvoices={invoices.slice(0, 5)} />;
            case 'invoices': return <InvoiceListPage invoices={invoices} onDelete={handleDeleteRequest} onCollect={handleCollectRequest} />;
            case 'customers': return <CustomerListPage customers={customers} invoices={invoices} onAddCustomer={addCustomer} isCustomerExists={isCustomerExists} />;
            case 'products': return <ProductManagementPage products={products} onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct} />;
            case 'orders': return <OrderManagementPage orders={orders} onUpdateOrder={updateOrder} />;
            case 'settings': return <SettingsPage serviceSets={serviceSets} onSaveServices={saveServiceSets} appSettings={settings} onSaveSettings={saveSettings} />;
            case 'reports': return <ReportsPage invoices={invoices} />;
            case 'new-invoice': return <InvoiceFormPage onSave={handleSaveInvoice} existingInvoice={invoiceToEdit} customers={customers} serviceSets={serviceSets} />;
            default: return <DashboardPage analytics={analytics} recentInvoices={invoices.slice(0,5)} />;
        }
    };

    if (loading || authLoading) {
        return <SplashScreen />;
    }

    if (!user) {
        if (roleNotSelected) {
            return <RoleSelectionPage onSelectRole={() => setRoleNotSelected(false)} />;
        }
        
        const selectedRole = localStorage.getItem('selectedRole');
        if (selectedRole === 'customer') {
            return <CustomerLoginPage customers={customers} />;
        }
        return <LoginPage />;
    }

    if (user.role === 'customer') {
        const customer = customers.find(c => c.phone === user.phone);
        return <CustomerDashboard 
            customer={customer!} 
            allInvoices={invoices} 
            products={products}
            orders={orders.filter(o => o.customerPhone === user.phone)}
            onPlaceOrder={addOrder}
            onUpdateOrder={updateOrder}
            settings={settings}
        />;
    }
    
    return (
        <>
            <MainLayout currentView={view} onNavigate={handleNavigate} onNewInvoice={handleStartNewInvoice}>
                {renderAdminContent()}
            </MainLayout>
            <ConfirmationModal state={confirmModalState} setState={setConfirmModalState} />
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
