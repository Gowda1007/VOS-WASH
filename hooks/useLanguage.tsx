import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../types';
import { useAsyncStorage } from './useAsyncStorage'; // FIX: Updated import for useAsyncStorage

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, defaultText?: string) => string; // Main app translation function
  invoiceT: (key: string, lang: Language) => string; // Invoice-specific translation function
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'vosWashLanguage';

const translations: Record<string, Record<Language, string>> = {
    // App Name & Tagline
    'app-name': { en: 'VOS WASH', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್' },
    'app-tagline': { en: '(Clean Everything)', kn: '(ಎಲ್ಲವನ್ನೂ ಸ್ವಚ್ಛಗೊಳಿಸಿ)' },

    // Default Service Names
    'Interior & Exterior': { en: 'Interior & Exterior', kn: 'ಇಂಟೀರಿಯರ್ ಮತ್ತು ಎಕ್ಸ್ಟೀರಿಯರ್' },
    'Fiber Shine': { en: 'Fiber Shine', kn: 'ಫೈಬರ್ ಶೈನ್' },
    'Bright Wash': { en: 'Bright Wash', kn: 'ಬ್ರೈಟ್ ವಾಶ್' },
    'Gold and Silver': { en: 'Gold and Silver', kn: 'ಗೋಲ್ಡ್ ಮತ್ತು ಸಿಲ್ವರ್' },
    'Spray Gun': { en: 'Spray Gun', kn: 'ಸ್ಪ್ರೇ ಗನ್' },

    // Nav & General UI
    'dashboard': { en: 'Dashboard', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
    'invoices': { en: 'Invoices', kn: 'ಇನ್‌ವಾಯ್ಸ್‌ಗಳು' },
    'customers': { en: 'Customers', kn: 'ಗ್ರಾಹಕರು' },
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
    'price': { en: 'Price', kn: 'ಬೆಲೆ' },
    'quantity': { en: 'Quantity', kn: 'ಪ್ರಮಾಣ' },
    'amount': { en: 'ಮೊತ್ತ', kn: 'ಮೊತ್ತ' },
    'from': { en: 'From', kn: 'ಇವರಿಂದ' },
    'actions': { en: 'Actions', kn: 'ಕ್ರಿಯೆಗಳು' },
    'status': { en: 'Status', kn: 'ಸ್ಥಿತಿ' },
    'contact': { en: 'Contact', kn: 'ಸಂಪರ್ಕ' },
    
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
    'welcome-back': { en: "Welcome back! Here's your business overview.", kn: 'ಮತ್ತೆ ಸ್ವಾಗತ! ನಿಮ್ಮ ವ್ಯಾಪಾರದ ಅವಲೋಕನ ಇಲ್ಲಿದೆ.' },
    'total-revenue': { en: 'Total Revenue', kn: 'ಒಟ್ಟು ಆದಾಯ' },
    'collected': { en: 'Collected', kn: 'ಸಂಗ್ರಹಿಸಲಾಗಿದೆ' },
    'unpaid-balance': { en: 'Unpaid Balance', kn: 'ಪಾವತಿಸದ ಬಾಕಿ' },
    'total-invoices': { en: 'Total Invoices', kn: 'ಒಟ್ಟು ಇನ್‌ವಾಯ್ಸ್‌ಗಳು' },
    'pending-orders': { en: 'Pending Orders', kn: 'ಬಾಕಿ ಇರುವ ಆರ್ಡರ್‌ಗಳು' },
    'generate-invoice': { en: 'Generate Invoice', kn: 'ಇನ್‌ವಾಯ್ಸ್ ರಚಿಸಿ' },
    'revenue-trend': { en: 'Revenue Trend', kn: 'ಆದಾಯದ ಪ್ರವೃತ್ತಿ' },
    'revenue-by-type': { en: 'Revenue by Type', kn: 'ಪ್ರಕಾರದ ಪ್ರಕಾರ ಆದಾಯ' },
    'top-services': { en: 'Top Goods & Services', kn: 'ಟಾಪ್ ಸರಕುಗಳು ಮತ್ತು ಸೇವೆಗಳು' },
    'recent-invoices': { en: 'Recent Invoices', kn: 'ಇತ್ತೀಚಿನ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು' },
    'no-service-data': { en: 'No goods or service data yet.', kn: 'ಇನ್ನೂ ಯಾವುದೇ ಸರಕು ಅಥವಾ ಸೇವಾ ಡೇಟಾ ಇಲ್ಲ.' },
    'promised-delivery-date': { en: 'Promised Delivery Date', kn: 'ಭರವಸೆಯ ವಿತರಣಾ ದಿನಾಂಕ' },
    'due-date': { en: 'Due Date', kn: 'ಅಂತಿಮ ದಿನಾಂಕ' },
    'order-date-label': { en: 'Ordered', kn: 'ಆರ್ಡರ್ ಮಾಡಲಾಗಿದೆ' },
    'urgent-badge': { en: 'Urgent', kn: 'ತುರ್ತು' },
    'chart-unavailable-rn': {en: 'Charts are currently unavailable in the native app.', kn: 'ಚಾರ್ಟ್‌ಗಳು ಪ್ರಸ್ತುತ ಸ್ಥಳೀಯ ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಲಭ್ಯವಿಲ್ಲ.'},


    // Invoice & Order Forms
    'customer-details': { en: 'Customer Details', kn: 'ಗ್ರಾಹಕರ ವಿವರಗಳು' },
    'customer-phone': { en: 'Customer Phone', kn: 'ಗ್ರಾಹಕರ ಫೋನ್' },
    'customer-name': { en: 'Customer Name', kn: 'ಗ್ರಾಹಕರ ಹೆಸರು' },
    'customer-address': { en: 'Customer Address (Optional)', kn: 'ಗ್ರಾಹಕರ ವಿಳಾಸ (ಐಚ್ಛಿಕ)' },
    'customer-type': { en: 'Customer Type', kn: 'ಗ್ರಾಹಕರ ಪ್ರಕಾರ' },
    'services-and-items': { en: 'Goods & Services', kn: 'ಸರಕುಗಳು ಮತ್ತು ಸೇವೆಗಳು' },
    'no-services-added': { en: 'No goods or services added yet.', kn: 'ಇನ್ನೂ ಯಾವುದೇ ಸರಕುಗಳು ಅಥವಾ ಸೇವೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ.' },
    'add-services': { en: 'Add Goods/Services', kn: 'ಸರಕು/ಸೇವೆಗಳನ್ನು ಸೇರಿಸಿ' },
    'add-custom-service': { en: 'Add Custom Goods/Service', kn: 'ಕಸ್ಟಮ್ ಸರಕು/ಸೇವೆ ಸೇರಿಸಿ' },
    'financials': { en: 'Financials', kn: 'ಹಣಕಾಸು' },
    'old-balance-arrears': { en: 'Old Balance (Arrears)', kn: 'ಹಳೆಯ ಬಾಕಿ (ಬಾಕಿ)' },
    'advance-paid': { en: 'Advance Paid', kn: 'ಮುಂಗಡ ಪಾವತಿ' },
    'preview-invoice': { en: 'Next: Preview Invoice', kn: 'ಮುಂದೆ: ಇನ್‌ವಾಯ್ಸ್ ಪೂರ್ವವೀಕ್ಷಣೆ' },
    'invoice-preview-title': { en: 'Invoice Preview', kn: 'ಇನ್‌ವಾಯ್ಸ್ ಪೂರ್ವವೀಕ್ಷಣೆ' },
    'edit-details': { en: 'Edit Details', kn: 'ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ' },
    'save-and-continue': { en: 'Save and Continue', kn: 'ಉಳಿಸಿ ಮತ್ತು ಮುಂದುವರಿಸಿ' },
    'collect-payment': { en: 'Collect Payment', kn: 'ಪಾವತಿ ಸಂಗ್ರಹಿಸಿ' },
    'payment-recorded-successfully': { en: 'Payment recorded successfully!', kn: 'ಪಾವತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ!' },
    'download-pdf': { en: 'Download PDF', kn: 'PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' },
    'share-on-whatsapp': { en: 'Share on WhatsApp', kn: 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ' },
    'finish-and-go-to-invoices': { en: 'Finish & Go to Invoices', kn: 'ಮುಗಿಸಿ ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್‌ಗಳಿಗೆ ಹೋಗಿ' },
    'enter-advance-amount': { en: 'Enter Advance Amount', kn: 'ಮುಂಗಡ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ' },
    'save-order': { en: 'Save Order', kn: 'ಆರ್ಡರ್ ಉಳಿಸಿ' },
    'order-saved-successfully': { en: 'Order saved successfully! It can be converted to an invoice from the dashboard.', kn: 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ! ಇದನ್ನು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಇನ್‌ವಾಯ್ಸ್‌ಗೆ ಪರಿವರ್ತಿಸಬಹುದು.' },
    'valid-service-name-price': { en: 'Please enter a valid goods/service name and price.', kn: 'ದಯವಿಟ್ಟು ಮಾನ್ಯ ಸರಕು/ಸೇವೆಯ ಹೆಸರು ಮತ್ತು ಬೆಲೆಯನ್ನು ನಮೂದಿಸಿ.' },
    'add-at-least-one-service': { en: 'Please add at least one goods or service.', kn: 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಸರಕು ಅಥವಾ ಸೇವೆಯನ್ನು ಸೇರಿಸಿ.' },
    'delete-service-aria': { en: 'Delete goods/service', kn: 'ಸರಕು/ಸೇವೆ ಅಳಿಸಿ' },
    'service-name-placeholder': { en: 'Goods/Service Name', kn: 'ಸರಕು/ಸೇವೆ ಹೆಸರು' },
    'urgent-order': { en: 'Mark as Urgent Order', kn: 'ತುರ್ತು ಆರ್ಡರ್ ಎಂದು ಗುರುತಿಸಿ' },
    'price-label': { en: 'Price:', kn: 'ಬೆಲೆ:' },
    'qty-label': { en: 'Qty:', kn: 'ಪ್ರಮಾಣ:' },
    'amount-placeholder': { en: 'Amount (₹)', kn: 'ಮೊತ್ತ (₹)' },
    'price-placeholder': { en: 'Price (₹)', kn: 'ಬೆಲೆ (₹)' },
    'invoice-for': { en: 'Invoice #{invoiceNumber} for {customerName}', kn: 'ಇನ್‌ವಾಯ್ಸ್ #{invoiceNumber} ಗಾಗಿ {customerName}' },
    'balance-due-label': { en: 'Balance Due:', kn: 'ಬಾಕಿ ಉಳಿದ ಮೊತ್ತ:' },
    'whatsapp-share-message': { en: `Hello {customerName}, Thank you for your payment of ₹{amountPaid}. Your invoice #{invoiceNumber} is attached. We appreciate your business with VOS WASH!`, kn: `ನಮಸ್ಕಾರ {customerName}, ₹{amountPaid} ಪಾವತಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಇನ್‌ವಾಯ್ಸ್ #{invoiceNumber} ಅನ್ನು ಲಗತ್ತಿಸಲಾಗಿದೆ. ವಿ.ಓ.ಎಸ್ ವಾಷ್ ಜೊತೆಗಿನ ನಿಮ್ಮ ವ್ಯವಹಾರವನ್ನು ನಾವು ಪ್ರಶಂಸಿಸುತ್ತೇವೆ!` },
    'date-placeholder': {en: 'YYYY-MM-DD', kn: 'YYYY-MM-DD'},
    
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
    // New Customer Deletion Translations
    'delete-customer': { en: 'Delete Customer', kn: 'ಗ್ರಾಹಕರನ್ನು ಅಳಿಸಿ' },
    'confirm-customer-deletion-title': { en: 'Confirm Customer Deletion', kn: 'ಗ್ರಾಹಕರ ಅಳಿಸುವಿಕೆಯನ್ನು ಖಚಿತಪಡಿಸಿ' },
    'confirm-customer-deletion-message': { en: 'Are you sure you want to permanently delete customer {customerName} and their associated data? This action cannot be undone.', kn: 'ನೀವು {customerName} ಗ್ರಾಹಕರನ್ನು ಮತ್ತು ಅವರ ಸಂಬಂಧಿತ ಡೇಟಾವನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಲು ಸಾಧ್ಯವಿಲ್ಲ.' },
    'delete-customer-success': { en: 'Customer deleted successfully!', kn: 'ಗ್ರಾಹಕರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ!' },
    
    // List Pages (Invoices, Customers)
    'you-have-total-invoices': { en: 'You have {count} total invoices.', kn: 'ನಿಮ್ಮಲ್ಲಿ ಒಟ್ಟು {count} ಇನ್‌ವಾಯ್ಸ್‌ಗಳಿವೆ.' },
    'search-invoices-placeholder': { en: 'Search by name, phone, or invoice #', kn: 'ಹೆಸರು, ಫೋನ್, ಅಥವಾ ಇನ್‌ವಾಯ್ಸ್ # ಮೂಲಕ ಹುಡುಕಿ' },
    'export-pdf': { en: 'Export PDF', kn: 'PDF ರಫ್ತು ಮಾಡಿ' },
    'all': { en: 'all', kn: 'ಎಲ್ಲಾ' },
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
    'total-spent': { en: 'Total Spent', kn: 'ಒಟ್ಟು ಖರ್ಚು' },
    'avg-invoice-value': { en: 'Avg. Invoice Value', kn: 'ಸರಾಸರಿ ಇನ್‌ವಾಯ್ಸ್ ಮೌಲ್ಯ' },
    'invoice-history': { en: 'Invoice History', kn: 'ಇನ್‌ವಾಯ್ಸ್ ಇತಿಹಾಸ' },
    'back-to-customers': { en: 'Back to Customers', kn: 'ಗ್ರಾಹಕರಿಗೆ ಹಿಂತಿರುಗಿ' },
    'no-invoices-for-customer': { en: 'No invoices found for this customer.', kn: 'ಈ ಗ್ರಾಹಕರಿಗೆ ಯಾವುದೇ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' },
    'total-amount': {en: 'Total Amount', kn: 'ಒಟ್ಟು ಮೊತ್ತ'},
    'paid-amount': {en: 'Paid Amount', kn: 'ಪಾವತಿಸಿದ ಮೊತ್ತ'},
    'invoice-list-report-title': {en: 'VOS WASH Invoice List Report', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್ ಇನ್‌ವಾಯ್ಸ್ ಪಟ್ಟಿ ವರದಿ'},
    'customer-list-report-title': {en: 'VOS WASH Customer List Report', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್ ಗ್ರಾಹಕರ ಪಟ್ಟಿ ವರದಿ'},
    'start-date': {en: 'Start Date', kn: 'ಪ್ರಾರಂಭ ದಿನಾಂಕ'},
    'end-date': {en: 'End Date', kn: 'ಅಂತ್ಯ ದಿನಾಂಕ'},

    // Settings
    'customize-services-and-settings': { en: 'Customize goods/services and app settings.', kn: 'ಸರಕು/ಸೇವೆಗಳು ಮತ್ತು ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡಿ.' },
    'app-settings': { en: 'App Settings', kn: 'ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
    'upi-id-label': { en: 'UPI ID for Customer Payments', kn: 'ಗ್ರಾಹಕರ ಪಾವತಿಗಳಿಗಾಗಿ UPI ಐಡಿ' },
    'service-prices': { en: 'Goods & Service Prices', kn: 'ಸರಕು ಮತ್ತು ಸೇವಾ ಬೆಲೆಗಳು' },
    'add-service-for': { en: 'Add Goods/Service for {customerType}', kn: '{customerType} ಗಾಗಿ ಸರಕು/ಸೇವೆ ಸೇರಿಸಿ' },
    'save-settings': { en: 'Save Settings', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ' },
    'settings-saved-success': { en: 'Goods/Service & App settings saved successfully!', kn: 'ಸರಕು/ಸೇವೆ ಮತ್ತು ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!' },
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
};

const invoiceTranslations: Record<string, Record<Language, string>> = {
    'app-name-invoice': { en: 'VOS WASH', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್' },
    'app-tagline': { en: '(Clean Everything)', kn: '(ಎಲ್ಲವನ್ನೂ ಸ್ವಚ್ಛಗೊಳಿಸಿ)' },
    'business-address': { en: 'Uttarahalli, Bengaluru - 61', kn: 'ಉತ್ತರಹಳ್ಳಿ, ಬೆಂಗಳೂರು - ೬೧' },
    'bill-to': { en: 'BILL TO:', kn: 'ಇವರಿಗೆ ಬಿಲ್:' },
    'invoice-header': { en: 'Invoice', kn: 'ಇನ್‌ವಾಯ್ಸ್' },
    'invoice-number': { en: 'Invoice #:', kn: 'ಇನ್‌ವಾಯ್ಸ್ #:' },
    'date': { en: 'Date:', kn: 'ದಿನಾಂಕ:' },
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
    'old-balance': { en: 'Old Balance (Arrears)', kn: 'ಹಳೆಯ ಬಾಕಿ (ಬಾಕಿ)' },
    'advance-paid': { en: 'Advance Paid (Earlier)', kn: 'ಮುಂಗಡ ಪಾವತಿ (ಹಿಂದಿನದು)' },
    'now-paid': { en: 'Now Paid (Today)', kn: 'ಈಗ ಪಾವತಿಸಲಾಗಿದೆ (ಇಂದು)' },
    'balance-due': { en: 'BALANCE DUE:', kn: 'ಬಾಕಿ ಉಳಿದ ಮೊತ್ತ:' },
    'final-grand-total': { en: 'GRAND TOTAL:', kn: 'ಒಟ್ಟು ಮೊತ್ತ:' },
    'footer-generated': { en: 'This is a computer-generated invoice and does not require a signature.', kn: 'ಇದು ಗಣಕಯಂತ್ರದಿಂದ ರಚಿತವಾದ ಇನ್‌ವಾಯ್ಸ್ ಮತ್ತು ಇದಕ್ಕೆ ಸಹಿ ಅಗತ್ಯವಿಲ್ಲ.' },
    'footer-thanks': { en: 'Thank you for choosing VOS WASH!', kn: 'ವಿ.ಓ.ಎಸ್ ವಾಷ್ ಆಯ್ಕೆ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದ!' },
    'footer-services': { en: 'Rubbing | Polish | Detailing | Fiber Shine Wash | Interior cleaning | PPF & Ceramic | Overall Body Wash | Headlight Bright Wash', kn: 'ರಬ್ಬಿಂಗ್ | ಪಾಲಿಶ್ | ಡೀಟೇಲಿಂಗ್ | ಫೈಬರ್ ಶೈನ್ ವಾಶ್ | ಇಂಟೀರಿಯರ್ ಕ್ಲೀನಿಂಗ್ | ಪಿಪಿಎಫ್ ಮತ್ತು ಸಿರಾಮಿಕ್ | ಓವರಾಲ್ ಬಾಡಿ ವಾಶ್ | ಹೆಡ್‌ಲೈಟ್ ಬ್ರೈಟ್ ವಾಶ್' }
};


export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en'); // Default to 'en'

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage) {
          setLanguageState(storedLanguage as Language);
        }
      } catch (error) {
        console.error('Failed to load language from AsyncStorage:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language to AsyncStorage:', error);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[key]?.[language] || defaultText || key;
  };
  
  const invoiceT = (key: string, lang: Language): string => {
      return invoiceTranslations[key]?.[lang] || translations[key]?.[lang] || key;
  };

  const value = useMemo(() => ({ language, setLanguage, t, invoiceT }), [language, setLanguage, t, invoiceT]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};