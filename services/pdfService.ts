// All PDF generation, download, and WhatsApp sharing functionality is REMOVED
// as html2canvas and jspdf are web-specific and require a complex native
// implementation (e.g., react-native-html-to-pdf + react-native-share) which
// is out of scope for a direct code conversion.

import { Alert } from 'react-native';
import type { Invoice } from '../types';

export const downloadPDF = async (invoiceData: Pick<Invoice, 'invoiceNumber' | 'customerName'>, elementToPrint?: any): Promise<void> => {
    Alert.alert(
        'PDF Functionality Unavailable',
        'PDF generation and download is not yet supported in the native app version. Please use the web version for this feature.',
        [{ text: 'OK' }]
    );
};

export const generatePdfAsFile = async (invoiceData: Pick<Invoice, 'invoiceNumber' | 'customerName'>, elementToPrint?: any): Promise<void> => {
    Alert.alert(
        'PDF Functionality Unavailable',
        'PDF generation and sharing is not yet supported in the native app version. Please use the web version for this feature.',
        [{ text: 'OK' }]
    );
};

export const downloadListAsPDF = async (headers: string[], data: (string | number)[][], filename: string, title: string): Promise<void> => {
    Alert.alert(
        'PDF Functionality Unavailable',
        'List export to PDF is not yet supported in the native app version. Please use the web version for this feature.',
        [{ text: 'OK' }]
    );
};

export const exportListAsFile = async (headers: string[], data: (string | number)[][], filename: string, title: string): Promise<void> => {
    Alert.alert(
        'PDF Functionality Unavailable',
        'List export to PDF is not yet supported in the native app version. Please use the web version for this feature.',
        [{ text: 'OK' }]
    );
};