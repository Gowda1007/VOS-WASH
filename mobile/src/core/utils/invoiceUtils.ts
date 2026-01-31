// Platform-agnostic invoice calculation utilities

import type { Invoice, Service, InvoiceStatus } from '../types';

export const calculateInvoiceTotal = (services: Service[]): number => {
    const subtotal = services.reduce((sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0), 0);
    return Math.round(subtotal);
};

export const calculateStatus = (invoice: Invoice): InvoiceStatus => {
    const totalDue = calculateTotalDue(invoice);
    const totalPaid = calculateTotalPaid(invoice);

    if (totalPaid >= totalDue) return 'paid';
    if (totalPaid > 0) return 'partially_paid';
    return 'unpaid';
};

export const calculateTotalDue = (invoice: Invoice): number => {
    const serviceTotal = calculateInvoiceTotal(invoice.services);
    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const oldBalance = invoice.oldBalance?.amount || 0;
    const advancePaid = invoice.advancePaid?.amount || 0;
    const balance = (serviceTotal + oldBalance) - (advancePaid + totalPaid);
    return Math.round(balance);
};

export const calculateTotalPaid = (invoice: Invoice): number => {
    return (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
};

export const calculateRemainingBalance = (invoice: Invoice): number => {
    const serviceTotal = calculateInvoiceTotal(invoice.services);
    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const oldBalance = invoice.oldBalance?.amount || 0;
    const advancePaid = invoice.advancePaid?.amount || 0;
    const balance = (serviceTotal + oldBalance) - (advancePaid + totalPaid);
    return Math.round(balance);
};

// Unified totals calculation used by preview and PDF
export interface InvoiceTotals {
    subtotal: number;
    tax: number;
    discount: number;
    serviceTotal: number;
    oldBalance: number;
    advancePaid: number;
    paymentsTotal: number;
    totalDue: number;
    balance: number;
}

export const calculateInvoiceTotalsFromInvoice = (invoice: Invoice, hasValidGst: boolean): InvoiceTotals => {
    const subtotal = invoice.services.reduce((sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0), 0);
    const tax = subtotal * 0.18;
    const discount = tax; // always apply tax as discount (matching web logic)
    const serviceTotal = subtotal; // web logic: serviceTotal is just subtotal

    const oldBalance = Number(invoice.oldBalance?.amount || 0);
    const advancePaid = Number(invoice.advancePaid?.amount || 0);
    const paymentsTotal = (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalDue = Math.round((serviceTotal + oldBalance) - advancePaid);
    const balance = Math.round((totalDue - paymentsTotal));

    return { subtotal, tax, discount, serviceTotal, oldBalance, advancePaid, paymentsTotal, totalDue, balance };
};

// Strict GST number validation (Indian GSTIN format)
export const isValidGstNumber = (gst?: string): boolean => {
    return !!gst && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gst);
};

export const generateUniqueInvoiceNumber = (existingInvoices: Invoice[]): string => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    const prefix = `${year}${month}${day}`;

    const invoicesForToday = existingInvoices.filter(inv => inv.invoiceNumber.startsWith(prefix));
    const maxCounter = invoicesForToday.reduce((max, inv) => {
        const counter = parseInt(inv.invoiceNumber.slice(-3), 10);
        return isNaN(counter) ? max : Math.max(max, counter);
    }, 0);

    const newCounter = (maxCounter + 1).toString().padStart(3, '0');
    return `${prefix}${newCounter}`;
};

export const formatCurrency = (amount: number): string => {
    const safe = Number.isFinite(amount) ? amount : 0;
    // For amounts >= 1 lakh (100000), don't show decimals to keep it readable
    if (Math.abs(safe) >= 100000) {
        try {
            return `₹${Math.round(safe).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        } catch {
            return `₹${Math.round(safe).toString()}`;
        }
    }
    // For smaller amounts, show 2 decimal places
    try {
        return `₹${safe.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch {
        return `₹${safe.toFixed(2)}`;
    }
};

// Currency formatting without decimals (for dashboard KPIs)
export const formatCurrencyNoDecimals = (amount: number): string => {
    const safe = Number.isFinite(amount) ? amount : 0;
    try {
        return `₹${Math.round(safe).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } catch {
        return `₹${Math.round(safe).toString()}`;
    }
};

// Indian short scale formatter for KPIs (supports Lakhs / Crores)
// language optional: 'en' uses L / Cr abbreviations, 'kn' uses Kannada words ಲಕ್ಷ / ಕೋಟಿ
export const formatCurrencyShortIndian = (amount: number, language: 'en' | 'kn' = 'en'): string => {
    const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    const LAKH = 100000; // 1,00,000
    const CRORE = 10000000; // 1,00,00,000

    // Below 1 lakh: show full number without decimals
    if (safe < LAKH) {
        try {
            return `₹${Math.round(safe).toLocaleString('en-IN')}`;
        } catch {
            return `₹${Math.round(safe)}`;
        }
    }

    // Crores
    if (safe >= CRORE) {
        const value = safe / CRORE; // e.g. 123456789 -> 12.3456789 Cr
        const rounded = value >= 10 ? value.toFixed(1) : value.toFixed(2); // More precision for smaller crores
        const trimmed = rounded.replace(/\.0+$/, '');
        const suffix = language === 'kn' ? 'ಕೋಟಿ' : 'Cr';
        return `₹${trimmed} ${suffix}`;
    }

    // Lakhs
    const value = safe / LAKH; // e.g. 1234567 -> 12.34567 L
    const rounded = value >= 10 ? value.toFixed(1) : value.toFixed(2); // More precision under 10L
    const trimmed = rounded.replace(/\.0+$/, '');
    const suffix = language === 'kn' ? 'ಲಕ್ಷ' : 'L';
    return `₹${trimmed} ${suffix}`;
};

// Scale an array of values for chart display (Lakhs/Crores) returning scaled values and unit label.
export const scaleValuesForIndianChart = (values: number[], language: 'en' | 'kn' = 'en') => {
    const max = Math.max(0, ...values.filter(v => Number.isFinite(v)));
    const LAKH = 100000;
    const CRORE = 10000000;
    if (max >= CRORE) {
        return {
            scaled: values.map(v => v / CRORE),
            unitLabel: language === 'kn' ? 'ಕೋಟಿ' : 'Cr'
        };
    }
    if (max >= LAKH) {
        return {
            scaled: values.map(v => v / LAKH),
            unitLabel: language === 'kn' ? 'ಲಕ್ಷ' : 'L'
        };
    }
    return { scaled: values, unitLabel: '' }; // No scaling needed
};

// Safely coerce any unknown value to a finite number (used before charting / math)
export const safeNumber = (value: unknown, fallback = 0): number => {
    if (value === null || value === undefined) return fallback;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
};

export const capitalizeWords = (str: string): string => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

// Normalize various date formats to DD-MM-YYYY for consistent display
export const formatInvoiceDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}-${m}-${y}`;
  }
  // Common IN: DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    return `${dd}-${mm}-${y}`;
  }
  // Already formatted DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('-');
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    return `${dd}-${mm}-${y}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear());
      return `${dd}-${mm}-${yy}`;
    }
  } catch {}
  return dateStr;
};

// Check if a date string represents today
export const isToday = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  const dateOnlyStr = dateStr.split(' ')[0].split('T')[0];
  let year: number, month: number, day: number;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnlyStr)) {
    const parts = dateOnlyStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateOnlyStr)) {
    const parts = dateOnlyStr.split('-');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateOnlyStr)) {
    const parts = dateOnlyStr.split('/');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else {
    return false;
  }

  const inputDate = new Date(year, month, day);
  const today = new Date();
  return inputDate.getFullYear() === today.getFullYear() &&
         inputDate.getMonth() === today.getMonth() &&
         inputDate.getDate() === today.getDate();
};

// Auto-format date input to DD/MM/YYYY as user types numbers
// Allows only digits and automatically inserts "/" at appropriate positions
export const formatDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};