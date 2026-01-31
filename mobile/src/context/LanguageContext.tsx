import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../core/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, defaultText?: string) => string; // Main app translation function
  invoiceT: (key: string, lang: Language) => string; // Invoice-specific translation function
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<string, Record<Language, string>> = {
    // App Name & Tagline
    'app-name': { en: 'VOS WASH', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್' },
    'app-tagline': { en: 'Clean Everything', kn: 'ಎಲ್ಲವನ್ನೂ ಸ್ವಚ್ಛಗೊಳಿಸಿ' },

    // Default Service Names
    'Interior & Exterior': { en: 'Interior & Exterior', kn: 'ಇಂಟೀರಿಯರ್ ಮತ್ತು ಎಕ್ಸ್ಟೀರಿಯರ್' },
    'Fiber Shine': { en: 'Fiber Shine', kn: 'ಫೈಬರ್ ಶೈನ್' },
    'Bright Wash': { en: 'Bright Wash', kn: 'ಬ್ರೈಟ್ ವಾಶ್' },
    'Gold and Silver': { en: 'Gold and Silver', kn: 'ಗೋಲ್ಡ್ ಮತ್ತು ಸಿಲ್ವರ್' },
    'Spray Gun': { en: 'Spray Gun', kn: 'ಸ್ಪ್ರೇ ಗನ್' },

    // Nav & General UI
    'dashboard': { en: 'Dashboard', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
    'invoices': { en: 'Invoices', kn: 'ಇನ್‌ವಾಯ್ಸ್‌ಗಳು' },
    'orders': { en: 'Orders', kn: 'ಆರ್ಡರ್‌ಗಳು' },
    'customers': { en: 'Customers', kn: 'ಗ್ರಾಹಕರು' },
    'raw-materials': { en: 'Raw Materials', kn: 'ಕಚ್ಚಾ ವಸ್ತುಗಳು' },
    'day-book': { en: 'Day Book', kn: 'ಡೇ ಬುಕ್' },
    'reports': { en: 'Reports', kn: 'ವರದಿಗಳು' },
    'settings': { en: 'Settings', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
    'take-order': { en: 'Take Order', kn: 'ಆರ್ಡರ್ ತೆಗೆದುಕೊಳ್ಳಿ' },
    'new-invoice': { en: 'New Invoice', kn: 'ಹೊಸ ಇನ್‌ವಾಯ್ಸ್' },
    'back': { en: 'Back', kn: 'ಹಿಂದೆ' },
    'next': { en: 'Next', kn: 'ಮುಂದೆ' },
    'save': { en: 'Save', kn: 'ಉಳಿಸಿ' },
    'cancel': { en: 'Cancel', kn: 'ರದ್ದುಮಾಡಿ' },
    'delete': { en: 'Delete', kn: 'ಅಳಿಸಿ' },
    'edit': { en: 'Edit', kn: 'ಸಂಪಾದಿಸಿ' },
    'confirm': { en: 'Confirm', kn: 'ಖಚಿತಪಡಿಸಿ' },
    'cash': { en: 'Cash', kn: 'ನಗದು' },
    'upi': { en: 'UPI', kn: 'ಯುಪಿಐ' },
    'day': { en: 'Day', kn: 'ದಿನ' },
    'week': { en: 'Week', kn: 'ವಾರ' },
    'month': { en: 'Month', kn: 'ತಿಂಗಳು' },
    'english': { en: 'English', kn: 'ಇಂಗ್ಲಿಷ್' },
    'kannada': { en: 'Kannada', kn: 'ಕನ್ನಡ' },
    'locale': { en: 'en-US', kn: 'kn-IN' },
    'current-month': { en: 'Current Month', kn: 'ಪ್ರಸ್ತುತ ತಿಂಗಳು' },
    'price': { en: 'Price', kn: 'ಬೆಲೆ' },
    'quantity': { en: 'Quantity', kn: 'ಪ್ರಮಾಣ' },
    'purchased-quantity': { en: 'Purchased Quantity', kn: 'ಖರೀದಿಸಿದ ಪ್ರಮಾಣ' },
    'remaining-quantity': { en: 'Remaining Quantity', kn: 'ಬಾಕಿ ಇರುವ ಪ್ರಮಾಣ' },
    'cost-per-unit': { en: 'Cost Per Unit', kn: 'ಪ್ರತಿ ಘಟಕಕ್ಕೆ ಬೆಲೆ' },
    'supplier': { en: 'Supplier', kn: 'ಪೂರೈಕೆದಾರ' },
    'amount': { en: 'Amount', kn: 'ಮೊತ್ತ' },
    'from': { en: 'From', kn: 'ಇವರಿಂದ' },
    'actions': { en: 'Actions', kn: 'ಕ್ರಿಯೆಗಳು' },
    'status': { en: 'Status', kn: 'ಸ್ಥಿತಿ' },
    'contact': { en: 'Contact', kn: 'ಸಂಪರ್ಕ' },
    'type': { en: 'Type', kn: 'ಪ್ರಕಾರ' },
    'all': { en: 'All', kn: 'ಎಲ್ಲಾ' },
    'export': { en: 'Export', kn: 'ರಫ್ತು' },
    'export-success': { en: 'Exported successfully', kn: 'ಯಶಸ್ವಿಯಾಗಿ ರಫ್ತು ಮಾಡಲಾಗಿದೆ' },
    'export-failed': { en: 'Export failed', kn: 'ರಫ್ತು ವಿಫಲವಾಗಿದೆ' },
    'customers-export-title': { en: 'Customers List', kn: 'ಗ್ರಾಹಕರ ಪಟ್ಟಿ' },
    'transactions-for': { en: 'Transactions for', kn: 'ವ್ಯವಹಾರಗಳು' },
    'total-spent': { en: 'Total Spent', kn: 'ಒಟ್ಟು ಖರ್ಚು' },
    'total-spent-raw-materials': { en: 'Total Spent on Raw Materials', kn: 'ಕಚ್ಚಾ ವಸ್ತುಗಳ ಮೇಲೆ ಖರ್ಚು ಮಾಡಿದ ಒಟ್ಟು' },
    'top-spender': { en: 'Top Spender', kn: 'ಟಾಪ್ ಖರ್ಚುದಾರ' },
    'total-customers': { en: 'Total Customers', kn: 'ಒಟ್ಟು ಗ್ರಾಹಕರು' },
    'balance': { en: 'Balance', kn: 'ಬಾಕಿ' },
    'total': { en: 'Total', kn: 'ಒಟ್ಟು' },
    'enter-valid-phone': { en: 'Enter a valid phone number', kn: 'ಮಾನ್ಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ' },
    'phone-already-exists': { en: 'Phone number already exists', kn: 'ಫೋನ್ ಸಂಖ್ಯೆ ಈಗಾಗಲೇ ಅಸ್ತಿತ್ವದಲ್ಲಿದೆ' },
    'enter-valid-name': { en: 'Customer name is required', kn: 'ಗ್ರಾಹಕ ಹೆಸರು ಅಗತ್ಯವಿದೆ' },
    'enter-valid-date': { en: 'Enter a valid date as DD/MM/YYYY', kn: 'ದಿನಾಂಕವನ್ನು DD/MM/YYYY ರೂಪದಲ್ಲಿ ನಮೂದಿಸಿ' },
  // Date range & filtering additions
  'start-date': { en: 'Start Date', kn: 'ಪ್ರಾರಂಭ ದಿನಾಂಕ' },
  'end-date': { en: 'End Date', kn: 'ಅಂತ್ಯದ ದಿನಾಂಕ' },
  'outstanding': { en: 'Outstanding', kn: 'ಬಾಕಿ ಉಳಿದ' },
  'urgent': { en: 'Urgent', kn: 'ತುರ್ತು' },
  // Generic labels for cards
  'invoice-date-label': { en: 'Date', kn: 'ದಿನಾಂಕ' },
  'total-amount-label': { en: 'Total', kn: 'ಒಟ್ಟು' },
  // Column headers / exports
  'invoice-number': { en: 'Invoice #', kn: 'ಇನ್‌ವಾಯ್ಸ್ #' },
  'date': { en: 'Date', kn: 'ದಿನಾಂಕ' },
  // 'customer' already defined below in Customer Types
    
    // Customer Types
    'customer': { en: 'Customer', kn: 'ಗ್ರಾಹಕ' },
    'garage_service_station': { en: 'Garage / Service Station', kn: 'ಗ್ಯಾರೇಜ್ / ಸೇವಾ ಕೇಂದ್ರ' },
    'dealer': { en: 'Dealer', kn: 'ಡೀಲರ್' },

    // Page Titles
    'page-title-dashboard': { en: 'Dashboard', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
    'page-title-invoices': { en: 'Invoices', kn: 'ಇನ್‌ವಾಯ್ಸ್‌ಗಳು' },
    'page-title-customers': { en: 'Customers', kn: 'ಗ್ರಾಹಕರು' },
    'page-title-settings': { en: 'Settings', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
    'page-title-reports': { en: 'Financial Reports', kn: 'ಹಣಕಾಸು ವರದಿಗಳು' },
    'page-title-new-invoice': { en: 'New Invoice', kn: 'ಹೊಸ ಇನ್‌ವಾಯ್ಸ್' },
    'page-title-take-order': { en: 'Take Order', kn: 'ಆರ್ಡರ್ ತೆಗೆದುಕೊಳ್ಳಿ' },
    'page-title-customer-detail': { en: 'Customer Details', kn: 'ಗ್ರಾಹಕರ ವಿವರಗಳು' },
    'page-title-day-book': { en: 'Day Book', kn: 'ಡೇ ಬುಕ್' },

    // Dashboard
    'welcome-back': { en: "Welcome back", kn: 'ಮತ್ತೆ ಸ್ವಾಗತ' },
    'total-revenue': { en: 'Total Revenue', kn: 'ಒಟ್ಟು ಆದಾಯ' },
    'collected': { en: 'Collected', kn: 'ಸಂಗ್ರಹಿಸಲಾಗಿದೆ' },
    'unpaid-balance': { en: 'Unpaid Balance', kn: 'ಪಾವತಿಸದ ಬಾಕಿ' },
    'total-invoices': { en: 'Total Invoices', kn: 'ಒಟ್ಟು ಇನ್‌ವಾಯ್ಸ್‌ಗಳು' },
    'pending-orders': { en: 'Pending Orders', kn: 'ಬಾಕಿ ಇರುವ ಆರ್ಡರ್‌ಗಳು' },
    'generate-invoice': { en: 'Generate Invoice', kn: 'ಇನ್‌ವಾಯ್ಸ್ ರಚಿಸಿ' },
    'revenue-trend': { en: 'Revenue Trend', kn: 'ಆದಾಯದ ಪ್ರವೃತ್ತಿ' },
    'track-your-earnings': { en: 'Track Your Earnings', kn: 'ನಿಮ್ಮ ಆದಾಯವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ' },
    'revenue-by-type': { en: 'Revenue by Type', kn: 'ಪ್ರಕಾರದ ಪ್ರಕಾರ ಆದಾಯ' },
    'customer-distribution': { en: 'Customer Distribution', kn: 'ಗ್ರಾಹಕರ ವಿತರಣೆ' },
    'top-services': { en: 'Top Goods & Services', kn: 'ಟಾಪ್ ಸರಕುಗಳು ಮತ್ತು ಸೇವೆಗಳು' },
    'most-requested': { en: 'Most Requested', kn: 'ಹೆಚ್ಚು ವಿನಂತಿಸಲಾಗಿದೆ' },
    'times': { en: 'times', kn: 'ಬಾರಿ' },
    'garage': { en: 'Garage', kn: 'ಗ್ಯಾರೇಜ್' },
    'recent-invoices': { en: 'Recent Invoices', kn: 'ಇತ್ತೀಚಿನ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು' },
    'no-service-data': { en: 'No goods or service data yet.', kn: 'ಇನ್ನೂ ಯಾವುದೇ ಸರಕು ಅಥವಾ ಸೇವಾ ಡೇಟಾ ಇಲ್ಲ.' },
    'promised-delivery-date': { en: 'Promised Delivery Date', kn: 'ಭರವಸೆಯ ವಿತರಣಾ ದಿನಾಂಕ' },
    'due-date': { en: 'Due Date', kn: 'ಅಂತಿಮ ದಿನಾಂಕ' },
    'order-date-label': { en: 'Ordered', kn: 'ಆರ್ಡರ್ ಮಾಡಲಾಗಿದೆ' },
    'urgent-badge': { en: 'Urgent', kn: 'ತುರ್ತು' },

    // Invoice & Order Forms
    'customer-details': { en: 'Customer Details', kn: 'ಗ್ರಾಹಕರ ವಿವರಗಳು' },
    'customer-phone': { en: 'Customer Phone', kn: 'ಗ್ರಾಹಕರ ಫೋನ್' },
    'customer-name': { en: 'Customer Name', kn: 'ಗ್ರಾಹಕರ ಹೆಸರು' },
    'customer-address': { en: 'Customer Address', kn: 'ಗ್ರಾಹಕರ ವಿಳಾಸ' },
    'enter-valid-address': { en: 'Customer address is required', kn: 'ಗ್ರಾಹಕರ ವಿಳಾಸ ಅಗತ್ಯವಿದೆ' },
    'customer-type': { en: 'Customer Type', kn: 'ಗ್ರಾಹಕರ ಪ್ರಕಾರ' },
    'services-and-items': { en: 'Goods & Services', kn: 'ಸರಕುಗಳು ಮತ್ತು ಸೇವೆಗಳು' },
    'no-services-added': { en: 'No goods or services added yet.', kn: 'ಇನ್ನೂ ಯಾವುದೇ ಸರಕುಗಳು ಅಥವಾ ಸೇವೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ.' },
    'add-services': { en: 'Add Goods/Services', kn: 'ಸರಕು/ಸೇವೆಗಳನ್ನು ಸೇರಿಸಿ' },
    'add-custom-service': { en: 'Add Custom Goods/Service', kn: 'ಕಸ್ಟಮ್ ಸರಕು/ಸೇವೆ ಸೇರಿಸಿ' },
    'custom-service': { en: 'Custom Goods/Service', kn: 'ಕಸ್ಟಮ್ ಸರಕು/ಸೇವೆ' },
    'financials': { en: 'Financials', kn: 'ಹಣಕಾಸು' },
    'old-balance-arrears': { en: 'Old Balance (Arrears)', kn: 'ಹಳೆಯ ಬಾಕಿ (ಬಾಕಿ)' },
    'advance-paid': { en: 'Advance Paid', kn: 'ಮುಂಗಡ ಪಾವತಿ' },
    'advance-and-delivery': { en: 'Advance & Delivery', kn: 'ಮುಂಗಡ ಮತ್ತು ವಿತರಣೆ' },
    'preview-invoice': { en: 'Next: Preview Invoice', kn: 'ಮುಂದೆ: ಇನ್‌ವಾಯ್ಸ್ ಪೂರ್ವವೀಕ್ಷಣೆ' },
    'invoice-preview-title': { en: 'Invoice Preview', kn: 'ಇನ್‌ವಾಯ್ಸ್ ಪೂರ್ವವೀಕ್ಷಣೆ' },
    'invoice-language': { en: 'Invoice Language', kn: 'ಇನ್‌ವಾಯ್ಸ್ ಭಾಷೆ' },
    'edit-details': { en: 'Edit Details', kn: 'ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ' },
    'save-and-continue': { en: 'Save and Continue', kn: 'ಉಳಿಸಿ ಮತ್ತು ಮುಂದುವರಿಸಿ' },
    'collect-payment': { en: 'Collect Payment', kn: 'ಪಾವತಿ ಸಂಗ್ರಹಿಸಿ' },
    'payment-recorded-successfully': { en: 'Payment recorded successfully!', kn: 'ಪಾವತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ!' },
    'invoice-saved-successfully': { en: 'Invoice saved successfully!', kn: 'ಇನ್\'ವಾಯ್ಸ್ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!' },
    'error-saving-invoice': { en: 'Error saving invoice', kn: 'ಇನ್\'ವಾಯ್ಸ್ ಉಳಿಸುವಲ್ಲಿ ದೋಷ' },
    'error-recording-payment': { en: 'Error recording payment', kn: 'ಪಾವತಿಯನ್ನು ದಾಖಲಿಸುವಲ್ಲಿ ದೋಷ' },
    'error-saving-order': { en: 'Could not save order. Please try again.', kn: 'ಆರ್ಡರ್ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' },
    'error-deleting-order': { en: 'Error deleting order', kn: 'ಆರ್ಡರ್ ಅಳಿಸುವಾಗ ದೋಷ' },
    'payment-skipped': { en: 'Payment skipped. You can collect payment later.', kn: 'ಪಾವತಿ ಬಿಟ್ಟುಬಿಡಲಾಗಿದೆ. ನಂತರ ಸಂಗ್ರಹಿಸಬಹುದು.' },
    'download-pdf': { en: 'Download PDF', kn: 'PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' },
    'share-pdf': { en: 'Share PDF', kn: 'PDF ಹಂಚಿಕೊಳ್ಳಿ' },
    'skip-payment': { en: 'Skip Payment', kn: 'ಪಾವತಿ ಬಿಟ್ಟುಬಿಡಿ' },
    'share-on-whatsapp': { en: 'Share on WhatsApp', kn: 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ' },
  'share-via-whatsapp': { en: 'Share via WhatsApp', kn: 'ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಹಂಚಿಕೊಳ್ಳಿ' },
  'could-not-share-via-whatsapp': { en: 'Could not share via WhatsApp.', kn: 'ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಹಂಚಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.' },
    'finish-and-go-to-invoices': { en: 'Finish & Go to Invoices', kn: 'ಮುಗಿಸಿ ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್‌ಗಳಿಗೆ ಹೋಗಿ' },
    'enter-advance-amount': { en: 'Enter Advance Amount', kn: 'ಮುಂಗಡ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ' },
    'save-order': { en: 'Save Order', kn: 'ಆರ್ಡರ್ ಉಳಿಸಿ' },
    'order-saved-successfully': { en: 'Order saved successfully! It can be converted to an invoice from the dashboard.', kn: 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ! ಇದನ್ನು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಇನ್‌ವಾಯ್ಸ್‌ಗೆ ಪರಿವರ್ತಿಸಬಹುದು.' },
    'order-due-reminder': { en: 'Order Due Reminder', kn: 'ಆರ್ಡರ್ ಕೊನೆಯ ದಿನದ ನೆನಪು' },
    'due-today': { en: 'Due today', kn: 'ಇಂದು ಕೊನೆಯ ದಿನ' },
    'valid-service-name-price': { en: 'Please enter a valid goods/service name and price.', kn: 'ದಯವಿಟ್ಟು ಮಾನ್ಯ ಸರಕು/ಸೇವೆಯ ಹೆಸರು ಮತ್ತು ಬೆಲೆಯನ್ನು ನಮೂದಿಸಿ.' },
    'add-at-least-one-service': { en: 'Please add at least one goods or service.', kn: 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಸರಕು ಅಥವಾ ಸೇವೆಯನ್ನು ಸೇರಿಸಿ.' },
    'delete-service-aria': { en: 'Delete goods/service', kn: 'ಸರಕು/ಸೇವೆ ಅಳಿಸಿ' },
    'service-name-placeholder': { en: 'Goods/Service Name', kn: 'ಸರಕು/ಸೇವೆ ಹೆಸರು' },
    'service-deleted-success': { en: 'Service removed.', kn: 'ಸೇವೆಯನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ.' },
    'urgent-order': { en: 'Mark as Urgent Order', kn: 'ತುರ್ತು ಆರ್ಡರ್ ಎಂದು ಗುರುತಿಸಿ' },
    'price-label': { en: 'Price:', kn: 'ಬೆಲೆ:' },
    'qty-label': { en: 'Qty:', kn: 'ಪ್ರಮಾಣ:' },
    'amount-placeholder': { en: 'Amount (₹)', kn: 'ಮೊತ್ತ (₹)' },
    'price-placeholder': { en: 'Price (₹)', kn: 'ಬೆಲೆ (₹)' },
    'invoice-for': { en: 'Invoice #{invoiceNumber} for {customerName}', kn: 'ಇನ್‌ವಾಯ್ಸ್ #{invoiceNumber} ಗಾಗಿ {customerName}' },
    'balance-due-label': { en: 'Balance Due:', kn: 'ಬಾಕಿ ಉಳಿದ ಮೊತ್ತ:' },
    'whatsapp-share-message': { en: `Hello {customerName}, Thank you for your payment of ₹{amountPaid}. Your invoice #{invoiceNumber} is attached. We appreciate your business with VOS WASH!`, kn: `ನಮಸ್ಕಾರ {customerName}, ₹{amountPaid} ಪಾವತಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಇನ್‌ವಾಯ್ಸ್ #{invoiceNumber} ಅನ್ನು ಲಗತ್ತಿಸಲಾಗಿದೆ. ವಿ.ಓ.ಎಸ್ ವಾಷ್ ಜೊತೆಗಿನ ನಿಮ್ಮ ವ್ಯವಹಾರವನ್ನು ನಾವು ಪ್ರಶಂಸಿಸುತ್ತೇವೆ!` },
    
    // Confirmation Modal
    'confirm-deletion-title': { en: 'Confirm Deletion', kn: 'ಅಳಿಸುವಿಕೆಯನ್ನು ಖಚಿತಪಡಿಸಿ' },
    'confirm-deletion-message': { en: 'Are you sure you want to permanently delete invoice #{invoiceNumber}? This action cannot be undone.', kn: 'ನೀವು ಇನ್‌ವಾಯ್ಸ್ #{invoiceNumber} ಅನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಲು ಸಾಧ್ಯವಿಲ್ಲ.' },
    'collect-balance-title': { en: 'Collect Balance', kn: 'ಬಾಕಿ ಸಂಗ್ರಹಿಸಿ' },
    'collect-balance-message': { en: 'Record a payment for invoice #{invoiceNumber}.', kn: 'ಇನ್‌ವಾಯ್ಸ್ #{invoiceNumber} ಗಾಗಿ ಪಾವತಿಯನ್ನು ದಾಖಲಿಸಿ.' },
    'enter-amount': { en: 'Enter Amount (₹):', kn: 'ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ (₹):' },
    'payment-method': { en: 'Payment Method:', kn: 'ಪಾವತಿ ವಿಧಾನ:' },
    'scan-to-pay': { en: 'Scan to pay ₹{amount}', kn: '₹{amount} ಪಾವತಿಸಲು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' },
    'confirm-collection': { en: 'Confirm Collection', kn: 'ಸಂಗ್ರಹಣೆಯನ್ನು ಖಚಿತಪಡಿಸಿ' },
    'confirm-delete': { en: 'Confirm Delete', kn: 'ಅಳಿಸುವಿಕೆಯನ್ನು ಖಚಿತಪಡಿಸಿ' },
    'processing': { en: 'Processing...', kn: 'ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...' },
    'confirm-order-deletion-title': { en: 'Confirm Order Deletion', kn: 'ಆರ್ಡರ್ ಅಳಿಸುವಿಕೆಯನ್ನು ಖಚಿತಪಡಿಸಿ' },
    'confirm-order-deletion-message': { en: 'Are you sure you want to delete the pending order for {customerName}?', kn: '{customerName} ಗಾಗಿ ಬಾಕಿ ಇರುವ ಆರ್ಡರ್ ಅನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?' },
    'delete-order-success': { en: 'Pending order deleted.', kn: 'ಬಾಕಿ ಇರುವ ಆರ್ಡರ್ ಅಳಿಸಲಾಗಿದೆ.' },
    'enter-valid-amount-qr': { en: 'Enter a valid amount to generate QR code.', kn: 'QR ಕೋಡ್ ರಚಿಸಲು ಮಾನ್ಯವಾದ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ.' },
  'pdf-downloaded': { en: 'PDF downloaded successfully!', kn: 'PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್\'ಲೋಡ್ ಮಾಡಲಾಗಿದೆ!' },
  'error-downloading-pdf': { en: 'Error downloading PDF', kn: 'PDF ಡೌನ್ಲೋಡ್ ಮಾಡುವಾಗ ದೋಷ' },
    'delete-customer': { en: 'Delete Customer', kn: 'ಗ್ರಾಹಕರನ್ನು ಅಳಿಸಿ' },
    'confirm-customer-deletion-title': { en: 'Confirm Customer Deletion', kn: 'ಗ್ರಾಹಕರ ಅಳಿಸುವಿಕೆಯನ್ನು ಖಚಿತಪಡಿಸಿ' },
    'confirm-customer-deletion-message': { en: 'Are you sure you want to permanently delete customer {customerName} and their associated data? This action cannot be undone.', kn: 'ನೀವು {customerName} ಗ್ರಾಹಕರನ್ನು ಮತ್ತು ಅವರ ಸಂಬಂಧಿತ ಡೇಟಾವನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಲು ಸಾಧ್ಯವಿಲ್ಲ.' },
    'customer-deleted': { en: 'Customer deleted successfully!', kn: 'ಗ್ರಾಹಕರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ!' },
    'edit-customer': { en: 'Edit Customer Details', kn: 'ಗ್ರಾಹಕರ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ' },
    'customer-updated': { en: 'Customer updated successfully!', kn: 'ಗ್ರಾಹಕರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಡೇಟ್ ಮಾಡಲಾಗಿದೆ!' },
    'error-updating-customer': { en: 'Error updating customer', kn: 'ಗ್ರಾಹಕರನ್ನು ಅಪ್‌ಡೇಟ್ ಮಾಡುವಾಗ ದೋಷ' },
    'error-deleting-customer': { en: 'Error deleting customer', kn: 'ಗ್ರಾಹಕರನ್ನು ಅಳಿಸುವಾಗ ದೋಷ' },
    'confirm-delete-customer': { en: 'Delete Customer', kn: 'ಗ್ರಾಹಕರನ್ನು ಅಳಿಸಿ' },
    'confirm-delete-customer-message': { en: 'Are you sure you want to delete this customer? This action cannot be undone.', kn: 'ನೀವು ಈ ಗ್ರಾಹಕರನ್ನು ಅಳಿಸಲು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಲು ಸಾಧ್ಯವಿಲ್ಲ.' },
    'delete-customer-success': { en: 'Customer deleted successfully!', kn: 'ಗ್ರಾಹಕರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ!' },

    // Raw Material Deletion
    'confirm-raw-material-deletion-message': { en: 'Are you sure you want to permanently delete raw material {name}? This action cannot be undone.', kn: 'ನೀವು {name} ಕಚ್ಚಾ ವಸ್ತುವನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಲು ಸಾಧ್ಯವಿಲ್ಲ.' },
    
    // List Pages (Invoices, Customers)
    'you-have-total-invoices': { en: 'You have {count} total invoices.', kn: 'ನಿಮ್ಮಲ್ಲಿ ಒಟ್ಟು {count} ಇನ್‌ವಾಯ್ಸ್‌ಗಳಿವೆ.' },
    'search-invoices-placeholder': { en: 'Search by name, phone, or invoice #', kn: 'ಹೆಸರು, ಫೋನ್, ಅಥವಾ ಇನ್‌ವಾಯ್ಸ್ # ಮೂಲಕ ಹುಡುಕಿ' },
    'export-pdf': { en: 'Export PDF', kn: 'PDF ರಫ್ತು ಮಾಡಿ' },
    'unpaid': { en: 'unpaid', kn: 'ಪಾವತಿಸದ' },
    'partially_paid': { en: 'partially paid', kn: 'ಭಾಗಶಃ ಪಾವತಿಸಲಾಗಿದೆ' },
    'paid': { en: 'paid', kn: 'ಪಾವತಿಸಲಾಗಿದೆ' },
    'no-invoices-found': { en: 'No Invoices Found', kn: 'ಯಾವುದೇ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ' },
    'no-invoices-found-message': { en: "Your latest invoices will appear here once created.", kn: "ನೀವು ರಚಿಸಿದ ನಂತರ ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ." },
    'adjust-filters-message': { en: 'Try adjusting your search, filter, or date range.', kn: 'ನಿಮ್ಮ ಹುಡುಕಾಟ, ಫಿಲ್ಟರ್, ಅಥವಾ ದಿನಾಂಕ ಶ್ರೇಣಿಯನ್ನು ಸರಿಹೊಂದಿಸಲು ಪ್ರಯತ್ನಿಸಿ.' },
    'you-have-unique-customers': { en: 'You have {count} unique customers.', kn: 'ನಿಮ್ಮಲ್ಲಿ {count} ಅನನ್ಯ ಗ್ರಾಹಕರಿದ್ದಾರೆ.' },
    'search-customers-placeholder': { en: 'Search by name or phone...', kn: 'ಹೆಸರು ಅಥವಾ ಫೋನ್ ಮೂಲಕ ಹುಡುಕಿ...' },
    'no-customers-found': { en: 'No Customers Found', kn: 'ಯಾವುದೇ ಗ್ರಾಹಕರು ಕಂಡುಬಂದಿಲ್ಲ' },
    'you-have-no-customers': { en: 'You have no customers', kn: 'ನಿಮ್ಮಲ್ಲಿ ಯಾವುದೇ ಗ್ರಾಹಕರಿಲ್ಲ' },
    'create-invoice-to-add-customer': { en: 'Create a new invoice to add your first customer.', kn: 'ನಿಮ್ಮ ಮೊದಲ ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಲು ಹೊಸ ಇನ್‌ವಾಯ್ಸ್ ರಚಿಸಿ.' },
    'search-returned-no-results': { en: 'Your search returned no results.', kn: 'ನಿಮ್ಮ ಹುಡುಕಾಟ ಯಾವುದೇ ಫಲಿತಾಂಶಗಳನ್ನು ಹಿಂದಿರುಗಿಸಲಿಲ್ಲ.' },
    'export-pdf-success-message': { en: 'Data exported to PDF.', kn: 'ಡೇಟಾವನ್ನು PDF ಗೆ ರಫ್ತು ಮಾಡಲಾಗಿದೆ.' },
    'invoice-total': { en: 'Amount', kn: 'ಮೊತ್ತ' },
    'avg-invoice-value': { en: 'Avg. Invoice Value', kn: 'ಸರಾಸರಿ ಇನ್‌ವಾಯ್ಸ್ ಮೌಲ್ಯ' },
    'invoice-history': { en: 'Invoice History', kn: 'ಇನ್‌ವಾಯ್ಸ್ ಇತಿಹಾಸ' },
    'back-to-customers': { en: 'Back to Customers', kn: 'ಗ್ರಾಹಕರಿಗೆ ಹಿಂತಿರುಗಿ' },
    'no-invoices-for-customer': { en: 'No invoices found for this customer.', kn: 'ಈ ಗ್ರಾಹಕರಿಗೆ ಯಾವುದೇ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' },
    'total-amount': {en: 'Total Amount', kn: 'ಒಟ್ಟು ಮೊತ್ತ'},
    'paid-amount': {en: 'Paid Amount', kn: 'ಪಾವತಿಸಿದ ಮೊತ್ತ'},
    'invoice-list-report-title': {en: 'VOS WASH Invoice List Report', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್ ಇನ್‌ವಾಯ್ಸ್ ಪಟ್ಟಿ ವರದಿ'},
    'customer-list-report-title': {en: 'VOS WASH Customer List Report', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್ ಗ್ರಾಹಕರ ಪಟ್ಟಿ ವರದಿ'},
  // Orders list additions
  'no-orders': { en: 'No Pending Orders', kn: 'ಯಾವುದೇ ಬಾಕಿ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ' },
  'no-orders-message': { en: 'Create a new order from Dashboard.', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಹೊಸ ಆರ್ಡರ್ ರಚಿಸಿ.' },
  'search-orders-placeholder': { en: 'Search pending orders...', kn: 'ಬಾಕಿ ಇರುವ ಆರ್ಡರ್‌ಗಳನ್ನು ಹುಡುಕಿ...' },

    // Settings
    'customize-services-and-settings': { en: 'Customize goods/services and app settings.', kn: 'ಸರಕು/ಸೇವೆಗಳು ಮತ್ತು ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡಿ.' },
    'app-settings': { en: 'App Settings', kn: 'ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
    'upi-id-label': { en: 'UPI ID for Customer Payments', kn: 'ಗ್ರಾಹಕರ ಪಾವತಿಗಳಿಗಾಗಿ UPI ಐಡಿ' },
    'service-prices': { en: 'Goods & Service Prices', kn: 'ಸರಕು ಮತ್ತು ಸೇವಾ ಬೆಲೆಗಳು' },
    'add-service-for': { en: 'Add Goods/Service for {customerType}', kn: '{customerType} ಗಾಗಿ ಸರಕು/ಸೇವೆ ಸೇರಿಸಿ' },
    'save-settings': { en: 'Save Settings', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ' },
    'settings-saved-success': { en: 'Goods/Service & App settings saved successfully!', kn: 'ಸರಕು/ಸೇವೆ ಮತ್ತು ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!' },
    'settings-saved-error': { en: 'Failed to save settings', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ' },
    'service-added-success': { en: 'Service added successfully!', kn: 'ಸೇವೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!' },
    'confirm-delete-service': { en: 'Delete this service?', kn: 'ಈ ಸೇವೆಯನ್ನು ಅಳಿಸಬೇಕೆ?' },
    'saving': { en: 'Saving...', kn: 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' },
    'language': { en: 'Language', kn: 'ಭಾಷೆ' },
    'company-settings': { en: 'Company Settings', kn: 'ಕಂಪನಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
    'new-service': { en: 'New Goods/Service', kn: 'ಹೊಸ ಸರಕು/ಸೇವೆ' },
    
    // Reports
    'analyze-revenue-and-collections': { en: 'Analyze your revenue and collections.', kn: 'ನಿಮ್ಮ ಆದಾಯ ಮತ್ತು ಸಂಗ್ರಹಣೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ.' },
    'this_month': { en: 'this month', kn: 'ಈ ತಿಂಗಳು' },
    'last_month': { en: 'last month', kn: 'ಕಳೆದ ತಿಂಗಳು' },
    'this_year': { en: 'this year', kn: 'ಈ ವರ್ಷ' },
    'invoices-issued': { en: 'Invoices Issued', kn: 'ನೀಡಲಾದ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು' },
    'cashflow-trend': { en: 'Cashflow Trend', kn: 'ನಗದು ಹರಿವಿನ ಪ್ರವೃತ್ತಿ' },
    'report-title': { en: 'VOS WASH Financial Report - {period}', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್ ಹಣಕಾಸು ವರದಿ - {period}' },

    // Day Book
    'day-book-description': { en: 'View a financial summary for any day.', kn: 'ಯಾವುದೇ ದಿನದ ಆರ್ಥಿಕ ಸಾರಾಂಶವನ್ನು ವೀಕ್ಷಿಸಿ.' },
    'invoices-created': { en: 'Invoices Created', kn: 'ರಚಿಸಲಾದ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು' },
    'payments-collected': { en: 'Payments Collected', kn: 'ಸಂಗ್ರಹಿಸಲಾದ ಪಾವತಿಗಳು' },
    'no-invoices-on-day': { en: 'No invoices were created on this day.', kn: 'ಈ ದಿನ ಯಾವುದೇ ಇನ್‌ವಾಯ್ಸ್‌ಗಳನ್ನು ರಚಿಸಲಾಗಿಲ್ಲ.' },
    'no-payments-on-day': { en: 'No payments were collected on this day.', kn: 'ಈ ದಿನ ಯಾವುದೇ ಪಾವತಿಗಳನ್ನು ಸಂಗ್ರಹಿಸಲಾಗಿಲ್ಲ.' },
    'cash-upi': { en: 'Cash / UPI', kn: 'ನಗದು / ಯುಪಿಐ' },

    // Order Form
    'ensure-upi-id-set': { en: '(Ensure UPI ID is set in Settings)', kn: '(ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ UPI ಐಡಿ ಹೊಂದಿಸಲಾಗಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ)' },

    // Raw Materials Screen
    'loading-raw-materials': { en: 'Loading Raw Materials...', kn: 'ಕಚ್ಚಾ ವಸ್ತುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' },
    'error-loading-raw-materials': { en: 'Error loading Raw Materials:', kn: 'ಕಚ್ಚಾ ವಸ್ತುಗಳನ್ನು ಲೋಡ್ ಮಾಡುವಾಗ ದೋಷ:' },
    'no-raw-materials': { en: 'No Raw Materials Added Yet', kn: 'ಇನ್ನೂ ಯಾವುದೇ ಕಚ್ಚಾ ವಸ್ತುಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ' },
    'add-your-first-raw-material': { en: 'Tap the + button to add your first raw material.', kn: '+ ಬಟನ್ ಅನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ ನಿಮ್ಮ ಮೊದಲ ಕಚ್ಚಾ ವಸ್ತುವನ್ನು ಸೇರಿಸಿ.' },
    'raw-material-form-title': { en: 'Add Raw Material Purchase', kn: 'ಕಚ್ಚಾ ವಸ್ತು ಖರೀದಿ ಸೇರಿಸಿ' },
    'raw-material-name': { en: 'Raw Material Name', kn: 'ಕಚ್ಚಾ ವಸ್ತು ಹೆಸರು' },
    'unit-type': { en: 'Unit Type', kn: 'ಘಟಕ' },
    'cost-per-unit-label': { en: 'Cost Per Unit (₹)', kn: 'ಪ್ರತಿ ಘಟಕ ಬೆಲೆ (₹)' },
    'total-cost-label': { en: 'Total Cost (Calculated)', kn: 'ಒಟ್ಟು ವೆಚ್ಚ (ಲೆಕ್ಕಾಚಾರಗೊಂಡಿದೆ)' },
    'purchase-date': { en: 'Purchase Date', kn: 'ಖರೀದಿಯ ದಿನಾಂಕ' },
    'supplier-name': { en: 'Supplier Name (Optional)', kn: 'ಪೂರೈಕೆದಾರರ ಹೆಸರು (ಐಚ್ಛಿಕ)' },
    'add-purchase': { en: 'Add Purchase', kn: 'ಖರೀದಿ ಸೇರಿಸಿ' },
    'update-purchase': { en: 'Update Purchase', kn: 'ಖರೀದಿ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ' },
    'edit-raw-material-title': { en: 'Edit Raw Material Purchase', kn: 'ಕಚ್ಚಾ ವಸ್ತು ಖರೀದಿ ಸಂಪಾದಿಸಿ' },
    'invalid-usage-amount': { en: 'Invalid amount. Cannot exceed remaining quantity.', kn: 'ಮಾನ್ಯವಲ್ಲದ ಮೊತ್ತ. ಬಾಕಿ ಪ್ರಮಾಣವನ್ನು ಮೀರಬಾರದು.' },
    'low-stock-warning': { en: 'Low stock!', kn: 'ಕಡಿಮೆ ಸ್ಟಾಕ್ ಇದೆ!' },
    'record-usage': { en: 'Record Usage', kn: 'ಬಳಕೆಯನ್ನು ದಾಖಲಿಸಿ' },

    // Raw material form placeholders
    'please-fill-all-fields': { en: 'Please fill all required fields.', kn: 'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅಗತ್ಯವಿರುವ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.' },
    'enter-raw-material-name': { en: 'e.g., Washing Liquid', kn: 'ಉದಾ., ವಾಷಿಂಗ್ ಲಿಕ್ವಿಡ್' },
    'enter-quantity': { en: 'e.g., 10', kn: 'ಉದಾ., 10' },
    'item': { en: 'Item', kn: 'ಐಟಂ' },
    'kg': { en: 'Kg', kn: 'ಕೆಜಿ' },
    'liter': { en: 'Liter', kn: 'ಲೀಟರ್' },
    'meter': { en: 'Meter', kn: 'ಮೀಟರ್' },
    'gallon': { en: 'Gallon', kn: 'ಗ್ಯಾಲನ್' },
    'unit': { en: 'Unit', kn: 'ಯೂನಿಟ್' },
    'roll': { en: 'Roll', kn: 'ರೋಲ್' },
    'enter-cost-per-unit': { en: 'e.g., 50.00', kn: 'ಉದಾ., 50.00' },
    'enter-supplier-name': { en: 'e.g., Chemical Traders', kn: 'ಉದಾ., ಕೆಮಿಕಲ್ ಟ್ರೇಡರ್ಸ್' },
    'use-placeholder': { en: 'Use ({unit})', kn: 'ಬಳಸಿ ({unit})' },
    'invalid-amount': { en: 'Please enter a valid usage amount.', kn: 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಬಳಕೆಯ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ.' },
    'invalid-quantity': { en: 'Please enter a valid quantity.', kn: 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಪ್ರಮಾಣವನ್ನು ನಮೂದಿಸಿ.' },
    'invalid-cost': { en: 'Please enter a valid cost per unit.', kn: 'ದಯವಿಟ್ಟು ಪ್ರತಿ ಯೂನಿಟ್‌ಗೆ ಮಾನ್ಯವಾದ ವೆಚ್ಚವನ್ನು ನಮೂದಿಸಿ.' },
    'usage-recorded-successfully': { en: 'Usage recorded successfully!', kn: 'ಬಳಕೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ!' },
    'usage-record-failed': { en: 'Failed to record usage. Please try again.', kn: 'ಬಳಕೆಯನ್ನು ದಾಖಲಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' },
    'custom-unit': { en: 'Custom Unit', kn: 'ಕಸ್ಟಮ್ ಘಟಕ' },
    'custom-unit-name': { en: 'Custom Unit Name', kn: 'ಕಸ್ಟಮ್ ಘಟಕದ ಹೆಸರು' },
    'enter-custom-unit': { en: 'e.g., Bottle, Packet, Box', kn: 'ಉದಾ., ಬಾಟಲ್, ಪ್ಯಾಕೆಟ್, ಬಾಕ್ಸ್' },
    'please-enter-custom-unit': { en: 'Please enter a custom unit.', kn: 'ದಯವಿಟ್ಟು ಕಸ್ಟಮ್ ಘಟಕವನ್ನು ನಮೂದಿಸಿ.' },
};

export const invoiceTranslations: Record<string, Record<Language, string>> = {
  'app-name-invoice': { en: 'VOS WASH', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್' },
  'app-tagline': { en: 'Clean Everything', kn: 'ಎಲ್ಲವನ್ನೂ ಸ್ವಚ್ಛಗೊಳಿಸಿ' },
  'business-address': { en: 'Business Address', kn: 'ವ್ಯಾಪಾರ ವಿಳಾಸ' },
  'invoice-details': { en: 'Invoice Details', kn: 'ಇನ್‌ವಾಯ್ಸ್ ವಿವರಗಳು' },
  'total-due': { en: 'Total Due:', kn: 'ಒಟ್ಟು ಬಾಕಿ:' },
  'amount-paid': { en: 'Amount Paid:', kn: 'ಪಾವತಿಸಿದ ಮೊತ್ತ:' },
  'balance': { en: 'Balance:', kn: 'ಬಾಕಿ:' },
  'amount-header': { en: 'AMOUNT', kn: 'ಮೊತ್ತ' },
  'summary-total': { en: 'Total', kn: 'ಒಟ್ಟು' },
  'summary-grand-total': { en: 'Grand Total', kn: 'ಒಟ್ಟು ಮೊತ್ತ' },
  'summary-balance': { en: 'Balance', kn: 'ಬಾಕಿ' },
  'now-paid': { en: 'Now Paid', kn: 'ಈಗ ಪಾವತಿಸಲಾಗಿದೆ' },
  'paid': { en: 'Paid', kn: 'ಪಾವತಿಸಲಾಗಿದೆ' },
    'gst-number-label': { en: 'GST', kn: 'ಜಿಎಸ್‌ಟಿ' },
    'bill-to': { en: 'BILL TO:', kn: 'ಇವರಿಗೆ ಬಿಲ್:' },
    'invoice-header': { en: 'Invoice', kn: 'ಇನ್‌ವಾಯ್ಸ್' },
    'invoice-number': { en: 'Invoice', kn: 'ಇನ್‌ವಾಯ್ಸ್' },
    'date': { en: 'Date', kn: 'ದಿನಾಂಕ' },
    'sl-no': { en: 'Sl No.', kn: 'ಕ್ರ.ಸಂ.' },
    'service': { en: 'GOODS / SERVICE', kn: 'ಸರಕು / ಸೇವೆ' },
    'qty': { en: 'QTY', kn: 'ಪ್ರಮಾಣ' },
    'price': { en: 'PRICE', kn: 'ಬೆಲೆ' },
    'total': { en: 'TOTAL', kn: 'ಒಟ್ಟು' },
    'subtotal': { en: 'Subtotal:', kn: 'ಉಪಮೊತ್ತ:' },
    'gst': { en: 'GST (18%):', kn: 'ಜಿಎಸ್‌ಟಿ (18%):' },
    'discount': { en: 'Discount:', kn: 'ರಿಯಾಯಿತಿ:' },
    'service-total': { en: 'GOODS/SERVICES TOTAL:', kn: 'ಸರಕು/ಸೇವೆಗಳ ಒಟ್ಟು:' },
    'grand-total': { en: 'TOTAL:', kn: 'ಒಟ್ಟು:' },
    'old-balance': { en: 'Old Balance', kn: 'ಹಳೆಯ ಬಾಕಿ' },
    'advance-paid': { en: 'Advance Paid', kn: 'ಮುಂಗಡ ಪಾವತಿ' },
    'payment': { en: 'Now Paid', kn: 'ಈಗ ಪಾವತಿಸಲಾಗಿದೆ' },
    'balance-due': { en: 'BALANCE DUE:', kn: 'ಬಾಕಿ ಉಳಿದ ಮೊತ್ತ:' },
    'advance-for-next-invoice': { en: 'ADVANCE FOR NEXT INVOICE:', kn: 'ಮುಂದಿನ ಇನ್‌ವಾಯ್ಸ್‌ಗೆ ಮುಂಗಡ:' },
    'final-grand-total': { en: 'GRAND TOTAL:', kn: 'ಒಟ್ಟು ಮೊತ್ತ:' },
    'footer-generated': { en: 'This is a computer-generated invoice and does not require a signature.', kn: 'ಇದು ಗಣಕಯಂತ್ರದಿಂದ ರಚಿತವಾದ ಇನ್‌ವಾಯ್ಸ್ ಮತ್ತು ಇದಕ್ಕೆ ಸಹಿ ಅಗತ್ಯವಿಲ್ಲ.' },
    'footer-thanks': { en: 'Thank you for choosing VOS WASH!', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್ ಆಯ್ಕೆ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದ!' },
    'footer-services': { en: 'Rubbing | Polish | Detailing | Fiber Shine Wash | Interior cleaning | PPF & Ceramic | Overall Body Wash | Headlight Bright Wash', kn: 'ರಬ್ಬಿಂಗ್ | ಪಾಲಿಶ್ | ಡೀಟೇಲಿಂಗ್ | ಫೈಬರ್ ಶೈನ್ ವಾಶ್ | ಇಂಟೀರಿಯರ್ ಕ್ಲೀನಿಂಗ್ | ಪಿಪಿಎಫ್ ಮತ್ತು ಸಿರಾಮಿಕ್ | ಓವರಾಲ್ ಬಾಡಿ ವಾಶ್ | ಹೆಡ್‌ಲೈಟ್ ಬ್ರೈಟ್ ವಾಶ್' }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('language').then((saved) => {
      if (saved && (saved === 'en' || saved === 'kn')) {
        setLanguageState(saved as Language);
      }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    await AsyncStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[key]?.[language] || defaultText || key;
  };
  
  const invoiceT = (key: string, lang: Language): string => {
      return invoiceTranslations[key]?.[lang] || translations[key]?.[lang] || key;
  };

  const value = useMemo(() => ({ language, setLanguage, t, invoiceT }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
