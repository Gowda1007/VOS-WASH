import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, SafeAreaView, View, StatusBar, Platform, Alert } from 'react-native';
import { MainLayout } from './components/MainLayout';
import { DashboardPage } from './components/DashboardPage';
import { InvoiceListPage } from './components/InvoiceListPage';
import { CustomerListPage } from './components/CustomerListPage';
import { SettingsPage } from './components/SettingsPage';
import { ReportsPage } from './components/ReportsPage';
import { InvoiceFormPage } from './components/InvoiceFormPage';
import { CustomerDetailPage } from './components/CustomerDetailPage';
import { DayBookPage } from './components/DayBookPage';
import { OrderFormPage } from './components/OrderFormPage';
import { SplashScreen } from './components/SplashScreen';
import { ConfirmationModal } from './components/ConfirmationModal';
import { InvoicePreviewOverlay } from './components/InvoicePreviewOverlay';
import { useInvoices, calculateRemainingBalance } from './hooks/useInvoices';
import { calculateAnalytics } from './services/analyticsService'; // FIX: Corrected import path for calculateAnalytics
import { useCustomers } from './hooks/useCustomers';
import { useServices } from './hooks/useServices';
import { useAppSettings } from './hooks/useAppSettings';
import { usePendingOrders } from './hooks/usePendingOrders';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { ToastProvider, useToast, ToastContainer } from './hooks/useToast'; // FIX: Import ToastContainer from useToast hook
import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import type { View as AppView, Invoice, Customer, ServiceSets, AppSettings, PendingOrder, ConfirmModalState, InvoiceStatus, PaymentMethod } from './types'; // FIX: Imported PaymentMethod
import * as apiService from './services/apiService';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pendingOrderToInvoice, setPendingOrderToInvoice] = useState<PendingOrder | null>(null);
  const toast = useToast();
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();

  // Data Hooks
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { customers, addOrUpdateCustomer, deleteCustomer } = useCustomers();
  const { serviceSets, saveServiceSets } = useServices();
  const { settings: appSettings, saveSettings } = useAppSettings();
  const { pendingOrders, addPendingOrder, deletePendingOrder } = usePendingOrders();

  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Toast management for direct rendering - This block is no longer needed after refactoring ToastContainer to use context
  // const [toasts, setToasts] = useState([]);
  // const addToast = useCallback((message, type) => {
  //   const id = Date.now();
  //   setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  // }, []);
  // const removeToast = useCallback((id) => {
  //   setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  // }, []);

  useEffect(() => {
    // Override Toast context addToast with local implementation that updates this AppContent's state
    // This is a workaround since useToast cannot directly modify AppContent's state via context in a pure RN render
    // A more robust solution might involve a global state manager or a different ToastProvider structure.
    // For now, it will use the context's addToast, and ToastProvider will render its own ToastContainer.
  }, []); // FIX: Removed [addToast] as it's no longer necessary

  useEffect(() => {
    const loadData = async () => {
      // Simulate data loading progress
      let currentProgress = 0;
      const totalSteps = 5;
      const increment = 100 / totalSteps;

      await Promise.all([
        apiService.getInvoices().then(() => setProgress(currentProgress += increment)),
        apiService.getCustomers().then(() => setProgress(currentProgress += increment)),
        apiService.getServiceSets().then(() => setProgress(currentProgress += increment)),
        apiService.getSettings().then(() => setProgress(currentProgress += increment)),
        apiService.getPendingOrders().then(() => setProgress(currentProgress += increment)),
      ]);

      // Ensure progress reaches 100%
      setProgress(100);
      setTimeout(() => setIsLoading(false), 500); // Give a little time for splash screen animation
    };
    loadData();
  }, []);

  const analytics = useMemo(() => calculateAnalytics(invoices), [invoices]);

  const handleNavigate = useCallback((view: AppView) => {
    setCurrentView(view);
    setSelectedInvoice(null);
    setSelectedCustomer(null);
    setPendingOrderToInvoice(null);
  }, []);

  const handleNewInvoice = useCallback(() => {
    setCurrentView('new-invoice');
    setSelectedInvoice(null);
    setPendingOrderToInvoice(null);
  }, []);

  const handleTakeOrder = useCallback(() => {
    setCurrentView('take-order');
    setSelectedInvoice(null);
    setPendingOrderToInvoice(null);
  }, []);

  // Confirmation Modal Logic
  const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>({
    isOpen: false,
    action: undefined,
  });

  const handleConfirmAction = useCallback(async (...args: any[]) => {
    if (!confirmModalState.action) return;

    if (confirmModalState.action === 'delete' && confirmModalState.invoice) {
      await deleteInvoice(confirmModalState.invoice.id);
      toast.success(t('confirm-deletion-success', 'Invoice deleted successfully!'));
    } else if (confirmModalState.action === 'collect' && confirmModalState.invoice) {
      const [amount, method] = args;
      if (amount <= 0) {
        toast.error(t('enter-valid-amount', 'Please enter a valid amount.'));
        return;
      }
      // FIX: Ensure 'method' is explicitly typed as PaymentMethod
      const newPayment = { amount: amount, date: new Date().toLocaleDateString("en-IN"), method: method as PaymentMethod };
      await updateInvoice(confirmModalState.invoice.id, {
        payments: [...confirmModalState.invoice.payments, newPayment]
      });
      toast.success(t('payment-recorded-successfully', 'Payment recorded successfully!'));
      setSelectedInvoice(prev => prev ? { ...prev, payments: [...prev.payments, newPayment] } : null);
    } else if (confirmModalState.action === 'deleteOrder' && confirmModalState.order) {
      await deletePendingOrder(confirmModalState.order.id);
      toast.success(t('delete-order-success', 'Pending order deleted.'));
    } else if (confirmModalState.action === 'deleteCustomer' && confirmModalState.customer) {
      await deleteCustomer(confirmModalState.customer.phone);
      toast.success(t('delete-customer-success', 'Customer deleted successfully!'));
      handleNavigate('customers'); // Go back to customer list
    }

    setConfirmModalState({ isOpen: false });
  }, [confirmModalState, deleteInvoice, updateInvoice, deletePendingOrder, deleteCustomer, toast, t, handleNavigate]);


  const openDeleteInvoiceModal = useCallback((invoice: Invoice) => {
    setConfirmModalState({
      isOpen: true,
      action: 'delete',
      invoice: invoice,
      title: t('confirm-deletion-title', 'Confirm Deletion'),
      message: t('confirm-deletion-message', 'Are you sure you want to permanently delete invoice #{invoiceNumber}? This action cannot be undone.').replace('{invoiceNumber}', invoice.invoiceNumber),
      onConfirm: handleConfirmAction,
    });
  }, [handleConfirmAction, t]);

  const openCollectPaymentModal = useCallback((invoice: Invoice) => {
    setConfirmModalState({
      isOpen: true,
      action: 'collect',
      invoice: invoice,
      title: t('collect-balance-title', 'Collect Balance'),
      message: t('collect-balance-message', 'Record a payment for invoice #{invoiceNumber}.').replace('{invoiceNumber}', invoice.invoiceNumber),
      onConfirm: handleConfirmAction,
    });
  }, [handleConfirmAction, t]);

  const openDeleteOrderModal = useCallback((order: PendingOrder) => {
    setConfirmModalState({
      isOpen: true,
      action: 'deleteOrder',
      order: order,
      title: t('confirm-order-deletion-title', 'Confirm Order Deletion'),
      message: t('confirm-order-deletion-message', 'Are you sure you want to delete the pending order for {customerName}?').replace('{customerName}', order.customerName),
      onConfirm: handleConfirmAction,
    });
  }, [handleConfirmAction, t]);

  const openDeleteCustomerModal = useCallback((customer: Customer) => {
    setConfirmModalState({
      isOpen: true,
      action: 'deleteCustomer',
      customer: customer,
      title: t('confirm-customer-deletion-title', 'Confirm Customer Deletion'),
      message: t('confirm-customer-deletion-message', 'Are you sure you want to permanently delete customer {customerName} and their associated data? This action cannot be undone.').replace('{customerName}', customer.name),
      onConfirm: handleConfirmAction,
    });
  }, [handleConfirmAction, t]);


  const handleSaveInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate'>) => {
    // Check if customer exists, add/update if needed
    const existingCustomer = customers.find(c => c.phone === invoiceData.customerPhone);
    if (!existingCustomer || existingCustomer.name !== invoiceData.customerName || existingCustomer.address !== invoiceData.customerAddress) {
      await addOrUpdateCustomer({
        phone: invoiceData.customerPhone,
        name: invoiceData.customerName,
        address: invoiceData.customerAddress,
      });
    }

    const newInvoice = await addInvoice({
      ...invoiceData,
      invoiceNumber: `INV-${Date.now() % 100000}`, // Simple invoice number generation
      invoiceDate: new Date().toLocaleDateString("en-IN"), // DD/MM/YYYY
    });
    return newInvoice;
  }, [addInvoice, addOrUpdateCustomer, customers]);

  const handleUpdatePayment = useCallback(async (invoiceId: number, amount: number, method: string) => {
    // FIX: Ensure 'method' is explicitly typed as PaymentMethod
    const newPayment = { amount, date: new Date().toLocaleDateString("en-IN"), method: method as PaymentMethod };
    const updatedInvoice = await updateInvoice(invoiceId, {
      payments: [...(invoices.find(inv => inv.id === invoiceId)?.payments || []), newPayment],
    });
    return updatedInvoice;
  }, [updateInvoice, invoices]);

  const handleGenerateInvoiceFromOrder = useCallback(async (order: PendingOrder) => {
    const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate' | 'payments'> & { payments: Invoice['payments'] } = {
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      customerType: order.customerType,
      services: order.services,
      advancePaid: order.advancePaid.amount > 0 ? order.advancePaid : undefined,
      payments: [],
    };
    setPendingOrderToInvoice(order);
    setCurrentView('new-invoice');
    toast.info(t('pending-order-loaded', 'Pending order details loaded into new invoice form.'));
  }, [toast, t]);


  const getPageTitle = useCallback((view: AppView): string => {
    switch (view) {
      case 'dashboard': return t('page-title-dashboard');
      case 'invoices': return t('page-title-invoices');
      case 'customers': return t('page-title-customers');
      case 'settings': return t('page-title-settings');
      case 'reports': return t('page-title-reports');
      case 'new-invoice': return t('page-title-new-invoice');
      case 'customer-detail': return selectedCustomer?.name || t('page-title-customer-detail');
      case 'day-book': return t('page-title-day-book');
      case 'take-order': return t('page-title-take-order');
      default: return 'VOS WASH';
    }
  }, [t, selectedCustomer]);

  if (isLoading) {
    return (
      <SplashScreen progress={progress} />
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardPage
            analytics={analytics}
            recentInvoices={invoices.slice(0, 5)}
            pendingOrders={pendingOrders}
            onPreviewInvoice={(inv) => { setSelectedInvoice(inv); }}
            onGenerateInvoice={handleGenerateInvoiceFromOrder}
            onDeleteOrder={openDeleteOrderModal} // FIX: Now passes PendingOrder object
            onNavigateToUnpaid={() => { setCurrentView('invoices'); }}
          />
        );
      case 'invoices':
        return (
          <InvoiceListPage
            invoices={invoices}
            onDelete={openDeleteInvoiceModal} // FIX: Now passes Invoice object
            onCollect={openCollectPaymentModal} // FIX: Now passes Invoice object
            onPreview={(inv) => { setSelectedInvoice(inv); }}
          />
        );
      case 'new-invoice':
        return (
          <InvoiceFormPage
            onSave={handleSaveInvoice}
            onUpdatePayment={handleUpdatePayment}
            onComplete={() => handleNavigate('invoices')}
            existingInvoice={null} // For new invoice, no existing invoice
            customers={customers}
            serviceSets={serviceSets}
            invoices={invoices} // Pass all invoices for old balance calculation
            pendingOrder={pendingOrderToInvoice}
            appSettings={appSettings}
          />
        );
      case 'take-order':
        return (
          <OrderFormPage
            onSave={async (orderData) => { await addPendingOrder(orderData); handleNavigate('dashboard'); }}
            customers={customers}
            serviceSets={serviceSets}
            appSettings={appSettings}
          />
        );
      case 'customers':
        return (
          <CustomerListPage
            customers={customers}
            invoices={invoices}
            onViewCustomer={(cust) => { setSelectedCustomer(cust); setCurrentView('customer-detail'); }}
          />
        );
      case 'customer-detail':
        if (!selectedCustomer) {
          handleNavigate('customers'); // Redirect if no customer selected
          return null;
        }
        return (
          <CustomerDetailPage
            customer={selectedCustomer}
            invoices={invoices.filter(inv => inv.customerPhone === selectedCustomer.phone)}
            onNavigateBack={() => handleNavigate('customers')}
            onCollectInvoice={openCollectPaymentModal} // FIX: Now passes Invoice object
            onPreviewInvoice={(inv) => { setSelectedInvoice(inv); }}
            onDeleteCustomer={openDeleteCustomerModal}
          />
        );
      case 'day-book':
        return (
          <DayBookPage
            invoices={invoices}
            onPreviewInvoice={(inv) => { setSelectedInvoice(inv); }}
            // onCollectInvoice={openCollectPaymentModal} // Removed, not relevant for DayBook
          />
        );
      case 'reports':
        return <ReportsPage invoices={invoices} />;
      case 'settings':
        return <SettingsPage serviceSets={serviceSets} onSaveServices={saveServiceSets} appSettings={appSettings} onSaveSettings={saveSettings} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, resolvedTheme === 'dark' ? styles.darkBackground : styles.lightBackground]}>
      <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={resolvedTheme === 'dark' ? '#1e293b' : '#f1f5f9'} />
      <MainLayout
        currentView={currentView}
        pageTitle={getPageTitle(currentView)}
        onNavigate={handleNavigate}
        onNewInvoice={handleNewInvoice}
        onTakeOrder={handleTakeOrder}
      >
        {renderContent()}
      </MainLayout>

      <ConfirmationModal state={confirmModalState} setState={setConfirmModalState} appSettings={appSettings} />
      {selectedInvoice && (
        <InvoicePreviewOverlay
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onCollect={openCollectPaymentModal}
        />
      )}
      {/* ToastContainer must be rendered at the top level to act as an overlay */}
      <ToastContainer /> {/* FIX: ToastContainer now uses context directly, no props needed */}
    </SafeAreaView>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <LanguageProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </LanguageProvider>
  </ThemeProvider>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  lightBackground: {
    backgroundColor: '#f1f5f9', // bg-slate-100
  },
  darkBackground: {
    backgroundColor: '#0f172a', // bg-slate-900
  },
});

export default App;