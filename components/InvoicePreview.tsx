import React from 'react';
import type { Invoice } from '../types';
import { calculateInvoiceTotal, calculateRemainingBalance } from '../hooks/useInvoices';

interface InvoicePreviewProps {
  invoiceData: Invoice;
}

// Helper to format dates consistently as (YYYY-MM-DD) for display
const formatDateForDisplay = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    // Handles yyyy-mm-dd from date inputs
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return `(${dateStr})`;
    }
    // Handles dd/mm/yyyy from saved invoiceDate/paymentDate
    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
         const [d, m, y] = dateStr.split('/');
         return `(${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')})`;
    }
    return `(${dateStr})`;
};


export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoiceData }) => {
  const { services, customerName, customerAddress, customerPhone, invoiceNumber, invoiceDate, payments, oldBalance, advancePaid } = invoiceData;

  const serviceTotal = calculateInvoiceTotal(services);
  const balanceDue = calculateRemainingBalance(invoiceData);

  const subtotal = services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const tax = subtotal * 0.18;
  const discount = tax;

  return (
    <div id="invoice-preview-container">
      {/* This is the A4 container that will be captured for PDF */}
      <div id="invoice-preview-content" className="w-full max-w-3xl aspect-[210/297] mx-auto bg-white text-gray-800 shadow-lg p-8 font-sans overflow-hidden">
        
        {/* Header */}
        <header className="text-center mb-8">
             <div className="w-48 mx-auto mb-2 flex items-center justify-center text-slate-400 text-sm" style={{height: '40px'}}>
                {/* Placeholder for ಶ್ರೀ ವಾರಿ logo */}
                <span className="text-lg font-serif">ಶ್ರೀ ವಾರಿ</span>
             </div>
             <div className="flex items-center justify-center space-x-3">
                 <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 text-xs">VOS Logo</div>
                 <div>
                    <h1 className="text-4xl font-bold text-blue-700 tracking-wide">VOS WASH</h1>
                    <p className="text-sm text-gray-600">(Clean Everything)</p>
                 </div>
             </div>
        </header>

        <hr className="my-6"/>
        
        {/* Bill To / Invoice Details */}
        <section className="flex justify-between items-start mb-8 text-sm">
          <div>
            <h2 className="font-bold text-gray-500 mb-1">BILL TO:</h2>
            <p className="font-semibold text-gray-800">{customerName}</p>
            <p className="text-gray-600">{customerAddress && customerAddress !== 'N/A' ? customerAddress : ''}</p>
            <p className="text-gray-600">{customerPhone}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
            <p className="text-gray-600"><strong>Invoice #:</strong> {invoiceNumber}</p>
            <p className="text-gray-600"><strong>Date:</strong> {invoiceDate}</p>
            <div className="mt-2 pt-2 border-t border-dashed">
              <p className="font-semibold text-gray-700">Uttarahalli, Bengaluru - 61</p>
              <p className="text-gray-600">+919845418725 / 6363178431</p>
            </div>
          </div>
        </section>
        
        {/* Services Table */}
        <section>
            <table className="w-full text-left text-sm">
                <thead className="border-b-2 border-blue-600 text-gray-500">
                    <tr>
                        <th className="pb-2 font-semibold">Sl No.</th>
                        <th className="pb-2 font-semibold">SERVICE</th>
                        <th className="pb-2 font-semibold text-center">QTY</th>
                        <th className="pb-2 font-semibold text-right">PRICE</th>
                        <th className="pb-2 font-semibold text-right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((s, i) => (
                        <tr key={i} className="border-b border-gray-200">
                            <td className="py-2">{i + 1}</td>
                            <td className="py-2">{s.name}</td>
                            <td className="py-2 text-center">{s.quantity}</td>
                            <td className="py-2 text-right">₹{s.price.toFixed(2)}</td>
                            <td className="py-2 text-right font-semibold">₹{(s.price * s.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>

        {/* Totals Section */}
        <section className="flex justify-end mt-6">
            <div className="w-full max-w-xs text-sm space-y-2">
                <div className="flex justify-between"><span>Subtotal (Service Cost):</span> <span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (18%):</span> <span>+ ₹{tax.toFixed(2)}</span></div>
                <div className="flex justify-between border-b border-dashed pb-2"><span>Discount (Equal to GST):</span> <span>- ₹{discount.toFixed(2)}</span></div>
                
                <div className="flex justify-between font-bold text-base pt-2 border-b-2 border-dashed border-gray-400 pb-2">
                    <span className="text-blue-700">NEW SERVICE TOTAL:</span>
                    <span className="text-blue-700">₹{serviceTotal.toFixed(2)}</span>
                </div>
                
                {oldBalance && oldBalance.amount > 0 && <div className="flex justify-between pt-2"><span>Old Balance (Arrears):</span> <span>+ ₹{oldBalance.amount.toFixed(2)} {formatDateForDisplay(oldBalance.date)}</span></div>}
                {advancePaid && advancePaid.amount > 0 && <div className="flex justify-between"><span>Advance Paid (Earlier):</span> <span>- ₹{advancePaid.amount.toFixed(2)} {formatDateForDisplay(advancePaid.date)}</span></div>}
                {payments.map((p, i) => <div key={i} className="flex justify-between"><span>Now Paid (Today):</span> <span>- ₹{p.amount.toFixed(2)}</span></div>)}
                
                <div className="border-t-2 border-dashed border-gray-400 mt-2 pt-2">
                     <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 flex justify-between items-center font-extrabold text-xl text-blue-800 dark:text-blue-300">
                        <span>REMAINING BALANCE:</span>
                        <span>₹{balanceDue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Footer */}
        <footer className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500">
             <hr className="mb-4"/>
            <p>This is a computer-generated invoice and does not require a signature.</p>
            <p>Thank you for choosing VOS WASH!</p>
        </footer>
      </div>
      <style>{`
        @media print {
            body * { visibility: hidden; }
            .print-hidden { display: none; }
            #invoice-preview-container, #invoice-preview-container * { visibility: visible; }
            #invoice-preview-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                padding: 2rem;
                color: #000 !important;
                background-color: #fff !important;
                box-shadow: none !important;
                border: none !important;
                aspect-ratio: unset;
            }
        }
      `}</style>
    </div>
  );
};
