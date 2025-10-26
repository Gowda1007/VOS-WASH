import React from 'react';
import type { Invoice } from '../types';
import { InvoicePreview } from './InvoicePreview';
import { Button, Icon } from './Common';
import { useToast } from '../hooks/useToast';
import { downloadPDF } from '../services/pdfService';
import { calculateRemainingBalance } from '../hooks/useInvoices';

interface InvoicePreviewOverlayProps {
  invoice: Invoice;
  onClose: () => void;
  onCollect: (invoiceId: number) => void;
}

export const InvoicePreviewOverlay: React.FC<InvoicePreviewOverlayProps> = ({ invoice, onClose, onCollect }) => {
    const toast = useToast();
    const balanceDue = calculateRemainingBalance(invoice);

    const handlePrint = () => window.print();
  
    const handleDownload = async () => {
        await downloadPDF(invoice, document.getElementById('invoice-preview-content'));
        toast.success('Invoice saved to your Downloads folder.');
    };

    const handleWhatsAppShare = () => {
        const message = `Hello ${invoice.customerName},\n\nHere is a summary of your invoice from VOS WASH:\n\nInvoice #: ${invoice.invoiceNumber}\nBalance Due: ₹${balanceDue.toFixed(2)}\n\nThank you!`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div 
                className="relative w-full max-w-4xl bg-slate-100 dark:bg-slate-900 rounded-lg shadow-xl my-8"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 z-10 p-2 rounded-full bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600 print-hidden"
                    aria-label="Close preview"
                >
                    <Icon name="x-mark" className="w-6 h-6"/>
                </button>
                {/* Visual wrapper to make the A4 page stand out */}
                <div className="p-4 sm:p-8 bg-slate-200 dark:bg-slate-800">
                    <InvoicePreview invoiceData={invoice} />
                </div>
                 <div className="flex flex-col sm:flex-row justify-center items-center gap-4 p-4 border-t border-slate-200 dark:border-slate-700 print-hidden">
                    <Button onClick={handlePrint} variant="secondary">
                        <Icon name="printer" className="w-5 h-5"/> Print
                    </Button>
                    <Button onClick={handleDownload}>
                         <Icon name="document-duplicate" className="w-5 h-5"/>
                        Download PDF
                    </Button>
                    <Button onClick={handleWhatsAppShare} className="bg-green-500 hover:bg-green-600 focus:ring-green-500">
                        <Icon name="whatsapp" className="w-5 h-5"/> Share
                    </Button>
                    {balanceDue > 0 && (
                        <Button onClick={() => onCollect(invoice.id)} className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                            <Icon name="banknotes" className="w-5 h-5"/> Collect Payment
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};