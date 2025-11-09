# VOS WASH Mobile App - Complete Structure

## ✅ Already Complete:

### 1. Core Infrastructure (`src/core/`)
- **types/index.ts**: All TypeScript interfaces (Invoice, Customer, PendingOrder, Service, etc.)
- **utils/invoiceUtils.ts**: Business logic (calculations, GST, totals)
- **services/apiService.ts**: API client with fetch
- **services/syncService.ts**: Incremental sync with timestamps
- **adapters/**: Interface definitions for all platform features

### 2. Native Adapters (`src/adapters/`)
- **nativePdfAdapter.ts**: Expo Print for PDF generation
- **nativeShareAdapter.ts**: WhatsApp deep linking + Share API
- **nativeQrAdapter.ts**: react-native-qrcode-svg wrapper
- **nativeStorageAdapter.ts**: AsyncStorage + FileSystem
- **nativeNotificationAdapter.ts**: expo-notifications

### 3. Hooks (`src/hooks/`)
- **useInvoices.ts**: Invoice CRUD operations
- **useCustomers.ts**: Customer management
- **useServices.ts**: Service sets management
- **usePendingOrders.ts**: Order management
- **useAppSettings.ts**: App configuration

### 4. Services (`src/services/`)
- **index.ts**: Wires ApiService, SyncService with native adapters

### 5. Configuration
- **package.json**: All dependencies installed
- **app.json**: Android/iOS config, permissions
- **eas.json**: Build profiles
- **metro.config.js**: Metro bundler config
- **.env**: API URL + Key
- **tsconfig.json**: TypeScript config

## 📝 To Be Created:

### 1. Context Providers (`src/context/`)
```
ToastContext.tsx - Toast notifications for React Native
LanguageContext.tsx - i18n with English/Kannada
```

### 2. Screens (`src/screens/`)
```
DashboardScreen.tsx - KPIs, charts, pending orders
InvoicesScreen.tsx - Invoice list with filters, PDF export
CustomersScreen.tsx - Customer list with search
OrdersScreen.tsx - Pending orders, convert to invoice
SettingsScreen.tsx - Service prices, UPI ID
```

### 3. Components (`src/components/`)
```
InvoiceCard.tsx - Reusable invoice display
CustomerCard.tsx - Customer item
OrderCard.tsx - Pending order item
StatCard.tsx - KPI card for dashboard
EmptyState.tsx - Empty list placeholder
Button.tsx - Styled button
Input.tsx - Text input
```

### 4. Navigation
```
App.tsx - Bottom tab navigator with 5 tabs
```

### 5. Styles
```
src/styles/theme.ts - Colors, typography, spacing constants
```

### 6. Constants
```
src/constants.ts - DEFAULT_SERVICE_SETS, storage keys
```

## 🎨 Design System:
- Primary Color: #2563eb (blue-600)
- Background: #f5f5f5 (gray-100)
- Card: #ffffff with shadow
- Text: #333333 (dark), #666666 (medium), #999999 (light)
- Success: #10b981 (green-500)
- Error: #ef4444 (red-500)
- Warning: #f59e0b (amber-500)

## 📱 Screen Structure:

### Dashboard
- 4 KPI Cards: Revenue, Collected, Unpaid, Total Invoices
- Pending Orders List (urgent highlighted)
- Recent Invoices (5)

### Invoices
- Search bar (name, phone, invoice#)
- Filter pills (all, unpaid, partial, paid)
- Date range picker
- Invoice cards with status badges
- Actions: View PDF, Collect Payment, Delete

### Orders
- Pending order cards
- Actions: Generate Invoice, Delete
- Floating Action Button: New Order

### Customers
- Search bar
- Customer cards showing phone, total invoices
- Tap to view customer detail (all invoices)

### Settings
- UPI ID input
- Service prices by customer type (3 sections)
- Save button
- Language toggle (EN/KN)

## 🔧 Features to Implement:

1. **PDF Generation**: Use nativePdfAdapter (Expo Print)
2. **WhatsApp Share**: Use nativeShareAdapter with deep link
3. **QR Code**: Generate UPI QR for payments
4. **Sync**: Pull-to-refresh on all screens
5. **Offline**: AsyncStorage caching
6. **Notifications**: Payment reminders
7. **i18n**: English + Kannada support
8. **Dark Mode**: Not needed (web app follows system)

## 📦 Next Steps:

1. Create context providers
2. Create 5 main screens
3. Create reusable components
4. Wire up navigation
5. Test all flows
6. Build APK with EAS

## 🚀 Build Commands:

```bash
# Development
npm run start

# Build Preview APK (no Google Play)
eas build -p android --profile preview

# Build Production APK
eas build -p android --profile production
```
