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

import type { Invoice, View } from './types';
import { useInvoices } from './hooks/useInvoices';
import { useCustomers } from './hooks/useCustomers';
import { useServices } from './hooks/useServices';
import { useAuth } from './hooks/useAuth';
import { calculateAnalytics } from './services/analyticsService';

const App: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const [view, setView] = useState<View>('dashboard');
    const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
    const { customers, addOrUpdateCustomer } = useCustomers();
    const { serviceSets, saveServiceSets } = useServices();

    const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>({ isOpen: false });
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

    const analytics = useMemo(() => calculateAnalytics(invoices), [invoices]);

    useEffect(() => {
        setTimeout(() => setLoading(false), 2500); // Simulate loading for splash screen
    }, []);

    const handleNavigate = (newView: View) => {
        setInvoiceToEdit(null);
        setView(newView);
    };

    const handleStartNewInvoice = () => {
        setInvoiceToEdit(null);
        setView('new-invoice');
    };
    
    const handleSaveInvoice = (invoice: Invoice) => {
        addOrUpdateCustomer({
            phone: invoice.customerPhone,
            name: invoice.customerName,
            address: invoice.customerAddress
        });
        
        if (invoiceToEdit) {
            updateInvoice(invoice.id, invoice);
        } else {
            addInvoice(invoice);
        }
        
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
                    return Promise.resolve();
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
                message: `The outstanding balance for invoice #${invoice.invoiceNumber} is ₹${invoice.totals.remainingBalance.toFixed(2)}. Enter the amount collected.`,
                onConfirm: (amount) => {
                    const newBalance = invoice.totals.remainingBalance - amount;
                    const updatedInv = { ...invoice, totals: { ...invoice.totals, remainingBalance: newBalance } };
                    updateInvoice(invoiceId, updatedInv);
                    setConfirmModalState({ isOpen: false });
                    return Promise.resolve();
                },
            });
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'dashboard':
                return <DashboardPage analytics={analytics} recentInvoices={invoices.slice(0, 5)} />;
            case 'invoices':
                return <InvoiceListPage invoices={invoices} onDelete={handleDeleteRequest} onCollect={handleCollectRequest} />;
            case 'customers':
                return <CustomerListPage customers={customers} invoices={invoices} />;
            case 'settings':
                return <SettingsPage serviceSets={serviceSets} onSave={saveServiceSets} />;
             case 'new-invoice':
                return <InvoiceFormPage 
                            onSave={handleSaveInvoice} 
                            existingInvoice={invoiceToEdit} 
                            allInvoices={invoices}
                            customers={customers}
                            serviceSets={serviceSets}
                        />;
            default:
                return <DashboardPage analytics={analytics} recentInvoices={invoices.slice(0,5)} />;
        }
    };

    if (loading) {
        return <SplashScreen />;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return (
        <>
            <MainLayout currentView={view} onNavigate={handleNavigate} onNewInvoice={handleStartNewInvoice}>
                {renderContent()}
            </MainLayout>
            <ConfirmationModal state={confirmModalState} setState={setConfirmModalState} />
        </>
    );
};

export default App;