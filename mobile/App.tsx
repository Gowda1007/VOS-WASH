import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, Text, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { ToastProvider } from './src/context/ToastContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { DashboardScreen, InvoicesScreen, CustomersScreen, OrdersScreen, SettingsScreen, RawMaterialsScreen } from './src/screens';
import { CustomerDetailScreen } from './src/screens/CustomerDetailScreen';
import { NewInvoiceScreen } from './src/screens/NewInvoiceScreen';
import { TakeOrderScreen } from './src/screens/TakeOrderScreen';
import { NavigationDrawer } from './src/components/NavigationDrawer';
import { AppHeader } from './src/components/AppHeader';
import { getNotificationAdapter, initializeServices, getPdfAdapter, getRawMaterialService } from './src/services';
import { preloadAssets } from './src/assets/assetLoader';
import * as Application from 'expo-application';
import { useInvoices } from './src/hooks/useInvoices';
import { useCustomers } from './src/hooks/useCustomers';
import { usePendingOrders } from './src/hooks/usePendingOrders'; // Fixed syntax error here
import { RawMaterialProvider } from './src/context/RawMaterialContext'; // Only import Provider here
import { RawMaterial } from './src/core/types/investmentTypes'; // Import RawMaterial type
import { Modal, Button } from './src/components/Common';
import { InvoicePreviewScreen, PaymentModal } from './src/components';
import { LoadingOverlay } from './src/components/LoadingOverlay';
import { useLanguage } from './src/context/LanguageContext';
import { useAppSettings } from './src/hooks/useAppSettings';
import { calculateInvoiceTotal, calculateRemainingBalance } from './src/core/utils/invoiceUtils';
import type { CustomerType, AnalyticsData, Invoice, Customer, PendingOrder, Payment, Service } from './src/core/types'; // Import AnalyticsData and other types
import { colors } from './src/styles/theme';
import AppSplash from './src/components/AppSplash';
import { useNetworkStatusToast } from './src/hooks/useNetworkStatus';
import * as Sharing from 'expo-sharing';

// SplashScreen optional integration (expo-splash-screen). Guard dynamic require to avoid crash if lib absent.
let splash: any = null;
try { splash = require('expo-splash-screen'); splash.preventAutoHideAsync?.().catch(()=>{}); } catch {}

import { DrawerNavigationProp } from '@react-navigation/drawer'; // Import DrawerNavigationProp
import { StackNavigationProp } from '@react-navigation/stack';   // Import StackNavigationProp

// Define types for root stack navigator
export type RootStackParamList = {
  Main: undefined; // Main screen is a drawer navigator
  InvoicePreview: { invoice: Invoice };
  NewInvoice: { fromOrder?: PendingOrder; invoice?: Invoice } | undefined;
  TakeOrder: undefined;
  CustomerDetail: { customerPhone: string } | undefined;
  // Add other stack screens if any, with their params
};

// Define types for drawer navigator
export type DrawerParamList = {
  Dashboard: undefined;
  Invoices: { filter?: 'paid' | 'unpaid' | 'partially_paid' | 'all' | 'outstanding' } | undefined;
  Orders: undefined;
  Customers: undefined;
  Settings: undefined;
  RawMaterials: undefined;
  // Modal screens that are also in drawer but hidden
  NewInvoice: { fromOrder?: PendingOrder; invoice?: Invoice } | undefined;
  TakeOrder: undefined;
  InvoicePreview: { invoice: Invoice };
  CustomerDetail: { customerPhone: string } | undefined;
};

// Extend React Navigation's types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createStackNavigator<RootStackParamList>();

interface AppContentProps {
  isReady: boolean;
  initialRawMaterials: RawMaterial[];
  rawMaterialsLoading: boolean;
  rawMaterialsError: string | null;
  fetchInvoices: (filters?: { q?: string; status?: 'paid'|'unpaid'|'partially_paid'|'all'|'outstanding'; from?: string; to?: string }) => void; // Adjusted type
  deleteInvoice: (invoiceNumber: string) => Promise<void>;
  recordPayment: (invoiceNumber: string, amount: number, method: any, referenceNumber?: string) => Promise<any>;
  invoices: Invoice[]; 
  customers: Customer[];
  pendingOrders: PendingOrder[];
  deletePendingOrder: (orderId: string) => Promise<void>;
  handleRefresh: () => Promise<void>;
  refreshing: boolean;
  setConfirmDeleteOrder: React.Dispatch<React.SetStateAction<string | null>>;
  setConfirmDeleteInvoice: React.Dispatch<React.SetStateAction<string | null>>;
  confirmDeleteOrder: string | null;
  confirmDeleteInvoice: string | null;
  setLoading: (loading: boolean) => void;
}

function AppContent({
  isReady,
  initialRawMaterials,
  rawMaterialsLoading,
  rawMaterialsError,
  fetchInvoices,
  deleteInvoice,
  recordPayment,
  invoices,
  customers,
  pendingOrders,
  deletePendingOrder,
  handleRefresh,
  refreshing,
  setConfirmDeleteOrder,
  setConfirmDeleteInvoice,
  confirmDeleteOrder,
  confirmDeleteInvoice,
  setLoading,
}: AppContentProps) {
  const { t, language } = useLanguage();
  const { settings: appSettings } = useAppSettings();
  const [previewInvoice, setPreviewInvoice] = React.useState<Invoice | null>(null);
  const [collectPaymentInvoice, setCollectPaymentInvoice] = React.useState<Invoice | null>(null);
  // Show online/offline toasts (must be called at top level, not inside effects)
  useNetworkStatusToast();

  const analytics: AnalyticsData = React.useMemo(() => {
    const totalRevenue = invoices.reduce((sum: number, inv: Invoice) => sum + (Number(calculateInvoiceTotal(inv.services)) || 0), 0);
    const totalPayments = invoices.reduce((sum: number, inv: Invoice) => {
      const payments = inv.payments || [];
      const advancePaid = inv.advancePaid?.amount || 0;
      return sum + payments.reduce((pSum: number, p: Payment) => pSum + (Number(p.amount) || 0), 0) + (Number(advancePaid) || 0);
    }, 0);
    const unpaidBalance = invoices.reduce((sum: number, inv: Invoice) => {
      const balance = calculateRemainingBalance(inv);
      return sum + (balance > 0 ? balance : 0);
    }, 0);

    // Calculate totalRawMaterialSpent using initialRawMaterials state
    const totalRawMaterialSpent = initialRawMaterials.reduce((sum: number, rm: RawMaterial) => sum + (rm.totalCost || 0), 0);

    // Calculate active customers (customers with invoices)
    const activeCustomers = new Set(invoices.map(inv => inv.customerPhone)).size;

    // Calculate pending amount from pending orders
    const pendingAmount = pendingOrders.reduce((sum: number, order: PendingOrder) => {
      const orderTotal = order.services.reduce((s: number, svc: Service) => s + ((Number(svc.price) || 0) * (Number(svc.quantity) || 0)), 0);
      return sum + orderTotal;
    }, 0);

    // Calculate revenue by customer type
    const revenueByCustomerType = invoices.reduce((acc: Record<CustomerType, number>, inv: Invoice) => {
      const total = calculateInvoiceTotal(inv.services);
      const custType = inv.customerType || 'customer' as CustomerType;
      acc[custType] = (Number(acc[custType]) || 0) + (Number(total) || 0);
      return acc;
    }, { customer: 0, garage_service_station: 0, dealer: 0 } as Record<CustomerType, number>);

    // Calculate top services
    const serviceCounts = invoices.reduce((acc: Record<string, number>, inv: Invoice) => {
      inv.services.forEach((svc: Service) => {
        const key = svc.name;
        acc[key] = (acc[key] || 0) + (Number(svc.quantity) || 0);
      });
      return acc;
    }, {} as Record<string, number>);
    const topServices = Object.entries(serviceCounts)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a) // Explicitly type sort parameters
      .slice(0, 5) as [string, number][];

    return {
      totalRevenue,
      totalPayments,
      unpaidBalance,
      totalInvoices: invoices.length,
      totalRawMaterialSpent, // Added totalRawMaterialSpent
      activeCustomers,
      pendingAmount,
      totalOrders: pendingOrders.length,
      revenueByCustomerType,
      topServices,
    };
  }, [invoices, pendingOrders, customers, initialRawMaterials]);


  if (!isReady) {
    return <AppSplash />;
  }

  const orderToDelete = pendingOrders.find(o => o.id === confirmDeleteOrder);
  const invoiceToDelete = invoices.find(i => i.invoiceNumber === confirmDeleteInvoice);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">
          {() => (
            <Drawer.Navigator
              drawerContent={(props) => <NavigationDrawer {...props} />}
              screenOptions={{
                drawerType: 'front',
                drawerStyle: { width: 280 },
                header: () => <AppHeader />,
              }}
            >
              <Drawer.Screen 
                name="Dashboard" 
                options={{ 
                  drawerIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} /> 
                }}
              >
                {(props) => (
                  <DashboardScreen
                    {...props}
                    analytics={analytics}
                    allInvoices={invoices}
                    pendingOrders={pendingOrders}
                    onPreviewInvoice={(invoice) => setPreviewInvoice(invoice)}
                    onGenerateInvoice={(order) => props.navigation.navigate('NewInvoice', { fromOrder: order })}
                    onCollectPayment={(invoice) => setCollectPaymentInvoice(invoice)}
                    onDeleteInvoice={(invoiceNumber) => setConfirmDeleteInvoice(invoiceNumber)}
                    onDeleteOrder={(orderId) => setConfirmDeleteOrder(orderId)}
                    onNavigateToUnpaid={() => props.navigation.navigate('Invoices', { filter: 'unpaid' })}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                  />
                )}
              </Drawer.Screen>
              <Drawer.Screen 
                name="Invoices" 
                component={InvoicesScreen} 
                options={{ 
                  drawerIcon: ({ color, size }) => <MaterialIcons name="receipt" size={size} color={color} /> 
                }} 
              />
              <Drawer.Screen 
                name="Orders" 
                component={OrdersScreen} 
                options={{ 
                  drawerIcon: ({ color, size }) => <MaterialIcons name="list-alt" size={size} color={color} /> 
                }} 
              />
              <Drawer.Screen 
                name="Customers" 
                component={CustomersScreen} 
                options={{ 
                  drawerIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} /> 
                }} 
              />
              <Drawer.Screen 
                name="Settings" 
                component={SettingsScreen} 
                options={{ 
                  drawerIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} /> 
                }}
              />
              <Drawer.Screen
                name="RawMaterials"
                component={RawMaterialsScreen}
                options={{
                  drawerIcon: ({ color, size }) => <MaterialIcons name="local-shipping" size={size} color={color} />
                }}
              />
              {/* Modal screens inside drawer for drawer access */}
              <Drawer.Screen 
                name="NewInvoice" 
                component={NewInvoiceScreen}
                options={{
                  drawerItemStyle: { display: 'none' },
                }}
              />
              <Drawer.Screen 
                name="TakeOrder" 
                component={TakeOrderScreen}
                options={{
                  drawerItemStyle: { display: 'none' },
                }}
              />
              <Drawer.Screen 
                name="CustomerDetail" 
                component={CustomerDetailScreen}
                options={{
                  drawerItemStyle: { display: 'none' },
                }}
              />
            </Drawer.Navigator>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>

    {/* Confirm Delete Order Modal */}
    <Modal
      visible={!!confirmDeleteOrder}
      onClose={() => setConfirmDeleteOrder(null)}
      title={t('confirm-order-deletion-title', 'Confirm Order Deletion')}
      footer={
        <>
          <Button variant="secondary" onPress={() => setConfirmDeleteOrder(null)}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            variant="danger"
            onPress={async () => {
              if (confirmDeleteOrder) {
                await deletePendingOrder(confirmDeleteOrder);
                setConfirmDeleteOrder(null);
              }
            }}
          >
            {t('confirm-delete', 'Confirm Delete')}
          </Button>
        </>
      }
    >
      <Text style={styles.modalText}>
        {orderToDelete
          ? t('confirm-order-deletion-message', 'Are you sure you want to delete the pending order for {customerName}?').replace(
              '{customerName}',
              orderToDelete.customerName
            )
          : t('confirm-order-deletion-message', 'Are you sure you want to delete this order?')}
      </Text>
    </Modal>

    {/* Confirm Delete Invoice Modal */}
    <Modal
      visible={!!confirmDeleteInvoice}
      onClose={() => setConfirmDeleteInvoice(null)}
      title={t('confirm-deletion-title', 'Confirm Deletion')}
      footer={
        <>
          <Button variant="secondary" onPress={() => setConfirmDeleteInvoice(null)}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            variant="danger"
            onPress={async () => {
              if (confirmDeleteInvoice) {
                await deleteInvoice(confirmDeleteInvoice);
                setConfirmDeleteInvoice(null);
              }
            }}
          >
            {t('confirm-delete', 'Confirm Delete')}
          </Button>
        </>
      }
    >
      <Text style={styles.modalText}>
        {invoiceToDelete
          ? t('confirm-deletion-message', 'Are you sure you want to permanently delete invoice #{invoiceNumber}? This action cannot be undone.').replace(
              '{invoiceNumber}',
              invoiceToDelete.invoiceNumber
            )
          : t('confirm-deletion-message', 'Are you sure you want to delete this invoice?')}
      </Text>
    </Modal>

    {/* Invoice Preview Modal */}
    {previewInvoice && (
      <Modal visible={true} onClose={() => setPreviewInvoice(null)} title="">
        <InvoicePreviewScreen
          invoice={previewInvoice}
          company={{
            name: appSettings.companyName,
            tagline: appSettings.companyTagline || '',
            address: 'Uttarahalli, Bengaluru - 61',
            phone: appSettings.companyPhone,
            email: appSettings.companyEmail,
            gstNumber: appSettings.gstNumber || '',
          }}
          onClose={() => setPreviewInvoice(null)}
          onCollectPayment={() => {
            if (previewInvoice) {
              setCollectPaymentInvoice(previewInvoice);
              setPreviewInvoice(null);
            }
          }}
        />
      </Modal>
    )}

    {/* Payment Collection Modal */}
    <PaymentModal
      visible={!!collectPaymentInvoice}
      invoice={collectPaymentInvoice}
      onClose={() => setCollectPaymentInvoice(null)}
      onSuccess={() => {
        setCollectPaymentInvoice(null);
        fetchInvoices();
      }}
    />
  </>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [bootStart] = useState(() => Date.now());
  const [appReloadKey, setAppReloadKey] = useState(0);
  const [initialRawMaterials, setInitialRawMaterials] = useState<RawMaterial[]>([]);
  
  // Get service instances
  const notificationAdapter = getNotificationAdapter();
  const pdfAdapter = getPdfAdapter();
  const rawMaterialService = getRawMaterialService();
  const [rawMaterialsLoading, setRawMaterialsLoading] = useState(true);
  const [rawMaterialsError, setRawMaterialsError] = useState<string | null>(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<string | null>(null);
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { invoices, fetchInvoices, deleteInvoice, recordPayment } = useInvoices(setLoading);
  const { customers } = useCustomers(setLoading);
  const { pendingOrders, deletePendingOrder } = usePendingOrders(setLoading);
  
  const [refreshing, setRefreshing] = useState(false);

  const prepareApp = useCallback(async () => {
      try {
        const rawMaterialsPromise = rawMaterialService.getRawMaterials()
            .then(data => {
              setInitialRawMaterials(data);
              setRawMaterialsLoading(false);
              return data;
            })
            .catch(err => {
              console.error('Failed to pre-fetch raw materials:', err);
              setRawMaterialsError(err.message || 'Failed to pre-fetch raw materials');
              setRawMaterialsLoading(false);
              return []; // Return empty array on error
            });

        const startupPromise = Promise.all([
          initializeServices(),
          preloadAssets(),
          (async () => {
            const isExpoGo = Application.applicationName === 'Expo Go' || (global as any).ExpoGo;
            if (!isExpoGo) {
              await notificationAdapter.requestPermissions?.();
            } else {
              console.log('ℹ️ Running in Expo Go - Notifications will be enabled in production build');
            }
          })(),
          rawMaterialsPromise, // Include the raw materials promise in startup
        ]);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initialization timed out')), 30000) // Increased timeout to 30s
        );

        await Promise.race([startupPromise, timeoutPromise]);
        
        const elapsed = Date.now() - bootStart;
        const remaining = Math.max(0, 5000 - elapsed);
        setTimeout(() => setIsReady(true), remaining);
      } catch (error) {
        console.error('App initialization error:', error);
        const elapsed = Date.now() - bootStart;
        const remaining = Math.max(0, 5000 - elapsed);
        setTimeout(() => setIsReady(true), remaining);
      }
      finally {
        // Hide native splash after initial ready state if available
      }
  }, [bootStart]);

  useEffect(() => {
    prepareApp();
  }, [prepareApp]);

  useEffect(() => {
    if (isReady) {
      setTimeout(() => splash?.hideAsync?.().catch(()=>{}), 10);
      pdfAdapter.requestStoragePermissions();
    }
  }, [isReady]);

  const reloadApp = useCallback(async () => {
    // Show splash and remount navigation/app content
    setIsReady(false);
    setAppReloadKey((k) => k + 1);
    await prepareApp();
  }, [prepareApp]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Hard reload app (remount + re-init services and assets)
      await reloadApp();
    } finally {
      setRefreshing(false);
    }
  }, [reloadApp]);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ToastProvider>
          <RawMaterialProvider
            initialRawMaterials={initialRawMaterials}
            initialLoading={rawMaterialsLoading}
            initialError={rawMaterialsError}
          >
            <StatusBar hidden={true} />
            <AppContent
              key={`app-${appReloadKey}`}
              isReady={isReady}
              initialRawMaterials={initialRawMaterials}
              rawMaterialsLoading={rawMaterialsLoading}
              rawMaterialsError={rawMaterialsError}
              fetchInvoices={fetchInvoices}
              deleteInvoice={deleteInvoice}
              recordPayment={recordPayment}
              invoices={invoices}
              customers={customers}
              pendingOrders={pendingOrders}
              deletePendingOrder={deletePendingOrder}
              handleRefresh={handleRefresh}
              refreshing={refreshing}
              setConfirmDeleteOrder={setConfirmDeleteOrder}
              setConfirmDeleteInvoice={setConfirmDeleteInvoice}
              confirmDeleteOrder={confirmDeleteOrder}
              confirmDeleteInvoice={confirmDeleteInvoice}
              setLoading={setLoading}
            />
            <LoadingOverlay visible={loading} />
          </RawMaterialProvider>
        </ToastProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.background 
  },
  modalText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 20,
    lineHeight: 20,
  },
});