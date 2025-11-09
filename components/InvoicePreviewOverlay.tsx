import React, { useState } from 'react';
import type { Invoice, Language } from '../types';
import { InvoicePreview } from './InvoicePreview';
import { Button, Icon } from './Common';
import { useToast } from '../hooks/useToast';
import { downloadPDF, generatePdfAsFile, blobToBase64 } from '../services/pdfService';
import { calculateRemainingBalance } from '../hooks/useInvoices';
import { useLanguage } from '../hooks/useLanguage';

interface InvoicePreviewOverlayProps {
  invoice: Invoice;
  onClose: () => void;
  onCollect: (invoiceNumber: string) => void;
}

const InvoiceLanguageToggle: React.FC<{ value: Language, onChange: (lang: Language) => void }> = ({ value, onChange }) => (
    <div className="flex items-center justify-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
        <button onClick={() => onChange('en')} className={`px-4 py-1.5 text-sm rounded-md ${value === 'en' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>English</button>
        <button onClick={() => onChange('kn')} className={`px-4 py-1.5 text-sm rounded-md ${value === 'kn' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>ಕನ್ನಡ</button>
    </div>
);

export const InvoicePreviewOverlay: React.FC<InvoicePreviewOverlayProps> = ({ invoice, onClose, onCollect }) => {
    const toast = useToast();
    const { t } = useLanguage();
    const balanceDue = calculateRemainingBalance(invoice);
    const [invoiceLanguage, setInvoiceLanguage] = useState<Language>(invoice.language || 'en');
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        const elementToPrint = document.getElementById('invoice-preview-content');
        if (elementToPrint) {
            await downloadPDF(invoice, elementToPrint);
            toast.success('Invoice saved to your Downloads folder.');
        } else {
            toast.error('Could not find invoice content to download.');
        }
    };

    const handleShare = async () => {
        const elementToPrint = document.getElementById('invoice-preview-content');
        if (!elementToPrint) {
            toast.error(t('could-not-find-invoice-content-to-share', 'Could not find invoice content to share.'));
            return;
        }

        setIsLoading(true);
        try {
            const pdfFile = await generatePdfAsFile(invoice, elementToPrint);

            if (!pdfFile) {
                toast.error(t('pdf-generation-failed', 'PDF generation failed.'));
                return;
            }

            const customerPhone = invoice.customerPhone.replace(/\D/g, '');
            const messageText = t("whatsapp-share-message")
                .replace("{customerName}", invoice.customerName)
                .replace("{invoiceNumber}", invoice.invoiceNumber);

            // 1. Check if the AndroidBridge is available (only in Android WebView)
            if (window.AndroidBridge?.sharePdfViaWhatsApp) {
                const base64Pdf = await blobToBase64(pdfFile);
                window.AndroidBridge.sharePdfViaWhatsApp(
                    base64Pdf,
                    customerPhone,
                    messageText
                );
                toast.success(t('invoice-shared-via-whatsapp', 'Invoice shared via WhatsApp.'));
            }
            // 2. Fallback for web browsers supporting Web Share API (for file sharing)
            else if (navigator.share && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    files: [pdfFile],
                    title: `Invoice ${invoice.invoiceNumber}`,
                    text: messageText,
                });
                toast.success(t('invoice-shared-via-web-share', 'Invoice shared successfully.'));
            }
            // 3. If neither native bridge nor Web Share API is available, throw an error.
            else {
                throw new Error("File sharing is not supported on this device/browser.");
            }

        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                // User dismissed the share dialog, no error toast needed
            } else {
                console.error("Error sharing via WhatsApp:", error);
                const errorMessage = error instanceof Error ? error.message : 'Could not share via WhatsApp.';
                toast.error(t('could-not-share-via-whatsapp', errorMessage));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div 
                className="relative w-full max-w-4xl bg-slate-100 dark:bg-slate-900 rounded-lg shadow-xl my-8"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-2 left-2 right-2 z-10 flex justify-between print-hidden">
                    <InvoiceLanguageToggle value={invoiceLanguage} onChange={setInvoiceLanguage} />
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600"
                        aria-label="Close preview"
                    >
                        <Icon name="x-mark" className="w-6 h-6"/>
                    </button>
                </div>
                
                <div className="p-4 sm:p-8 pt-16 sm:pt-16 bg-slate-200 dark:bg-slate-800">
                    <InvoicePreview invoiceData={invoice} language={invoiceLanguage} />
                </div>
                 <div className="flex flex-col sm:flex-row justify-center items-center gap-4 p-4 border-t border-slate-200 dark:border-slate-700 print-hidden">
                    <Button onClick={handleDownload}>
                         <Icon name="document-duplicate" className="w-5 h-5"/>
                        {t('download-pdf')}
                    </Button>
                    <Button onClick={handleShare} disabled={isLoading} className="bg-green-500 hover:bg-green-600 focus:ring-green-400">
                        {isLoading ? (
                            <Icon name="arrow-path" className="w-5 h-5 animate-spin" />
                        ) : (
                            <Icon name="share" className="w-5 h-5"/>
                        )}
                        {t('share-via-whatsapp', 'Share via WhatsApp')}
                    </Button>
                    {balanceDue > 0 && (
                        <Button onClick={() => onCollect(invoice.invoiceNumber)} className="bg-green-600 hover:bg-green-700 focus:ring-green-500">
                            <Icon name="banknotes" className="w-5 h-5"/> {t('collect-payment')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};