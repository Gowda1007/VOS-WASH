# Mobile App - VOS WASH

**VOS WASH** is a specialized business management application designed for a chemical sales company run by an individual entrepreneur. The business focuses on manufacturing and selling various cleaning chemicals, including:
- Car washing chemicals
- Cloth washing chemicals
- Fiber and glass washing chemicals
- Gold and silver washing chemicals
- Foam for washing
- Tyre and light shining chemicals

This application aims to provide better business scalability through smart management, invoicing, and customer tracking.

## Technology Stack

- **Framework**: [Expo](https://expo.dev/) (Managed Workflow)
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack, Drawer, Bottom Tabs)
- **UI Components**: Custom components in `src/components` with styling in `src/styles`.
- **PDF Generation**: `expo-print` for invoice generation.
- **Charts**: `react-native-chart-kit`.
- **Storage**: `@react-native-async-storage/async-storage`.

## Project Structure

```
mobile/
├── src/
│   ├── adapters/         # Native adapters (PDF, Sharing, Notifications)
│   ├── components/       # Reusable UI components
│   ├── context/          # React Contexts (Language, Toast, etc.)
│   ├── core/             # Core logic & Types
│   │   ├── types/        # TypeScript interfaces (Invoice, Customer, etc.)
│   │   └── utils/        # Utility functions (Invoice calculations, Currency formatting)
│   ├── hooks/            # Custom React Hooks (Data access)
│   ├── screens/          # Application Screens
│   └── styles/           # Theme configuration (Colors, Typography)
├── App.tsx               # Entry point
└── app.json              # Expo configuration
```

## Key Features

- **Dashboard**: Overview of business metrics.
- **Invoicing**: Create, view, and manage invoices.
  - Generates HTML-based PDFs for printing/sharing.
  - Supports English and Kannada languages.
- **Customer Management**: CRM features to track customer details and payment history.
- **Reports**: View financial reports and transaction history.

## Setup & Running

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npx expo start
    ```

3.  **Run on Device/Emulator**:
    - Press `a` for Android Emulator.
    - Press `i` for iOS Simulator.
    - Scan QR code with Expo Go app on physical device.
