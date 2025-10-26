import React from 'react';
import type { Invoice } from '../types';
import { calculateInvoiceTotal, calculateTotalPaid, calculateRemainingBalance } from '../hooks/useInvoices';
import { Logo, Button, Icon } from './Common';
import { downloadPDF } from '../services/pdfService';
import { useToast } from '../hooks/useToast';

interface InvoicePreviewProps {
  invoiceData: Invoice;
}

// FEATURE IMPLEMENTATION: The entire invoice preview is redesigned for financial clarity.
export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoiceData }) => {
  const { services, customerName, customerAddress, customerPhone, invoiceNumber, invoiceDate, payments, oldBalance, advancePaid } = invoiceData;
  const toast = useToast();

  const serviceTotal = calculateInvoiceTotal(services);
  const totalPaid = calculateTotalPaid(payments);
  const balanceDue = calculateRemainingBalance(invoiceData);

  // Original logic for tax/discount display
  const subtotal = services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const tax = subtotal * 0.18;
  const discount = tax;
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = async () => {
      await downloadPDF(invoiceData, document.getElementById('invoice-preview-content'));
      toast.success('Invoice saved to your Downloads folder.');
  };

  const handleWhatsAppShare = () => {
      const message = `Hello ${customerName},\n\nHere is a summary of your invoice from VOS WASH:\n\nInvoice #: ${invoiceNumber}\nTotal Amount: ₹${serviceTotal.toFixed(2)}\nBalance Due: ₹${balanceDue.toFixed(2)}\n\nThank you for your business!`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  };

  return (
    <div id="invoice-preview-container">
      <div id="invoice-preview-content" className="p-6 bg-white dark:bg-slate-800 max-w-full shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 print-container">
        <header className="flex justify-between items-start pb-4 border-b dark:border-slate-600">
            <div className="flex items-center space-x-3">
                <Logo className="w-16 h-16 text-blue-700 dark:text-blue-400" />
                <div>
                    <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">VOS WASH</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">(Clean Everything)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Uttarahalli, Bengaluru - 61</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">+919845418725 / 6363178431</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-3xl font-bold uppercase text-slate-700 dark:text-slate-300">Invoice</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400"># {invoiceNumber}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Date: {invoiceDate}</p>
            </div>
        </header>

        <section className="my-6">
             <h3 className="font-semibold text-slate-500 dark:text-slate-400 text-sm mb-1">Bill To</h3>
             <p className="font-bold text-slate-800 dark:text-slate-100">{customerName}</p>
             <p className="text-slate-600 dark:text-slate-300">{customerAddress}</p>
             <p className="text-slate-600 dark:text-slate-300">{customerPhone}</p>
        </section>

        <table className="w-full text-left mb-8">
          <thead className="bg-slate-100 dark:bg-slate-700">
            <tr>
              <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-300">Service</th>
              <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-300 text-center">Qty</th>
              <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Price</th>
              <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, i) => (
              <tr key={i} className="border-b dark:border-slate-700">
                <td className="p-3">{s.name}</td>
                <td className="p-3 text-center">{s.quantity}</td>
                <td className="p-3 text-right">₹{s.price.toFixed(2)}</td>
                <td className="p-3 text-right font-semibold">₹{(s.price * s.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col md:flex-row justify-end gap-8">
            <div className="w-full md:w-1/2 text-slate-700 dark:text-slate-300 space-y-2 text-sm">
                {/* Service Breakdown */}
                <div className="flex justify-between"><p>Subtotal:</p><p>₹{subtotal.toFixed(2)}</p></div>
                <div className="flex justify-between"><p>GST (18%):</p><p>+ ₹{tax.toFixed(2)}</p></div>
                <div className="flex justify-between pb-2 border-b dark:border-slate-600"><p>Discount:</p><p>- ₹{discount.toFixed(2)}</p></div>
                
                {/* Financial Summary */}
                <div className="flex justify-between font-bold text-base pt-2"><p>New Service Total:</p><p>₹{serviceTotal.toFixed(2)}</p></div>

                {oldBalance && oldBalance.amount > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400"><p>Old Balance (Arrears):</p><p>+ ₹{oldBalance.amount.toFixed(2)}</p></div>
                )}
                {advancePaid && advancePaid.amount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400"><p>Advance Paid:</p><p>- ₹{advancePaid.amount.toFixed(2)}</p></div>
                )}

                {/* Payments Section */}
                {payments.length > 0 && (
                     <div className="pt-2">
                        {payments.map((p, i) => (
                           <div key={i} className="flex justify-between">
                                <p>Payment ({p.method}):</p>
                                <p className="text-green-600 dark:text-green-400">- ₹{p.amount.toFixed(2)}</p>
                           </div>
                        ))}
                    </div>
                )}
                
                <div className="flex justify-between font-extrabold text-2xl mt-4 pt-4 border-t-2 border-slate-800 dark:border-slate-300 text-slate-800 dark:text-slate-100">
                    <p>Balance Due:</p>
                    <p>₹{balanceDue.toFixed(2)}</p>
                </div>
            </div>
        </div>
        <footer className="mt-12 pt-4 border-t dark:border-slate-600 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>Thank you for choosing VOS WASH! This is a computer-generated invoice.</p>
        </footer>
      </div>
       <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 print-hidden">
            <Button onClick={handlePrint} variant="secondary">
                <Icon name="printer" className="w-5 h-5"/>
                Print Invoice
            </Button>
            <Button onClick={handleDownload}>
                Download PDF
            </Button>
            <Button onClick={handleWhatsAppShare} className="bg-green-500 hover:bg-green-600 focus:ring-green-500">
                <Icon name="whatsapp" className="w-5 h-5"/>
                Share on WhatsApp
            </Button>
        </div>
      <style>{`
        @media print {
            body * { visibility: hidden; }
            .print-hidden { display: none; }
            .print-container, .print-container * { visibility: visible; }
            #invoice-preview-content {
                color: #000 !important;
                background-color: #fff !important;
                box-shadow: none !important;
                border: none !important;
            }
            .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
        }
      `}</style>
    </div>
  );
};