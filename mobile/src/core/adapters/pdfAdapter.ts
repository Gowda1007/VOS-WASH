// PDF Adapter Interface for platform-agnostic PDF generation
// Web: html2canvas + jsPDF
// React Native: react-native-html-to-pdf or similar

import type { Invoice } from '../types';

export interface PdfGenerationOptions {
    invoice: Invoice;
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    gstNumber?: string;
}

export interface PdfResult {
    filePath?: string;      // File path on device (RN)
    dataUri?: string;       // Data URI for web
    fileName: string;
    success: boolean;
    error?: string;
}

export interface PdfAdapter {
    /**
     * Generate PDF from invoice data
     * @param options Invoice data and company information
     * @returns PDF result with file path or data URI
     */
    generateInvoicePdf(options: PdfGenerationOptions): Promise<PdfResult>;

    /**
     * Generate a simple tabular PDF (generic list export)
     * @param options title, columns header, row data and optional fileName override
     */
    generateSimpleListPdf?(options: { title: string; columns: string[]; rows: string[][]; fileName?: string }): Promise<PdfResult>;

    /**
     * Save PDF to device storage (mobile specific)
     * @param filePath Source file path
     * @param fileName Destination file name
     * @returns Saved file path
     */
    savePdfToDevice?(filePath: string, fileName: string): Promise<string>;

    /**
     * Open/preview PDF in native viewer
     * @param filePath Path to PDF file
     */
    openPdf?(filePath: string): Promise<void>;
}
