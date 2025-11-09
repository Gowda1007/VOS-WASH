import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { ToastProvider } from './src/context/ToastContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { DashboardScreen, InvoicesScreen, CustomersScreen, OrdersScreen, SettingsScreen } from './src/screens';
import { storageAdapter, notificationAdapter } from './src/adapters';
import { useInvoices } from './src/hooks/useInvoices';
import { useCustomers } from './src/hooks/useCustomers';
import { usePendingOrders } from './src/hooks/usePendingOrders';
import { calculateInvoiceTotal, calculateRemainingBalance } from './src/core/utils/invoiceUtils';
import { colors } from './src/styles/theme';
import type { CustomerType } from './src/core/types';

const Tab = createBottomTabNavigator();

const PlaceholderScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

// Real screens wired below via barrel exports

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { invoices, fetchInvoices } = useInvoices();
  const { customers } = useCustomers();
  const { pendingOrders } = usePendingOrders();

  useEffect(() => {
    async function prepare() {
      try {
        await notificationAdapter.requestPermissions();
        await fetchInvoices();
        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInvoices();
    } finally {
      setRefreshing(false);
    }
  };

  const analytics = React.useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
    const totalPayments = invoices.reduce((sum, inv) => {
      const payments = inv.payments || [];
      const advancePaid = inv.advancePaid?.amount || 0;
      return sum + payments.reduce((pSum, p) => pSum + p.amount, 0) + advancePaid;
    }, 0);
    const unpaidBalance = invoices.reduce((sum, inv) => {
      const balance = calculateRemainingBalance(inv);
      return sum + (balance > 0 ? balance : 0);
    }, 0);

    // Calculate active customers (customers with invoices)
    const activeCustomers = new Set(invoices.map(inv => inv.customerPhone)).size;

    // Calculate pending amount from pending orders
    const pendingAmount = pendingOrders.reduce((sum, order) => {
      const orderTotal = order.services.reduce((s, svc) => s + (svc.price * svc.quantity), 0);
      return sum + orderTotal;
    }, 0);

    // Calculate revenue by customer type
    const revenueByCustomerType = invoices.reduce((acc, inv) => {
      const total = calculateInvoiceTotal(inv.services);
      const custType = inv.customerType || 'non-member' as CustomerType;
      acc[custType] = (acc[custType] || 0) + total;
      return acc;
    }, {} as Record<CustomerType, number>);

    // Calculate top services
    const serviceCounts = invoices.reduce((acc, inv) => {
      inv.services.forEach(svc => {
        const key = svc.name;
        acc[key] = (acc[key] || 0) + svc.quantity;
      });
      return acc;
    }, {} as Record<string, number>);
    const topServices = Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) as [string, number][];

    return {
      totalRevenue,
      totalPayments,
      unpaidBalance,
      totalInvoices: invoices.length,
      activeCustomers,
      pendingAmount,
      totalOrders: pendingOrders.length,
      revenueByCustomerType,
      topServices,
    };
  }, [invoices, pendingOrders, customers]);

  const recentInvoices = React.useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()).slice(0, 10);
  }, [invoices]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarStyle: styles.tabBar,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          options={{ 
            tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} /> 
          }}
        >
          {(props) => (
            <DashboardScreen
              {...props}
              analytics={analytics}
              recentInvoices={recentInvoices}
              pendingOrders={pendingOrders}
              onPreviewInvoice={(invoice) => console.log('Preview:', invoice)}
              onGenerateInvoice={(order) => console.log('Generate:', order)}
              onDeleteOrder={(orderId) => console.log('Delete order:', orderId)}
              onNavigateToUnpaid={() => console.log('Navigate to unpaid')}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          )}
        </Tab.Screen>
        <Tab.Screen 
          name="Invoices" 
          component={InvoicesScreen} 
          options={{ 
            tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt" size={size} color={color} /> 
          }} 
        />
        <Tab.Screen 
          name="Orders" 
          component={OrdersScreen} 
          options={{ 
            tabBarIcon: ({ color, size }) => <MaterialIcons name="list-alt" size={size} color={color} /> 
          }} 
        />
        <Tab.Screen 
          name="Customers" 
          component={CustomersScreen} 
          options={{ 
            tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} /> 
          }} 
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ 
            tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} /> 
          }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <AppContent />
      </ToastProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.background 
  },
  tabBar: { 
    borderTopWidth: 1, 
    borderTopColor: colors.border, 
    paddingBottom: 5, 
    paddingTop: 5, 
    height: 60 
  },
});